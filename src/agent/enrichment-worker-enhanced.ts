// Lead Enrichment Application - Enhanced Worker with Web Tools
// Uses Claude's WebSearch and WebFetch for real data enrichment

import Anthropic from '@anthropic-ai/sdk';
import { getLead, updateLead, updateStatus } from '@/lib/db';
import { AgentResponseSchema } from '@/lib/validations';
import type { Lead, EnrichmentSource } from '@/types';

// Tool definitions for Claude
const webTools: Anthropic.Tool[] = [
  {
    name: 'web_search',
    description: 'Search the web for information about a company or person. Use this to find recent news, company details, and professional information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query to execute',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: 'Fetch and extract content from a specific URL. Use this to scrape company websites for detailed information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch content from',
        },
        extract: {
          type: 'string',
          description: 'What specific information to extract from the page (e.g., "company description", "team members", "products")',
        },
      },
      required: ['url', 'extract'],
    },
  },
];

/**
 * Execute web search using a simple fetch-based approach
 */
async function executeWebSearch(query: string): Promise<{ results: string; source: EnrichmentSource }> {
  const timestamp = new Date().toISOString();

  try {
    // Use DuckDuckGo instant answers API (free, no API key needed)
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract relevant information
    const results: string[] = [];

    if (data.Abstract) {
      results.push(`Summary: ${data.Abstract}`);
    }
    if (data.AbstractSource) {
      results.push(`Source: ${data.AbstractSource}`);
    }
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics
        .slice(0, 5)
        .filter((t: any) => t.Text)
        .map((t: any) => t.Text);
      if (topics.length > 0) {
        results.push(`Related: ${topics.join('; ')}`);
      }
    }

    const resultText = results.length > 0
      ? results.join('\n')
      : 'No detailed results found. Consider searching with different terms.';

    return {
      results: resultText,
      source: {
        type: 'web_search',
        url: `https://duckduckgo.com/?q=${encodedQuery}`,
        fetched_at: timestamp,
        data_points: results.length > 0 ? ['abstract', 'related_topics'] : [],
      },
    };
  } catch (error: any) {
    console.error('[WebSearch] Error:', error.message);
    return {
      results: `Search failed: ${error.message}. Will proceed with inference.`,
      source: {
        type: 'web_search',
        fetched_at: timestamp,
        data_points: [],
      },
    };
  }
}

/**
 * Execute web fetch to scrape a URL
 */
async function executeWebFetch(url: string, extract: string): Promise<{ content: string; source: EnrichmentSource }> {
  const timestamp = new Date().toISOString();

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadEnrichmentBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const html = await response.text();

    // Extract text content (simple HTML to text conversion)
    const textContent = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Limit to first 3000 characters
      .slice(0, 3000);

    const dataPoints: string[] = [];
    if (textContent.length > 100) {
      dataPoints.push('page_content');
      if (extract) dataPoints.push(extract.toLowerCase().replace(/\s+/g, '_'));
    }

    return {
      content: textContent || 'Could not extract meaningful content from this page.',
      source: {
        type: 'web_fetch',
        url: url,
        fetched_at: timestamp,
        data_points: dataPoints,
      },
    };
  } catch (error: any) {
    console.error('[WebFetch] Error:', error.message);
    return {
      content: `Could not fetch ${url}: ${error.message}`,
      source: {
        type: 'web_fetch',
        url: url,
        fetched_at: timestamp,
        data_points: [],
      },
    };
  }
}

/**
 * Build premium enrichment prompt with web research instructions
 */
function buildPremiumPrompt(lead: Lead): string {
  return `You are an expert lead researcher. Your job is to thoroughly research this person and their company, then draft a highly personalized introduction email.

LEAD INFORMATION:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
${lead.jobTitle ? `- Title: ${lead.jobTitle}` : ''}
- Email: ${lead.email}
${lead.linkedinUrl ? `- LinkedIn: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- Company Website: ${lead.companyWebsite}` : ''}

RESEARCH INSTRUCTIONS:

Use the available tools to gather real information:

1. COMPANY RESEARCH: Use web_search to find:
   - What the company does
   - Recent news or announcements
   - Industry and market position
   - Company size and funding (if available)

2. WEBSITE ANALYSIS: If a company website is provided, use web_fetch to:
   - Extract company description and value proposition
   - Identify products/services offered
   - Find any relevant team or about page information

3. PERSON RESEARCH: Use web_search to find:
   - Professional background
   - Recent activities or posts
   - Speaking engagements or publications

After gathering information, provide a comprehensive analysis and draft email.

RESPONSE FORMAT (strict JSON):

{
  "enrichment": {
    "role_summary": "Detailed description of their role and likely responsibilities",
    "company_focus": "What the company does based on your research",
    "key_insights": ["Research-backed insight 1", "Research-backed insight 2", "Research-backed insight 3"],
    "company_info": {
      "description": "Company description from website/search",
      "industry": "Industry sector",
      "products_services": ["Product 1", "Service 1"],
      "recent_news": ["Recent news item if found"]
    },
    "person_info": {
      "bio": "Brief professional bio if found",
      "expertise_areas": ["Area 1", "Area 2"]
    },
    "likely_challenges": ["Challenge they might face 1", "Challenge 2"],
    "potential_value_props": ["How we could help 1", "Value proposition 2"],
    "talking_points": ["Conversation starter 1", "Conversation starter 2"],
    "confidence_score": 85,
    "data_freshness": "real_time"
  },
  "draft_email": "Your thoroughly researched and personalized email here (200-300 words)"
}

Important: Use the tools to gather REAL information. The draft email should reference specific, verified details about the company and person.`;
}

