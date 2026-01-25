import { NextRequest, NextResponse } from 'next/server';
import {
  getEnrichmentConfig,
  getFullEnrichmentConfig,
  updateEnrichmentConfig,
  deleteEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import { UpdateEnrichmentConfigSchema } from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id] - Get a specific configuration
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeFull = searchParams.get('full') === 'true';

    const config = includeFull
      ? await getFullEnrichmentConfig(id)
      : await getEnrichmentConfig(id);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id] - Update a configuration
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = UpdateEnrichmentConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const config = await updateEnrichmentConfig(id, validationResult.data);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id] - Delete a configuration
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deleted = await deleteEnrichmentConfig(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}
