// Lead Enrichment Application - Agentic Enrichment Worker
// Uses Anthropic SDK directly with server tools (web_search, web_fetch) and custom tools
// Supports database-driven configuration and business context

import Anthropic from '@anthropic-ai/sdk';
import { getLead, updateLead, updateStatus } from '@/lib/db';
import { createAuditEntry, completeAuditEntry } from '@/lib/audit';
import { loadConfigForTier, getEffectiveConfig, applyBlacklistToContent, type LoadedConfig } from '@/lib/config-loader';
import { buildEnrichmentPrompt, buildDefaultPrompt } from '@/lib/prompt-builder';
import { getActiveBusinessContext } from '@/lib/project-db';
import { executeTool, getCustomToolDefinition } from './tools';
import {
  standardEnrichmentSchema,
  mediumEnrichmentSchema,
  premiumEnrichmentSchema,
  type StandardEnrichmentOutput,
  type MediumEnrichmentOutput,
  type PremiumEnrichmentOutput,
} from './enrichment-schema';
import type { Lead, EnrichmentSource } from '@/types';
import type { BusinessContext } from '@/types/project';
import { categorizeTools, getRequiredBetaHeaders } from '@/lib/tool-config';

// Type for the submit_enrichment tool schema
type EnrichmentSchema = typeof standardEnrichmentSchema | typeof mediumEnrichmentSchema | typeof premiumEnrichmentSchema;

/**
 * Create the submit_enrichment tool for structured output
 * This tool is used with tool_choice to force Claude to return valid JSON
 */
function createSubmitEnrichmentTool(tier: 'standard' | 'medium' | 'premium'): Anthropic.Tool {
  const schemas: Record<string, EnrichmentSchema> = {
    standard: standardEnrichmentSchema,
    medium: mediumEnrichmentSchema,
    premium: premiumEnrichmentSchema,
  };

  const schema = schemas[tier];

  return {
    name: 'submit_enrichment',
    description: `Submit the final enrichment results. You MUST call this tool when you have completed your research and are ready to submit the enrichment data, email subject, draft email, and sources. This is the ONLY way to submit your results.`,
    input_schema: JSON.parse(JSON.stringify(schema)) as Anthropic.Tool.InputSchema,
  };
}

// Type for server tools
type ServerTool = {
  type: 'web_search_20250305';
  name: 'web_search';
  max_uses?: number;
} | {
  type: 'web_fetch_20250910';
  name: 'web_fetch';
  max_uses?: number;
};

// Combined tools type
type ToolUnion = Anthropic.Tool | ServerTool;

/**
 * Build prompt using database config if available, otherwise use defaults
 * Now includes business context for the sender's company
 */
function buildPromptFromConfig(
  lead: Lead,
  loadedConfig: LoadedConfig,
  businessContext?: BusinessContext | null
): { systemPrompt: string; userPrompt: string } {
  if (loadedConfig.config && !loadedConfig.isDefault) {
    // Use dynamic prompt builder with config and business context
    return buildEnrichmentPrompt(lead, loadedConfig, businessContext);
  }
  // Fall back to hardcoded defaults
  const defaultPrompt = buildDefaultPrompt(lead, loadedConfig.tier);
  return { systemPrompt: '', userPrompt: defaultPrompt };
}

/**
 * Build the standard tier enrichment prompt (legacy fallback)
 * Quick inference-based research, 3-4 paragraph email
 */
function buildStandardPrompt(lead: Lead): string {
  return `You are a professional lead researcher. Your task is to research this person and draft a personalized introduction email.

## LEAD INFORMATION
- **Name**: ${lead.fullName}
- **Company**: ${lead.companyName}
${lead.jobTitle ? `- **Title**: ${lead.jobTitle}` : ''}
- **Email**: ${lead.email}
${lead.linkedinUrl ? `- **LinkedIn**: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- **Company Website**: ${lead.companyWebsite}` : ''}

## RESEARCH STRATEGY (2-3 tool calls max)

**Step 1 - Company Research:**
Use web_search with query: "${lead.companyName} company overview products services"
Extract: What they do, their industry, key products/services

${lead.companyWebsite ? `**Step 2 - Website Details (if needed):**
Use web_fetch on ${lead.companyWebsite} to get:
- Company description and value proposition
- Products or services offered
- Any recent news or announcements` : ''}

**Step 3 - Synthesize:**
Based on ${lead.jobTitle || 'their role'} at ${lead.companyName}, infer:
- What their day-to-day responsibilities involve
- What challenges someone in their position typically faces
- What would be valuable to them

## INFORMATION TO EXTRACT
1. **Company Focus**: What does ${lead.companyName} do? (1-2 sentences)
2. **Role Summary**: What does ${lead.fullName}'s role likely involve? (1-2 sentences)
3. **Key Insights**: 2-3 specific, actionable insights about them or their company

## EMAIL REQUIREMENTS

**Subject Line:**
Create a compelling subject (5-10 words) that references something specific about their company or role.
Examples: "Quick question about [specific product]" or "Saw [Company]'s recent [achievement]"

**Email Structure (100-150 words):**
1. **Opening Hook** (1-2 sentences): Reference something specific about their company or role
2. **Connection Point** (2-3 sentences): Why you're reaching out and what value you could provide
3. **Insight Reference** (1-2 sentences): Mention a specific challenge or opportunity relevant to them
4. **Soft CTA** (1 sentence): Suggest a brief conversation without being pushy

**Tone:** Professional but warm. Not salesy. Sound like a human, not a template.

## OUTPUT FORMAT
When you have completed your research, you MUST call the submit_enrichment tool with your results.
DO NOT output JSON as text - always use the submit_enrichment tool.

The submit_enrichment tool expects:
- enrichment: { role_summary, company_focus, key_insights[], confidence_score, data_freshness }
- email_subject: Your personalized subject line
- draft_email: The full email
- sources: [{ type, url?, data_points[] }]`;
}

