-- Lead Enrichment Application - Add Medium Tier
-- Migration 004: Adds 'medium' to the enrichment_tier options

-- Drop the existing constraint on leads table
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_enrichment_tier_check;

-- Add new constraint with 'medium' tier for leads
ALTER TABLE leads ADD CONSTRAINT leads_enrichment_tier_check
  CHECK (enrichment_tier IN ('standard', 'medium', 'premium'));

-- Update comment for leads
COMMENT ON COLUMN leads.enrichment_tier IS 'Enrichment level: standard (quick inference), medium (company research), or premium (full web research with LinkedIn)';

-- Drop the existing constraint on enrichment_audit table
ALTER TABLE enrichment_audit DROP CONSTRAINT IF EXISTS enrichment_audit_tier_check;

-- Add new constraint with 'medium' tier for enrichment_audit
ALTER TABLE enrichment_audit ADD CONSTRAINT enrichment_audit_tier_check
  CHECK (tier IN ('standard', 'medium', 'premium'));

-- Update comment for enrichment_audit
COMMENT ON COLUMN enrichment_audit.tier IS 'Enrichment tier: standard, medium, or premium';
