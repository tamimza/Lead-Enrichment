// Run production database migration
// Usage: DATABASE_URL="your-neon-url" npx tsx scripts/migrate-production.ts

import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.error('Usage: DATABASE_URL="your-neon-url" npx tsx scripts/migrate-production.ts');
    process.exit(1);
  }

  console.log('🚀 Running production migration...');
  console.log(`📍 Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '001_create_leads.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Running migration: 001_create_leads.sql');
    await client.query(sql);

    console.log('✓ Migration completed successfully!\n');
    console.log('✅ Database is ready for production');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