/**
 * Build the medium tier enrichment prompt
 * Balanced research with company website scraping, 3-4 paragraph email
 */
function buildMediumPrompt(lead: Lead): string {
  return `You are a professional lead researcher. Research this person and their company thoroughly, then craft a personalized introduction email.

## LEAD INFORMATION
- **Name**: ${lead.fullName}
- **Company**: ${lead.companyName}
${lead.jobTitle ? `- **Title**: ${lead.jobTitle}` : ''}
- **Email**: ${lead.email}
${lead.linkedinUrl ? `- **LinkedIn**: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- **Company Website**: ${lead.companyWebsite}` : ''}

## RESEARCH STRATEGY (4 tool calls max)

**Step 1 - Company Overview:**
Use web_search: "${lead.companyName} company overview products services industry"
Goal: Understand what they do, their market position, and key offerings

${lead.companyWebsite ? `**Step 2 - Website Deep Dive:**
Use scrape_company_website on ${lead.companyWebsite}
Extract:
- Detailed company description and value proposition
- Products/services with specifics
- Recent news, blog posts, or announcements
- Team information if visible
- Any technology indicators` : '**Step 2 - Company Details:**\nUse web_search to find more specific information about their products and recent news'}

**Step 3 - Industry Context:**
Use web_search: "${lead.companyName} OR ${lead.jobTitle || 'their industry'} challenges trends"
Goal: Understand what challenges companies/roles like theirs typically face

**Step 4 - Synthesize (if needed):**
Only use a 4th tool call if you're missing critical information

## INFORMATION TO EXTRACT

**Company Info:**
- Description (what they do, value proposition)
- Industry sector
- Size (employees, revenue if found)
- Products/services (be specific)
- Recent news or announcements

**Person Info:**
- Role summary based on title: ${lead.jobTitle || 'Unknown'}
- Likely responsibilities and priorities
- What success looks like in their role

**Insights:**
- 3-4 key insights (specific, not generic)
- 2-3 likely challenges they face

## EMAIL REQUIREMENTS

**Subject Line:**
Create a subject (5-10 words) that references a specific finding about their company.
Good: "Your approach to [specific product/service]" or "Quick thought on [recent news]"
Bad: "Partnership opportunity" or "Quick question for you"

**Email Structure (150-200 words):**
1. **Opening Hook** (2-3 sentences): Reference something SPECIFIC you found about their company
2. **Value Bridge** (2-3 sentences): Connect their situation to how you could help
3. **Challenge/Insight** (2 sentences): Show you understand their world
4. **Soft CTA** (1-2 sentences): Suggest a brief conversation, make it easy to say yes

**Tone:** Professional, knowledgeable, not salesy. You've done your homework - let it show.

## OUTPUT FORMAT
When you have completed your research, you MUST call the submit_enrichment tool with your results.
DO NOT output JSON as text - always use the submit_enrichment tool.

The submit_enrichment tool expects:
- enrichment: { role_summary, company_focus, key_insights[], company_info{}, likely_challenges[], confidence_score, data_freshness }
- email_subject: Your personalized subject line
- draft_email: The full email
- sources: [{ type, url?, data_points[] }]`;
}

/**
 * Build the premium tier enrichment prompt
 * Comprehensive research, multiple sources, 4-5 paragraph personalized email
 */
