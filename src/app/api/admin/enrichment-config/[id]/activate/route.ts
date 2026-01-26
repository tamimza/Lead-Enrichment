import { NextRequest, NextResponse } from 'next/server';
import { activateEnrichmentConfig } from '@/lib/enrichment-config-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/enrichment-config/[id]/activate - Activate a configuration
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const config = await activateEnrichmentConfig(id);

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
      message: `Configuration "${config.name}" is now active for ${config.tier} tier`,
    });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/activate error:', error);
    return NextResponse.json(
      { error: 'Failed to activate configuration' },
      { status: 500 }
    );
  }
}
