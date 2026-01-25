-- Lead Enrichment Application - Enrichment Audit Trail
-- Migration 003: Creates audit table for compliance and cost tracking

CREATE TABLE IF NOT EXISTS enrichment_audit (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to lead
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Enrichment metadata
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('standard', 'premium')),
  status VARCHAR(20) NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'success', 'failed')),

  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  -- Tool usage tracking
  tool_calls INTEGER DEFAULT 0,
  tools_used TEXT[], -- Array of tool names used

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost tracking
  cost_usd DECIMAL(10, 6) DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_enrichment_audit_lead_id ON enrichment_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_audit_status ON enrichment_audit(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_audit_tier ON enrichment_audit(tier);
CREATE INDEX IF NOT EXISTS idx_enrichment_audit_started_at ON enrichment_audit(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_audit_cost ON enrichment_audit(cost_usd);

-- Comments for documentation
COMMENT ON TABLE enrichment_audit IS 'Audit trail for all enrichment operations - tracks every step, tool call, and cost';
COMMENT ON COLUMN enrichment_audit.tier IS 'Enrichment tier: standard or premium';
COMMENT ON COLUMN enrichment_audit.tool_calls IS 'Total number of tool invocations during enrichment';
COMMENT ON COLUMN enrichment_audit.tools_used IS 'List of all tools used (e.g., WebSearch, scrape_linkedin)';
COMMENT ON COLUMN enrichment_audit.cost_usd IS 'Total cost of this enrichment operation in USD';
COMMENT ON COLUMN enrichment_audit.duration_ms IS 'Total duration of enrichment in milliseconds';
