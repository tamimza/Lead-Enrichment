// =============================================================================
// Enrichment Configuration Types
// =============================================================================

export type EnrichmentTierConfig = 'standard' | 'medium' | 'premium';
export type EmailTone = 'professional' | 'friendly' | 'casual' | 'formal' | 'conversational';
export type SearchType = 'web_search' | 'company_website' | 'linkedin' | 'custom';
export type ConditionType = 'data_found' | 'data_missing' | 'value_matches' | 'value_contains' | 'custom';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
export type ActionType = 'add_insight' | 'modify_tone' | 'include_section' | 'exclude_section' | 'set_priority' | 'custom';
export type BlacklistItemType = 'word' | 'phrase' | 'topic' | 'competitor' | 'regex';

// =============================================================================
// Core Configuration Types
// =============================================================================

export interface EnrichmentConfig {
  id: string;
  orgId: string;
  tier: EnrichmentTierConfig;
  name: string;
  description?: string;
  isActive: boolean;

  // Agent settings
  maxTurns: number;
  maxToolCalls: number;
  maxBudgetUsd: number;
  allowedTools: string[];

  // Email settings
  emailTone: EmailTone;
  emailMinWords: number;
  emailMaxWords: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichmentConfigRow {
  id: string;
  org_id: string;
  tier: EnrichmentTierConfig;
  name: string;
  description: string | null;
  is_active: boolean;
  max_turns: number;
  max_tool_calls: number;
  max_budget_usd: string; // Decimal comes as string from pg
  allowed_tools: string[];
  email_tone: EmailTone;
  email_min_words: number;
  email_max_words: number;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Search Playbook Types
// =============================================================================

export interface SearchPlaybookStep {
  id: string;
  configId: string;
  stepOrder: number;
  name: string;
  description?: string;

  // Search configuration
  searchType: SearchType;
  queryTemplate: string;
  requiredVariables: string[];

  // Conditions
  isEnabled: boolean;
  skipIfFound?: string[];
  requiredTier?: EnrichmentTierConfig;

  createdAt: Date;
  updatedAt: Date;
}

export interface SearchPlaybookStepRow {
  id: string;
  config_id: string;
  step_order: number;
  name: string;
  description: string | null;
  search_type: SearchType;
  query_template: string;
  required_variables: string[];
  is_enabled: boolean;
  skip_if_found: string[] | null;
  required_tier: EnrichmentTierConfig | null;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Information Priority Types
// =============================================================================

export interface InformationPriority {
  id: string;
  configId: string;
  priorityOrder: number;
  name: string;
  description?: string;
  category: string;
  weight: number;
  isRequired: boolean;
  isEnabled: boolean;
  extractionHint?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InformationPriorityRow {
  id: string;
  config_id: string;
  priority_order: number;
  name: string;
  description: string | null;
  category: string;
  weight: number;
  is_required: boolean;
  is_enabled: boolean;
  extraction_hint: string | null;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Thinking Rule Types
// =============================================================================

export interface ThinkingRuleAction {
  type: ActionType;
  value?: string;
  config?: Record<string, unknown>;
}

export interface ThinkingRule {
  id: string;
  configId: string;
  ruleOrder: number;
  name: string;
  description?: string;

  // Condition
  conditionType: ConditionType;
  conditionField?: string;
  conditionValue?: string;
  conditionOperator: ConditionOperator;

  // Action
  actionType: ActionType;
  actionValue: ThinkingRuleAction;

  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThinkingRuleRow {
  id: string;
  config_id: string;
  rule_order: number;
  name: string;
  description: string | null;
  condition_type: ConditionType;
  condition_field: string | null;
  condition_value: string | null;
  condition_operator: ConditionOperator;
  action_type: ActionType;
  action_value: ThinkingRuleAction;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Email Template Types
// =============================================================================

export interface EmailSection {
  id: string;
  name: string;
  order: number;
  required: boolean;
  instructions: string;
  example?: string;
}

export interface EmailTemplate {
  id: string;
  configId: string;
  name: string;
  subjectTemplate?: string;
  tone: EmailTone;
  writingStyle?: string;
  sections: EmailSection[];
  openingStyle?: string;
  closingStyle?: string;
  signatureTemplate?: string;
  minParagraphs: number;
  maxParagraphs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateRow {
  id: string;
  config_id: string;
  name: string;
  subject_template: string | null;
  tone: EmailTone;
  writing_style: string | null;
  sections: EmailSection[];
  opening_style: string | null;
  closing_style: string | null;
  signature_template: string | null;
  min_paragraphs: number;
  max_paragraphs: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Blacklist Types
// =============================================================================

export interface BlacklistItem {
  id: string;
  configId: string;
  itemType: BlacklistItemType;
  value: string;
  reason?: string;
  replacement?: string;
  isEnabled: boolean;
  createdAt: Date;
}

export interface BlacklistItemRow {
  id: string;
  config_id: string;
  item_type: BlacklistItemType;
  value: string;
  reason: string | null;
  replacement: string | null;
  is_enabled: boolean;
  created_at: Date;
}

// =============================================================================
// Template Library Types
// =============================================================================

export interface TemplateConfigSnapshot {
  maxTurns: number;
  maxBudgetUsd: number;
  allowedTools: string[];
  emailTone: EmailTone;
  emailMinWords: number;
  emailMaxWords: number;
  priorities?: string[];
  sections?: string[];
  playbook?: Partial<SearchPlaybookStep>[];
  rules?: Partial<ThinkingRule>[];
  blacklist?: string[];
}

export interface TemplateLibraryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  configSnapshot: TemplateConfigSnapshot;
  tier: EnrichmentTierConfig;
  isSystemTemplate: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateLibraryRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  tags: string[];
  config_snapshot: TemplateConfigSnapshot;
  tier: EnrichmentTierConfig;
  is_system_template: boolean;
  use_count: number;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Full Configuration (with all related data)
// =============================================================================

export interface FullEnrichmentConfig extends EnrichmentConfig {
  playbook: SearchPlaybookStep[];
  priorities: InformationPriority[];
  rules: ThinkingRule[];
  emailTemplate?: EmailTemplate;
  blacklist: BlacklistItem[];
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CreateEnrichmentConfigRequest {
  tier: EnrichmentTierConfig;
  name: string;
  description?: string;
  maxTurns?: number;
  maxToolCalls?: number;
  maxBudgetUsd?: number;
  allowedTools?: string[];
  emailTone?: EmailTone;
  emailMinWords?: number;
  emailMaxWords?: number;
}

export interface UpdateEnrichmentConfigRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  maxTurns?: number;
  maxToolCalls?: number;
  maxBudgetUsd?: number;
  allowedTools?: string[];
  emailTone?: EmailTone;
  emailMinWords?: number;
  emailMaxWords?: number;
}

export interface CreatePlaybookStepRequest {
  name: string;
  description?: string;
  searchType: SearchType;
  queryTemplate: string;
  requiredVariables?: string[];
  skipIfFound?: string[];
  requiredTier?: EnrichmentTierConfig;
}

export interface UpdatePlaybookStepRequest {
  stepOrder?: number;
  name?: string;
  description?: string;
  searchType?: SearchType;
  queryTemplate?: string;
  requiredVariables?: string[];
  isEnabled?: boolean;
  skipIfFound?: string[];
  requiredTier?: EnrichmentTierConfig;
}

export interface CreatePriorityRequest {
  name: string;
  description?: string;
  category: string;
  weight?: number;
  isRequired?: boolean;
  extractionHint?: string;
}

export interface UpdatePriorityRequest {
  priorityOrder?: number;
  name?: string;
  description?: string;
  category?: string;
  weight?: number;
  isRequired?: boolean;
  isEnabled?: boolean;
  extractionHint?: string;
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  conditionType: ConditionType;
  conditionField?: string;
  conditionValue?: string;
  conditionOperator?: ConditionOperator;
  actionType: ActionType;
  actionValue: ThinkingRuleAction;
}

export interface UpdateRuleRequest {
  ruleOrder?: number;
  name?: string;
  description?: string;
  conditionType?: ConditionType;
  conditionField?: string;
  conditionValue?: string;
  conditionOperator?: ConditionOperator;
  actionType?: ActionType;
  actionValue?: ThinkingRuleAction;
  isEnabled?: boolean;
}

export interface CreateEmailTemplateRequest {
  name?: string;
  subjectTemplate?: string;
  tone?: EmailTone;
  writingStyle?: string;
  sections?: EmailSection[];
  openingStyle?: string;
  closingStyle?: string;
  signatureTemplate?: string;
  minParagraphs?: number;
  maxParagraphs?: number;
}

export interface UpdateEmailTemplateRequest extends CreateEmailTemplateRequest {
  isActive?: boolean;
}

export interface CreateBlacklistItemRequest {
  itemType: BlacklistItemType;
  value: string;
  reason?: string;
  replacement?: string;
}

export interface UpdateBlacklistItemRequest {
  value?: string;
  reason?: string;
  replacement?: string;
  isEnabled?: boolean;
}

export interface BulkCreateBlacklistRequest {
  items: CreateBlacklistItemRequest[];
}

export interface CreateTemplateLibraryRequest {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  tier: EnrichmentTierConfig;
  configId: string; // Source config to snapshot
}

export interface ApplyTemplateRequest {
  templateId: string;
  tier: EnrichmentTierConfig;
  name: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface EnrichmentConfigListResponse {
  configs: EnrichmentConfig[];
  total: number;
}

export interface TemplateLibraryListResponse {
  templates: TemplateLibraryItem[];
  total: number;
}
