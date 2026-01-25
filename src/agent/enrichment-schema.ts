// Lead Enrichment Application - JSON Schema for Structured Output
// Used with Claude Agent SDK's outputFormat option to guarantee correct output

/**
 * Standard Tier Enrichment Schema
 * Lighter research, faster processing, 3-4 paragraph email
 */
export const standardEnrichmentSchema = {
  type: 'object',
  properties: {
    enrichment: {
      type: 'object',
      description: 'Enriched data about the lead based on available information',
      properties: {
        role_summary: {
          type: 'string',
          description: 'Brief 1-2 sentence summary of their likely role and responsibilities',
        },
        company_focus: {
          type: 'string',
          description: 'What the company does based on name and any available context',
        },
        key_insights: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 3,
          description: 'Key insights about the person or company (2-3 points)',
        },
        confidence_score: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Confidence level in the enrichment data (0-100)',
        },
        data_freshness: {
          type: 'string',
          enum: ['real_time', 'cached', 'inferred'],
          description: 'How fresh the data is',
        },
      },
      required: ['role_summary', 'company_focus', 'key_insights', 'confidence_score', 'data_freshness'],
    },
    email_subject: {
      type: 'string',
      description: 'A compelling email subject line (5-10 words). Personalized, not generic. Reference something specific about them or their company.',
    },
    draft_email: {
      type: 'string',
      description: 'A concise 3-4 paragraph introduction email (100-150 words). Professional but friendly tone. Reference their role and company. Include a soft call-to-action.',
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['web_search', 'web_fetch', 'scrape_company_website', 'scrape_linkedin', 'inference'],
          },
          url: { type: 'string' },
          data_points: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['type', 'data_points'],
      },
      description: 'Sources used to gather information',
    },
  },
  required: ['enrichment', 'email_subject', 'draft_email', 'sources'],
} as const;

/**
 * Premium Tier Enrichment Schema
 * Comprehensive research, multiple sources, 4-5 paragraph personalized email
 */
export const premiumEnrichmentSchema = {
  type: 'object',
  properties: {
    enrichment: {
      type: 'object',
      description: 'Comprehensive enriched data about the lead from multiple sources',
      properties: {
        role_summary: {
          type: 'string',
          description: 'Detailed 2-3 sentence summary of their role, seniority, and likely responsibilities',
        },
        company_focus: {
          type: 'string',
          description: 'Detailed description of what the company does, their market position, and value proposition',
        },
        key_insights: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 5,
          description: 'Key research-backed insights about the person and company (3-5 points)',
        },
        company_info: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            industry: { type: 'string' },
            size: { type: 'string' },
            founded: { type: 'string' },
            headquarters: { type: 'string' },
            products_services: {
              type: 'array',
              items: { type: 'string' },
            },
            recent_news: {
              type: 'array',
              items: { type: 'string' },
            },
            tech_stack: {
              type: 'array',
              items: { type: 'string' },
            },
            social_links: {
              type: 'object',
              properties: {
                linkedin: { type: 'string' },
                twitter: { type: 'string' },
                facebook: { type: 'string' },
              },
            },
          },
          description: 'Detailed company information from web research',
        },
        person_info: {
          type: 'object',
          properties: {
            bio: { type: 'string' },
            current_role: { type: 'string' },
            experience_years: { type: 'integer' },
            expertise_areas: {
              type: 'array',
              items: { type: 'string' },
            },
            recent_posts: {
              type: 'array',
              items: { type: 'string' },
            },
            education: { type: 'string' },
            certifications: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          description: 'Professional information about the person',
        },
        likely_challenges: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4,
          description: 'Business challenges they likely face based on their role and company',
        },
        potential_value_props: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 3,
          description: 'How we could potentially help them',
        },
        talking_points: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4,
          description: 'Specific conversation starters based on research',
        },
        confidence_score: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Overall confidence in the enrichment data (0-100)',
        },
        data_freshness: {
          type: 'string',
          enum: ['real_time', 'cached', 'inferred'],
          description: 'How fresh the data is',
        },
      },
      required: [
        'role_summary',
        'company_focus',
        'key_insights',
        'likely_challenges',
        'talking_points',
        'confidence_score',
        'data_freshness',
      ],
    },
    email_subject: {
      type: 'string',
      description: 'A compelling, highly personalized email subject line (5-12 words). Reference specific research findings. Make it intriguing but professional.',
    },
    draft_email: {
      type: 'string',
      description:
        'A personalized 4-5 paragraph introduction email (200-300 words). Reference specific details from research. Mention a specific challenge or talking point. Include a clear but soft call-to-action. Professional yet warm and genuine tone.',
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['web_search', 'web_fetch', 'scrape_company_website', 'scrape_linkedin', 'inference'],
          },
          url: { type: 'string' },
          data_points: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['type', 'data_points'],
      },
      description: 'All sources used to gather information',
    },
  },
  required: ['enrichment', 'email_subject', 'draft_email', 'sources'],
} as const;

