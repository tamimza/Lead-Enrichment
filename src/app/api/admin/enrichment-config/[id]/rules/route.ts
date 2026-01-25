import { NextRequest, NextResponse } from 'next/server';
import {
  getRules,
  createRule,
  reorderRules,
  updateRule,
  deleteRule,
  getEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import {
  CreateRuleSchema,
  UpdateRuleSchema,
  ReorderRulesSchema,
} from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id]/rules - Get all thinking rules
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

    const rules = await getRules(id);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id]/rules error:', error);
    return NextResponse.json(
      { error: 'Failed to get rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config/[id]/rules - Create a new thinking rule
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
    const validationResult = CreateRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const rule = await createRule(id, validationResult.data);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/rules error:', error);
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id]/rules - Reorder or update rules
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if this is a reorder request or an update request
    if (body.ruleIds) {
      // Reorder request
      const validationResult = ReorderRulesSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const rules = await reorderRules(id, validationResult.data.ruleIds);
      return NextResponse.json({ rules });
    } else if (body.ruleId) {
      // Update single rule request
      const { ruleId, ...updates } = body;
      const validationResult = UpdateRuleSchema.safeParse(updates);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const rule = await updateRule(ruleId, validationResult.data);
      if (!rule) {
        return NextResponse.json(
          { error: 'Rule not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(rule);
    } else {
      return NextResponse.json(
        { error: 'Missing ruleIds or ruleId in request body' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id]/rules error:', error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id]/rules - Delete a rule
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Missing ruleId query parameter' },
        { status: 400 }
      );
    }

    const deleted = await deleteRule(ruleId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Return updated list
    const rules = await getRules(id);
    return NextResponse.json({ rules, deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id]/rules error:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
