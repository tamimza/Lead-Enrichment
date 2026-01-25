// Lead Enrichment Application - Zod Validation Schemas
// Runtime validation for form inputs and API requests

import { z } from 'zod';

// Enrichment tier types
export const EnrichmentTier = z.enum(['standard', 'medium', 'premium']);
export type EnrichmentTierType = z.infer<typeof EnrichmentTier>;

/**
 * Lead form submission schema
 * Validates user input from the /connect form
 */
export const LeadSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be less than 255 characters')
    .trim(),

  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must be less than 255 characters')
    .trim(),

  jobTitle: z
    .string()
    .max(255, 'Job title must be less than 255 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .toLowerCase(),

  linkedinUrl: z
    .string()
    .url('Please enter a valid URL')
    .refine((url) => url.includes('linkedin.com'), {
      message: 'Please enter a valid LinkedIn URL',
    })
    .optional()
    .or(z.literal('')),

  companyWebsite: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),

  enrichmentTier: EnrichmentTier.optional().default('standard'),
});

/**
 * Pagination query params schema
 */
export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().max(1000)),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 25))
    .pipe(z.number().int().positive().max(100)),

  status: z
    .enum(['pending', 'processing', 'enriched', 'failed'])
    .optional(),
});

/**
 * Company information from web scraping
 */
export const CompanyInfoSchema = z.object({
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  founded: z.string().optional(),
  headquarters: z.string().optional(),
  products_services: z.array(z.string()).optional(),
  recent_news: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  social_links: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
  }).optional(),
});

/**
 * Person information from web research
 */
export const PersonInfoSchema = z.object({
  bio: z.string().optional(),
  current_role: z.string().optional(),
  experience_years: z.number().optional(),
  expertise_areas: z.array(z.string()).optional(),
  recent_posts: z.array(z.string()).optional(),
  education: z.string().optional(),
  certifications: z.array(z.string()).optional(),
});

/**
 * Enrichment source tracking
 */
export const EnrichmentSourceSchema = z.object({
  type: z.enum(['web_search', 'web_fetch', 'inference']),
  url: z.string().optional(),
  fetched_at: z.string(),
  data_points: z.array(z.string()),
});

/**
 * Enhanced enrichment data schema with real web data
 */
export const EnrichmentDataSchema = z.object({
  // Core insights (always present)
  role_summary: z.string(),
  company_focus: z.string(),
  key_insights: z.array(z.string()),

  // Enhanced data from web research (premium tier)
  company_info: CompanyInfoSchema.optional(),
  person_info: PersonInfoSchema.optional(),

  // Pain points and opportunities
  likely_challenges: z.array(z.string()).optional(),
  potential_value_props: z.array(z.string()).optional(),

  // Conversation starters
  talking_points: z.array(z.string()).optional(),

  // Data quality indicators
  confidence_score: z.number().min(0).max(100).optional(),
  data_freshness: z.enum(['real_time', 'cached', 'inferred']).optional(),
});

/**
 * Standard tier response (surface-level)
 */
export const StandardEnrichmentResponseSchema = z.object({
  enrichment: z.object({
    role_summary: z.string(),
    company_focus: z.string(),
    key_insights: z.array(z.string()).max(3),
    confidence_score: z.number().min(0).max(100),
    data_freshness: z.enum(['real_time', 'cached', 'inferred']),
  }),
  draft_email: z.string(),
  sources: z.array(EnrichmentSourceSchema),
});

/**
 * Premium tier response (comprehensive)
 */
export const PremiumEnrichmentResponseSchema = z.object({
  enrichment: EnrichmentDataSchema,
  draft_email: z.string(),
  sources: z.array(EnrichmentSourceSchema),
});

/**
 * Agent response schema (unified)
 */
export const AgentResponseSchema = z.object({
  enrichment: EnrichmentDataSchema,
  draft_email: z.string(),
  sources: z.array(EnrichmentSourceSchema).optional(),
});

// Export inferred types
export type LeadFormData = z.infer<typeof LeadSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type EnrichmentData = z.infer<typeof EnrichmentDataSchema>;
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;
export type PersonInfo = z.infer<typeof PersonInfoSchema>;
export type EnrichmentSource = z.infer<typeof EnrichmentSourceSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
export type StandardEnrichmentResponse = z.infer<typeof StandardEnrichmentResponseSchema>;
export type PremiumEnrichmentResponse = z.infer<typeof PremiumEnrichmentResponseSchema>;
