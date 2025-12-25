// Lead Enrichment Application - Job Queue Setup
// BullMQ queue and worker configuration for background processing

import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
const redisConnection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required for BullMQ
  tls: {
    rejectUnauthorized: false, // Required for Upstash
  },
});

// Test Redis connection
redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisConnection.on('connect', () => {
  console.log('✓ Redis connected');
});

/**
 * Lead enrichment queue
 * Jobs contain lead ID to process
 */
export const enrichmentQueue = new Queue('enrichment', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay, doubles each retry
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

/**
 * Queue events for monitoring
 */
export const queueEvents = new QueueEvents('enrichment', {
  connection: redisConnection,
});

// Log queue events
queueEvents.on('completed', ({ jobId }) => {
  console.log(`[Queue] Job ${jobId} completed`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[Queue] Job ${jobId} failed: ${failedReason}`);
});

queueEvents.on('progress', ({ jobId, data }) => {
  console.log(`[Queue] Job ${jobId} progress: ${JSON.stringify(data)}`);
});

/**
 * Add a lead enrichment job to the queue
 */
export async function addEnrichmentJob(leadId: string): Promise<void> {
  await enrichmentQueue.add(
    'enrich-lead',
    { leadId },
    {
      jobId: leadId, // Use lead ID as job ID to prevent duplicates
    }
  );

  console.log(`[Queue] Queued enrichment job for lead: ${leadId}`);
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    enrichmentQueue.getWaitingCount(),
    enrichmentQueue.getActiveCount(),
    enrichmentQueue.getCompletedCount(),
    enrichmentQueue.getFailedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

/**
 * Close queue connections (for graceful shutdown)
 */
export async function closeQueue(): Promise<void> {
  await enrichmentQueue.close();
  await queueEvents.close();
  redisConnection.disconnect();
}
