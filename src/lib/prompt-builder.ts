import type { Lead } from '@/types';
import type { LoadedConfig } from './config-loader';
import type { BusinessContext } from '@/types/project';
import {
  getEffectiveConfig,
  getPriorityInstructions,
  getThinkingRules,
  getPlaybookSteps,
  getBlacklistForPrompt,
} from './config-loader';

// =============================================================================
// Prompt Building Interface
// =============================================================================

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
}

// =============================================================================
// Dynamic Prompt Builder
// =============================================================================

/**
 * Build the enrichment prompt based on the loaded configuration.
 * If no config is loaded (using defaults), returns a minimal prompt structure.
 * Now includes optional business context for the sender's company.
 */
export function buildEnrichmentPrompt(
  lead: Lead,
  loadedConfig: LoadedConfig,
  businessContext?: BusinessContext | null
): BuiltPrompt {
  const config = getEffectiveConfig(loadedConfig);
  const priorities = getPriorityInstructions(loadedConfig);
  const rules = getThinkingRules(loadedConfig);
  const emailSections = getEmailSectionsWithExamples(loadedConfig);
  const playbookSteps = getPlaybookSteps(loadedConfig, loadedConfig.tier);
  const blacklist = getBlacklistForPrompt(loadedConfig);

  // Merge project competitors into blacklist
  if (businessContext?.competitors && businessContext.competitors.length > 0) {
    blacklist.competitors = [
      ...new Set([...blacklist.competitors, ...businessContext.competitors])
    ];
  }

  // Build system prompt sections
  const systemParts: string[] = [];

  // Core identity - now includes sender context if available
  if (businessContext && businessContext.companyName) {
    systemParts.push(`You are a sales development representative for ${businessContext.companyName}. Your task is to research a business lead and craft a personalized outreach email that connects THEIR specific situation to YOUR company's value proposition.`);
  } else {
    systemParts.push(`You are an expert lead research and enrichment assistant. Your task is to gather comprehensive information about a business lead and craft a personalized outreach email.`);
  }

  // About Us section - only if business context is provided
  if (businessContext && businessContext.companyName) {
    const aboutParts: string[] = [];
    aboutParts.push(`\n## About Us (${businessContext.companyName})`);

    if (businessContext.companyDescription) {
      aboutParts.push(`**What We Do:** ${businessContext.companyDescription}`);
    }

    if (businessContext.products && businessContext.products.length > 0) {
      aboutParts.push(`**Our Products/Services:** ${businessContext.products.join(', ')}`);
    }

    if (businessContext.valuePropositions && businessContext.valuePropositions.length > 0) {
      aboutParts.push(`**Our Value Propositions:**\n${businessContext.valuePropositions.map(v => `- ${v}`).join('\n')}`);
    }

    if (businessContext.differentiators && businessContext.differentiators.length > 0) {
      aboutParts.push(`**What Makes Us Different:** ${businessContext.differentiators.join(', ')}`);
    }

    if (businessContext.targetCustomerProfile) {
      aboutParts.push(`**Our Target Customers:** ${businessContext.targetCustomerProfile}`);
    }

    if (businessContext.industryFocus && businessContext.industryFocus.length > 0) {
      aboutParts.push(`**Industries We Focus On:** ${businessContext.industryFocus.join(', ')}`);
    }

    aboutParts.push(`\n**Your Goal:** Research the lead below and find connections between THEIR situation and OUR value propositions. The email should feel personalized to them while naturally introducing how ${businessContext.companyName} could help.`);

    systemParts.push(aboutParts.join('\n'));
  }

  // Tool usage constraint - CRITICAL for controlling costs
  systemParts.push(`\n## IMPORTANT: Tool Usage Limit
You MUST complete your research using a MAXIMUM of ${config.maxToolCalls} tool calls total. Be efficient:
- Combine related searches when possible
- Don't repeat searches that didn't yield results
- Prioritize the most valuable data sources first
- Stop searching once you have enough information to write a quality email`);

  // Priorities section
  if (priorities.length > 0) {
    systemParts.push(`\n## Information Priorities\nFocus on gathering the following information, in order of importance:\n${priorities.join('\n')}`);
  }

  // Research playbook
  if (playbookSteps.length > 0) {
    const playbookText = playbookSteps.map((step, i) => {
      let stepText = `${i + 1}. ${step.name}: ${step.queryTemplate}`;
      if (step.skipIfFound && step.skipIfFound.length > 0) {
        stepText += ` (Skip if already found: ${step.skipIfFound.join(', ')})`;
      }
      return stepText;
    }).join('\n');
    systemParts.push(`\n## Research Playbook\nFollow these steps to gather information:\n${playbookText}`);
  }

  // Thinking rules
  if (rules.length > 0) {
    const rulesText = rules.map(r => `- IF ${r.condition}, THEN ${r.action}`).join('\n');
    systemParts.push(`\n## Decision Rules\nApply these rules when interpreting data:\n${rulesText}`);
  }

  // Blacklist section - CRITICAL: Tell Claude what to avoid BEFORE generating
  const hasBlacklistItems = blacklist.words.length > 0 || blacklist.phrases.length > 0 ||
                            blacklist.topics.length > 0 || blacklist.competitors.length > 0;
  if (hasBlacklistItems) {
    const blacklistParts: string[] = [];
    blacklistParts.push(`\n## BLACKLIST - NEVER MENTION`);
    blacklistParts.push(`The following MUST NEVER appear in your output. If you need to reference these, rephrase or omit entirely.`);

    if (blacklist.competitors.length > 0) {
      blacklistParts.push(`\n**Competitors (never mention):** ${blacklist.competitors.join(', ')}`);
    }
    if (blacklist.topics.length > 0) {
      blacklistParts.push(`\n**Topics to avoid:** ${blacklist.topics.join(', ')}`);
    }
    if (blacklist.phrases.length > 0) {
      blacklistParts.push(`\n**Phrases to avoid:** ${blacklist.phrases.join(', ')}`);
    }
    if (blacklist.words.length > 0) {
      blacklistParts.push(`\n**Words to avoid:** ${blacklist.words.join(', ')}`);
    }

    systemParts.push(blacklistParts.join('\n'));
  }

  // Email structure with examples
  if (emailSections.length > 0) {
    const sectionsText = emailSections.map(s => {
      let text = `\n### ${s.name}${s.required ? ' (REQUIRED)' : ' (optional)'}\n${s.instructions}`;
      if (s.example) {
        text += `\n**Example:** "${s.example}"`;
      }
      return text;
    }).join('\n');
    systemParts.push(`\n## Email Structure\nStructure the email with these sections:${sectionsText}`);
  }

  // Email constraints
  const emailTemplate = loadedConfig.config?.emailTemplate;
  systemParts.push(`\n## Email Requirements
- Tone: ${emailTemplate?.tone || config.emailTone}
- Length: ${config.emailMinWords}-${config.emailMaxWords} words
- Paragraphs: ${emailTemplate?.minParagraphs || 3}-${emailTemplate?.maxParagraphs || 5}`);

  if (emailTemplate?.writingStyle) {
    systemParts.push(`- Style: ${emailTemplate.writingStyle}`);
  }
  if (emailTemplate?.openingStyle) {
    systemParts.push(`- Opening: ${emailTemplate.openingStyle}`);
  }
  if (emailTemplate?.closingStyle) {
    systemParts.push(`- Closing: ${emailTemplate.closingStyle}`);
  }

  // Subject line template
  if (emailTemplate?.subjectTemplate) {
    systemParts.push(`\n## Email Subject Line\nGenerate a subject line following this pattern: "${emailTemplate.subjectTemplate}"\nReplace any {{variables}} with actual values from your research.`);
  } else {
    systemParts.push(`\n## Email Subject Line\nCreate a compelling, personalized subject line (5-10 words) that references something specific about the lead or company.`);
  }

  // Signature template - use business context if available, otherwise use email template
  if (businessContext?.senderName) {
    const signatureParts = [businessContext.senderName];
    if (businessContext.senderTitle) signatureParts.push(businessContext.senderTitle);
    if (businessContext.companyName) signatureParts.push(businessContext.companyName);
    if (businessContext.calendarLink) signatureParts.push(`\nBook a call: ${businessContext.calendarLink}`);
    systemParts.push(`\n## Email Signature\nEnd the email with this signature:\n${signatureParts.join('\n')}`);
  } else if (emailTemplate?.signatureTemplate) {
    systemParts.push(`\n## Email Signature\nEnd the email with this signature:\n${emailTemplate.signatureTemplate}`);
  }

  // Build user prompt with lead data
  const userPromptParts: string[] = [];
  userPromptParts.push(`Please research and enrich the following lead:`);
  userPromptParts.push(`\n## Lead Information`);
  userPromptParts.push(`- Name: ${lead.fullName}`);
  userPromptParts.push(`- Company: ${lead.companyName}`);
  userPromptParts.push(`- Email: ${lead.email}`);

  if (lead.jobTitle) {
    userPromptParts.push(`- Job Title: ${lead.jobTitle}`);
  }
  if (lead.linkedinUrl) {
    userPromptParts.push(`- LinkedIn: ${lead.linkedinUrl}`);
  }
  if (lead.companyWebsite) {
    userPromptParts.push(`- Company Website: ${lead.companyWebsite}`);
  }

  // Add tier-specific output requirements
  userPromptParts.push(buildOutputRequirements(loadedConfig.tier, config, emailTemplate?.signatureTemplate));

  return {
    systemPrompt: systemParts.join('\n'),
    userPrompt: userPromptParts.join('\n'),
  };
}

