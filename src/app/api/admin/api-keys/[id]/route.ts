// Admin API: /api/admin/api-keys/[id]
// Update and delete individual API keys

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getApiKey, updateApiKey, deleteApiKey, getApiKeyStats } from '@/lib/api-keys-db';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

// =============================================================================
// Auth Check
// =============================================================================

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

// =============================================================================
// GET /api/admin/api-keys/[id]
// Get a single API key with stats
// =============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const key = await getApiKey(id);

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const stats = await getApiKeyStats(id);

    return NextResponse.json({
      key: {
        ...key,
        stats: stats || {
          requestsToday: 0,
          rateLimitPerDay: key.rateLimitPerDay,
          lastUsedAt: key.lastUsedAt,
          percentUsed: 0,
        },
      },
    });
  } catch (error) {
    console.error('[Admin API Keys] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/admin/api-keys/[id]
// Update an API key (name, active status, rate limit)
// =============================================================================

const updateKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  rateLimitPerDay: z.number().int().min(1).max(10000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if key exists
    const existingKey = await getApiKey(id);
    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Update the key
    const updatedKey = await updateApiKey(id, validation.data);

    return NextResponse.json({
      success: true,
      key: updatedKey,
    });
  } catch (error) {
    console.error('[Admin API Keys] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/admin/api-keys/[id]
// Delete an API key
// =============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Check if key exists
    const existingKey = await getApiKey(id);
    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Delete the key
    await deleteApiKey(id);

    return NextResponse.json({
      success: true,
      message: 'API key deleted',
    });
  } catch (error) {
    console.error('[Admin API Keys] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