function buildPremiumPrompt(lead: Lead): string {
  return `You are an expert lead researcher conducting comprehensive research. Your goal is to deeply understand this person and their company to craft a highly personalized outreach.

## LEAD INFORMATION
- **Name**: ${lead.fullName}
- **Company**: ${lead.companyName}
${lead.jobTitle ? `- **Title**: ${lead.jobTitle}` : ''}
- **Email**: ${lead.email}
${lead.linkedinUrl ? `- **LinkedIn**: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- **Company Website**: ${lead.companyWebsite}` : ''}

## RESEARCH STRATEGY (Thorough, multi-source)

### Phase 1: Company Deep Dive

**1.1 Company Overview:**
web_search: "${lead.companyName} company overview funding investors valuation"
Extract: Company stage, funding history, key investors, market position

**1.2 Products & Services:**
web_search: "${lead.companyName} products services features pricing"
Extract: What they sell, key differentiators, target customers

${lead.companyWebsite ? `**1.3 Website Analysis:**
scrape_company_website on ${lead.companyWebsite}
Extract:
- Mission and value proposition
- Product details and features
- Recent blog posts or news
- Team page information
- Technology stack indicators (check for specific tools)
- Customer testimonials or case studies` : ''}

**1.4 Recent News:**
web_search: "${lead.companyName} news announcement 2024"
Extract: Recent launches, partnerships, funding, leadership changes

### Phase 2: Person Research

**2.1 Professional Background:**
web_search: "${lead.fullName} ${lead.companyName} ${lead.jobTitle || ''}"
Extract: Career history, expertise areas, public statements

${lead.linkedinUrl ? `**2.2 LinkedIn Profile:**
scrape_linkedin on ${lead.linkedinUrl}
Extract:
- Current role description and tenure
- Career progression and past companies
- Skills and endorsements
- Recent posts and articles
- Professional interests and groups
- Education and certifications` : '**2.2 Extended Person Search:**\nweb_search for additional professional information, interviews, or speaking engagements'}

**2.3 Thought Leadership:**
web_search: "${lead.fullName} interview podcast article"
Extract: Their opinions, priorities, and communication style

### Phase 3: Synthesis

Based on ALL research, identify:
- 3-5 detailed, specific insights (not generic observations)
- 3-4 likely challenges they face (tied to their specific situation)
- 2-3 potential value propositions (how you could help)
- 3-4 talking points for conversation

## INFORMATION TO EXTRACT

**Company Info (be comprehensive):**
- Description, industry, and market position
- Size (employees, revenue, funding stage)
- Year founded, headquarters location
- Products/services with SPECIFIC details
- Recent news and announcements
- Technology stack if discoverable
- Social media presence

**Person Info (be thorough):**
- Professional bio and background
- Current role specifics and responsibilities
- Years of experience
- Areas of expertise
- Recent posts, articles, or speaking
- Education and certifications if found

**Strategic Insights:**
- 3-5 key insights (specific, actionable, unique)
- 3-4 likely challenges (tied to role + company situation)
- 2-3 value propositions (concrete ways to help)
- 3-4 talking points (conversation starters based on research)

## EMAIL REQUIREMENTS

**Subject Line:**
Create a highly personalized subject (5-12 words) that references a SPECIFIC research finding.
Good: "Your [recent blog post/news] on [specific topic]" or "Re: [specific initiative they mentioned]"
Bad: Generic subjects like "Partnership opportunity" or "Quick sync?"

**Email Structure (200-300 words):**

1. **Research-Backed Opening** (2-3 sentences):
   - Reference something SPECIFIC you found (a post they wrote, news about their company, etc.)
   - Show you've done your homework without being creepy
   - Example: "I read your post about [topic] and your point about [specific detail] resonated..."

2. **Context & Connection** (2-3 sentences):
   - Bridge from your research to why you're reaching out
   - Show understanding of their world
   - Example: "Given [specific challenge their role/company likely faces]..."

3. **Value Proposition** (2-3 sentences):
   - Specific to THEIR situation, not generic
   - Reference a challenge or opportunity you identified
   - Example: "We've helped companies like [similar company] address [specific challenge]..."

4. **Credibility Boost** (1-2 sentences):
   - Brief, relevant proof point
   - Social proof or specific result

5. **Soft CTA** (1-2 sentences):
   - Make it easy to say yes
   - Specific but low-commitment
   - Example: "Would a 15-minute call next week make sense to explore this?"

**Tone:** Intelligent, personalized, genuine. You're a peer who's done their research. NOT salesy or template-y.

## OUTPUT FORMAT
When you have completed your research, you MUST call the submit_enrichment tool with your results.
DO NOT output JSON as text - always use the submit_enrichment tool.

The submit_enrichment tool expects:
- enrichment: { role_summary, company_focus, key_insights[], company_info{}, person_info{}, likely_challenges[], potential_value_props[], talking_points[], confidence_score, data_freshness }
- email_subject: Your highly personalized subject line
- draft_email: The full email (200-300 words)
- sources: [{ type, url?, data_points[] }]`;
}

