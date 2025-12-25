// Lead Enrichment Application - Database Layer
// PostgreSQL client with connection pooling and CRUD operations

import { Pool } from 'pg';
import type { Lead, LeadRow, LeadFormData, LeadStatus, EnrichmentData } from '@/types';

// Create connection pool singleton
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(-1);
});

// Helper: Convert database row to Lead object (snake_case -> camelCase)
function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    fullName: row.full_name,
    companyName: row.company_name,
    jobTitle: row.job_title || undefined,
    email: row.email,
    linkedinUrl: row.linkedin_url || undefined,
    companyWebsite: row.company_website || undefined,
    status: row.status,
    enrichmentData: row.enrichment_data || undefined,
    draftEmail: row.draft_email || undefined,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    processedAt: row.processed_at || undefined,
  };
}

/**
 * Create a new lead in the database
 */
export async function createLead(data: LeadFormData): Promise<Lead> {
  const query = `
    INSERT INTO leads (
      full_name, company_name, job_title, email, linkedin_url, company_website
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    data.fullName,
    data.companyName,
    data.jobTitle || null,
    data.email,
    data.linkedinUrl || null,
    data.companyWebsite || null,
  ];

  try {
    const result = await pool.query<LeadRow>(query, values);
    return rowToLead(result.rows[0]);
  } catch (error: any) {
    // Handle duplicate email error
    if (error.code === '23505') {
      throw new Error('Email already exists');
    }
    throw error;
  }
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string): Promise<Lead | null> {
  const query = 'SELECT * FROM leads WHERE id = $1';

  const result = await pool.query<LeadRow>(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return rowToLead(result.rows[0]);
}

/**
 * Update lead with enrichment results
 */
export async function updateLead(
  id: string,
  updates: {
    status?: LeadStatus;
    enrichmentData?: EnrichmentData;
    draftEmail?: string;
    errorMessage?: string;
    processedAt?: Date;
  }
): Promise<Lead> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  if (updates.enrichmentData !== undefined) {
    fields.push(`enrichment_data = $${paramIndex++}`);
    values.push(JSON.stringify(updates.enrichmentData));
  }

  if (updates.draftEmail !== undefined) {
    fields.push(`draft_email = $${paramIndex++}`);
    values.push(updates.draftEmail);
  }

  if (updates.errorMessage !== undefined) {
    fields.push(`error_message = $${paramIndex++}`);
    values.push(updates.errorMessage);
  }

  if (updates.processedAt !== undefined) {
    fields.push(`processed_at = $${paramIndex++}`);
    values.push(updates.processedAt);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const query = `
    UPDATE leads
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query<LeadRow>(query, values);

  if (result.rows.length === 0) {
    throw new Error('Lead not found');
  }

  return rowToLead(result.rows[0]);
}

/**
 * Update only the status of a lead (common operation)
 */
export async function updateStatus(id: string, status: LeadStatus): Promise<void> {
  const query = 'UPDATE leads SET status = $1 WHERE id = $2';
  await pool.query(query, [status, id]);
}

/**
 * List leads with pagination and optional status filter
 */
export async function listLeads(options: {
  page?: number;
  limit?: number;
  status?: LeadStatus;
}): Promise<{ leads: Lead[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 25;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM leads';
  let countQuery = 'SELECT COUNT(*) FROM leads';
  const values: any[] = [];
  let paramIndex = 1;

  // Add status filter if provided
  if (options.status) {
    const whereClause = ` WHERE status = $${paramIndex}`;
    query += whereClause;
    countQuery += whereClause;
    values.push(options.status);
    paramIndex++;
  }

  // Add ordering and pagination
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  // Execute queries in parallel
  const [leadsResult, countResult] = await Promise.all([
    pool.query<LeadRow>(query, values),
    pool.query<{ count: string }>(countQuery, options.status ? [options.status] : []),
  ]);

  return {
    leads: leadsResult.rows.map(rowToLead),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

/**
 * Get oldest pending lead (for cron-based processing)
 */
export async function getOldestPendingLead(): Promise<Lead | null> {
  const query = `
    SELECT * FROM leads
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
  `;

  const result = await pool.query<LeadRow>(query);

  if (result.rows.length === 0) {
    return null;
  }

  return rowToLead(result.rows[0]);
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Close database connections (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
