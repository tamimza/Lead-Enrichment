// Lead Enrichment Application - Database Migration Runner
// Executes SQL migration files in order

// Load environment variables FIRST
import './env-loader';

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log('Starting database migrations...');
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Read and execute migration file
    const migrationPath = join(process.cwd(), 'migrations', '001_create_leads.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration: 001_create_leads.sql');
    await pool.query(migrationSQL);
    console.log('✓ Migration completed successfully');

    // Verify table was created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'leads'
    `);

    if (result.rows.length > 0) {
      console.log('✓ Verified: leads table exists');

      // Show table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
        ORDER BY ordinal_position
      `);

      console.log('\nTable structure:');
      columns.rows.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      throw new Error('Table creation verification failed');
    }

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
