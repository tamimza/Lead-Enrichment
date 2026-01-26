// Lead Enrichment Application - Agentic Enrichment Worker
// Uses Claude Agent SDK's query() with MCP tools and structured output
// Now supports database-driven configuration and business context

import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { getLead, updateLead, updateStatus } from '@/lib/db';
import { createAuditEntry, completeAuditEntry } from '@/lib/audit';
import { loadConfigForTier, getEffectiveConfig, applyBlacklistToContent, type LoadedConfig } from '@/lib/config-loader';
import { buildEnrichmentPrompt, buildDefaultPrompt } from '@/lib/prompt-builder';
import { getActiveBusinessContext } from '@/lib/project-db';
import { scrapeCompanyWebsiteTool, scrapeLinkedinTool } from './mcp-tools';
import { standardEnrichmentSchema, mediumEnrichmentSchema, premiumEnrichmentSchema } from './enrichment-schema';
import type { StandardEnrichmentOutput, MediumEnrichmentOutput, PremiumEnrichmentOutput } from './enrichment-schema';
import type { Lead, EnrichmentSource } from '@/types';
import type { BusinessContext } from '@/types/project';
import { categorizeTools } from '@/lib/tool-config';

// Map of MCP tool IDs to their implementations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MCP_TOOL_MAP: Record<string, any> = {
  'scrape_company_website': scrapeCompanyWebsiteTool,
  'scrape_linkedin': scrapeLinkedinTool,
};

/**
 * Create a filtered MCP server based on allowed tools
 */
function createFilteredMcpServer(allowedMcpTools: string[]) {
  if (allowedMcpTools.length === 0) {
    return null;
  }

  const tools = allowedMcpTools
    .filter(toolId => MCP_TOOL_MAP[toolId])
    .map(toolId => MCP_TOOL_MAP[toolId]);

  if (tools.length === 0) {
    return null;
  }

  console.log(`[Agent] Creating MCP server with tools: ${allowedMcpTools.join(', ')}`);

  return createSdkMcpServer({
    name: 'lead-enrichment',
    version: '1.0.0',
    tools,
  });
}

/**
 * Build prompt using database config if available, otherwise use defaults
 * Now includes business context for the sender's company
 */