/**
 * Medium Tier Enrichment Schema
 * Balanced research depth, company website scraping, 3-4 paragraph email
 * NO LinkedIn scraping - focuses on company research
 */
export const mediumEnrichmentSchema = {
  type: 'object',
  properties: {
    enrichment: {
      type: 'object',
      description: 'Enriched data about the lead with company website research',
      properties: {
        role_summary: {
          type: 'string',
          description: '2-3 sentence summary of their role and likely responsibilities',
        },
        company_focus: {
          type: 'string',
          description: 'Detailed description of what the company does based on web research',
        },
        key_insights: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 4,
          description: 'Key insights about the person and company (3-4 points)',
        },
        company_info: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            industry: { type: 'string' },
            size: { type: 'string' },
            founded: { type: 'string' },
            headquarters: { type: 'string' },
            products_services: {
              type: 'array',
              items: { type: 'string' },
            },
            recent_news: {
              type: 'array',
              items: { type: 'string' },
            },
            tech_stack: {
              type: 'array',
              items: { type: 'string' },
            },
            social_links: {
              type: 'object',
              properties: {
                linkedin: { type: 'string' },
                twitter: { type: 'string' },
                facebook: { type: 'string' },
              },
            },
          },
          description: 'Company information from website scraping',
        },
        likely_challenges: {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
          maxItems: 3,
          description: 'Business challenges they likely face based on role and company',
        },
        confidence_score: {
          type: 'integer',
          minimum: 0,
          maximum: 100,
          description: 'Confidence level in the enrichment data (0-100)',
        },
        data_freshness: {
          type: 'string',
          enum: ['real_time', 'cached', 'inferred'],
          description: 'How fresh the data is',
        },
      },
      required: [
        'role_summary',
        'company_focus',
        'key_insights',
        'likely_challenges',
        'confidence_score',
        'data_freshness',
      ],
    },
    email_subject: {
      type: 'string',
      description: 'A compelling email subject line (5-10 words). Personalized based on company research. Reference something specific you discovered.',
    },
    draft_email: {
      type: 'string',
      description:
        'A personalized 3-4 paragraph introduction email (150-200 words). Reference company details from research. Mention a relevant challenge. Professional and friendly tone with a soft call-to-action.',
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['web_search', 'web_fetch', 'scrape_company_website', 'inference'],
          },
          url: { type: 'string' },
          data_points: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['type', 'data_points'],
      },
      description: 'Sources used to gather information',
    },
  },
  required: ['enrichment', 'email_subject', 'draft_email', 'sources'],
} as const;

// Type definitions for the schema outputs
export interface StandardEnrichmentOutput {
  enrichment: {
    role_summary: string;
    company_focus: string;
    key_insights: string[];
    confidence_score: number;
    data_freshness: 'real_time' | 'cached' | 'inferred';
  };
  email_subject: string;
  draft_email: string;
  sources: Array<{
    type: 'web_search' | 'web_fetch' | 'scrape_company_website' | 'scrape_linkedin' | 'inference';
    url?: string;
    data_points: string[];
  }>;
}

export interface MediumEnrichmentOutput {
  enrichment: {
    role_summary: string;
    company_focus: string;
    key_insights: string[];
    company_info?: {
      description?: string;
      industry?: string;
      size?: string;
      founded?: string;
      headquarters?: string;
      products_services?: string[];
      recent_news?: string[];
      tech_stack?: string[];
      social_links?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
      };
    };
    likely_challenges: string[];
    confidence_score: number;
    data_freshness: 'real_time' | 'cached' | 'inferred';
  };
  email_subject: string;
  draft_email: string;
  sources: Array<{
    type: 'web_search' | 'web_fetch' | 'scrape_company_website' | 'inference';
    url?: string;
    data_points: string[];
  }>;
}

export interface PremiumEnrichmentOutput {
  enrichment: {
    role_summary: string;
    company_focus: string;
    key_insights: string[];
    company_info?: {
      description?: string;
      industry?: string;
      size?: string;
      founded?: string;
      headquarters?: string;
      products_services?: string[];
      recent_news?: string[];
      tech_stack?: string[];
      social_links?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
      };
    };
    person_info?: {
      bio?: string;
      current_role?: string;
      experience_years?: number;
      expertise_areas?: string[];
      recent_posts?: string[];
      education?: string;
      certifications?: string[];
    };
    likely_challenges: string[];
    potential_value_props?: string[];
    talking_points: string[];
    confidence_score: number;
    data_freshness: 'real_time' | 'cached' | 'inferred';
  };
  email_subject: string;
  draft_email: string;
  sources: Array<{
    type: 'web_search' | 'web_fetch' | 'scrape_company_website' | 'scrape_linkedin' | 'inference';
    url?: string;
    data_points: string[];
  }>;
}
