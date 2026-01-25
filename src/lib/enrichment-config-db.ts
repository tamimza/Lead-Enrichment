import { pool } from './db';
import type {
  EnrichmentConfig,
  EnrichmentConfigRow,
  SearchPlaybookStep,
  SearchPlaybookStepRow,
  InformationPriority,
  InformationPriorityRow,
  ThinkingRule,
  ThinkingRuleRow,
  EmailTemplate,
  EmailTemplateRow,
  BlacklistItem,
  BlacklistItemRow,
  TemplateLibraryItem,
  TemplateLibraryRow,
  FullEnrichmentConfig,
  EnrichmentTierConfig,
  CreateEnrichmentConfigRequest,
  UpdateEnrichmentConfigRequest,
  CreatePlaybookStepRequest,
  UpdatePlaybookStepRequest,
  CreatePriorityRequest,
  UpdatePriorityRequest,
  CreateRuleRequest,
  UpdateRuleRequest,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  CreateBlacklistItemRequest,
  UpdateBlacklistItemRequest,
} from '@/types/enrichment-config';

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

// =============================================================================
// Row to Model Converters
// =============================================================================

function rowToConfig(row: EnrichmentConfigRow): EnrichmentConfig {
  return {
    id: row.id,
    orgId: row.org_id,
    tier: row.tier,
    name: row.name,
    description: row.description || undefined,
    isActive: row.is_active,
    maxTurns: row.max_turns,
    maxToolCalls: row.max_tool_calls || 5,
    maxBudgetUsd: parseFloat(row.max_budget_usd),
    allowedTools: row.allowed_tools,
    emailTone: row.email_tone,
    emailMinWords: row.email_min_words,
    emailMaxWords: row.email_max_words,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPlaybookStep(row: SearchPlaybookStepRow): SearchPlaybookStep {
  return {
    id: row.id,
    configId: row.config_id,
    stepOrder: row.step_order,
    name: row.name,
    description: row.description || undefined,
    searchType: row.search_type,
    queryTemplate: row.query_template,
    requiredVariables: row.required_variables,
    isEnabled: row.is_enabled,
    skipIfFound: row.skip_if_found || undefined,
    requiredTier: row.required_tier || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPriority(row: InformationPriorityRow): InformationPriority {
  return {
    id: row.id,
    configId: row.config_id,
    priorityOrder: row.priority_order,
    name: row.name,
    description: row.description || undefined,
    category: row.category,
    weight: row.weight,
    isRequired: row.is_required,
    isEnabled: row.is_enabled,
    extractionHint: row.extraction_hint || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRule(row: ThinkingRuleRow): ThinkingRule {
  return {
    id: row.id,
    configId: row.config_id,
    ruleOrder: row.rule_order,
    name: row.name,
    description: row.description || undefined,
    conditionType: row.condition_type,
    conditionField: row.condition_field || undefined,
    conditionValue: row.condition_value || undefined,
    conditionOperator: row.condition_operator,
    actionType: row.action_type,
    actionValue: row.action_value,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToEmailTemplate(row: EmailTemplateRow): EmailTemplate {
  return {
    id: row.id,
    configId: row.config_id,
    name: row.name,
    subjectTemplate: row.subject_template || undefined,
    tone: row.tone,
    writingStyle: row.writing_style || undefined,
    sections: row.sections,
    openingStyle: row.opening_style || undefined,
    closingStyle: row.closing_style || undefined,
    signatureTemplate: row.signature_template || undefined,
    minParagraphs: row.min_paragraphs,
    maxParagraphs: row.max_paragraphs,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToBlacklistItem(row: BlacklistItemRow): BlacklistItem {
  return {
    id: row.id,
    configId: row.config_id,
    itemType: row.item_type,
    value: row.value,
    reason: row.reason || undefined,
    replacement: row.replacement || undefined,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
  };
}

function rowToTemplateLibraryItem(row: TemplateLibraryRow): TemplateLibraryItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    category: row.category,
    tags: row.tags,
    configSnapshot: row.config_snapshot,
    tier: row.tier,
    isSystemTemplate: row.is_system_template,
    useCount: row.use_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// Enrichment Config CRUD
// =============================================================================

export async function createEnrichmentConfig(
  data: CreateEnrichmentConfigRequest,
  orgId: string = DEFAULT_ORG_ID
): Promise<EnrichmentConfig> {
  const result = await pool.query<EnrichmentConfigRow>(
    `INSERT INTO enrichment_configs (
      org_id, tier, name, description, max_turns, max_tool_calls, max_budget_usd,
      allowed_tools, email_tone, email_min_words, email_max_words
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      orgId,
      data.tier,
      data.name,
      data.description || null,
      data.maxTurns ?? 10,
      data.maxToolCalls ?? 5,
      data.maxBudgetUsd ?? 0,
      data.allowedTools ?? ['WebSearch', 'WebFetch'],
      data.emailTone ?? 'professional',
      data.emailMinWords ?? 100,
      data.emailMaxWords ?? 200,
    ]
  );
  return rowToConfig(result.rows[0]);
}

export async function getEnrichmentConfig(id: string): Promise<EnrichmentConfig | null> {
  const result = await pool.query<EnrichmentConfigRow>(
    'SELECT * FROM enrichment_configs WHERE id = $1',
    [id]
  );
  return result.rows.length > 0 ? rowToConfig(result.rows[0]) : null;
}

export async function getActiveConfigForTier(
  tier: EnrichmentTierConfig,
  orgId: string = DEFAULT_ORG_ID
): Promise<EnrichmentConfig | null> {
  const result = await pool.query<EnrichmentConfigRow>(
    'SELECT * FROM enrichment_configs WHERE org_id = $1 AND tier = $2 AND is_active = true LIMIT 1',
    [orgId, tier]
  );
  return result.rows.length > 0 ? rowToConfig(result.rows[0]) : null;
}

export async function listEnrichmentConfigs(
  tier?: EnrichmentTierConfig,
  orgId: string = DEFAULT_ORG_ID
): Promise<EnrichmentConfig[]> {
  let query = 'SELECT * FROM enrichment_configs WHERE org_id = $1';
  const params: (string | undefined)[] = [orgId];

  if (tier) {
    query += ' AND tier = $2';
    params.push(tier);
  }

  query += ' ORDER BY tier, is_active DESC, created_at DESC';

  const result = await pool.query<EnrichmentConfigRow>(query, params);
  return result.rows.map(rowToConfig);
}

export async function updateEnrichmentConfig(
  id: string,
  updates: UpdateEnrichmentConfigRequest
): Promise<EnrichmentConfig | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }
  if (updates.maxTurns !== undefined) {
    fields.push(`max_turns = $${paramIndex++}`);
    values.push(updates.maxTurns);
  }
  if (updates.maxToolCalls !== undefined) {
    fields.push(`max_tool_calls = $${paramIndex++}`);
    values.push(updates.maxToolCalls);
  }
  if (updates.maxBudgetUsd !== undefined) {
    fields.push(`max_budget_usd = $${paramIndex++}`);
    values.push(updates.maxBudgetUsd);
  }
  if (updates.allowedTools !== undefined) {
    fields.push(`allowed_tools = $${paramIndex++}`);
    values.push(updates.allowedTools);
  }
  if (updates.emailTone !== undefined) {
    fields.push(`email_tone = $${paramIndex++}`);
    values.push(updates.emailTone);
  }
  if (updates.emailMinWords !== undefined) {
    fields.push(`email_min_words = $${paramIndex++}`);
    values.push(updates.emailMinWords);
  }
  if (updates.emailMaxWords !== undefined) {
    fields.push(`email_max_words = $${paramIndex++}`);
    values.push(updates.emailMaxWords);
  }

  if (fields.length === 0) {
    return getEnrichmentConfig(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<EnrichmentConfigRow>(
    `UPDATE enrichment_configs SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToConfig(result.rows[0]) : null;
}

export async function deleteEnrichmentConfig(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM enrichment_configs WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Search Playbook Steps CRUD
// =============================================================================

export async function createPlaybookStep(
  configId: string,
  data: CreatePlaybookStepRequest
): Promise<SearchPlaybookStep> {
  // Get the next step order
  const orderResult = await pool.query<{ max_order: number | null }>(
    'SELECT MAX(step_order) as max_order FROM search_playbook_steps WHERE config_id = $1',
    [configId]
  );
  const nextOrder = (orderResult.rows[0].max_order ?? 0) + 1;

  const result = await pool.query<SearchPlaybookStepRow>(
    `INSERT INTO search_playbook_steps (
      config_id, step_order, name, description, search_type,
      query_template, required_variables, skip_if_found, required_tier
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      configId,
      nextOrder,
      data.name,
      data.description || null,
      data.searchType,
      data.queryTemplate,
      data.requiredVariables || [],
      data.skipIfFound || null,
      data.requiredTier || null,
    ]
  );
  return rowToPlaybookStep(result.rows[0]);
}

export async function getPlaybookSteps(configId: string): Promise<SearchPlaybookStep[]> {
  const result = await pool.query<SearchPlaybookStepRow>(
    'SELECT * FROM search_playbook_steps WHERE config_id = $1 ORDER BY step_order',
    [configId]
  );
  return result.rows.map(rowToPlaybookStep);
}

export async function updatePlaybookStep(
  id: string,
  updates: UpdatePlaybookStepRequest
): Promise<SearchPlaybookStep | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.stepOrder !== undefined) {
    fields.push(`step_order = $${paramIndex++}`);
    values.push(updates.stepOrder);
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.searchType !== undefined) {
    fields.push(`search_type = $${paramIndex++}`);
    values.push(updates.searchType);
  }
  if (updates.queryTemplate !== undefined) {
    fields.push(`query_template = $${paramIndex++}`);
    values.push(updates.queryTemplate);
  }
  if (updates.requiredVariables !== undefined) {
    fields.push(`required_variables = $${paramIndex++}`);
    values.push(updates.requiredVariables);
  }
  if (updates.isEnabled !== undefined) {
    fields.push(`is_enabled = $${paramIndex++}`);
    values.push(updates.isEnabled);
  }
  if (updates.skipIfFound !== undefined) {
    fields.push(`skip_if_found = $${paramIndex++}`);
    values.push(updates.skipIfFound);
  }
  if (updates.requiredTier !== undefined) {
    fields.push(`required_tier = $${paramIndex++}`);
    values.push(updates.requiredTier);
  }

  if (fields.length === 0) {
    const result = await pool.query<SearchPlaybookStepRow>(
      'SELECT * FROM search_playbook_steps WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? rowToPlaybookStep(result.rows[0]) : null;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<SearchPlaybookStepRow>(
    `UPDATE search_playbook_steps SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToPlaybookStep(result.rows[0]) : null;
}

export async function reorderPlaybookSteps(
  configId: string,
  stepIds: string[]
): Promise<SearchPlaybookStep[]> {
  // Update each step's order in a transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < stepIds.length; i++) {
      await client.query(
        'UPDATE search_playbook_steps SET step_order = $1, updated_at = NOW() WHERE id = $2 AND config_id = $3',
        [i + 1, stepIds[i], configId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getPlaybookSteps(configId);
}

export async function deletePlaybookStep(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM search_playbook_steps WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Information Priorities CRUD
// =============================================================================

export async function createPriority(
  configId: string,
  data: CreatePriorityRequest
): Promise<InformationPriority> {
  const orderResult = await pool.query<{ max_order: number | null }>(
    'SELECT MAX(priority_order) as max_order FROM information_priorities WHERE config_id = $1',
    [configId]
  );
  const nextOrder = (orderResult.rows[0].max_order ?? 0) + 1;

  const result = await pool.query<InformationPriorityRow>(
    `INSERT INTO information_priorities (
      config_id, priority_order, name, description, category,
      weight, is_required, extraction_hint
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      configId,
      nextOrder,
      data.name,
      data.description || null,
      data.category,
      data.weight ?? 5,
      data.isRequired ?? false,
      data.extractionHint || null,
    ]
  );
  return rowToPriority(result.rows[0]);
}

export async function getPriorities(configId: string): Promise<InformationPriority[]> {
  const result = await pool.query<InformationPriorityRow>(
    'SELECT * FROM information_priorities WHERE config_id = $1 ORDER BY priority_order',
    [configId]
  );
  return result.rows.map(rowToPriority);
}

export async function updatePriority(
  id: string,
  updates: UpdatePriorityRequest
): Promise<InformationPriority | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.priorityOrder !== undefined) {
    fields.push(`priority_order = $${paramIndex++}`);
    values.push(updates.priorityOrder);
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(updates.category);
  }
  if (updates.weight !== undefined) {
    fields.push(`weight = $${paramIndex++}`);
    values.push(updates.weight);
  }
  if (updates.isRequired !== undefined) {
    fields.push(`is_required = $${paramIndex++}`);
    values.push(updates.isRequired);
  }
  if (updates.isEnabled !== undefined) {
    fields.push(`is_enabled = $${paramIndex++}`);
    values.push(updates.isEnabled);
  }
  if (updates.extractionHint !== undefined) {
    fields.push(`extraction_hint = $${paramIndex++}`);
    values.push(updates.extractionHint);
  }

  if (fields.length === 0) {
    const result = await pool.query<InformationPriorityRow>(
      'SELECT * FROM information_priorities WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? rowToPriority(result.rows[0]) : null;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<InformationPriorityRow>(
    `UPDATE information_priorities SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToPriority(result.rows[0]) : null;
}

export async function reorderPriorities(
  configId: string,
  priorityIds: string[]
): Promise<InformationPriority[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < priorityIds.length; i++) {
      await client.query(
        'UPDATE information_priorities SET priority_order = $1, updated_at = NOW() WHERE id = $2 AND config_id = $3',
        [i + 1, priorityIds[i], configId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getPriorities(configId);
}

export async function deletePriority(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM information_priorities WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Thinking Rules CRUD
// =============================================================================

export async function createRule(
  configId: string,
  data: CreateRuleRequest
): Promise<ThinkingRule> {
  const orderResult = await pool.query<{ max_order: number | null }>(
    'SELECT MAX(rule_order) as max_order FROM thinking_rules WHERE config_id = $1',
    [configId]
  );
  const nextOrder = (orderResult.rows[0].max_order ?? 0) + 1;

  const result = await pool.query<ThinkingRuleRow>(
    `INSERT INTO thinking_rules (
      config_id, rule_order, name, description, condition_type,
      condition_field, condition_value, condition_operator,
      action_type, action_value
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      configId,
      nextOrder,
      data.name,
      data.description || null,
      data.conditionType,
      data.conditionField || null,
      data.conditionValue || null,
      data.conditionOperator ?? 'equals',
      data.actionType,
      JSON.stringify(data.actionValue),
    ]
  );
  return rowToRule(result.rows[0]);
}

export async function getRules(configId: string): Promise<ThinkingRule[]> {
  const result = await pool.query<ThinkingRuleRow>(
    'SELECT * FROM thinking_rules WHERE config_id = $1 ORDER BY rule_order',
    [configId]
  );
  return result.rows.map(rowToRule);
}

export async function updateRule(
  id: string,
  updates: UpdateRuleRequest
): Promise<ThinkingRule | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.ruleOrder !== undefined) {
    fields.push(`rule_order = $${paramIndex++}`);
    values.push(updates.ruleOrder);
  }
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.conditionType !== undefined) {
    fields.push(`condition_type = $${paramIndex++}`);
    values.push(updates.conditionType);
  }
  if (updates.conditionField !== undefined) {
    fields.push(`condition_field = $${paramIndex++}`);
    values.push(updates.conditionField);
  }
  if (updates.conditionValue !== undefined) {
    fields.push(`condition_value = $${paramIndex++}`);
    values.push(updates.conditionValue);
  }
  if (updates.conditionOperator !== undefined) {
    fields.push(`condition_operator = $${paramIndex++}`);
    values.push(updates.conditionOperator);
  }
  if (updates.actionType !== undefined) {
    fields.push(`action_type = $${paramIndex++}`);
    values.push(updates.actionType);
  }
  if (updates.actionValue !== undefined) {
    fields.push(`action_value = $${paramIndex++}`);
    values.push(JSON.stringify(updates.actionValue));
  }
  if (updates.isEnabled !== undefined) {
    fields.push(`is_enabled = $${paramIndex++}`);
    values.push(updates.isEnabled);
  }

  if (fields.length === 0) {
    const result = await pool.query<ThinkingRuleRow>(
      'SELECT * FROM thinking_rules WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? rowToRule(result.rows[0]) : null;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<ThinkingRuleRow>(
    `UPDATE thinking_rules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToRule(result.rows[0]) : null;
}

export async function reorderRules(
  configId: string,
  ruleIds: string[]
): Promise<ThinkingRule[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < ruleIds.length; i++) {
      await client.query(
        'UPDATE thinking_rules SET rule_order = $1, updated_at = NOW() WHERE id = $2 AND config_id = $3',
        [i + 1, ruleIds[i], configId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getRules(configId);
}

export async function deleteRule(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM thinking_rules WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Email Template CRUD
// =============================================================================

export async function createEmailTemplate(
  configId: string,
  data: CreateEmailTemplateRequest = {}
): Promise<EmailTemplate> {
  const result = await pool.query<EmailTemplateRow>(
    `INSERT INTO email_templates (
      config_id, name, subject_template, tone, writing_style,
      sections, opening_style, closing_style, signature_template,
      min_paragraphs, max_paragraphs
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      configId,
      data.name ?? 'Default Template',
      data.subjectTemplate || null,
      data.tone ?? 'professional',
      data.writingStyle || null,
      JSON.stringify(data.sections ?? []),
      data.openingStyle || null,
      data.closingStyle || null,
      data.signatureTemplate || null,
      data.minParagraphs ?? 3,
      data.maxParagraphs ?? 5,
    ]
  );
  return rowToEmailTemplate(result.rows[0]);
}

export async function getEmailTemplate(configId: string): Promise<EmailTemplate | null> {
  const result = await pool.query<EmailTemplateRow>(
    'SELECT * FROM email_templates WHERE config_id = $1 AND is_active = true LIMIT 1',
    [configId]
  );
  return result.rows.length > 0 ? rowToEmailTemplate(result.rows[0]) : null;
}

export async function updateEmailTemplate(
  id: string,
  updates: UpdateEmailTemplateRequest
): Promise<EmailTemplate | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.subjectTemplate !== undefined) {
    fields.push(`subject_template = $${paramIndex++}`);
    values.push(updates.subjectTemplate);
  }
  if (updates.tone !== undefined) {
    fields.push(`tone = $${paramIndex++}`);
    values.push(updates.tone);
  }
  if (updates.writingStyle !== undefined) {
    fields.push(`writing_style = $${paramIndex++}`);
    values.push(updates.writingStyle);
  }
  if (updates.sections !== undefined) {
    fields.push(`sections = $${paramIndex++}`);
    values.push(JSON.stringify(updates.sections));
  }
  if (updates.openingStyle !== undefined) {
    fields.push(`opening_style = $${paramIndex++}`);
    values.push(updates.openingStyle);
  }
  if (updates.closingStyle !== undefined) {
    fields.push(`closing_style = $${paramIndex++}`);
    values.push(updates.closingStyle);
  }
  if (updates.signatureTemplate !== undefined) {
    fields.push(`signature_template = $${paramIndex++}`);
    values.push(updates.signatureTemplate);
  }
  if (updates.minParagraphs !== undefined) {
    fields.push(`min_paragraphs = $${paramIndex++}`);
    values.push(updates.minParagraphs);
  }
  if (updates.maxParagraphs !== undefined) {
    fields.push(`max_paragraphs = $${paramIndex++}`);
    values.push(updates.maxParagraphs);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }

  if (fields.length === 0) {
    const result = await pool.query<EmailTemplateRow>(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? rowToEmailTemplate(result.rows[0]) : null;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<EmailTemplateRow>(
    `UPDATE email_templates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToEmailTemplate(result.rows[0]) : null;
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM email_templates WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Blacklist CRUD
// =============================================================================

export async function createBlacklistItem(
  configId: string,
  data: CreateBlacklistItemRequest
): Promise<BlacklistItem> {
  const result = await pool.query<BlacklistItemRow>(
    `INSERT INTO blacklist_items (config_id, item_type, value, reason, replacement)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [configId, data.itemType, data.value, data.reason || null, data.replacement || null]
  );
  return rowToBlacklistItem(result.rows[0]);
}

export async function createBlacklistItemsBulk(
  configId: string,
  items: CreateBlacklistItemRequest[]
): Promise<BlacklistItem[]> {
  if (items.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;

  for (const item of items) {
    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    values.push(configId, item.itemType, item.value, item.reason || null, item.replacement || null);
  }

  const result = await pool.query<BlacklistItemRow>(
    `INSERT INTO blacklist_items (config_id, item_type, value, reason, replacement)
    VALUES ${placeholders.join(', ')}
    RETURNING *`,
    values
  );
  return result.rows.map(rowToBlacklistItem);
}

export async function getBlacklistItems(configId: string): Promise<BlacklistItem[]> {
  const result = await pool.query<BlacklistItemRow>(
    'SELECT * FROM blacklist_items WHERE config_id = $1 ORDER BY item_type, value',
    [configId]
  );
  return result.rows.map(rowToBlacklistItem);
}

export async function updateBlacklistItem(
  id: string,
  updates: UpdateBlacklistItemRequest
): Promise<BlacklistItem | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.value !== undefined) {
    fields.push(`value = $${paramIndex++}`);
    values.push(updates.value);
  }
  if (updates.reason !== undefined) {
    fields.push(`reason = $${paramIndex++}`);
    values.push(updates.reason);
  }
  if (updates.replacement !== undefined) {
    fields.push(`replacement = $${paramIndex++}`);
    values.push(updates.replacement);
  }
  if (updates.isEnabled !== undefined) {
    fields.push(`is_enabled = $${paramIndex++}`);
    values.push(updates.isEnabled);
  }

  if (fields.length === 0) {
    const result = await pool.query<BlacklistItemRow>(
      'SELECT * FROM blacklist_items WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? rowToBlacklistItem(result.rows[0]) : null;
  }

  values.push(id);

  const result = await pool.query<BlacklistItemRow>(
    `UPDATE blacklist_items SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToBlacklistItem(result.rows[0]) : null;
}

export async function deleteBlacklistItem(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM blacklist_items WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function deleteAllBlacklistItems(configId: string): Promise<number> {
  const result = await pool.query(
    'DELETE FROM blacklist_items WHERE config_id = $1',
    [configId]
  );
  return result.rowCount ?? 0;
}

// =============================================================================
// Template Library CRUD
// =============================================================================

export async function listTemplateLibrary(
  category?: string,
  tier?: EnrichmentTierConfig
): Promise<TemplateLibraryItem[]> {
  let query = 'SELECT * FROM template_library WHERE 1=1';
  const params: string[] = [];
  let paramIndex = 1;

  if (category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(category);
  }
  if (tier) {
    query += ` AND tier = $${paramIndex++}`;
    params.push(tier);
  }

  query += ' ORDER BY use_count DESC, name';

  const result = await pool.query<TemplateLibraryRow>(query, params);
  return result.rows.map(rowToTemplateLibraryItem);
}

export async function getTemplateLibraryItem(id: string): Promise<TemplateLibraryItem | null> {
  const result = await pool.query<TemplateLibraryRow>(
    'SELECT * FROM template_library WHERE id = $1',
    [id]
  );
  return result.rows.length > 0 ? rowToTemplateLibraryItem(result.rows[0]) : null;
}

export async function createTemplateFromConfig(
  configId: string,
  name: string,
  description: string,
  category: string,
  tags: string[] = []
): Promise<TemplateLibraryItem> {
  // Get the full config with all related data
  const fullConfig = await getFullEnrichmentConfig(configId);
  if (!fullConfig) {
    throw new Error('Configuration not found');
  }

  // Create snapshot
  const snapshot = {
    maxTurns: fullConfig.maxTurns,
    maxBudgetUsd: fullConfig.maxBudgetUsd,
    allowedTools: fullConfig.allowedTools,
    emailTone: fullConfig.emailTone,
    emailMinWords: fullConfig.emailMinWords,
    emailMaxWords: fullConfig.emailMaxWords,
    priorities: fullConfig.priorities.map(p => p.name),
    sections: fullConfig.emailTemplate?.sections.map(s => s.name) ?? [],
    playbook: fullConfig.playbook.map(s => ({
      name: s.name,
      searchType: s.searchType,
      queryTemplate: s.queryTemplate,
    })),
    rules: fullConfig.rules.map(r => ({
      name: r.name,
      conditionType: r.conditionType,
      actionType: r.actionType,
    })),
    blacklist: fullConfig.blacklist.map(b => b.value),
  };

  const result = await pool.query<TemplateLibraryRow>(
    `INSERT INTO template_library (name, description, category, tags, tier, config_snapshot)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [name, description, category, tags, fullConfig.tier, JSON.stringify(snapshot)]
  );

  return rowToTemplateLibraryItem(result.rows[0]);
}

export async function incrementTemplateUseCount(id: string): Promise<void> {
  await pool.query(
    'UPDATE template_library SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1',
    [id]
  );
}

export async function deleteTemplateLibraryItem(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM template_library WHERE id = $1 AND is_system_template = false RETURNING id',
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// =============================================================================
// Full Configuration Loading
// =============================================================================

export async function getFullEnrichmentConfig(configId: string): Promise<FullEnrichmentConfig | null> {
  const config = await getEnrichmentConfig(configId);
  if (!config) return null;

  const [playbook, priorities, rules, emailTemplate, blacklist] = await Promise.all([
    getPlaybookSteps(configId),
    getPriorities(configId),
    getRules(configId),
    getEmailTemplate(configId),
    getBlacklistItems(configId),
  ]);

  return {
    ...config,
    playbook,
    priorities,
    rules,
    emailTemplate: emailTemplate || undefined,
    blacklist,
  };
}

export async function getActiveFullConfigForTier(
  tier: EnrichmentTierConfig,
  orgId: string = DEFAULT_ORG_ID
): Promise<FullEnrichmentConfig | null> {
  const config = await getActiveConfigForTier(tier, orgId);
  if (!config) return null;

  return getFullEnrichmentConfig(config.id);
}
