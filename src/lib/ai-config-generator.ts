// AI-Powered Project Configuration Generator
// Uses Claude to analyze website data and generate customized enrichment configs

import Anthropic from '@anthropic-ai/sdk';
import type { ScrapedWebsiteData } from '@/types/project';

// =============================================================================
// Types
// =============================================================================

export interface ProjectGenerationInput {
  projectName: string;
  companyName: string;
  websiteUrl?: string;
  scrapedData?: ScrapedWebsiteData;
  templateId?: string; // If using template-based setup
}

export interface GeneratedBusinessContext {
  companyDescription: string;
  products: string[];
  valuePropositions: string[];
  differentiators: string[];
  targetCustomerProfile: string;
  industryFocus: string[];
  competitors: string[];
}

export interface GeneratedPlaybookStep {
  stepOrder: number;
  name: string;
  description: string;
  searchType: 'web_search' | 'company_website' | 'linkedin' | 'custom';
  queryTemplate: string;
  requiredVariables: string[];
  skipIfFound?: string[];
  requiredTier: 'standard' | 'medium' | 'premium';
}

export interface GeneratedPriority {
  priorityOrder: number;
  name: string;
  description: string;
  category: 'company' | 'person' | 'industry' | 'technology' | 'insights';
  weight: number;
  isRequired: boolean;
  extractionHint: string;
}

export interface GeneratedThinkingRule {
  ruleOrder: number;
  name: string;
  description: string;
  conditionType: 'data_found' | 'data_missing' | 'value_matches' | 'value_contains' | 'custom';
  conditionField?: string;
  conditionValue?: string;
  conditionOperator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  actionType: 'add_insight' | 'modify_tone' | 'include_section' | 'exclude_section' | 'set_priority' | 'custom';
  actionValue: Record<string, unknown>;
}

export interface GeneratedEmailSection {
  id: string;
  name: string;
  order: number;
  required: boolean;
  instructions: string;
  example: string;
}

export interface GeneratedEmailTemplate {
  name: string;
  subjectTemplate: string;
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'conversational';
  writingStyle: string;
  openingStyle: string;
  closingStyle: string;
  signatureTemplate?: string;
  minParagraphs: number;
  maxParagraphs: number;
  sections: GeneratedEmailSection[];
}

export interface GeneratedBlacklistItem {
  itemType: 'word' | 'phrase' | 'topic' | 'competitor' | 'regex';
  value: string;
  reason: string;
  replacement?: string;
}

export interface GeneratedTierConfig {
  tier: 'standard' | 'medium' | 'premium';
  name: string;
  description: string;
  maxTurns: number;
  maxBudgetUsd: number;
  allowedTools: string[];
  emailTone: string;
  emailMinWords: number;
  emailMaxWords: number;
  playbook: GeneratedPlaybookStep[];
  priorities: GeneratedPriority[];
  thinkingRules: GeneratedThinkingRule[];
  emailTemplate: GeneratedEmailTemplate;
  blacklist: GeneratedBlacklistItem[];
}

export interface GeneratedProjectConfig {
  businessContext: GeneratedBusinessContext;
  configs: {
    standard: GeneratedTierConfig;
    medium: GeneratedTierConfig;
    premium: GeneratedTierConfig;
  };
}

// =============================================================================
// AI Generation Service
// =============================================================================

const client = new Anthropic();

const GENERATION_PROMPT = `You are an expert sales operations consultant who specializes in creating personalized lead enrichment and email outreach configurations.

Given information about a company, you will generate:
1. A business context summary
2. Customized enrichment configurations for 3 tiers (standard, medium, premium)

Each tier should have:
- Playbook steps (search queries customized with their terminology)
- Information priorities (weighted by their industry needs)
- Thinking rules (IF/THEN logic for their specific context)
- Email template (tone and sections that match their brand)
- Blacklist items (competitors and things to avoid)

IMPORTANT GUIDELINES:
- Use the company's actual product names, industry terms, and value props in templates
- Make search queries specific to their industry
- Weight priorities based on what matters for their target customers
- Email tone should match their brand voice (formal for enterprise, casual for startups)
- Always add their competitors to the blacklist
- Make the standard tier focused and efficient (fewer steps, basic research)
- Make premium tier comprehensive (more steps, LinkedIn, deeper analysis)

Respond with a valid JSON object matching this structure:
{
  "businessContext": {
    "companyDescription": "string",
    "products": ["string"],
    "valuePropositions": ["string"],
    "differentiators": ["string"],
    "targetCustomerProfile": "string",
    "industryFocus": ["string"],
    "competitors": ["string"]
  },
  "configs": {
    "standard": { tier config object },
    "medium": { tier config object },
    "premium": { tier config object }
  }
}

Each tier config should have:
{
  "tier": "standard|medium|premium",
  "name": "string (e.g., 'Acme Corp - Standard')",
  "description": "string",
  "maxTurns": number (standard: 6, medium: 8, premium: 12),
  "maxBudgetUsd": number (standard: 0.30, medium: 0.50, premium: 1.20),
  "allowedTools": ["WebSearch", "WebFetch", "scrape_company_website"] (premium adds "scrape_linkedin"),
  "emailTone": "professional|friendly|casual|formal|conversational",
  "emailMinWords": number,
  "emailMaxWords": number,
  "playbook": [playbook steps],
  "priorities": [information priorities],
  "thinkingRules": [thinking rules],
  "emailTemplate": { email template object },
  "blacklist": [blacklist items]
}`;

