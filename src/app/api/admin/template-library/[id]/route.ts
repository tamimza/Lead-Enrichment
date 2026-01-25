import { NextRequest, NextResponse } from 'next/server';
import {
  getTemplateLibraryItem,
  deleteTemplateLibraryItem,
} from '@/lib/enrichment-config-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/template-library/[id] - Get a specific template
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const template = await getTemplateLibraryItem(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('GET /api/admin/template-library/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to get template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/template-library/[id] - Delete a template
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if template exists and is not a system template
    const template = await getTemplateLibraryItem(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.isSystemTemplate) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      );
    }

    const deleted = await deleteTemplateLibraryItem(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/template-library/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
