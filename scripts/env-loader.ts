// Environment Variable Loader
// MUST be imported first before any other application code

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// In production (Railway, etc.), env vars are set directly - no .env files needed
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const envLocalPath = resolve(process.cwd(), '.env.local');
  const envPath = resolve(process.cwd(), '.env');

  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
    console.log('[ENV] Loaded .env.local');
  } else if (existsSync(envPath)) {
    config({ path: envPath });
    console.log('[ENV] Loaded .env');
  } else {
    console.warn('[ENV] Warning: No .env or .env.local file found');
  }
} else {
  console.log('[ENV] Production mode - using environment variables');
}

// Verify critical environment variables
if (!process.env.DATABASE_URL) {
  console.error('[ENV] ERROR: DATABASE_URL not found in environment');
  process.exit(1);
}

if (!process.env.REDIS_URL) {
  console.error('[ENV] ERROR: REDIS_URL not found in environment');
  process.exit(1);
}

// Check for Claude authentication
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('[ENV] WARNING: ANTHROPIC_API_KEY not found');
  console.warn('[ENV] Agent SDK will attempt to use Claude CLI authentication');
} else {
  console.log('[ENV] ANTHROPIC_API_KEY is set');
}
