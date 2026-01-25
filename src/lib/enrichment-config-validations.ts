import { z } from 'zod';

// =============================================================================
// Base Enums
// =============================================================================

export const EnrichmentTierSchema = z.enum(['standard', 'medium', 'premium']);
export const EmailToneSchema = z.enum(['professional', 'friendly', 'casual', 'formal', 'conversational']);
export const SearchTypeSchema = z.enum(['web_search', 'company_website', 'linkedin', 'custom']);
export const ConditionTypeSchema = z.enum(['data_found', 'data_missing', 'value_matches', 'value_contains', 'custom']);
export const ConditionOperatorSchema = z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists']);
export const ActionTypeSchema = z.enum(['add_insight', 'modify_tone', 'include_section', 'exclude_section', 'set_priority', 'custom']);
export const BlacklistItemTypeSchema = z.enum(['word', 'phrase', 'topic', 'competitor', 'regex']);

// =============================================================================
// Enrichment Config Schemas
// =============================================================================

export const CreateEnrichmentConfigSchema = z.object({
  tier: EnrichmentTierSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  maxTurns: z.number().int().min(1).max(50).optional(),
  maxToolCalls: z.number().int().min(1).max(50).optional(),
  maxBudgetUsd: z.number().min(0).max(100).optional(),
  allowedTools: z.array(z.string()).optional(),
  emailTone: EmailToneSchema.optional(),
  emailMinWords: z.number().int().min(50).max(500).optional(),
  emailMaxWords: z.number().int().min(100).max(1000).optional(),
}).refine(
  data => !data.emailMinWords || !data.emailMaxWords || data.emailMinWords <= data.emailMaxWords,
  { message: 'emailMinWords must be less than or equal to emailMaxWords' }
);

export const UpdateEnrichmentConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  maxTurns: z.number().int().min(1).max(50).optional(),
  maxToolCalls: z.number().int().min(1).max(50).optional(),
  maxBudgetUsd: z.number().min(0).max(100).optional(),
  allowedTools: z.array(z.string()).optional(),
  emailTone: EmailToneSchema.optional(),
  emailMinWords: z.number().int().min(50).max(500).optional(),
  emailMaxWords: z.number().int().min(100).max(1000).optional(),
}).refine(
  data => !data.emailMinWords || !data.emailMaxWords || data.emailMinWords <= data.emailMaxWords,
  { message: 'emailMinWords must be less than or equal to emailMaxWords' }
);

// =============================================================================
// Playbook Step Schemas
// =============================================================================

export const CreatePlaybookStepSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  searchType: SearchTypeSchema,
  queryTemplate: z.string().min(1).max(2000),
  requiredVariables: z.array(z.string()).optional(),
  skipIfFound: z.array(z.string()).optional(),
  requiredTier: EnrichmentTierSchema.optional(),
});

export const UpdatePlaybookStepSchema = z.object({
  stepOrder: z.number().int().min(1).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  searchType: SearchTypeSchema.optional(),
  queryTemplate: z.string().min(1).max(2000).optional(),
  requiredVariables: z.array(z.string()).optional(),
  isEnabled: z.boolean().optional(),
  skipIfFound: z.array(z.string()).optional(),
  requiredTier: EnrichmentTierSchema.optional(),
});

export const ReorderPlaybookStepsSchema = z.object({
  stepIds: z.array(z.string().uuid()),
});

// =============================================================================
// Information Priority Schemas
// =============================================================================

export const CreatePrioritySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  weight: z.number().int().min(1).max(10).optional(),
  isRequired: z.boolean().optional(),
  extractionHint: z.string().max(1000).optional(),
});

export const UpdatePrioritySchema = z.object({
  priorityOrder: z.number().int().min(1).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100).optional(),
  weight: z.number().int().min(1).max(10).optional(),
  isRequired: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  extractionHint: z.string().max(1000).optional(),
});

export const ReorderPrioritiesSchema = z.object({
  priorityIds: z.array(z.string().uuid()),
});

// =============================================================================
// Thinking Rule Schemas
// =============================================================================

export const ThinkingRuleActionSchema = z.object({
  type: ActionTypeSchema,
  value: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

export const CreateRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  conditionType: ConditionTypeSchema,
  conditionField: z.string().max(255).optional(),
  conditionValue: z.string().max(1000).optional(),
  conditionOperator: ConditionOperatorSchema.optional(),
  actionType: ActionTypeSchema,
  actionValue: ThinkingRuleActionSchema,
});