/**
 * Get email sections with examples included.
 */
function getEmailSectionsWithExamples(loadedConfig: LoadedConfig): Array<{
  name: string;
  instructions: string;
  required: boolean;
  example?: string;
}> {
  if (!loadedConfig.config?.emailTemplate) {
    return [];
  }

  return loadedConfig.config.emailTemplate.sections
    .sort((a, b) => a.order - b.order)
    .map(s => ({
      name: s.name,
      instructions: s.instructions,
      required: s.required,
      example: s.example,
    }));
}

/**
 * Build the output requirements section based on tier.
 */
function buildOutputRequirements(
  tier: string,
  config: ReturnType<typeof getEffectiveConfig>,
  signatureTemplate?: string
): string {
  const requirements: string[] = ['\n## Required Output'];

  // Common requirements
  requirements.push(`Provide your findings as a JSON object with the following structure:`);

  const signatureNote = signatureTemplate
    ? ` Include the provided signature at the end.`
    : '';

  switch (tier) {
    case 'standard':
      requirements.push(`{
  "enrichment": {
    "role_summary": "Brief summary of the person's role and responsibilities",
    "company_focus": "What the company does and their main focus",
    "key_insights": ["2-3 key insights about the lead or company"],
    "confidence_score": 0-100,
    "data_freshness": "real_time" | "cached" | "inferred"
  },
  "email_subject": "Compelling, personalized subject line (5-10 words)",
  "draft_email": "A personalized outreach email (${config.emailMinWords}-${config.emailMaxWords} words).${signatureNote}",
  "sources": [{"type": "web_search|web_fetch|inference", "url": "optional", "data_points": ["what you found"]}]
}`);
      break;

    case 'medium':
      requirements.push(`{
  "enrichment": {
    "role_summary": "Summary of the person's role and responsibilities",
    "company_focus": "What the company does and their main focus",
    "key_insights": ["3-4 key insights about the lead or company"],
    "company_info": {
      "description": "Company description",
      "industry": "Industry sector",
      "size": "Company size if found",
      "products_services": ["Main products or services"],
      "recent_news": ["Recent news or announcements"]
    },
    "likely_challenges": ["2-3 challenges this person/company likely faces"],
    "confidence_score": 0-100,
    "data_freshness": "real_time" | "cached" | "inferred"
  },
  "email_subject": "Compelling, personalized subject line referencing company research",
  "draft_email": "A personalized outreach email (${config.emailMinWords}-${config.emailMaxWords} words).${signatureNote}",
  "sources": [{"type": "web_search|web_fetch|scrape_company_website|inference", "url": "optional", "data_points": ["what you found"]}]
}`);
      break;

    case 'premium':
      requirements.push(`{
  "enrichment": {
    "role_summary": "Detailed summary of the person's role, responsibilities, and expertise",
    "company_focus": "Comprehensive overview of what the company does",
    "key_insights": ["3-5 detailed insights about the lead and company"],
    "company_info": {
      "description": "Detailed company description",
      "industry": "Industry sector",
      "size": "Company size",
      "founded": "Year founded if found",
      "headquarters": "Company headquarters",
      "products_services": ["Main products or services"],
      "recent_news": ["Recent news or announcements"],
      "tech_stack": ["Technologies used if discoverable"]
    },
    "person_info": {
      "bio": "Professional bio or background",
      "current_role": "Current role details",
      "experience_years": "Years of experience if found",
      "expertise_areas": ["Areas of expertise"],
      "recent_posts": ["Recent LinkedIn posts or articles if found"]
    },
    "likely_challenges": ["3-4 challenges this person/company likely faces"],
    "potential_value_props": ["2-3 potential value propositions to highlight"],
    "talking_points": ["3-4 conversation starters or talking points"],
    "confidence_score": 0-100,
    "data_freshness": "real_time" | "cached" | "inferred"
  },
  "email_subject": "Highly personalized subject line referencing specific research findings",
  "draft_email": "A highly personalized outreach email (${config.emailMinWords}-${config.emailMaxWords} words).${signatureNote}",
  "sources": [{"type": "web_search|web_fetch|scrape_company_website|scrape_linkedin|inference", "url": "optional", "data_points": ["what you found"]}]
}`);
      break;
  }

  return requirements.join('\n');
}