/**
 * Convert structured output sources to our database format
 */
function convertSources(
  sources: Array<{ type: string; url?: string; data_points: string[] }>
): EnrichmentSource[] {
  return sources.map((s) => ({
    type: s.type as 'web_search' | 'web_fetch' | 'inference',
    url: s.url,
    fetched_at: new Date().toISOString(),
    data_points: s.data_points,
  }));
}

/**
 * Build tools array based on allowed tools configuration
 */
function buildToolsArray(
  allowedToolIds: string[],
  maxToolCalls: number
): ToolUnion[] {
  const { serverTools, customTools } = categorizeTools(allowedToolIds);
  const tools: ToolUnion[] = [];

  // Add server tools
  for (const serverTool of serverTools) {
    if (serverTool.serverType === 'web_search_20250305') {
      tools.push({
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: maxToolCalls,
      });
    } else if (serverTool.serverType === 'web_fetch_20250910') {
      tools.push({
        type: 'web_fetch_20250910',
        name: 'web_fetch',
        max_uses: maxToolCalls,
      });
    }
  }

  // Add custom tools
  for (const customTool of customTools) {
    const toolDef = getCustomToolDefinition(customTool.id);
    if (toolDef) {
      tools.push(toolDef);
    }
  }

  return tools;
}

/**
 * Extract structured output from submit_enrichment tool call
 * This is the primary method when using tool_choice for structured output
 */
function extractFromToolCall<T>(content: Anthropic.ContentBlock[]): T | null {
  for (const block of content) {
    if (block.type === 'tool_use' && block.name === 'submit_enrichment') {
      return block.input as T;
    }
  }
  return null;
}

/**
 * Extract JSON from Claude's response text (fallback method)
 */
function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Ignored
  }

  const codeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Ignored
    }
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Ignored
    }
  }

  throw new Error('No valid JSON found in response');
}

/**
 * Run enrichment with the agentic loop pattern
 */
