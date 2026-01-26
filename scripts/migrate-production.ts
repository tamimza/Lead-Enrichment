// Run production database migration
// Usage: DATABASE_URL="your-neon-url" npx tsx scripts/migrate-production.ts

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Client } = pg;

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required');
    console.error('Usage: DATABASE_URL="your-neon-url" npx tsx scripts/migrate-production.ts');
    process.exit(1);
  }

  console.log('🚀 Running production migrations...');
  console.log(`📍 Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'unknown'}\n`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get all migration files sorted by name
    const migrationsDir = join(process.cwd(), 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files:\n`);

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf-8');

      console.log(`📝 Running: ${file}`);
      try {
        await client.query(sql);
        console.log(`   ✓ Success\n`);
      } catch (error: any) {
        // Check if error is "already exists" type - that's OK
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key')
        ) {
          console.log(`   ⚠ Skipped (already applied)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully!');
    console.log('✅ Database is ready for production\n');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
