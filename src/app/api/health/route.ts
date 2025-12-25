// Lead Enrichment Application - Health Check Endpoint
// GET /api/health - Check database and Redis connectivity

import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';
import Redis from 'ioredis';
import type { HealthCheckResponse } from '@/types';

export async function GET() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    // Test Redis connection
    let redisConnected = false;
    try {
      const redis = new Redis(process.env.REDIS_URL!);
      await redis.ping();
      redisConnected = true;
      redis.disconnect();
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    const response: HealthCheckResponse = {
      status: dbConnected && redisConnected ? 'healthy' : 'unhealthy',
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: response.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