/**
 * Build a simplified prompt for when no custom config exists.
 * This maintains backward compatibility with the original hardcoded behavior.
 */
export function buildDefaultPrompt(
  lead: Lead,
  tier: 'standard' | 'medium' | 'premium'
): string {
  switch (tier) {
    case 'standard':
      return buildStandardDefaultPrompt(lead);
    case 'medium':
      return buildMediumDefaultPrompt(lead);
    case 'premium':
      return buildPremiumDefaultPrompt(lead);
  }
}

function buildStandardDefaultPrompt(lead: Lead): string {
  return `You are an expert lead researcher. Research the following lead and provide enrichment data.

Lead Information:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
- Email: ${lead.email}
${lead.jobTitle ? `- Job Title: ${lead.jobTitle}` : ''}
${lead.companyWebsite ? `- Company Website: ${lead.companyWebsite}` : ''}

Instructions:
1. Search for information about this person and their company
2. Identify 2-3 key insights that would be valuable for outreach
3. Create a compelling email subject line (5-10 words) that references something specific
4. Write a personalized email (3-4 paragraphs, 100-150 words) that references specific findings

Return your findings as JSON with these fields:
- enrichment: { role_summary, company_focus, key_insights[], confidence_score, data_freshness }
- email_subject: A compelling, personalized subject line
- draft_email: The personalized email
- sources: [{ type, url?, data_points[] }]`;
}

