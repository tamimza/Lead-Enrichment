-- Migration 006: Add email_subject column to leads table
-- This stores the AI-generated email subject line

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS email_subject VARCHAR(500);

-- Add a comment explaining the column
COMMENT ON COLUMN leads.email_subject IS 'AI-generated email subject line for the draft email';
