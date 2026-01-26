// Project database functions

import { pool } from './db';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ScrapedWebsiteData,
  BusinessContext,
} from '@/types/project';

// =============================================================================
// Database Row Types
// =============================================================================

interface ProjectRow {
  id: string;
  name: string;
  company_name: string;
  company_website: string | null;
  company_description: string | null;
  products: string[];
  value_propositions: string[];
  differentiators: string[];
  target_customer_profile: string | null;
  industry_focus: string[];
  competitors: string[];
  sender_name: string | null;
  sender_title: string | null;
  sender_email: string | null;
  calendar_link: string | null;
  scraped_data: ScrapedWebsiteData | null;
  scraped_at: Date | null;
  setup_method: 'ai_assisted' | 'template' | 'manual';
  source_template_id: string | null;
  ai_generation_status: 'pending' | 'generating' | 'completed' | 'failed';
  ai_generation_error: string | null;
  max_leads_per_month: number;
  leads_used_this_month: number;
  usage_reset_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// Row to Model Conversion
// =============================================================================

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    companyWebsite: row.company_website,
    companyDescription: row.company_description,
    products: row.products || [],
    valuePropositions: row.value_propositions || [],
    differentiators: row.differentiators || [],
    targetCustomerProfile: row.target_customer_profile,
    industryFocus: row.industry_focus || [],
    competitors: row.competitors || [],
    senderName: row.sender_name,
    senderTitle: row.sender_title,
    senderEmail: row.sender_email,
    calendarLink: row.calendar_link,
    scrapedData: row.scraped_data,
    scrapedAt: row.scraped_at,
    setupMethod: row.setup_method || 'manual',
    sourceTemplateId: row.source_template_id,
    aiGenerationStatus: row.ai_generation_status || 'pending',
    aiGenerationError: row.ai_generation_error,
    maxLeadsPerMonth: row.max_leads_per_month || 100,
    leadsUsedThisMonth: row.leads_used_this_month || 0,
    usageResetDate: row.usage_reset_date || new Date(),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// CRUD Operations
// =============================================================================

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const result = await pool.query<ProjectRow>(
    `INSERT INTO projects (
      name, company_name, company_website, company_description,
      products, value_propositions, differentiators,
      target_customer_profile, industry_focus, competitors,
      sender_name, sender_title, sender_email, calendar_link,
      setup_method, source_template_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      data.name,
      data.companyName,
      data.companyWebsite || null,
      data.companyDescription || null,
      JSON.stringify(data.products || []),
      JSON.stringify(data.valuePropositions || []),
      JSON.stringify(data.differentiators || []),
      data.targetCustomerProfile || null,
      JSON.stringify(data.industryFocus || []),
      JSON.stringify(data.competitors || []),
      data.senderName || null,
      data.senderTitle || null,
      data.senderEmail || null,
      data.calendarLink || null,
      data.setupMethod || 'manual',
      data.sourceTemplateId || null,
    ]
  );

  return rowToProject(result.rows[0]);
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

export async function getActiveProject(): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    'SELECT * FROM projects WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

export async function listProjects(): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(
    'SELECT * FROM projects ORDER BY is_active DESC, updated_at DESC'
  );

  return result.rows.map(rowToProject);
}

export async function updateProject(
  id: string,
  data: UpdateProjectRequest
): Promise<Project | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.companyName !== undefined) {
    fields.push(`company_name = $${paramIndex++}`);
    values.push(data.companyName);
  }
  if (data.companyWebsite !== undefined) {
    fields.push(`company_website = $${paramIndex++}`);
    values.push(data.companyWebsite);
  }
  if (data.companyDescription !== undefined) {
    fields.push(`company_description = $${paramIndex++}`);
    values.push(data.companyDescription);
  }
  if (data.products !== undefined) {
    fields.push(`products = $${paramIndex++}`);
    values.push(JSON.stringify(data.products));
  }
  if (data.valuePropositions !== undefined) {
    fields.push(`value_propositions = $${paramIndex++}`);
    values.push(JSON.stringify(data.valuePropositions));
  }
  if (data.differentiators !== undefined) {
    fields.push(`differentiators = $${paramIndex++}`);
    values.push(JSON.stringify(data.differentiators));
  }
  if (data.targetCustomerProfile !== undefined) {
    fields.push(`target_customer_profile = $${paramIndex++}`);
    values.push(data.targetCustomerProfile);
  }
  if (data.industryFocus !== undefined) {
    fields.push(`industry_focus = $${paramIndex++}`);
    values.push(JSON.stringify(data.industryFocus));
  }
  if (data.competitors !== undefined) {
    fields.push(`competitors = $${paramIndex++}`);
    values.push(JSON.stringify(data.competitors));
  }
  if (data.senderName !== undefined) {
    fields.push(`sender_name = $${paramIndex++}`);
    values.push(data.senderName);
  }
  if (data.senderTitle !== undefined) {
    fields.push(`sender_title = $${paramIndex++}`);
    values.push(data.senderTitle);
  }
  if (data.senderEmail !== undefined) {
    fields.push(`sender_email = $${paramIndex++}`);
    values.push(data.senderEmail);
  }
  if (data.calendarLink !== undefined) {
    fields.push(`calendar_link = $${paramIndex++}`);
    values.push(data.calendarLink);
  }
  if (data.isActive !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(data.isActive);
  }

  if (fields.length === 0) {
    return getProject(id);
  }

  values.push(id);

  const result = await pool.query<ProjectRow>(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

export async function updateProjectScrapedData(
  id: string,
  scrapedData: ScrapedWebsiteData
): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    `UPDATE projects
     SET scraped_data = $1, scraped_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [JSON.stringify(scrapedData), id]
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

export async function setActiveProject(id: string): Promise<Project | null> {
  // Deactivate all projects first
  await pool.query('UPDATE projects SET is_active = false');

  // Activate the specified project
  const result = await pool.query<ProjectRow>(
    `UPDATE projects SET is_active = true, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get all config IDs for this project
    const configsResult = await client.query(
      'SELECT id FROM enrichment_configs WHERE project_id = $1',
      [id]
    );
    const configIds = configsResult.rows.map((r) => r.id);

    // Delete all sub-entities for each config
    if (configIds.length > 0) {
      // Delete playbook steps
      await client.query(
        'DELETE FROM search_playbook_steps WHERE config_id = ANY($1)',
        [configIds]
      );

      // Delete information priorities
      await client.query(
        'DELETE FROM information_priorities WHERE config_id = ANY($1)',
        [configIds]
      );

      // Delete thinking rules
      await client.query(
        'DELETE FROM thinking_rules WHERE config_id = ANY($1)',
        [configIds]
      );

      // Delete email templates
      await client.query(
        'DELETE FROM email_templates WHERE config_id = ANY($1)',
        [configIds]
      );

      // Delete blacklist items
      await client.query(
        'DELETE FROM blacklist_items WHERE config_id = ANY($1)',
        [configIds]
      );

      // Delete the configs themselves
      await client.query(
        'DELETE FROM enrichment_configs WHERE project_id = $1',
        [id]
      );
    }

    // Delete the project
    const result = await client.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [id]
    );

    await client.query('COMMIT');

    console.log(`[deleteProject] Deleted project ${id} with ${configIds.length} configs`);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[deleteProject] Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// Business Context Loading
// =============================================================================

export async function getBusinessContext(projectId: string): Promise<BusinessContext | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  return {
    companyName: project.companyName,
    companyDescription: project.companyDescription,
    products: project.products,
    valuePropositions: project.valuePropositions,
    differentiators: project.differentiators,
    targetCustomerProfile: project.targetCustomerProfile,
    industryFocus: project.industryFocus,
    competitors: project.competitors,
    senderName: project.senderName,
    senderTitle: project.senderTitle,
    senderEmail: project.senderEmail,
    calendarLink: project.calendarLink,
  };
}

export async function getActiveBusinessContext(): Promise<BusinessContext | null> {
  const project = await getActiveProject();
  if (!project) return null;

  return {
    companyName: project.companyName,
    companyDescription: project.companyDescription,
    products: project.products,
    valuePropositions: project.valuePropositions,
    differentiators: project.differentiators,
    targetCustomerProfile: project.targetCustomerProfile,
    industryFocus: project.industryFocus,
    competitors: project.competitors,
    senderName: project.senderName,
    senderTitle: project.senderTitle,
    senderEmail: project.senderEmail,
    calendarLink: project.calendarLink,
  };
}

// =============================================================================
// Link Projects to Enrichment Configs
// =============================================================================

export async function linkConfigToProject(
  configId: string,
  projectId: string | null
): Promise<void> {
  await pool.query(
    'UPDATE enrichment_configs SET project_id = $1 WHERE id = $2',
    [projectId, configId]
  );
}

export async function getProjectForConfig(configId: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    `SELECT p.* FROM projects p
     JOIN enrichment_configs c ON c.project_id = p.id
     WHERE c.id = $1`,
    [configId]
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

// =============================================================================
// AI Generation Status
// =============================================================================

export async function updateAIGenerationStatus(
  projectId: string,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  error?: string
): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(
    `UPDATE projects
     SET ai_generation_status = $1, ai_generation_error = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, error || null, projectId]
  );

  return result.rows.length > 0 ? rowToProject(result.rows[0]) : null;
}

// =============================================================================
// Project Configs - Get configs for a specific project
// =============================================================================

export async function getProjectConfigs(projectId: string): Promise<{
  standard: string | null;
  medium: string | null;
  premium: string | null;
}> {
  const result = await pool.query(
    `SELECT id, tier FROM enrichment_configs
     WHERE project_id = $1 AND is_active = true`,
    [projectId]
  );

  const configs: { standard: string | null; medium: string | null; premium: string | null } = {
    standard: null,
    medium: null,
    premium: null,
  };

  for (const row of result.rows) {
    if (row.tier === 'standard') configs.standard = row.id;
    if (row.tier === 'medium') configs.medium = row.id;
    if (row.tier === 'premium') configs.premium = row.id;
  }

  return configs;
}

// =============================================================================
// Usage Tracking
// =============================================================================

export async function incrementLeadUsage(projectId: string): Promise<void> {
  await pool.query(
    `UPDATE projects
     SET leads_used_this_month = leads_used_this_month + 1, updated_at = NOW()
     WHERE id = $1`,
    [projectId]
  );
}

export async function checkLeadLimit(projectId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const result = await pool.query(
    `SELECT leads_used_this_month, max_leads_per_month FROM projects WHERE id = $1`,
    [projectId]
  );

  if (result.rows.length === 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

  const { leads_used_this_month, max_leads_per_month } = result.rows[0];
  return {
    allowed: leads_used_this_month < max_leads_per_month,
    used: leads_used_this_month,
    limit: max_leads_per_month,
  };
}
