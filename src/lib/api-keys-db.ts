// API Keys Database Functions
// CRUD operations for API key management

import { pool } from './db';
import crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  rateLimitPerDay: number;
  requestsToday: number;
  lastRequestDate: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyRow {
  id: string;
  project_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_per_day: number;
  requests_today: number;
  last_request_date: Date | null;
  last_used_at: Date | null;
  created_at: Date;
}

export interface CreateApiKeyResult {
  apiKey: ApiKey;
  fullKey: string; // Only returned once on creation
}

// =============================================================================
// Helper Functions
// =============================================================================

function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    isActive: row.is_active,
    rateLimitPerDay: row.rate_limit_per_day,
    requestsToday: row.requests_today,
    lastRequestDate: row.last_request_date,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
  };
}

/**
 * Generate a secure random API key
 * Format: le_prod_<32 random hex chars>
 */
function generateApiKey(): string {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `le_prod_${randomPart}`;
}

/**
 * Create a prefix for display (shows first and last parts)
 * e.g., "le_prod_abc123...xyz789"
 */
function createKeyPrefix(fullKey: string): string {
  const prefix = fullKey.substring(0, 15); // "le_prod_abc123"
  const suffix = fullKey.substring(fullKey.length - 6); // "xyz789"
  return `${prefix}...${suffix}`;
}

/**
 * Hash an API key for storage using SHA-256
 * (faster than bcrypt, secure enough for API keys)
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against a hash
 */
export function verifyApiKeyHash(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash));
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a new API key
 * Returns the full key ONCE - it cannot be retrieved later
 */
export async function createApiKey(
  projectId: string,
  name: string,
  rateLimitPerDay: number = 100
): Promise<CreateApiKeyResult> {
  const fullKey = generateApiKey();
  const keyHash = hashApiKey(fullKey);
  const keyPrefix = createKeyPrefix(fullKey);

  const result = await pool.query<ApiKeyRow>(
    `INSERT INTO api_keys (project_id, name, key_hash, key_prefix, rate_limit_per_day)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [projectId, name, keyHash, keyPrefix, rateLimitPerDay]
  );

  return {
    apiKey: rowToApiKey(result.rows[0]),
    fullKey, // Return full key only on creation
  };
}

/**
 * Get an API key by ID (does not return hash)
 */
export async function getApiKey(id: string): Promise<ApiKey | null> {
  const result = await pool.query<ApiKeyRow>(
    'SELECT * FROM api_keys WHERE id = $1',
    [id]
  );

  return result.rows.length > 0 ? rowToApiKey(result.rows[0]) : null;
}

/**
 * List all API keys for a project
 */
export async function listApiKeys(projectId: string): Promise<ApiKey[]> {
  const result = await pool.query<ApiKeyRow>(
    'SELECT * FROM api_keys WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );

  return result.rows.map(rowToApiKey);
}

/**
 * Find an API key by the full key value (for authentication)
 * Returns the key row including hash for verification
 */
export async function findApiKeyByValue(fullKey: string): Promise<{
  apiKey: ApiKey;
  keyHash: string;
} | null> {
  // First, get all active keys and check hash
  // This is necessary because we can't query by hash directly
  const keyHash = hashApiKey(fullKey);

  const result = await pool.query<ApiKeyRow>(
    'SELECT * FROM api_keys WHERE key_hash = $1',
    [keyHash]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    apiKey: rowToApiKey(result.rows[0]),
    keyHash: result.rows[0].key_hash,
  };
}

/**
 * Update API key details
 */
export async function updateApiKey(
  id: string,
  updates: {
    name?: string;
    isActive?: boolean;
    rateLimitPerDay?: number;
  }
): Promise<ApiKey | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(updates.isActive);
  }
  if (updates.rateLimitPerDay !== undefined) {
    fields.push(`rate_limit_per_day = $${paramIndex++}`);
    values.push(updates.rateLimitPerDay);
  }

  if (fields.length === 0) {
    return getApiKey(id);
  }

  values.push(id);

  const result = await pool.query<ApiKeyRow>(
    `UPDATE api_keys SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToApiKey(result.rows[0]) : null;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM api_keys WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Increment request count and update last used timestamp
 * Also handles daily reset if last_request_date is different from today
 */
export async function incrementRequestCount(id: string): Promise<{
  requestsToday: number;
  rateLimitPerDay: number;
}> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Use a single query that handles the daily reset
  const result = await pool.query<{ requests_today: number; rate_limit_per_day: number }>(
    `UPDATE api_keys
     SET
       requests_today = CASE
         WHEN last_request_date = $2::date THEN requests_today + 1
         ELSE 1
       END,
       last_request_date = $2::date,
       last_used_at = NOW()
     WHERE id = $1
     RETURNING requests_today, rate_limit_per_day`,
    [id, today]
  );

  if (result.rows.length === 0) {
    throw new Error('API key not found');
  }

  return {
    requestsToday: result.rows[0].requests_today,
    rateLimitPerDay: result.rows[0].rate_limit_per_day,
  };
}

/**
 * Check if an API key has exceeded its rate limit
 * Returns current usage info without incrementing
 */
export async function checkRateLimit(id: string): Promise<{
  allowed: boolean;
  requestsToday: number;
  rateLimitPerDay: number;
  resetsAt: Date;
}> {
  const today = new Date().toISOString().split('T')[0];

  const result = await pool.query<ApiKeyRow>(
    'SELECT * FROM api_keys WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('API key not found');
  }

  const row = result.rows[0];
  const lastRequestDate = row.last_request_date?.toISOString().split('T')[0];

  // If last request was on a different day, counter effectively resets
  const effectiveRequestsToday = lastRequestDate === today ? row.requests_today : 0;

  // Calculate reset time (midnight UTC tomorrow)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    allowed: effectiveRequestsToday < row.rate_limit_per_day,
    requestsToday: effectiveRequestsToday,
    rateLimitPerDay: row.rate_limit_per_day,
    resetsAt: tomorrow,
  };
}

/**
 * Get usage statistics for an API key
 */
export async function getApiKeyStats(id: string): Promise<{
  requestsToday: number;
  rateLimitPerDay: number;
  lastUsedAt: Date | null;
  percentUsed: number;
} | null> {
  const apiKey = await getApiKey(id);
  if (!apiKey) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastRequestDate = apiKey.lastRequestDate?.toISOString().split('T')[0];

  const effectiveRequestsToday = lastRequestDate === today ? apiKey.requestsToday : 0;

  return {
    requestsToday: effectiveRequestsToday,
    rateLimitPerDay: apiKey.rateLimitPerDay,
    lastUsedAt: apiKey.lastUsedAt,
    percentUsed: Math.round((effectiveRequestsToday / apiKey.rateLimitPerDay) * 100),
  };
}