/**
 * Build standard enrichment prompt (inference-based, faster)
 */
function buildStandardPrompt(lead: Lead): string {
  return `You are a professional lead researcher. Based on the information provided, make intelligent inferences and draft a concise introduction email.

LEAD INFORMATION:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
${lead.jobTitle ? `- Title: ${lead.jobTitle}` : ''}
- Email: ${lead.email}

INSTRUCTIONS:
Make reasonable inferences about their role and company based on the information provided. Draft a brief, professional introduction email.

RESPONSE FORMAT (strict JSON):

{
  "enrichment": {
    "role_summary": "Brief description of their likely role based on title",
    "company_focus": "What the company likely does based on name",
    "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
    "confidence_score": 60,
    "data_freshness": "inferred"
  },
  "draft_email": "A concise introduction email (100-150 words)"
}`;
}

/**
 * Extract JSON from Claude's response
 */
function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {}

  const codeBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {}
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }

  throw new Error('No valid JSON found in response');
}

/**
 * Process tool calls from Claude's response
 */
async function processToolCalls(
  toolUseBlocks: Anthropic.ToolUseBlock[]
): Promise<{ results: Anthropic.ToolResultBlockParam[]; sources: EnrichmentSource[] }> {
  const results: Anthropic.ToolResultBlockParam[] = [];
  const sources: EnrichmentSource[] = [];

  for (const toolUse of toolUseBlocks) {
    console.log(`[Agent] Tool call: ${toolUse.name}`);

    if (toolUse.name === 'web_search') {
      const input = toolUse.input as { query: string };
      const { results: searchResults, source } = await executeWebSearch(input.query);
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: searchResults,
      });
      sources.push(source);
    } else if (toolUse.name === 'web_fetch') {
      const input = toolUse.input as { url: string; extract: string };
      const { content, source } = await executeWebFetch(input.url, input.extract);
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: content,
      });
      sources.push(source);
    }
  }

  return { results, sources };
}

/**
 * Main enrichment function - Premium tier with web tools
 */
export async function enrichLeadPremium(leadId: string): Promise<void> {
  console.log(`[Agent] Processing PREMIUM lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  await updateStatus(leadId, 'processing');
  const allSources: EnrichmentSource[] = [];

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildPremiumPrompt(lead);
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: prompt },
    ];

    const startTime = Date.now();
    console.log(`[Agent] Starting premium enrichment with web tools...`);

    // Initial API call with tools
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      tools: webTools,
      messages,
    });

    // Process tool calls in a loop (max 5 iterations)
    let iterations = 0;
    const maxIterations = 5;

    while (response.stop_reason === 'tool_use' && iterations < maxIterations) {
      iterations++;
      console.log(`[Agent] Tool iteration ${iterations}/${maxIterations}`);

      // Extract tool use blocks
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Process tool calls
      const { results: toolResults, sources } = await processToolCalls(toolUseBlocks);
      allSources.push(...sources);

      // Add assistant response and tool results to messages
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });

      // Continue conversation
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        tools: webTools,
        messages,
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Agent] Completed in ${duration}s with ${allSources.length} sources`);

    // Extract final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textBlock) {
      throw new Error('No text response from Claude');
    }

    // Add inference source if no web sources were gathered
    if (allSources.length === 0) {
      allSources.push({
        type: 'inference',
        fetched_at: new Date().toISOString(),
        data_points: ['role_inference', 'company_inference'],
      });
    }

    // Parse and validate response
    const jsonData = extractJSON(textBlock.text);
    const validated = AgentResponseSchema.parse(jsonData);

    // Save to database
    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: validated.enrichment,
      enrichmentSources: allSources,
      draftEmail: validated.draft_email,
      processedAt: new Date(),
    });

    console.log(`[Agent] Premium enrichment complete: ${leadId}`);
  } catch (error: any) {
    console.error(`[Agent] Premium enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage: error.message || 'Unknown error',
      enrichmentSources: allSources,
      processedAt: new Date(),
    });

    throw error;
  }
}

/**
 * Main enrichment function - Standard tier (inference only)
 */
export async function enrichLeadStandard(leadId: string): Promise<void> {
  console.log(`[Agent] Processing STANDARD lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  await updateStatus(leadId, 'processing');

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildStandardPrompt(lead);
    const startTime = Date.now();
    console.log(`[Agent] Starting standard enrichment...`);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Agent] Completed in ${duration}s`);

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textBlock) {
      throw new Error('No text response from Claude');
    }

    const jsonData = extractJSON(textBlock.text);
    const validated = AgentResponseSchema.parse(jsonData);

    const inferenceSource: EnrichmentSource = {
      type: 'inference',
      fetched_at: new Date().toISOString(),
      data_points: ['role_inference', 'company_inference'],
    };

    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: validated.enrichment,
      enrichmentSources: [inferenceSource],
      draftEmail: validated.draft_email,
      processedAt: new Date(),
    });

    console.log(`[Agent] Standard enrichment complete: ${leadId}`);
  } catch (error: any) {
    console.error(`[Agent] Standard enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage: error.message || 'Unknown error',
      processedAt: new Date(),
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

  const tier = lead.enrichmentTier || 'standard';
  console.log(`[Agent] Processing ${tier.toUpperCase()} lead: ${leadId}`);

  // Premium and Medium both use web research
  // Standard uses inference only
  if (tier === 'premium' || tier === 'medium') {
    await enrichLeadPremium(leadId);
  } else {
    await enrichLeadStandard(leadId);
  }
}
