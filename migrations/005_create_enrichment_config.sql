-- Migration: 005_create_enrichment_config.sql
-- Description: Create tables for AI enrichment configuration dashboard
-- Date: 2025-01-25

-- =============================================================================
-- ENRICHMENT CONFIGS - Master configuration per tier
-- =============================================================================
CREATE TABLE enrichment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID DEFAULT '00000000-0000-0000-0000-000000000000', -- For future multi-tenant
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('standard', 'medium', 'premium')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,

    -- Agent settings
    max_turns INTEGER NOT NULL DEFAULT 10,
    max_budget_usd DECIMAL(10, 2) DEFAULT 0,
    allowed_tools TEXT[] DEFAULT ARRAY['WebSearch', 'WebFetch'],

    -- Email settings
    email_tone VARCHAR(50) DEFAULT 'professional',
    email_min_words INTEGER DEFAULT 100,
    email_max_words INTEGER DEFAULT 200,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE enrichment_configs IS 'Master configuration settings per enrichment tier';
COMMENT ON COLUMN enrichment_configs.org_id IS 'Organization ID for future multi-tenant support';
COMMENT ON COLUMN enrichment_configs.tier IS 'Enrichment tier: standard, medium, or premium';
COMMENT ON COLUMN enrichment_configs.is_active IS 'Only one config per tier per org can be active';
COMMENT ON COLUMN enrichment_configs.allowed_tools IS 'List of MCP tools the agent can use';

CREATE INDEX idx_enrichment_configs_tier ON enrichment_configs(tier);
CREATE INDEX idx_enrichment_configs_org_tier ON enrichment_configs(org_id, tier);
CREATE INDEX idx_enrichment_configs_active ON enrichment_configs(org_id, tier, is_active) WHERE is_active = true;

-- =============================================================================
-- SEARCH PLAYBOOK STEPS - Ordered search steps with query templates
-- =============================================================================
CREATE TABLE search_playbook_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES enrichment_configs(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Search configuration
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('web_search', 'company_website', 'linkedin', 'custom')),
    query_template TEXT NOT NULL, -- Template with {{variables}} like {{company_name}}, {{person_name}}
    required_variables TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Conditions
    is_enabled BOOLEAN DEFAULT true,
    skip_if_found TEXT[], -- Skip this step if these data points are already found
    required_tier VARCHAR(20) CHECK (required_tier IN ('standard', 'medium', 'premium')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE search_playbook_steps IS 'Ordered search steps defining the research playbook';
COMMENT ON COLUMN search_playbook_steps.query_template IS 'Search query template with {{variable}} placeholders';
COMMENT ON COLUMN search_playbook_steps.skip_if_found IS 'Skip step if these data points already exist';

CREATE INDEX idx_playbook_config ON search_playbook_steps(config_id);
CREATE INDEX idx_playbook_order ON search_playbook_steps(config_id, step_order);

-- =============================================================================
-- INFORMATION PRIORITIES - What information to prioritize (ranked list)
-- =============================================================================
CREATE TABLE information_priorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES enrichment_configs(id) ON DELETE CASCADE,
    priority_order INTEGER NOT NULL,

    -- Priority definition
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- e.g., 'company', 'person', 'industry', 'technology'

    -- Importance settings
    weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
    is_required BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,

    -- Instructions for the agent
    extraction_hint TEXT, -- Hint for how to find this info

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE information_priorities IS 'Ranked list of information types to prioritize during enrichment';
COMMENT ON COLUMN information_priorities.weight IS 'Importance weight from 1-10';
COMMENT ON COLUMN information_priorities.extraction_hint IS 'Instructions for the agent on how to find this info';

CREATE INDEX idx_priorities_config ON information_priorities(config_id);
CREATE INDEX idx_priorities_order ON information_priorities(config_id, priority_order);

-- =============================================================================
-- THINKING RULES - IF/THEN logic for interpreting data
-- =============================================================================
CREATE TABLE thinking_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES enrichment_configs(id) ON DELETE CASCADE,
    rule_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Condition (IF part)
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN ('data_found', 'data_missing', 'value_matches', 'value_contains', 'custom')),
    condition_field VARCHAR(255), -- Field to check, e.g., 'company_info.industry'
    condition_value TEXT, -- Value to match against
    condition_operator VARCHAR(20) DEFAULT 'equals' CHECK (condition_operator IN ('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists')),

    -- Action (THEN part)
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('add_insight', 'modify_tone', 'include_section', 'exclude_section', 'set_priority', 'custom')),
    action_value JSONB NOT NULL, -- Action-specific configuration

    is_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE thinking_rules IS 'IF/THEN logic rules for intelligent data interpretation';