async function runEnrichmentLoop<T>(options: {
  lead: Lead;
  tier: 'standard' | 'medium' | 'premium';
  loadedConfig: LoadedConfig;
  effectiveConfig: ReturnType<typeof getEffectiveConfig>;
  businessContext: BusinessContext | null | undefined;
  buildDefaultPrompt: (lead: Lead) => string;
  auditId: string;
  startTime: number;
}): Promise<T> {
  const {
    lead,
    tier,
    loadedConfig,
    effectiveConfig,
    businessContext,
    buildDefaultPrompt: buildTierPrompt,
    auditId,
    startTime,
  } = options;

  let toolCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const toolsUsed: string[] = [];

  // Build prompt
  const { systemPrompt, userPrompt } = loadedConfig.isDefault
    ? { systemPrompt: '', userPrompt: buildTierPrompt(lead) }
    : buildPromptFromConfig(lead, loadedConfig, businessContext);

  // Build tools array
  const researchTools = buildToolsArray(effectiveConfig.allowedTools, effectiveConfig.maxToolCalls);
  const submitTool = createSubmitEnrichmentTool(tier);
  const tools: ToolUnion[] = [...researchTools, submitTool];
  const toolNames = tools.map((t: ToolUnion) => 'name' in t ? t.name : 'unknown');
  console.log(`[Agent] Tools enabled: ${toolNames.join(', ')}`);
  console.log(`[Agent] Structured output: ENABLED (submit_enrichment tool)`);

  // Get required beta headers
  const betaHeaders = getRequiredBetaHeaders(effectiveConfig.allowedTools);
  const headers: Record<string, string> = {};
  if (betaHeaders.length > 0) {
    headers['anthropic-beta'] = betaHeaders.join(',');
    console.log(`[Agent] Beta headers: ${betaHeaders.join(',')}`);
  }

  // Initialize Anthropic client
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Initialize messages
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ];

  let turns = 0;
  const maxTurns = effectiveConfig.maxTurns;

  // Log prompt details
  console.log(`\n[Agent] ========== PROMPT DETAILS ==========`);
  if (systemPrompt) {
    console.log(`[Agent] System prompt length: ${systemPrompt.length} chars`);

    // Show key parts of system prompt
    if (systemPrompt.includes('About Us')) {
      const aboutMatch = systemPrompt.match(/## About Us \(([^)]+)\)/);
      if (aboutMatch) {
        console.log(`[Agent] ✓ Business context: ${aboutMatch[1]}`);
      }
      // Show what business context includes
      if (systemPrompt.includes('What We Do:')) console.log(`[Agent]   - Company description included`);
      if (systemPrompt.includes('Our Products/Services:')) console.log(`[Agent]   - Products/services included`);
      if (systemPrompt.includes('Our Value Propositions:')) console.log(`[Agent]   - Value propositions included`);
      if (systemPrompt.includes('What Makes Us Different:')) console.log(`[Agent]   - Differentiators included`);
      if (systemPrompt.includes('Our Target Customers:')) console.log(`[Agent]   - Target customer profile included`);
    }

    if (systemPrompt.includes('Tool Usage Limit')) {
      const limitMatch = systemPrompt.match(/MAXIMUM of (\d+) tool calls/);
      if (limitMatch) {
        console.log(`[Agent] ✓ Max tool calls in prompt: ${limitMatch[1]}`);
      }
    }

    if (systemPrompt.includes('Information Priorities')) {
      const priorityCount = (systemPrompt.match(/- .+\[REQUIRED\]|- .+: .+/g) || []).length;
      console.log(`[Agent] ✓ Information Priorities: ${priorityCount} priorities defined`);
    } else {
      console.log(`[Agent] ✗ Information Priorities: NOT CONFIGURED`);
    }

    if (systemPrompt.includes('Research Playbook')) {
      const stepCount = (systemPrompt.match(/\d+\. .+:/g) || []).length;
      console.log(`[Agent] ✓ Research Playbook: ${stepCount} steps defined`);
    } else {
      console.log(`[Agent] ✗ Research Playbook: NOT CONFIGURED`);
    }

    if (systemPrompt.includes('Decision Rules')) {
      const ruleCount = (systemPrompt.match(/- IF .+, THEN/g) || []).length;
      console.log(`[Agent] ✓ Thinking Rules: ${ruleCount} rules defined`);
    } else {
      console.log(`[Agent] ✗ Thinking Rules: NOT CONFIGURED`);
    }

    if (systemPrompt.includes('BLACKLIST')) {
      const blacklistItems: string[] = [];
      if (systemPrompt.includes('Competitors (never mention):')) blacklistItems.push('competitors');
      if (systemPrompt.includes('Topics to avoid:')) blacklistItems.push('topics');
      if (systemPrompt.includes('Phrases to avoid:')) blacklistItems.push('phrases');
      if (systemPrompt.includes('Words to avoid:')) blacklistItems.push('words');
      console.log(`[Agent] ✓ Blacklist: ${blacklistItems.join(', ') || 'enabled'}`);
    } else {
      console.log(`[Agent] ✗ Blacklist: NOT CONFIGURED`);
    }

    if (systemPrompt.includes('Email Structure')) {
      console.log(`[Agent] ✓ Email Structure: CONFIGURED`);
    }

    if (systemPrompt.includes('Email Signature')) {
      console.log(`[Agent] ✓ Email Signature: CONFIGURED`);
    }

    // Debug: Show full prompt if DEBUG=true
    if (process.env.DEBUG === 'true') {
      console.log(`\n[Agent] ========== FULL SYSTEM PROMPT (DEBUG) ==========`);
      console.log(systemPrompt);
      console.log(`[Agent] ========== END SYSTEM PROMPT ==========\n`);
    }
  } else {
    console.log(`[Agent] Using default prompt (no system prompt)`);
  }
  console.log(`[Agent] User prompt length: ${userPrompt.length} chars`);
  console.log(`[Agent] ==========================================\n`);

  console.log(`[Agent] Starting agentic loop (max ${maxTurns} turns)...`);

  while (turns < maxTurns) {
    turns++;
    console.log(`\n[Agent] ========== TURN ${turns}/${maxTurns} ==========`);

    // Make API call
    const requestOptions: Anthropic.MessageCreateParamsNonStreaming = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages,
      tools: tools as Anthropic.Tool[],
    };

    if (systemPrompt) {
      requestOptions.system = systemPrompt;
    }

    const response = await client.messages.create(requestOptions, {
      headers: betaHeaders.length > 0 ? headers : undefined,
    });

    // Track token usage
    if (response.usage) {
      inputTokens += response.usage.input_tokens;
      outputTokens += response.usage.output_tokens;
    }

    console.log(`[Agent] Stop reason: ${response.stop_reason}`);

    // Detailed logging of what Claude did
    let serverToolCount = 0;
    for (const block of response.content) {
      const blockType = (block as { type: string }).type;

      if (blockType === 'text') {
        const textBlock = block as Anthropic.TextBlock;
        // Show Claude's thinking/text (first 200 chars)
        const preview = textBlock.text.slice(0, 200).replace(/\n/g, ' ');
        console.log(`[Agent] 💭 Claude: "${preview}${textBlock.text.length > 200 ? '...' : ''}"`);
      } else if (blockType === 'server_tool_use') {
        serverToolCount++;
        const serverBlock = block as unknown as { type: 'server_tool_use'; name: string; input?: Record<string, unknown> };
        toolsUsed.push(serverBlock.name);
        if (serverBlock.name === 'web_search') {
          const input = serverBlock.input as { query?: string } | undefined;
          console.log(`[Agent] 🔍 Web Search: "${input?.query || 'unknown query'}"`);
        } else if (serverBlock.name === 'web_fetch') {
          const input = serverBlock.input as { url?: string } | undefined;
          console.log(`[Agent] 🌐 Web Fetch: ${input?.url || 'unknown URL'}`);
        }
      } else if (blockType === 'web_search_tool_result') {
        console.log(`[Agent] ✅ Search results received`);
      } else if (blockType === 'web_fetch_tool_result') {
        console.log(`[Agent] ✅ Fetch results received`);
      } else if (blockType === 'tool_use') {
        const toolBlock = block as Anthropic.ToolUseBlock;
        console.log(`[Agent] 🔧 Custom tool requested: ${toolBlock.name}`);
      }
    }
    if (serverToolCount > 0) {
      toolCalls += serverToolCount;
      console.log(`[Agent] Server tools used this turn: ${serverToolCount}`);
    }

    // Handle based on stop_reason
    if (response.stop_reason === 'end_turn') {
      // Done - extract final JSON response
      // Get ALL text blocks - server tools interleave text with tool results
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      if (textBlocks.length === 0) {
        // Log all content blocks for debugging
        console.log(`[Agent] No text block found. Content blocks:`, response.content.map(b => b.type));
        throw new Error('No text response from Claude');
      }

      // The LAST text block contains the final JSON response
      // Earlier text blocks are Claude's "thinking" before/between tool calls
      const finalTextBlock = textBlocks[textBlocks.length - 1];

      const duration = Date.now() - startTime;
      console.log(`\n[Agent] ========== ENRICHMENT COMPLETE (${tier.toUpperCase()}) ==========`);
      console.log(`[Agent] Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`[Agent] Total tool calls: ${toolCalls} (server: ${toolCalls}, custom: ${toolsUsed.filter(t => t === 'scrape_company_website' || t === 'scrape_linkedin').length})`);
      console.log(`[Agent] Tools used: ${[...new Set(toolsUsed)].join(', ') || 'none'}`);
      console.log(`[Agent] Text blocks in response: ${textBlocks.length}`);

      // Parse JSON response
      let jsonData: T;
      try {
        jsonData = extractJSON(finalTextBlock.text) as T;
      } catch (parseError) {
        console.error(`[Agent] ❌ JSON parse failed. Full response:\n${finalTextBlock.text}`);
        throw parseError;
      }

      // Log output preview
      const output = jsonData as Record<string, unknown>;
      console.log(`\n[Agent] ========== OUTPUT PREVIEW ==========`);
      if (output.enrichment) {
        const enrichment = output.enrichment as Record<string, unknown>;
        console.log(`[Agent] 📊 Role Summary: ${String(enrichment.role_summary || '').slice(0, 100)}...`);
        console.log(`[Agent] 🏢 Company Focus: ${String(enrichment.company_focus || '').slice(0, 100)}...`);
        if (enrichment.key_insights && Array.isArray(enrichment.key_insights)) {
          console.log(`[Agent] 💡 Key Insights: ${enrichment.key_insights.length} insights`);
        }
        if (enrichment.confidence_score !== undefined) {
          console.log(`[Agent] 📈 Confidence Score: ${enrichment.confidence_score}`);
        }
      }
      if (output.email_subject) {
        console.log(`[Agent] 📧 Subject: ${output.email_subject}`);
      }
      if (output.draft_email) {
        const email = String(output.draft_email);
        const wordCount = email.split(/\s+/).length;
        console.log(`[Agent] ✉️ Email: ${wordCount} words`);
        console.log(`[Agent] Email preview: "${email.slice(0, 150).replace(/\n/g, ' ')}..."`);
      }
      console.log(`[Agent] ============================================\n`);

      // Complete audit
      await completeAuditEntry(auditId, {
        status: 'success',
        duration_ms: duration,
        tool_calls: toolCalls,
        tools_used: toolsUsed,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: 0, // Calculate if needed
      });

      return jsonData;
    }

    if (response.stop_reason === 'pause_turn') {
      // Server tool still processing - continue conversation
      console.log(`[Agent] ⏳ Server tool still processing, continuing to next turn...`);
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }

    if (response.stop_reason === 'tool_use') {
      // Check if this is the submit_enrichment tool (structured output)
      const structuredOutput = extractFromToolCall<T>(response.content);
      if (structuredOutput) {
        const duration = Date.now() - startTime;
        console.log(`\n[Agent] ========== ENRICHMENT COMPLETE VIA STRUCTURED OUTPUT (${tier.toUpperCase()}) ==========`);
        console.log(`[Agent] Duration: ${(duration / 1000).toFixed(1)}s`);
        console.log(`[Agent] Total tool calls: ${toolCalls}`);
        console.log(`[Agent] Tools used: ${[...new Set(toolsUsed)].join(', ') || 'none'}`);

        // Log output preview
        const output = structuredOutput as Record<string, unknown>;
        console.log(`\n[Agent] ========== OUTPUT PREVIEW (STRUCTURED) ==========`);
        if (output.enrichment) {
          const enrichment = output.enrichment as Record<string, unknown>;
          console.log(`[Agent] 📊 Role Summary: ${String(enrichment.role_summary || '').slice(0, 100)}...`);
          console.log(`[Agent] 🏢 Company Focus: ${String(enrichment.company_focus || '').slice(0, 100)}...`);
          if (enrichment.key_insights && Array.isArray(enrichment.key_insights)) {
            console.log(`[Agent] 💡 Key Insights: ${enrichment.key_insights.length} insights`);
          }
          if (enrichment.confidence_score !== undefined) {
            console.log(`[Agent] 📈 Confidence Score: ${enrichment.confidence_score}`);
          }
        }
        if (output.email_subject) {
          console.log(`[Agent] 📧 Subject: ${output.email_subject}`);
        }
        if (output.draft_email) {
          const email = String(output.draft_email);
          const wordCount = email.split(/\s+/).length;
          console.log(`[Agent] ✉️ Email: ${wordCount} words`);
          console.log(`[Agent] Email preview: "${email.slice(0, 150).replace(/\n/g, ' ')}..."`);
        }
        console.log(`[Agent] ============================================\n`);

        // Complete audit
        await completeAuditEntry(auditId, {
          status: 'success',
          duration_ms: duration,
          tool_calls: toolCalls,
          tools_used: toolsUsed,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: 0,
        });

        return structuredOutput;
      }

      // Custom tools (scrape_company_website, scrape_linkedin) - execute them
      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          // Skip submit_enrichment as it's already handled above
          if (block.name === 'submit_enrichment') continue;

          toolCalls++;
          toolsUsed.push(block.name);

          console.log(`\n[Agent] ========== TOOL CALL #${toolCalls} ==========`);
          console.log(`[Agent] Tool: ${block.name}`);
          console.log(`[Agent] Input: ${JSON.stringify(block.input, null, 2)}`);

          // Execute custom tool
          const result = await executeTool(block.name, block.input as Record<string, unknown>);

          const resultPreview = result.slice(0, 500) + (result.length > 500 ? '...' : '');
          console.log(`[Agent] Result: ${resultPreview}`);
          console.log(`[Agent] =====================================\n`);

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      if (toolResults.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }
    }
  }

  throw new Error(`Exceeded maximum turns (${maxTurns}) without completing`);
}

