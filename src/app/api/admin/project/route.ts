import { NextRequest, NextResponse } from 'next/server';
import {
  createProject,
  getActiveProject,
  listProjects,
  updateProject,
  setActiveProject,
} from '@/lib/project-db';
import { z } from 'zod';

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  companyName: z.string().min(1).max(255),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companyDescription: z.string().optional(),
  products: z.array(z.string()).optional(),
  valuePropositions: z.array(z.string()).optional(),
  differentiators: z.array(z.string()).optional(),
  targetCustomerProfile: z.string().optional(),
  industryFocus: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
  senderName: z.string().optional(),
  senderTitle: z.string().optional(),
  senderEmail: z.string().email().optional().or(z.literal('')),
  calendarLink: z.string().url().optional().or(z.literal('')),
});

// GET /api/admin/project - List all projects or get active project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      const project = await getActiveProject();
      return NextResponse.json({ project });
    }

    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('GET /api/admin/project error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/admin/project - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = CreateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const project = await createProject({
      name: data.name,
      companyName: data.companyName,
      companyWebsite: data.companyWebsite || undefined,
      companyDescription: data.companyDescription,
      products: data.products,
      valuePropositions: data.valuePropositions,
      differentiators: data.differentiators,
      targetCustomerProfile: data.targetCustomerProfile,
      industryFocus: data.industryFocus,
      competitors: data.competitors,
      senderName: data.senderName,
      senderTitle: data.senderTitle,
      senderEmail: data.senderEmail || undefined,
      calendarLink: data.calendarLink || undefined,
    });

    // Set as active if it's the first project
    const projects = await listProjects();
    if (projects.length === 1) {
      await setActiveProject(project.id);
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/project - Update the active project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await updateProject(id, updates);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('PUT /api/admin/project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