function buildPromptFromConfig(
  lead: Lead,
  loadedConfig: LoadedConfig,
  businessContext?: BusinessContext | null
): string {
  if (loadedConfig.config && !loadedConfig.isDefault) {
    // Use dynamic prompt builder with config and business context
    const { systemPrompt, userPrompt } = buildEnrichmentPrompt(lead, loadedConfig, businessContext);
    return `${systemPrompt}\n\n${userPrompt}`;
  }
  // Fall back to hardcoded defaults (no business context in defaults for now)
  return buildDefaultPrompt(lead, loadedConfig.tier);
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
Use WebSearch with query: "${lead.companyName} company overview products services"
Extract: What they do, their industry, key products/services

${lead.companyWebsite ? `**Step 2 - Website Details (if needed):**
Use WebFetch on ${lead.companyWebsite} to get:
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
Return a JSON object with:
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
Use WebSearch: "${lead.companyName} company overview products services industry"
Goal: Understand what they do, their market position, and key offerings

${lead.companyWebsite ? `**Step 2 - Website Deep Dive:**
Use scrape_company_website on ${lead.companyWebsite}
Extract:
- Detailed company description and value proposition
- Products/services with specifics
- Recent news, blog posts, or announcements
- Team information if visible
- Any technology indicators` : '**Step 2 - Company Details:**\nUse WebSearch to find more specific information about their products and recent news'}

**Step 3 - Industry Context:**
Use WebSearch: "${lead.companyName} OR ${lead.jobTitle || 'their industry'} challenges trends"
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
Return a JSON object with:
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
WebSearch: "${lead.companyName} company overview funding investors valuation"
Extract: Company stage, funding history, key investors, market position

**1.2 Products & Services:**
WebSearch: "${lead.companyName} products services features pricing"
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
WebSearch: "${lead.companyName} news announcement 2024"
Extract: Recent launches, partnerships, funding, leadership changes

### Phase 2: Person Research

**2.1 Professional Background:**
WebSearch: "${lead.fullName} ${lead.companyName} ${lead.jobTitle || ''}"
Extract: Career history, expertise areas, public statements

${lead.linkedinUrl ? `**2.2 LinkedIn Profile:**
scrape_linkedin on ${lead.linkedinUrl}
Extract:
- Current role description and tenure
- Career progression and past companies
- Skills and endorsements
- Recent posts and articles
- Professional interests and groups
- Education and certifications` : '**2.2 Extended Person Search:**\nWebSearch for additional professional information, interviews, or speaking engagements'}

**2.3 Thought Leadership:**
WebSearch: "${lead.fullName} interview podcast article"
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
Return a JSON object with:
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
 * Enrich lead using Claude Agent SDK - Standard Tier
 * Uses WebSearch/WebFetch for quick research
 * Now supports database-driven configuration
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
  let toolCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Build prompt using config or defaults
    const prompt = loadedConfig.isDefault
      ? buildStandardPrompt(lead)
      : buildPromptFromConfig(lead, loadedConfig, businessContext);

    // Categorize tools into builtin and MCP
    const { builtinTools, mcpTools } = categorizeTools(effectiveConfig.allowedTools);
    console.log(`[Agent] Allowed builtin tools: ${builtinTools.join(', ') || 'none'}`);
    console.log(`[Agent] Allowed MCP tools: ${mcpTools.join(', ') || 'none'}`);

    // Create filtered MCP server (only if MCP tools are allowed)
    const mcpServer = createFilteredMcpServer(mcpTools);

    // Build query options
    const queryOptions: any = {
      model: 'sonnet',
      maxTurns: effectiveConfig.maxTurns,
      allowedTools: builtinTools,
      outputFormat: {
        type: 'json_schema',
        schema: standardEnrichmentSchema,
      },
      permissionMode: 'bypassPermissions',
    };

    // Only add MCP server if there are MCP tools allowed
    if (mcpServer) {
      queryOptions.mcpServers = {
        'lead-enrichment': mcpServer,
      };
    }

    // Use Agent SDK query() with configured tools
    for await (const message of query({
      prompt,
      options: queryOptions,
    })) {
      // Track tool usage for audit
      if ('type' in message && message.type === 'assistant') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_use') {
              toolCalls++;
              console.log(`\n[Agent] ========== TOOL CALL #${toolCalls} ==========`);
              console.log(`[Agent] Tool: ${block.name}`);
              console.log(`[Agent] Input: ${JSON.stringify(block.input, null, 2)}`);
            }
          });
        }
      }

      // Log tool results
      if ('type' in message && message.type === 'user') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_result') {
              const resultPreview = typeof block.content === 'string'
                ? block.content.slice(0, 500) + (block.content.length > 500 ? '...' : '')
                : JSON.stringify(block.content).slice(0, 500);
              console.log(`[Agent] Result: ${block.is_error ? 'ERROR - ' : ''}${resultPreview}`);
              console.log(`[Agent] =====================================\n`);
            }
          });
        }
      }

      // Capture final result
      if ('type' in message && message.type === 'result') {
        if (message.subtype === 'success' && message.structured_output) {
          const result = message.structured_output as StandardEnrichmentOutput;

          // Update token counts from result
          if (message.usage) {
            inputTokens = message.usage.input_tokens || 0;
            outputTokens = message.usage.output_tokens || 0;
          }

          const duration = Date.now() - startTime;
          console.log(`[Agent] Standard enrichment completed in ${duration}ms`);

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

          // Complete audit entry
          await completeAuditEntry(auditId, {
            status: 'success',
            duration_ms: duration,
            tool_calls: toolCalls,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: message.total_cost_usd || 0,
          });

          console.log(`[Agent] Standard enrichment complete: ${leadId}`);
          return;
        } else if (message.subtype.startsWith('error')) {
          throw new Error(`Agent query failed: ${message.subtype}`);
        }
      }
    }
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
      tool_calls: toolCalls,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Enrich lead using Claude Agent SDK - Medium Tier
 * Uses WebSearch/WebFetch + company website scraping (no LinkedIn)
 * Now supports database-driven configuration
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
  let toolCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const toolsUsed: string[] = [];

  try {
    // Build prompt using config or defaults
    const prompt = loadedConfig.isDefault
      ? buildMediumPrompt(lead)
      : buildPromptFromConfig(lead, loadedConfig, businessContext);

    // Categorize tools into builtin and MCP
    const { builtinTools, mcpTools } = categorizeTools(effectiveConfig.allowedTools);
    console.log(`[Agent] Allowed builtin tools: ${builtinTools.join(', ') || 'none'}`);
    console.log(`[Agent] Allowed MCP tools: ${mcpTools.join(', ') || 'none'}`);

    // Create filtered MCP server (only if MCP tools are allowed)
    const mcpServer = createFilteredMcpServer(mcpTools);

    // Build query options
    const queryOptions: any = {
      model: 'sonnet',
      maxTurns: effectiveConfig.maxTurns,
      allowedTools: builtinTools,
      outputFormat: {
        type: 'json_schema',
        schema: mediumEnrichmentSchema,
      },
      permissionMode: 'bypassPermissions',
      maxBudgetUsd: effectiveConfig.maxBudgetUsd || 1.0,
    };

    // Only add MCP server if there are MCP tools allowed
    if (mcpServer) {
      queryOptions.mcpServers = {
        'lead-enrichment': mcpServer,
      };
    }

    // Use Agent SDK query() with configured tools
    for await (const message of query({
      prompt,
      options: queryOptions,
    })) {
      // Track tool usage for audit
      if ('type' in message && message.type === 'assistant') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_use') {
              toolCalls++;
              toolsUsed.push(block.name);
              console.log(`\n[Agent] ========== TOOL CALL #${toolCalls} ==========`);
              console.log(`[Agent] Tool: ${block.name}`);
              console.log(`[Agent] Input: ${JSON.stringify(block.input, null, 2)}`);
            }
          });
        }
      }

      // Log tool results
      if ('type' in message && message.type === 'user') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_result') {
              const resultPreview = typeof block.content === 'string'
                ? block.content.slice(0, 500) + (block.content.length > 500 ? '...' : '')
                : JSON.stringify(block.content).slice(0, 500);
              console.log(`[Agent] Result: ${block.is_error ? 'ERROR - ' : ''}${resultPreview}`);
              console.log(`[Agent] =====================================\n`);
            }
          });
        }
      }

      // Capture final result
      if ('type' in message && message.type === 'result') {
        if (message.subtype === 'success' && message.structured_output) {
          const result = message.structured_output as MediumEnrichmentOutput;

          if (message.usage) {
            inputTokens = message.usage.input_tokens || 0;
            outputTokens = message.usage.output_tokens || 0;
          }

          const duration = Date.now() - startTime;
          console.log(
            `[Agent] Medium enrichment completed in ${duration}ms using ${toolCalls} tool calls`
          );

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

          // Complete audit entry
          await completeAuditEntry(auditId, {
            status: 'success',
            duration_ms: duration,
            tool_calls: toolCalls,
            tools_used: toolsUsed,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: message.total_cost_usd || 0,
          });

          console.log(`[Agent] Medium enrichment complete: ${leadId}`);
          return;
        } else if (message.subtype.startsWith('error')) {
          throw new Error(`Agent query failed: ${message.subtype}`);
        }
      }
    }
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
      tool_calls: toolCalls,
      tools_used: toolsUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      error_message: errorMessage,
    });

    throw error;
  }
}

