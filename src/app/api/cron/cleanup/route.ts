// Lead Enrichment Application - Data Retention Cron Job
// Automatically deletes expired leads as promised in consent disclosure
// Runs daily via Vercel Cron

import { NextRequest, NextResponse } from 'next/server';
import { deleteExpiredLeads } from '@/lib/db';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[Cron] Unauthorized cleanup attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startTime = Date.now();
    console.log('[Cron] Starting data retention cleanup...');

    // Delete expired leads (those past their expires_at date)
    const deletedCount = await deleteExpiredLeads();

    const duration = Date.now() - startTime;
    console.log(`[Cron] Cleanup completed: ${deletedCount} expired leads deleted in ${duration}ms`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Cleanup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
