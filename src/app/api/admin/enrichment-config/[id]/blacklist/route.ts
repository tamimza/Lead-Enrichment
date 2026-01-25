import { NextRequest, NextResponse } from 'next/server';
import {
  getBlacklistItems,
  createBlacklistItem,
  createBlacklistItemsBulk,
  updateBlacklistItem,
  deleteBlacklistItem,
  deleteAllBlacklistItems,
  getEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import {
  CreateBlacklistItemSchema,
  UpdateBlacklistItemSchema,
  BulkCreateBlacklistSchema,
} from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id]/blacklist - Get all blacklist items
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

    const items = await getBlacklistItems(id);

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id]/blacklist error:', error);
    return NextResponse.json(
      { error: 'Failed to get blacklist items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config/[id]/blacklist - Create blacklist item(s)
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

    // Check if this is a bulk create request
    if (body.items && Array.isArray(body.items)) {
      // Bulk create
      const validationResult = BulkCreateBlacklistSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const items = await createBlacklistItemsBulk(id, validationResult.data.items);

      return NextResponse.json({ items, created: items.length }, { status: 201 });
    } else {
      // Single item create
      const validationResult = CreateBlacklistItemSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const item = await createBlacklistItem(id, validationResult.data);

      return NextResponse.json(item, { status: 201 });
    }
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/blacklist error:', error);
    return NextResponse.json(
      { error: 'Failed to create blacklist item' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id]/blacklist - Update blacklist item
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Must have itemId
    if (!body.itemId) {
      return NextResponse.json(
        { error: 'Missing itemId in request body' },
        { status: 400 }
      );
    }

    const { itemId, ...updates } = body;
    const validationResult = UpdateBlacklistItemSchema.safeParse(updates);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const item = await updateBlacklistItem(itemId, validationResult.data);
    if (!item) {
      return NextResponse.json(
        { error: 'Blacklist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id]/blacklist error:', error);
    return NextResponse.json(
      { error: 'Failed to update blacklist item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id]/blacklist - Delete blacklist item(s)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clearAll') === 'true';

    // Verify config exists
    const config = await getEnrichmentConfig(id);
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      );
    }

    if (clearAll) {
      // Delete all blacklist items
      const deletedCount = await deleteAllBlacklistItems(id);
      return NextResponse.json({ deleted: deletedCount, cleared: true });
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing itemId query parameter or clearAll=true' },
        { status: 400 }
      );
    }

    const deleted = await deleteBlacklistItem(itemId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Blacklist item not found' },
        { status: 404 }
      );
    }

    // Return updated list
    const items = await getBlacklistItems(id);
    return NextResponse.json({ items, deleted: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id]/blacklist error:', error);
    return NextResponse.json(
      { error: 'Failed to delete blacklist item' },
      { status: 500 }
    );
  }
}