/**
 * Enrich lead using Claude Agent SDK - Premium Tier
 * Uses custom MCP tools + WebSearch/WebFetch for comprehensive research
 * Now supports database-driven configuration
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
  let toolCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const toolsUsed: string[] = [];

  try {
    // Build prompt using config or defaults
    const prompt = loadedConfig.isDefault
      ? buildPremiumPrompt(lead)
      : buildPromptFromConfig(lead, loadedConfig, businessContext);

    // Categorize tools into builtin and MCP
    const { builtinTools, mcpTools } = categorizeTools(effectiveConfig.allowedTools);
    console.log(`[Agent] Allowed builtin tools: ${builtinTools.join(', ') || 'none'}`);
    console.log(`[Agent] Allowed MCP tools: ${mcpTools.join(', ') || 'none'}`);

    // Create filtered MCP server (only if MCP tools are allowed)
    const mcpServer = createFilteredMcpServer(mcpTools);

    // Build query options
    const queryOptions: any = {
      model: 'sonnet',
      maxTurns: effectiveConfig.maxTurns,
      allowedTools: builtinTools,
      outputFormat: {
        type: 'json_schema',
        schema: premiumEnrichmentSchema,
      },
      permissionMode: 'bypassPermissions',
      maxBudgetUsd: effectiveConfig.maxBudgetUsd || 2.0,
    };

    // Only add MCP server if there are MCP tools allowed
    if (mcpServer) {
      queryOptions.mcpServers = {
        'lead-enrichment': mcpServer,
      };
    }

    // Use Agent SDK query() with configured tools
    for await (const message of query({
      prompt,
      options: queryOptions,
    })) {
      // Track tool usage for audit
      if ('type' in message && message.type === 'assistant') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_use') {
              toolCalls++;
              toolsUsed.push(block.name);
              console.log(`\n[Agent] ========== TOOL CALL #${toolCalls} ==========`);
              console.log(`[Agent] Tool: ${block.name}`);
              console.log(`[Agent] Input: ${JSON.stringify(block.input, null, 2)}`);
            }
          });
        }
      }

      // Log tool results
      if ('type' in message && message.type === 'user') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          content.forEach((block: any) => {
            if (block.type === 'tool_result') {
              const resultPreview = typeof block.content === 'string'
                ? block.content.slice(0, 500) + (block.content.length > 500 ? '...' : '')
                : JSON.stringify(block.content).slice(0, 500);
              console.log(`[Agent] Result: ${block.is_error ? 'ERROR - ' : ''}${resultPreview}`);
              console.log(`[Agent] =====================================\n`);
            }
          });
        }
      }

      // Capture final result
      if ('type' in message && message.type === 'result') {
        if (message.subtype === 'success' && message.structured_output) {
          const result = message.structured_output as PremiumEnrichmentOutput;

          if (message.usage) {
            inputTokens = message.usage.input_tokens || 0;
            outputTokens = message.usage.output_tokens || 0;
          }

          const duration = Date.now() - startTime;
          console.log(
            `[Agent] Premium enrichment completed in ${duration}ms using ${toolCalls} tool calls`
          );

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

          // Complete audit entry
          await completeAuditEntry(auditId, {
            status: 'success',
            duration_ms: duration,
            tool_calls: toolCalls,
            tools_used: toolsUsed,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_usd: message.total_cost_usd || 0,
          });

          console.log(`[Agent] Premium enrichment complete: ${leadId}`);
          return;
        } else if (message.subtype.startsWith('error')) {
          throw new Error(`Agent query failed: ${message.subtype}`);
        }
      }
    }
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
      tool_calls: toolCalls,
      tools_used: toolsUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
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
