import { NextRequest, NextResponse } from 'next/server';
import {
  getPlaybookSteps,
  createPlaybookStep,
  reorderPlaybookSteps,
  updatePlaybookStep,
  deletePlaybookStep,
  getEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import {
  CreatePlaybookStepSchema,
  UpdatePlaybookStepSchema,
  ReorderPlaybookStepsSchema,
} from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id]/playbook - Get all playbook steps
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

    const steps = await getPlaybookSteps(id);

    return NextResponse.json({ steps });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id]/playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to get playbook steps' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config/[id]/playbook - Create a new playbook step
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
    const validationResult = CreatePlaybookStepSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const step = await createPlaybookStep(id, validationResult.data);

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to create playbook step' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id]/playbook - Reorder playbook steps
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if this is a reorder request or an update request
    if (body.stepIds) {
      // Reorder request
      const validationResult = ReorderPlaybookStepsSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const steps = await reorderPlaybookSteps(id, validationResult.data.stepIds);
      return NextResponse.json({ steps });
    } else if (body.stepId) {
      // Update single step request
      const { stepId, ...updates } = body;
      const validationResult = UpdatePlaybookStepSchema.safeParse(updates);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const step = await updatePlaybookStep(stepId, validationResult.data);
      if (!step) {
        return NextResponse.json(
          { error: 'Playbook step not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(step);
    } else {
      return NextResponse.json(
        { error: 'Missing stepIds or stepId in request body' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id]/playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to update playbook' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id]/playbook - Delete a playbook step
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return NextResponse.json(
        { error: 'Missing stepId query parameter' },
        { status: 400 }
      );
    }

    const deleted = await deletePlaybookStep(stepId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Playbook step not found' },
        { status: 404 }
      );
    }

    // Return updated list
    const steps = await getPlaybookSteps(id);
    return NextResponse.json({ steps, deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id]/playbook error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playbook step' },
      { status: 500 }
    );
  }
}
