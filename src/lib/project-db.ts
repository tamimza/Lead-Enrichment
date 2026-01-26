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
      sender_name, sender_title, sender_email, calendar_link
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
  // First unlink any enrichment configs
  await pool.query(
    'UPDATE enrichment_configs SET project_id = NULL WHERE project_id = $1',
    [id]
  );

  const result = await pool.query(
    'DELETE FROM projects WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount !== null && result.rowCount > 0;
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
