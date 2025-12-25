// Lead Enrichment Application - Setup Verification Script
// Verifies that all services and dependencies are properly configured

// Load environment variables FIRST
import './env-loader';

import { testConnection } from '../src/lib/db';
import Redis from 'ioredis';

console.log('========================================');
console.log('Lead Enrichment Setup Verification');
console.log('========================================\n');

async function verifySetup() {
  let allPassed = true;

  // 1. Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'ADMIN_PASSWORD',
    'NEXT_PUBLIC_APP_URL',
  ];

  const optionalEnvVars = ['ANTHROPIC_API_KEY', 'DEBUG'];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✓ ${envVar} is set`);
    } else {
      console.log(`   ✗ ${envVar} is NOT set (required)`);
      allPassed = false;
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✓ ${envVar} is set`);
    } else {
      console.log(`   ℹ ${envVar} is not set (optional)`);
    }
  }

  // 2. Check database connection
  console.log('\n2. Checking database connection...');
  try {
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log('   ✓ Database connection successful');
    } else {
      console.log('   ✗ Database connection failed');
      allPassed = false;
    }
  } catch (error: any) {
    console.log(`   ✗ Database error: ${error.message}`);
    allPassed = false;
  }

  // 3. Check Redis connection
  console.log('\n3. Checking Redis connection...');
  try {
    const redis = new Redis(process.env.REDIS_URL!);
    const pong = await redis.ping();
    if (pong === 'PONG') {
      console.log('   ✓ Redis connection successful');
    } else {
      console.log('   ✗ Redis connection failed');
      allPassed = false;
    }
    redis.disconnect();
  } catch (error: any) {
    console.log(`   ✗ Redis error: ${error.message}`);
    allPassed = false;
  }

  // 4. Check Claude Code authentication
  console.log('\n4. Checking Claude Code authentication...');
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('   ✓ ANTHROPIC_API_KEY is set');
  } else {
    console.log('   ℹ ANTHROPIC_API_KEY not set');
    console.log('   ℹ Make sure you have run "claude" to authenticate');
  }

  // 5. Check Node.js version
  console.log('\n5. Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    console.log(`   ✓ Node.js version ${nodeVersion} (>= 18 required)`);
  } else {
    console.log(`   ✗ Node.js version ${nodeVersion} (>= 18 required)`);
    allPassed = false;
  }

  // Summary
  console.log('\n========================================');
  if (allPassed) {
    console.log('✓ All checks passed! You are ready to start.');
    console.log('\nNext steps:');
    console.log('  1. Start Next.js: npm run dev');
    console.log('  2. Start Worker: npm run worker');
    console.log('  3. Visit: http://localhost:3000/connect');
  } else {
    console.log('✗ Some checks failed. Please fix the issues above.');
    console.log('\nCommon fixes:');
    console.log('  - Run: cp .env.example .env.local');
    console.log('  - Run: docker-compose up -d');
    console.log('  - Run: npm run db:migrate');
    console.log('  - Run: claude (to authenticate)');
  }
  console.log('========================================\n');

  process.exit(allPassed ? 0 : 1);
}

verifySetup();
