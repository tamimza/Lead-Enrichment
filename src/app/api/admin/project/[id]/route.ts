import { NextRequest, NextResponse } from 'next/server';
import {
  getProject,
  updateProject,
  deleteProject,
  setActiveProject,
} from '@/lib/project-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/project/[id] - Get a specific project
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('GET /api/admin/project/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/project/[id] - Update a specific project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const project = await updateProject(id, body);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('PUT /api/admin/project/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/project/[id] - Delete a project
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteProject(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/project/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

// POST /api/admin/project/[id] - Special actions (activate)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'activate') {
      const project = await setActiveProject(id);

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, project });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('POST /api/admin/project/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
