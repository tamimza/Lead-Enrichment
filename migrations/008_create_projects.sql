-- Migration 008: Create projects table for business context
-- This stores information about the SENDER's company, not the leads

-- =============================================================================
-- Projects Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,                    -- "Acme Corp Outreach Campaign"

    -- Company info (sender)
    company_name VARCHAR(255) NOT NULL,
    company_website TEXT,
    company_description TEXT,

    -- What they sell (JSONB arrays)
    products JSONB DEFAULT '[]'::jsonb,            -- ["Product A", "Product B"]
    value_propositions JSONB DEFAULT '[]'::jsonb,  -- ["Save 10 hours/week", "2x reply rates"]
    differentiators JSONB DEFAULT '[]'::jsonb,     -- ["AI-powered", "Real-time data"]

    -- Target customer profile
    target_customer_profile TEXT,                  -- "B2B SaaS companies with 50-500 employees"
    industry_focus JSONB DEFAULT '[]'::jsonb,      -- ["SaaS", "FinTech", "Healthcare"]

    -- Competitors (will auto-merge into blacklist)
    competitors JSONB DEFAULT '[]'::jsonb,         -- ["ZoomInfo", "Apollo", "Clearbit"]

    -- Sender defaults for email signature
    sender_name VARCHAR(255),
    sender_title VARCHAR(255),
    sender_email VARCHAR(255),
    calendar_link TEXT,

    -- Scraped data (raw, for reference)
    scraped_data JSONB,
    scraped_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project_id to enrichment_configs to link configs to projects
ALTER TABLE enrichment_configs
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_name);
CREATE INDEX IF NOT EXISTS idx_enrichment_configs_project ON enrichment_configs(project_id);

-- Comments
COMMENT ON TABLE projects IS 'Business context for the sender company - used to personalize outreach emails';
COMMENT ON COLUMN projects.company_name IS 'The name of the company sending outreach emails';
COMMENT ON COLUMN projects.products IS 'JSON array of products/services the company offers';
COMMENT ON COLUMN projects.value_propositions IS 'JSON array of key value propositions';
COMMENT ON COLUMN projects.competitors IS 'JSON array of competitor names - auto-merged into blacklist';
COMMENT ON COLUMN projects.scraped_data IS 'Raw data extracted from website scraping';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();
