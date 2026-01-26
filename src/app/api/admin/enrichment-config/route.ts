import { NextRequest, NextResponse } from 'next/server';
import {
  createEnrichmentConfig,
  listEnrichmentConfigs,
} from '@/lib/enrichment-config-db';
import { getActiveProject } from '@/lib/project-db';
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
    const projectIdParam = searchParams.get('projectId');

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

    // Get project ID - use param or fall back to active project
    let projectId = projectIdParam;
    if (!projectId) {
      const activeProject = await getActiveProject();
      projectId = activeProject?.id || undefined;
    }

    const configs = await listEnrichmentConfigs(
      queryResult.data.tier as EnrichmentTierConfig | undefined,
      undefined,
      projectId || undefined
    );

    return NextResponse.json({
      configs,
      total: configs.length,
      projectId,
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

    // Get project ID from body or active project
    let projectId = body.projectId;
    if (!projectId) {
      const activeProject = await getActiveProject();
      projectId = activeProject?.id;
    }

    const config = await createEnrichmentConfig({
      ...validationResult.data,
      projectId,
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config error:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    );
  }
}
