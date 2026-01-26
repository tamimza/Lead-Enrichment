// Admin API: /api/admin/api-keys
// List and create API keys for the active project

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { listApiKeys, createApiKey, getApiKeyStats } from '@/lib/api-keys-db';
import { getActiveProject } from '@/lib/project-db';
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
// GET /api/admin/api-keys
// List all API keys for the active project
// =============================================================================

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get active project
    const activeProject = await getActiveProject();

    if (!activeProject) {
      return NextResponse.json(
        { error: 'No active project', keys: [] },
        { status: 200 }
      );
    }

    // Get all API keys for this project
    const keys = await listApiKeys(activeProject.id);

    // Get stats for each key
    const keysWithStats = await Promise.all(
      keys.map(async (key) => {
        const stats = await getApiKeyStats(key.id);
        return {
          ...key,
          stats: stats || {
            requestsToday: 0,
            rateLimitPerDay: key.rateLimitPerDay,
            lastUsedAt: key.lastUsedAt,
            percentUsed: 0,
          },
        };
      })
    );

    return NextResponse.json({
      keys: keysWithStats,
      projectId: activeProject.id,
      projectName: activeProject.name,
    });
  } catch (error) {
    console.error('[Admin API Keys] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/admin/api-keys
// Create a new API key
// =============================================================================

const createKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(255),
  rateLimitPerDay: z.number().int().min(1).max(10000).default(100),
});

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get active project
    const activeProject = await getActiveProject();

    if (!activeProject) {
      return NextResponse.json(
        { error: 'No active project. Create a project first.' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, rateLimitPerDay } = validation.data;

    // Create the API key
    const result = await createApiKey(activeProject.id, name, rateLimitPerDay);

    // Return the key with the full key value (shown only once!)
    return NextResponse.json(
      {
        success: true,
        message: 'API key created. Copy the key now - it will not be shown again!',
        key: {
          id: result.apiKey.id,
          name: result.apiKey.name,
          keyPrefix: result.apiKey.keyPrefix,
          fullKey: result.fullKey, // Only returned on creation!
          rateLimitPerDay: result.apiKey.rateLimitPerDay,
          isActive: result.apiKey.isActive,
          createdAt: result.apiKey.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin API Keys] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
