-- Migration: Create API Keys table
-- Enables external API access with key-based authentication

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(30) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_day INTEGER DEFAULT 100,
  requests_today INTEGER DEFAULT 0,
  last_request_date DATE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups by prefix (used during auth)
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for external access to lead enrichment';
COMMENT ON COLUMN api_keys.key_hash IS 'Bcrypt hash of the full API key';
COMMENT ON COLUMN api_keys.key_prefix IS 'First and last chars for display (le_prod_abc...xyz)';
COMMENT ON COLUMN api_keys.rate_limit_per_day IS 'Maximum requests allowed per day';
COMMENT ON COLUMN api_keys.requests_today IS 'Counter that resets daily';
COMMENT ON COLUMN api_keys.last_request_date IS 'Date of last request, used to reset daily counter';
