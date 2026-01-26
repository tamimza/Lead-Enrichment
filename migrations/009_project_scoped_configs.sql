-- Migration 009: Project-Scoped Configurations
-- Makes all enrichment settings project-specific instead of global
-- Supports AI-assisted, template-based, and manual project setup

-- =============================================================================
-- UPDATE PROJECTS TABLE
-- =============================================================================

-- Add setup method to track how the project was created
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS setup_method VARCHAR(20)
    DEFAULT 'manual'
    CHECK (setup_method IN ('ai_assisted', 'template', 'manual'));

-- Add template_id if project was created from a template
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS source_template_id UUID REFERENCES template_library(id);

-- Add project limits (for future subscription enforcement)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS max_leads_per_month INTEGER DEFAULT 100;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS leads_used_this_month INTEGER DEFAULT 0;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMP DEFAULT NOW();

-- Add AI generation status
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS ai_generation_status VARCHAR(20)
    DEFAULT 'pending'
    CHECK (ai_generation_status IN ('pending', 'generating', 'completed', 'failed'));

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS ai_generation_error TEXT;

-- =============================================================================
-- UPDATE LEADS TABLE - Link leads to projects
-- =============================================================================

ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_project ON leads(project_id);

-- =============================================================================
-- UPDATE ENRICHMENT AUDIT - Link audit entries to projects
-- =============================================================================

ALTER TABLE enrichment_audit
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enrichment_audit_project ON enrichment_audit(project_id);

-- =============================================================================
-- UPDATE TRIGGER FOR SINGLE ACTIVE CONFIG PER PROJECT/TIER
-- =============================================================================

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_ensure_single_active_config ON enrichment_configs;
DROP FUNCTION IF EXISTS ensure_single_active_config();

-- Create new function that scopes by project instead of org
CREATE OR REPLACE FUNCTION ensure_single_active_config_per_project()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true AND NEW.project_id IS NOT NULL THEN
        UPDATE enrichment_configs
        SET is_active = false, updated_at = NOW()
        WHERE project_id = NEW.project_id
          AND tier = NEW.tier
          AND id != NEW.id
          AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_config_per_project
BEFORE INSERT OR UPDATE ON enrichment_configs
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_config_per_project();

-- =============================================================================
-- MIGRATE EXISTING DATA
-- =============================================================================

-- Create a "Default" project for existing configs if any exist
DO $$
DECLARE
    default_project_id UUID;
    existing_configs_count INTEGER;
BEGIN
    -- Check if there are existing configs without a project
    SELECT COUNT(*) INTO existing_configs_count
    FROM enrichment_configs
    WHERE project_id IS NULL;

    IF existing_configs_count > 0 THEN
        -- Check if Default project already exists
        SELECT id INTO default_project_id
        FROM projects
        WHERE name = 'Default Project'
        LIMIT 1;

        -- Create Default project if it doesn't exist
        IF default_project_id IS NULL THEN
            INSERT INTO projects (
                name,
                company_name,
                company_description,
                setup_method,
                ai_generation_status,
                is_active
            ) VALUES (
                'Default Project',
                'My Company',
                'Default project for existing configurations. Update with your company information.',
                'manual',
                'completed',
                true
            )
            RETURNING id INTO default_project_id;

            RAISE NOTICE 'Created Default Project with ID: %', default_project_id;
        END IF;

        -- Link existing configs to the default project
        UPDATE enrichment_configs
        SET project_id = default_project_id
        WHERE project_id IS NULL;

        RAISE NOTICE 'Linked % existing configs to Default Project', existing_configs_count;

        -- Link existing leads to the default project
        UPDATE leads
        SET project_id = default_project_id
        WHERE project_id IS NULL;

        -- Link existing audit entries to the default project
        UPDATE enrichment_audit
        SET project_id = default_project_id
        WHERE project_id IS NULL;
    END IF;
END $$;

-- =============================================================================
-- ADD COMMENTS
-- =============================================================================

COMMENT ON COLUMN projects.setup_method IS 'How the project was created: ai_assisted, template, or manual';
COMMENT ON COLUMN projects.source_template_id IS 'Template ID if project was created from a template';
COMMENT ON COLUMN projects.max_leads_per_month IS 'Maximum leads allowed per month (subscription limit)';
COMMENT ON COLUMN projects.leads_used_this_month IS 'Number of leads processed this month';
COMMENT ON COLUMN projects.ai_generation_status IS 'Status of AI config generation: pending, generating, completed, failed';
COMMENT ON COLUMN leads.project_id IS 'Project this lead belongs to';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
    orphan_configs INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_configs
    FROM enrichment_configs
    WHERE project_id IS NULL;

    IF orphan_configs > 0 THEN
        RAISE WARNING 'There are still % configs without a project!', orphan_configs;
    ELSE
        RAISE NOTICE 'Migration 009 complete: All configs are now project-scoped';
    END IF;
END $$;
