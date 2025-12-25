// Lead Enrichment Application - Alternative Worker using Anthropic SDK
// Uses direct API calls instead of Agent SDK

import Anthropic from '@anthropic-ai/sdk';
import { getLead, updateLead, updateStatus } from '@/lib/db';
import { AgentResponseSchema } from '@/lib/validations';
import type { Lead } from '@/types';

const DEBUG = process.env.DEBUG === 'true';

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
 * Build enrichment prompt
 */
function buildEnrichmentPrompt(lead: Lead): string {
  return `You are a professional lead researcher. Research this person and draft a personalized introduction email.

LEAD INFORMATION:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
${lead.jobTitle ? `- Title: ${lead.jobTitle}` : ''}
- Email: ${lead.email}
${lead.linkedinUrl ? `- LinkedIn: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- Company Website: ${lead.companyWebsite}` : ''}

INSTRUCTIONS:

Based on the information provided above:

1. Make reasonable inferences about:
   - Their likely role and seniority level based on their title
   - What their company likely does based on the company name
   - What challenges they might face in their role
   - What would be relevant to them professionally

2. Generate a personalized introduction email (150-200 words) that:
   - References their role and company
   - Sounds conversational and genuine (not templated)
   - Has a clear but soft call-to-action
   - Avoids overly salesy language
   - Shows understanding of their likely business context

IMPORTANT: Return your findings as valid JSON in this EXACT format:

{
  "enrichment": {
    "role_summary": "Brief description of their likely role and experience level",
    "company_focus": "What the company likely does based on name/context",
    "key_insights": ["Insight 1 about their role", "Insight 2 about their company", "Insight 3 about relevance"]
  },
  "draft_email": "The complete personalized email text here"
}

Note: Since we don't have access to real-time web search, make intelligent inferences based on the title and company name provided.`;
}

/**
 * Main enrichment function using Anthropic SDK
 */
export async function enrichLeadWithAPI(leadId: string): Promise<void> {
  console.log(`[Agent] Processing lead: ${leadId}`);

  const lead = await getLead(leadId);
  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  await updateStatus(leadId, 'processing');
  console.log(`[Agent] Lead status updated to processing`);

  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildEnrichmentPrompt(lead);

    if (DEBUG) {
      console.log(`[Agent] Prompt:\n${prompt}`);
    }

    const startTime = Date.now();
    console.log(`[Agent] Calling Claude API...`);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Agent] Completed in ${duration}s`);

    // Extract text from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const finalResult = content.text;

    if (DEBUG) {
      console.log(`[Agent] Response:\n${finalResult}`);
    }

    // Extract and validate JSON
    const jsonData = extractJSON(finalResult);
    const validated = AgentResponseSchema.parse(jsonData);

    // Save to database
    await updateLead(leadId, {
      status: 'enriched',
      enrichmentData: validated.enrichment,
      draftEmail: validated.draft_email,
      processedAt: new Date(),
    });

    console.log(`[Agent] Lead enriched successfully: ${leadId}`);
  } catch (error: any) {
    console.error(`[Agent] Enrichment failed for ${leadId}:`, error);

    await updateLead(leadId, {
      status: 'failed',
      errorMessage: error.message || 'Unknown error',
      processedAt: new Date(),
    });

    throw error;
  }
}