/**
 * Enrich lead - Standard Tier
 * Uses web_search/web_fetch for quick research
 */
export async function enrichLeadStandard(leadId: string): Promise<void> {
  console.log(`[Agent] Processing STANDARD lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Load configuration from database (or use defaults)
  const loadedConfig = await loadConfigForTier('standard');
  const effectiveConfig = getEffectiveConfig(loadedConfig);

  // Load business context (sender's company info)
  const businessContext = await getActiveBusinessContext();

  console.log(`[Agent] Using config: ${loadedConfig.isDefault ? 'defaults' : loadedConfig.config?.name}`);
  console.log(`[Agent] Business context: ${businessContext ? businessContext.companyName : 'none'}`);

  await updateStatus(leadId, 'processing');

  // Create audit entry
  const auditId = await createAuditEntry({
    lead_id: leadId,
    tier: 'standard',
    started_at: new Date(),
  });

  const startTime = Date.now();

  try {
    const result = await runEnrichmentLoop<StandardEnrichmentOutput>({
      lead,
      tier: 'standard',
      loadedConfig,
      effectiveConfig,
      businessContext,
      buildDefaultPrompt: buildStandardPrompt,
      auditId,
      startTime,
    });

    // Apply blacklist filtering to draft email and subject
    const filteredEmail = applyBlacklistToContent(result.draft_email, loadedConfig);
    const filteredSubject = applyBlacklistToContent(result.email_subject, loadedConfig);

    // Save to database
    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: result.enrichment,
      enrichmentSources: convertSources(result.sources),
      emailSubject: filteredSubject,
      draftEmail: filteredEmail,
      processedAt: new Date(),
    });

    console.log(`[Agent] Standard enrichment complete: ${leadId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Agent] Standard enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage,
      processedAt: new Date(),
    });

    await completeAuditEntry(auditId, {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      tool_calls: 0,
      input_tokens: 0,
      output_tokens: 0,
      error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Enrich lead - Medium Tier
 * Uses web_search/web_fetch + company website scraping (no LinkedIn)
 */
export async function enrichLeadMedium(leadId: string): Promise<void> {
  console.log(`[Agent] Processing MEDIUM lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Load configuration from database (or use defaults)
  const loadedConfig = await loadConfigForTier('medium');
  const effectiveConfig = getEffectiveConfig(loadedConfig);

  // Load business context (sender's company info)
  const businessContext = await getActiveBusinessContext();

  console.log(`[Agent] Using config: ${loadedConfig.isDefault ? 'defaults' : loadedConfig.config?.name}`);
  console.log(`[Agent] Business context: ${businessContext ? businessContext.companyName : 'none'}`);

  await updateStatus(leadId, 'processing');

  // Create audit entry
  const auditId = await createAuditEntry({
    lead_id: leadId,
    tier: 'medium',
    started_at: new Date(),
  });

  const startTime = Date.now();

  try {
    const result = await runEnrichmentLoop<MediumEnrichmentOutput>({
      lead,
      tier: 'medium',
      loadedConfig,
      effectiveConfig,
      businessContext,
      buildDefaultPrompt: buildMediumPrompt,
      auditId,
      startTime,
    });

    // Apply blacklist filtering to draft email and subject
    const filteredEmail = applyBlacklistToContent(result.draft_email, loadedConfig);
    const filteredSubject = applyBlacklistToContent(result.email_subject, loadedConfig);

    // Save to database
    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: result.enrichment,
      enrichmentSources: convertSources(result.sources),
      emailSubject: filteredSubject,
      draftEmail: filteredEmail,
      processedAt: new Date(),
    });

    console.log(`[Agent] Medium enrichment complete: ${leadId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Agent] Medium enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage,
      processedAt: new Date(),
    });

    await completeAuditEntry(auditId, {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      tool_calls: 0,
      input_tokens: 0,
      output_tokens: 0,
      error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Enrich lead - Premium Tier
 * Uses web_search/web_fetch + company website scraping + LinkedIn scraping
 */
export async function enrichLeadPremium(leadId: string): Promise<void> {
  console.log(`[Agent] Processing PREMIUM lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Load configuration from database (or use defaults)
  const loadedConfig = await loadConfigForTier('premium');
  const effectiveConfig = getEffectiveConfig(loadedConfig);

  // Load business context (sender's company info)
  const businessContext = await getActiveBusinessContext();

  console.log(`[Agent] Using config: ${loadedConfig.isDefault ? 'defaults' : loadedConfig.config?.name}`);
  console.log(`[Agent] Business context: ${businessContext ? businessContext.companyName : 'none'}`);

  await updateStatus(leadId, 'processing');

  // Create audit entry
  const auditId = await createAuditEntry({
    lead_id: leadId,
    tier: 'premium',
    started_at: new Date(),
  });

  const startTime = Date.now();

  try {
    const result = await runEnrichmentLoop<PremiumEnrichmentOutput>({
      lead,
      tier: 'premium',
      loadedConfig,
      effectiveConfig,
      businessContext,
      buildDefaultPrompt: buildPremiumPrompt,
      auditId,
      startTime,
    });

    // Apply blacklist filtering to draft email and subject
    const filteredEmail = applyBlacklistToContent(result.draft_email, loadedConfig);
    const filteredSubject = applyBlacklistToContent(result.email_subject, loadedConfig);

    // Save to database
    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: result.enrichment,
      enrichmentSources: convertSources(result.sources),
      emailSubject: filteredSubject,
      draftEmail: filteredEmail,
      processedAt: new Date(),
    });

    console.log(`[Agent] Premium enrichment complete: ${leadId}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Agent] Premium enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage,
      processedAt: new Date(),
    });

    await completeAuditEntry(auditId, {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      tool_calls: 0,
      input_tokens: 0,
      output_tokens: 0,
      error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Router function - calls appropriate enrichment based on tier
 */
export async function enrichLeadByTier(leadId: string): Promise<void> {
  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  switch (lead.enrichmentTier) {
    case 'premium':
      await enrichLeadPremium(leadId);
      break;
    case 'medium':
      await enrichLeadMedium(leadId);
      break;
    case 'standard':
    default:
      await enrichLeadStandard(leadId);
      break;
  }
}
