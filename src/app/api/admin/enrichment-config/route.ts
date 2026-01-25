import { NextRequest, NextResponse } from 'next/server';
import {
  createEnrichmentConfig,
  listEnrichmentConfigs,
} from '@/lib/enrichment-config-db';
import {
  CreateEnrichmentConfigSchema,
  ConfigQuerySchema,
} from '@/lib/enrichment-config-validations';
import type { EnrichmentTierConfig } from '@/types/enrichment-config';

// GET /api/admin/enrichment-config - List all configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tierParam = searchParams.get('tier');

    // Validate query params
    const queryResult = ConfigQuerySchema.safeParse({
      tier: tierParam || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const configs = await listEnrichmentConfigs(queryResult.data.tier as EnrichmentTierConfig | undefined);

    return NextResponse.json({
      configs,
      total: configs.length,
    });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config error:', error);
    return NextResponse.json(
      { error: 'Failed to list configurations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config - Create a new configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = CreateEnrichmentConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const config = await createEnrichmentConfig(validationResult.data);

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config error:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    );
  }
}