COMMENT ON COLUMN thinking_rules.condition_type IS 'Type of condition to evaluate';
COMMENT ON COLUMN thinking_rules.action_value IS 'JSON configuration for the action to take';

CREATE INDEX idx_rules_config ON thinking_rules(config_id);
CREATE INDEX idx_rules_order ON thinking_rules(config_id, rule_order);

-- =============================================================================
-- EMAIL TEMPLATES - Email structure, tone, and sections
-- =============================================================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES enrichment_configs(id) ON DELETE CASCADE,

    -- Template settings
    name VARCHAR(255) NOT NULL DEFAULT 'Default Template',
    subject_template TEXT, -- Email subject with {{variables}}

    -- Tone and style
    tone VARCHAR(50) DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual', 'formal', 'conversational')),
    writing_style TEXT, -- Additional style instructions

    -- Structure
    sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, order, required, instructions, example}

    -- Personalization
    opening_style TEXT, -- How to open the email
    closing_style TEXT, -- How to close the email
    signature_template TEXT,

    -- Constraints
    min_paragraphs INTEGER DEFAULT 3,
    max_paragraphs INTEGER DEFAULT 5,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE email_templates IS 'Email template configuration with sections and styling';
COMMENT ON COLUMN email_templates.sections IS 'JSON array of email sections with order and instructions';

CREATE INDEX idx_email_templates_config ON email_templates(config_id);
CREATE UNIQUE INDEX idx_email_templates_active ON email_templates(config_id) WHERE is_active = true;

-- =============================================================================
-- BLACKLIST ITEMS - Words/topics to never mention
-- =============================================================================
CREATE TABLE blacklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES enrichment_configs(id) ON DELETE CASCADE,

    -- Blacklist entry
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('word', 'phrase', 'topic', 'competitor', 'regex')),
    value TEXT NOT NULL,

    -- Context
    reason TEXT, -- Why this is blacklisted
    replacement TEXT, -- Optional replacement text

    is_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE blacklist_items IS 'Words, phrases, and topics to exclude from generated content';
COMMENT ON COLUMN blacklist_items.item_type IS 'Type of blacklist entry: word, phrase, topic, competitor, or regex pattern';
COMMENT ON COLUMN blacklist_items.replacement IS 'Optional replacement text to use instead';

CREATE INDEX idx_blacklist_config ON blacklist_items(config_id);
CREATE INDEX idx_blacklist_type ON blacklist_items(config_id, item_type);

-- =============================================================================
-- TEMPLATE LIBRARY - Pre-built configuration presets
-- =============================================================================
CREATE TABLE template_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- e.g., 'SaaS', 'FinTech', 'Healthcare', 'Enterprise'
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Full configuration snapshot
    config_snapshot JSONB NOT NULL, -- Complete config including all related data

    -- Template info
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('standard', 'medium', 'premium')),
    is_system_template BOOLEAN DEFAULT false, -- System templates can't be deleted

    -- Usage tracking
    use_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE template_library IS 'Library of pre-built configuration templates for quick setup';
COMMENT ON COLUMN template_library.config_snapshot IS 'Complete configuration snapshot in JSON format';
COMMENT ON COLUMN template_library.is_system_template IS 'System templates are read-only and cannot be deleted';

CREATE INDEX idx_template_library_category ON template_library(category);
CREATE INDEX idx_template_library_tier ON template_library(tier);
CREATE INDEX idx_template_library_tags ON template_library USING GIN(tags);

-- =============================================================================
-- HELPER FUNCTION: Ensure only one active config per tier per org
-- =============================================================================
CREATE OR REPLACE FUNCTION ensure_single_active_config()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE enrichment_configs
        SET is_active = false, updated_at = NOW()
        WHERE org_id = NEW.org_id
          AND tier = NEW.tier
          AND id != NEW.id
          AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_active_config
BEFORE INSERT OR UPDATE ON enrichment_configs
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_config();

