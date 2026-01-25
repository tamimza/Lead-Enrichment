-- Lead Enrichment Application - Add Enrichment Tier and Data Retention Fields
-- Migration 002: Adds tiered enrichment support and data retention policy

-- Add enrichment_tier column with default 'standard'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_tier VARCHAR(20) DEFAULT 'standard' NOT NULL
  CHECK (enrichment_tier IN ('standard', 'premium'));

-- Add enrichment_sources column for tracking data provenance
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrichment_sources JSONB;

-- Add expires_at column for data retention policy (default 90 days from creation)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Update existing rows to have expires_at set to 90 days from created_at
UPDATE leads SET expires_at = created_at + INTERVAL '90 days' WHERE expires_at IS NULL;

-- Create index for efficient cleanup of expired leads
CREATE INDEX IF NOT EXISTS idx_leads_expires_at ON leads(expires_at);

-- Create index for filtering by enrichment tier
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_tier ON leads(enrichment_tier);

-- Comments for documentation
COMMENT ON COLUMN leads.enrichment_tier IS 'Enrichment level: standard (quick inference) or premium (full web research)';
COMMENT ON COLUMN leads.enrichment_sources IS 'Array of sources used for enrichment with URLs and timestamps';
COMMENT ON COLUMN leads.expires_at IS 'When the lead data will be automatically deleted (data retention policy)';
