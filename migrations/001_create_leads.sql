-- Lead Enrichment Application - Initial Schema
-- Creates the leads table with all required fields and indexes

CREATE TABLE IF NOT EXISTS leads (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Form submission data
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  linkedin_url TEXT,
  company_website TEXT,

  -- Processing state
  status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'enriched', 'failed')),
  enrichment_data JSONB,
  draft_email TEXT,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Comments for documentation
COMMENT ON TABLE leads IS 'Stores lead information and enrichment results';
COMMENT ON COLUMN leads.status IS 'Processing state: pending, processing, enriched, or failed';
COMMENT ON COLUMN leads.enrichment_data IS 'JSON object with role_summary, company_focus, key_insights from Claude agent';
COMMENT ON COLUMN leads.draft_email IS 'AI-generated personalized outreach email';
COMMENT ON COLUMN leads.error_message IS 'Error details if enrichment failed';
