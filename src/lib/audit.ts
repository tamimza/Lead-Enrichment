// Lead Enrichment Application - Audit Trail Functions
// Tracks every enrichment operation for compliance and cost monitoring

import { pool } from './db';

export interface AuditEntry {
  id: string;
  lead_id: string;
  tier: 'standard' | 'medium' | 'premium';
  status: 'started' | 'success' | 'failed';
  started_at: Date;
  completed_at?: Date;
  duration_ms?: number;
  tool_calls: number;
  tools_used?: string[];
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  error_message?: string;
  created_at: Date;
}

interface CreateAuditParams {
  lead_id: string;
  tier: 'standard' | 'medium' | 'premium';
  started_at: Date;
}

interface CompleteAuditParams {
  status: 'success' | 'failed';
  duration_ms: number;
  tool_calls?: number;
  tools_used?: string[];
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  error_message?: string;
}

/**
 * Create a new audit entry when enrichment starts
 * Returns the audit ID for later completion
 */
export async function createAuditEntry(params: CreateAuditParams): Promise<string> {
  const query = `
    INSERT INTO enrichment_audit (lead_id, tier, status, started_at)
    VALUES ($1, $2, 'started', $3)
    RETURNING id
  `;

  const result = await pool.query<{ id: string }>(query, [
    params.lead_id,
    params.tier,
    params.started_at,
  ]);

  return result.rows[0].id;
}

/**
 * Complete an audit entry when enrichment finishes
 */
export async function completeAuditEntry(
  auditId: string,
  params: CompleteAuditParams
): Promise<void> {
  const query = `
    UPDATE enrichment_audit
    SET
      status = $1,
      completed_at = NOW(),
      duration_ms = $2,
      tool_calls = $3,
      tools_used = $4,
      input_tokens = $5,
      output_tokens = $6,
      cost_usd = $7,
      error_message = $8
    WHERE id = $9
  `;

  await pool.query(query, [
    params.status,
    params.duration_ms,
    params.tool_calls || 0,
    params.tools_used || [],
    params.input_tokens || 0,
    params.output_tokens || 0,
    params.cost_usd || 0,
    params.error_message || null,
    auditId,
  ]);
}

/**
 * Get audit entries for a specific lead
 */
export async function getAuditEntriesForLead(leadId: string): Promise<AuditEntry[]> {
  const query = `
    SELECT * FROM enrichment_audit
    WHERE lead_id = $1
    ORDER BY started_at DESC
  `;

  const result = await pool.query<AuditEntry>(query, [leadId]);
  return result.rows;
}

/**
 * Get aggregate audit statistics
 */
export async function getAuditStats(options?: {
  since?: Date;
  tier?: 'standard' | 'medium' | 'premium';
}): Promise<{
  total_enrichments: number;
  successful: number;
  failed: number;
  total_cost_usd: number;
  avg_duration_ms: number;
  total_tool_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
}> {
  let query = `
    SELECT
      COUNT(*) as total_enrichments,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COALESCE(SUM(cost_usd), 0) as total_cost_usd,
      COALESCE(AVG(duration_ms), 0) as avg_duration_ms,
      COALESCE(SUM(tool_calls), 0) as total_tool_calls,
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens
    FROM enrichment_audit
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramIndex = 1;

  if (options?.since) {
    query += ` AND started_at >= $${paramIndex}`;
    values.push(options.since);
    paramIndex++;
  }

  if (options?.tier) {
    query += ` AND tier = $${paramIndex}`;
    values.push(options.tier);
    paramIndex++;
  }

  const result = await pool.query(query, values);
  const row = result.rows[0];

  return {
    total_enrichments: parseInt(row.total_enrichments, 10),
    successful: parseInt(row.successful, 10),
    failed: parseInt(row.failed, 10),
    total_cost_usd: parseFloat(row.total_cost_usd),
    avg_duration_ms: parseFloat(row.avg_duration_ms),
    total_tool_calls: parseInt(row.total_tool_calls, 10),
    total_input_tokens: parseInt(row.total_input_tokens, 10),
    total_output_tokens: parseInt(row.total_output_tokens, 10),
  };
}

/**
 * Get recent audit entries with pagination
 */
export async function getRecentAuditEntries(options?: {
  limit?: number;
  offset?: number;
  status?: 'started' | 'success' | 'failed';
}): Promise<{ entries: AuditEntry[]; total: number }> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  let query = 'SELECT * FROM enrichment_audit';
  let countQuery = 'SELECT COUNT(*) FROM enrichment_audit';
  const values: any[] = [];
  let paramIndex = 1;

  if (options?.status) {
    const whereClause = ` WHERE status = $${paramIndex}`;
    query += whereClause;
    countQuery += whereClause;
    values.push(options.status);
    paramIndex++;
  }

  query += ` ORDER BY started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const [entriesResult, countResult] = await Promise.all([
    pool.query<AuditEntry>(query, values),
    pool.query<{ count: string }>(countQuery, options?.status ? [options.status] : []),
  ]);

  return {
    entries: entriesResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}