export const UpdateRuleSchema = z.object({
  ruleOrder: z.number().int().min(1).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  conditionType: ConditionTypeSchema.optional(),
  conditionField: z.string().max(255).optional(),
  conditionValue: z.string().max(1000).optional(),
  conditionOperator: ConditionOperatorSchema.optional(),
  actionType: ActionTypeSchema.optional(),
  actionValue: ThinkingRuleActionSchema.optional(),
  isEnabled: z.boolean().optional(),
});

export const ReorderRulesSchema = z.object({
  ruleIds: z.array(z.string().uuid()),
});

// =============================================================================
// Email Template Schemas
// =============================================================================

export const EmailSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  required: z.boolean(),
  instructions: z.string().min(1).max(2000),
  example: z.string().max(2000).optional(),
});

export const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subjectTemplate: z.string().max(500).optional(),
  tone: EmailToneSchema.optional(),
  writingStyle: z.string().max(2000).optional(),
  sections: z.array(EmailSectionSchema).optional(),
  openingStyle: z.string().max(1000).optional(),
  closingStyle: z.string().max(1000).optional(),
  signatureTemplate: z.string().max(500).optional(),
  minParagraphs: z.number().int().min(1).max(10).optional(),
  maxParagraphs: z.number().int().min(1).max(20).optional(),
}).refine(
  data => !data.minParagraphs || !data.maxParagraphs || data.minParagraphs <= data.maxParagraphs,
  { message: 'minParagraphs must be less than or equal to maxParagraphs' }
);

export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subjectTemplate: z.string().max(500).optional(),
  tone: EmailToneSchema.optional(),
  writingStyle: z.string().max(2000).optional(),
  sections: z.array(EmailSectionSchema).optional(),
  openingStyle: z.string().max(1000).optional(),
  closingStyle: z.string().max(1000).optional(),
  signatureTemplate: z.string().max(500).optional(),
  minParagraphs: z.number().int().min(1).max(10).optional(),
  maxParagraphs: z.number().int().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
}).refine(
  data => !data.minParagraphs || !data.maxParagraphs || data.minParagraphs <= data.maxParagraphs,
  { message: 'minParagraphs must be less than or equal to maxParagraphs' }
);

// =============================================================================
// Blacklist Schemas
// =============================================================================

export const CreateBlacklistItemSchema = z.object({
  itemType: BlacklistItemTypeSchema,
  value: z.string().min(1).max(255),
  reason: z.string().max(500).optional(),
  replacement: z.string().max(255).optional(),
});

export const UpdateBlacklistItemSchema = z.object({
  value: z.string().min(1).max(255).optional(),
  reason: z.string().max(500).optional(),
  replacement: z.string().max(255).optional(),
  isEnabled: z.boolean().optional(),
});

export const BulkCreateBlacklistSchema = z.object({
  items: z.array(CreateBlacklistItemSchema).min(1).max(100),
});

// =============================================================================
// Template Library Schemas
// =============================================================================

export const CreateTemplateLibrarySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string().max(50)).max(10).optional(),
  tier: EnrichmentTierSchema,
  configId: z.string().uuid(),
});

export const ApplyTemplateSchema = z.object({
  templateId: z.string().uuid(),
  tier: EnrichmentTierSchema,
  name: z.string().min(1).max(255),
});

// =============================================================================
// Query Parameter Schemas
// =============================================================================

export const ConfigQuerySchema = z.object({
  tier: EnrichmentTierSchema.optional(),
});

export const TemplateQuerySchema = z.object({
  category: z.string().max(100).optional(),
  tier: EnrichmentTierSchema.optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateEnrichmentConfigInput = z.infer<typeof CreateEnrichmentConfigSchema>;
export type UpdateEnrichmentConfigInput = z.infer<typeof UpdateEnrichmentConfigSchema>;
export type CreatePlaybookStepInput = z.infer<typeof CreatePlaybookStepSchema>;
export type UpdatePlaybookStepInput = z.infer<typeof UpdatePlaybookStepSchema>;
export type CreatePriorityInput = z.infer<typeof CreatePrioritySchema>;
export type UpdatePriorityInput = z.infer<typeof UpdatePrioritySchema>;
export type CreateRuleInput = z.infer<typeof CreateRuleSchema>;
export type UpdateRuleInput = z.infer<typeof UpdateRuleSchema>;
export type CreateEmailTemplateInput = z.infer<typeof CreateEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>;
export type CreateBlacklistItemInput = z.infer<typeof CreateBlacklistItemSchema>;
export type UpdateBlacklistItemInput = z.infer<typeof UpdateBlacklistItemSchema>;
export type CreateTemplateLibraryInput = z.infer<typeof CreateTemplateLibrarySchema>;
export type ApplyTemplateInput = z.infer<typeof ApplyTemplateSchema>;