function buildMediumDefaultPrompt(lead: Lead): string {
  return `You are an expert lead researcher with access to company website scraping. Research the following lead thoroughly.

Lead Information:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
- Email: ${lead.email}
${lead.jobTitle ? `- Job Title: ${lead.jobTitle}` : ''}
${lead.companyWebsite ? `- Company Website: ${lead.companyWebsite}` : ''}

Instructions:
1. Search for information about this person and their company
2. If available, scrape their company website for detailed information
3. Identify 3-4 key insights and potential challenges they face
4. Create a compelling email subject line that references your research findings
5. Write a personalized email (3-4 paragraphs, 150-200 words)

Return your findings as JSON with these fields:
- enrichment: { role_summary, company_focus, key_insights[], company_info{}, likely_challenges[], confidence_score, data_freshness }
- email_subject: A compelling subject line referencing company research
- draft_email: The personalized email
- sources: [{ type, url?, data_points[] }]`;
}

function buildPremiumDefaultPrompt(lead: Lead): string {
  return `You are an expert lead researcher with full research capabilities including LinkedIn access. Conduct comprehensive research on the following lead.

Lead Information:
- Name: ${lead.fullName}
- Company: ${lead.companyName}
- Email: ${lead.email}
${lead.jobTitle ? `- Job Title: ${lead.jobTitle}` : ''}
${lead.linkedinUrl ? `- LinkedIn: ${lead.linkedinUrl}` : ''}
${lead.companyWebsite ? `- Company Website: ${lead.companyWebsite}` : ''}

Instructions:
1. Conduct thorough web searches about this person and company
2. Scrape their company website for detailed information
3. If LinkedIn URL is provided, research their professional profile
4. Identify comprehensive insights, challenges, and value propositions
5. Develop specific talking points for outreach
6. Create a highly personalized email subject line referencing specific research findings
7. Write a highly personalized email (4-5 paragraphs, 200-300 words)

Return your findings as JSON with these fields:
- enrichment: { role_summary, company_focus, key_insights[], company_info{}, person_info{}, likely_challenges[], potential_value_props[], talking_points[], confidence_score, data_freshness }
- email_subject: Highly personalized subject line referencing specific research
- draft_email: Highly personalized email
- sources: [{ type, url?, data_points[] }]`;
}

/**
 * Interpolate variables in a query template.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }

  return result;
}

/**
 * Build search queries from playbook steps.
 */
export function buildSearchQueries(
  lead: Lead,
  loadedConfig: LoadedConfig
): Array<{ name: string; query: string; searchType: string }> {
  const playbookSteps = getPlaybookSteps(loadedConfig, loadedConfig.tier);

  const variables: Record<string, string> = {
    person_name: lead.fullName,
    full_name: lead.fullName,
    company_name: lead.companyName,
    company: lead.companyName,
    email: lead.email,
    job_title: lead.jobTitle || '',
    linkedin_url: lead.linkedinUrl || '',
    company_website: lead.companyWebsite || '',
  };

  return playbookSteps.map(step => ({
    name: step.name,
    query: interpolateTemplate(step.queryTemplate, variables),
    searchType: step.searchType,
  }));
}
