import { NextRequest, NextResponse } from 'next/server';
import {
  getPriorities,
  createPriority,
  reorderPriorities,
  updatePriority,
  deletePriority,
  getEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import {
  CreatePrioritySchema,
  UpdatePrioritySchema,
  ReorderPrioritiesSchema,
} from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id]/priorities - Get all priorities
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify config exists
    const config = await getEnrichmentConfig(id);
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    const priorities = await getPriorities(id);

    return NextResponse.json({ priorities });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id]/priorities error:', error);
    return NextResponse.json(
      { error: 'Failed to get priorities' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config/[id]/priorities - Create a new priority
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify config exists
    const config = await getEnrichmentConfig(id);
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = CreatePrioritySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const priority = await createPriority(id, validationResult.data);

    return NextResponse.json(priority, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/priorities error:', error);
    return NextResponse.json(
      { error: 'Failed to create priority' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id]/priorities - Reorder or update priorities
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if this is a reorder request or an update request
    if (body.priorityIds) {
      // Reorder request
      const validationResult = ReorderPrioritiesSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const priorities = await reorderPriorities(id, validationResult.data.priorityIds);
      return NextResponse.json({ priorities });
    } else if (body.priorityId) {
      // Update single priority request
      const { priorityId, ...updates } = body;
      const validationResult = UpdatePrioritySchema.safeParse(updates);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const priority = await updatePriority(priorityId, validationResult.data);
      if (!priority) {
        return NextResponse.json(
          { error: 'Priority not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(priority);
    } else {
      return NextResponse.json(
        { error: 'Missing priorityIds or priorityId in request body' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id]/priorities error:', error);
    return NextResponse.json(
      { error: 'Failed to update priorities' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id]/priorities - Delete a priority
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const priorityId = searchParams.get('priorityId');

    if (!priorityId) {
      return NextResponse.json(
        { error: 'Missing priorityId query parameter' },
        { status: 400 }
      );
    }

    const deleted = await deletePriority(priorityId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Priority not found' },
        { status: 404 }
      );
    }

    // Return updated list
    const priorities = await getPriorities(id);
    return NextResponse.json({ priorities, deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id]/priorities error:', error);
    return NextResponse.json(
      { error: 'Failed to delete priority' },
      { status: 500 }
    );
  }
}
