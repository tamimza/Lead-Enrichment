-- Migration: Add missing max_tool_calls column to enrichment_configs
-- This column was expected by the application code but missing from schema

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'enrichment_configs'
        AND column_name = 'max_tool_calls'
    ) THEN
        ALTER TABLE enrichment_configs ADD COLUMN max_tool_calls integer NOT NULL DEFAULT 5;
    END IF;
END $$;

COMMENT ON COLUMN enrichment_configs.max_tool_calls IS 'Maximum number of tool calls allowed per enrichment run';
