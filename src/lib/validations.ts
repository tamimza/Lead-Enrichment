// Lead Enrichment Application - Zod Validation Schemas
// Runtime validation for form inputs and API requests

import { z } from 'zod';

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
 * Enrichment data schema (from Claude agent)
 */
export const EnrichmentDataSchema = z.object({
  role_summary: z.string(),
  company_focus: z.string(),
  key_insights: z.array(z.string()),
  recent_activity: z.string().optional(),
  tech_stack: z.array(z.string()).optional(),
});

/**
 * Agent response schema
 */
export const AgentResponseSchema = z.object({
  enrichment: EnrichmentDataSchema,
  draft_email: z.string(),
});

// Export inferred types
export type LeadFormData = z.infer<typeof LeadSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type EnrichmentData = z.infer<typeof EnrichmentDataSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
