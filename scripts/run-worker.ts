// Lead Enrichment Application - Worker Process
// BullMQ worker that processes enrichment jobs in the background

// IMPORTANT: Load environment variables FIRST
import './env-loader';

import { Worker } from 'bullmq';
import Redis from 'ioredis';
// Use Anthropic SDK directly for production (no CLI dependency)
// The enhanced worker uses direct API calls with tool use
import { enrichLeadByTier } from '../src/agent/enrichment-worker-enhanced';
import { closeQueue, getQueueStats } from '../src/lib/queue';

// Redis connection for worker
// Only use TLS for cloud Redis (Upstash uses rediss://)
const redisUrl = process.env.REDIS_URL!;
const useTls = redisUrl.startsWith('rediss://');

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  keepAlive: 30000, // Send keepalive every 30 seconds
  connectTimeout: 10000, // 10 second connection timeout
  retryStrategy: (times: number) => {
    // Reconnect after increasing delays, max 30 seconds
    const delay = Math.min(times * 1000, 30000);
    console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    // Reconnect on connection reset errors
    const targetErrors = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'];
    return targetErrors.some(e => err.message.includes(e));
  },
  ...(useTls && {
    tls: {
      rejectUnauthorized: false, // Required for Upstash
    },
  }),
});

// Log Redis connection events
redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected');
});

redisConnection.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

console.log('\n========================================');
console.log('Lead Enrichment Worker Starting...');
console.log('========================================');
console.log(`Redis: ${process.env.REDIS_URL}`);
console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);
console.log(`Model: claude-sonnet-4-5-20250929`);
console.log(`Auth: API Key (${process.env.ANTHROPIC_API_KEY ? 'set' : 'not set'})`);
console.log(`Debug: ${process.env.DEBUG || 'false'}`);
console.log('========================================\n');

/**
 * BullMQ Worker
 * Processes jobs from the 'enrichment' queue
 */
const worker = new Worker(
  'enrichment',
  async (job) => {
    const { leadId } = job.data;

    console.log(`\n[Worker] Processing job ${job.id} for lead: ${leadId}`);

    try {
      // Call the tiered enrichment function (standard or premium based on lead tier)
      await enrichLeadByTier(leadId);

      console.log(`[Worker] Job ${job.id} completed successfully\n`);
      return { success: true, leadId };
    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);
      throw error; // Re-throw for BullMQ retry logic
    }
  },
  {
    connection: redisConnection,

    // Process 2 jobs concurrently max
    // Adjust based on your API rate limits and infrastructure
    concurrency: 2,

    // Rate limiting to avoid overwhelming Anthropic API
    limiter: {
      max: 10, // Max 10 jobs per duration
      duration: 60000, // 1 minute
    },
  }
);

// Worker event handlers
worker.on('completed', async (job) => {
  console.log(`[Worker] ✓ Job ${job.id} completed`);

  // Log queue stats periodically
  const stats = await getQueueStats();
  console.log(
    `[Stats] Queue: ${stats.waiting} waiting, ${stats.active} active, ${stats.completed} completed, ${stats.failed} failed`
  );
});

worker.on('failed', (job, err) => {
  if (job) {
    console.error(`[Worker] ✗ Job ${job.id} failed after ${job.attemptsMade} attempts: ${err.message}`);
  }
});

worker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`[Worker] → Job ${job.id} started`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n[Worker] Shutting down gracefully...');

  try {
    await worker.close();
    await closeQueue();
    redisConnection.disconnect();

    console.log('[Worker] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Worker] Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Log initial queue stats
(async () => {
  try {
    const stats = await getQueueStats();
    console.log('[Worker] Initial queue stats:');
    console.log(`  Waiting: ${stats.waiting}`);
    console.log(`  Active: ${stats.active}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log('\n[Worker] Ready to process jobs...\n');
  } catch (error) {
    console.error('[Worker] Failed to get initial stats:', error);
  }
})();