export async function generateProjectConfig(
  input: ProjectGenerationInput
): Promise<GeneratedProjectConfig> {
  const userPrompt = buildUserPrompt(input);

  console.log('[AI Config Generator] Starting generation for:', input.companyName);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    system: GENERATION_PROMPT,
  });

  // Extract text content
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  try {
    const generated = JSON.parse(jsonMatch[0]) as GeneratedProjectConfig;
    console.log('[AI Config Generator] Successfully generated config for:', input.companyName);
    console.log('[AI Config Generator] Generated data includes:', {
      hasBusinessContext: !!generated.businessContext,
      hasConfigs: !!generated.configs,
      tiers: generated.configs ? Object.keys(generated.configs) : [],
      standardConfig: generated.configs?.standard ? {
        name: generated.configs.standard.name,
        playbookSteps: generated.configs.standard.playbook?.length || 0,
        priorities: generated.configs.standard.priorities?.length || 0,
        rules: generated.configs.standard.thinkingRules?.length || 0,
        blacklist: generated.configs.standard.blacklist?.length || 0,
        hasEmailTemplate: !!generated.configs.standard.emailTemplate,
      } : 'missing',
    });
    return generated;
  } catch (error) {
    console.error('[AI Config Generator] Failed to parse JSON:', error);
    console.error('[AI Config Generator] Raw JSON string:', jsonMatch[0].substring(0, 500) + '...');
    throw new Error('Failed to parse AI-generated configuration');
  }
}

function buildUserPrompt(input: ProjectGenerationInput): string {
  const parts: string[] = [
    `Generate enrichment configurations for this company:`,
    ``,
    `Company Name: ${input.companyName}`,
    `Project Name: ${input.projectName}`,
  ];

  if (input.websiteUrl) {
    parts.push(`Website: ${input.websiteUrl}`);
  }

  if (input.scrapedData) {
    parts.push('');
    parts.push('=== SCRAPED WEBSITE DATA ===');

    if (input.scrapedData.title) {
      parts.push(`Page Title: ${input.scrapedData.title}`);
    }
    if (input.scrapedData.metaDescription) {
      parts.push(`Meta Description: ${input.scrapedData.metaDescription}`);
    }
    if (input.scrapedData.headings && input.scrapedData.headings.length > 0) {
      parts.push(`Main Headings: ${input.scrapedData.headings.slice(0, 10).join(', ')}`);
    }
    if (input.scrapedData.paragraphs && input.scrapedData.paragraphs.length > 0) {
      parts.push(`Key Content:`);
      input.scrapedData.paragraphs.slice(0, 5).forEach((p) => {
        parts.push(`  - ${p.slice(0, 200)}...`);
      });
    }
    if (input.scrapedData.links && input.scrapedData.links.length > 0) {
      const navLinks = input.scrapedData.links
        .filter((l) => l.text && l.text.length < 30)
        .slice(0, 15)
        .map((l) => l.text);
      if (navLinks.length > 0) {
        parts.push(`Navigation: ${navLinks.join(', ')}`);
      }
    }
    if (input.scrapedData.suggestedIndustry) {
      parts.push(`Detected Industry: ${input.scrapedData.suggestedIndustry}`);
    }
  }

  parts.push('');
  parts.push('Generate a complete configuration with business context and all three tier configs.');
  parts.push('Make everything specific to this company - use their actual terminology and focus on their industry.');

  return parts.join('\n');
}

// =============================================================================
// Quick Business Context Generation (cheaper, for preview)
// =============================================================================

export async function generateBusinessContextOnly(
  input: ProjectGenerationInput
): Promise<GeneratedBusinessContext> {
  const userPrompt = `Analyze this company and generate a business context summary:

Company Name: ${input.companyName}
${input.websiteUrl ? `Website: ${input.websiteUrl}` : ''}
${input.scrapedData?.metaDescription ? `Description: ${input.scrapedData.metaDescription}` : ''}
${input.scrapedData?.suggestedIndustry ? `Industry: ${input.scrapedData.suggestedIndustry}` : ''}

Respond with JSON:
{
  "companyDescription": "2-3 sentence description of what the company does",
  "products": ["list of products/services"],
  "valuePropositions": ["key value props for customers"],
  "differentiators": ["what makes them unique"],
  "targetCustomerProfile": "description of ideal customer",
  "industryFocus": ["industries they serve"],
  "competitors": ["likely competitors based on industry"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  return JSON.parse(jsonMatch[0]) as GeneratedBusinessContext;
}

// =============================================================================
// Template-Based Generation (no AI cost)
// =============================================================================

export function generateFromTemplate(
  input: ProjectGenerationInput,
  _templateConfig: Record<string, unknown>
): Partial<GeneratedProjectConfig> {
  // This creates a config based on a template, customizing names only
  // No AI cost - just string replacement
  // Note: _templateConfig will be used in future for template-based customization

  const companyName = input.companyName;

  return {
    businessContext: {
      companyDescription: `${companyName} - Update this description with your company information.`,
      products: [],
      valuePropositions: [],
      differentiators: [],
      targetCustomerProfile: 'Update with your target customer profile',
      industryFocus: [],
      competitors: [],
    },
  };
}

// =============================================================================
// Regeneration (update existing configs)
// =============================================================================

export async function regenerateConfigs(
  businessContext: GeneratedBusinessContext,
  tier?: 'standard' | 'medium' | 'premium'
): Promise<GeneratedTierConfig | GeneratedProjectConfig['configs']> {
  const prompt = `Based on this business context, generate ${tier ? `the ${tier} tier` : 'all three tiers of'} enrichment configuration:

Business Context:
${JSON.stringify(businessContext, null, 2)}

${tier ? `Generate only the ${tier} tier config.` : 'Generate configs for all three tiers (standard, medium, premium).'}

Respond with valid JSON.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: tier ? 3000 : 8000,
    messages: [{ role: 'user', content: prompt }],
    system: GENERATION_PROMPT,
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  return JSON.parse(jsonMatch[0]);
}