-- =============================================================================
-- SEED DEFAULT TEMPLATES
-- =============================================================================
INSERT INTO template_library (name, description, category, tags, tier, is_system_template, config_snapshot)
VALUES
    (
        'SaaS Sales Outreach',
        'Optimized for B2B SaaS companies reaching out to potential customers',
        'SaaS',
        ARRAY['b2b', 'sales', 'software'],
        'premium',
        true,
        '{
            "max_turns": 15,
            "max_budget_usd": 2.0,
            "allowed_tools": ["WebSearch", "WebFetch", "scrape_company_website", "scrape_linkedin"],
            "email_tone": "professional",
            "email_min_words": 150,
            "email_max_words": 250,
            "priorities": ["company_tech_stack", "recent_funding", "growth_signals", "pain_points"],
            "sections": ["personalized_hook", "value_proposition", "social_proof", "call_to_action"]
        }'::jsonb
    ),
    (
        'FinTech Compliance Focus',
        'Tailored for financial technology companies with compliance awareness',
        'FinTech',
        ARRAY['finance', 'compliance', 'regulated'],
        'premium',
        true,
        '{
            "max_turns": 15,
            "max_budget_usd": 2.0,
            "allowed_tools": ["WebSearch", "WebFetch", "scrape_company_website", "scrape_linkedin"],
            "email_tone": "formal",
            "email_min_words": 150,
            "email_max_words": 250,
            "priorities": ["regulatory_environment", "compliance_needs", "security_focus", "industry_news"],
            "sections": ["personalized_hook", "compliance_awareness", "solution_fit", "next_steps"]
        }'::jsonb
    ),
    (
        'Healthcare Outreach',
        'HIPAA-aware communication for healthcare industry prospects',
        'Healthcare',
        ARRAY['healthcare', 'hipaa', 'medical'],
        'premium',
        true,
        '{
            "max_turns": 12,
            "max_budget_usd": 1.5,
            "allowed_tools": ["WebSearch", "WebFetch", "scrape_company_website"],
            "email_tone": "professional",
            "email_min_words": 120,
            "email_max_words": 200,
            "priorities": ["healthcare_focus", "patient_outcomes", "technology_adoption", "compliance_needs"],
            "sections": ["personalized_opening", "healthcare_relevance", "outcome_focus", "consultation_offer"]
        }'::jsonb
    ),
    (
        'Enterprise Sales',
        'High-touch approach for enterprise-level prospects',
        'Enterprise',
        ARRAY['enterprise', 'large-account', 'strategic'],
        'premium',
        true,
        '{
            "max_turns": 15,
            "max_budget_usd": 2.5,
            "allowed_tools": ["WebSearch", "WebFetch", "scrape_company_website", "scrape_linkedin"],
            "email_tone": "formal",
            "email_min_words": 180,
            "email_max_words": 300,
            "priorities": ["executive_initiatives", "strategic_priorities", "recent_announcements", "organizational_changes"],
            "sections": ["executive_hook", "strategic_alignment", "enterprise_credibility", "executive_meeting_request"]
        }'::jsonb
    ),
    (
        'Startup Outreach',
        'Fast and friendly approach for startup prospects',
        'Startup',
        ARRAY['startup', 'growth', 'agile'],
        'standard',
        true,
        '{
            "max_turns": 5,
            "max_budget_usd": 0,
            "allowed_tools": ["WebSearch", "WebFetch"],
            "email_tone": "friendly",
            "email_min_words": 80,
            "email_max_words": 150,
            "priorities": ["funding_stage", "growth_metrics", "founder_background", "product_focus"],
            "sections": ["casual_opener", "quick_pitch", "simple_cta"]
        }'::jsonb
    ),
    (
        'Agency Prospecting',
        'Tailored for reaching out to marketing and creative agencies',
        'Agency',
        ARRAY['agency', 'marketing', 'creative'],
        'medium',
        true,
        '{
            "max_turns": 8,
            "max_budget_usd": 1.0,
            "allowed_tools": ["WebSearch", "WebFetch", "scrape_company_website"],
            "email_tone": "conversational",
            "email_min_words": 100,
            "email_max_words": 180,
            "priorities": ["client_portfolio", "specializations", "recent_work", "team_size"],
            "sections": ["creative_hook", "portfolio_acknowledgment", "partnership_value", "collaboration_invite"]
        }'::jsonb
    );
