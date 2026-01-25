import { NextRequest, NextResponse } from 'next/server';
import {
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEnrichmentConfig,
} from '@/lib/enrichment-config-db';
import {
  CreateEmailTemplateSchema,
  UpdateEmailTemplateSchema,
} from '@/lib/enrichment-config-validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/enrichment-config/[id]/email-template - Get email template
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

    const template = await getEmailTemplate(id);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('GET /api/admin/enrichment-config/[id]/email-template error:', error);
    return NextResponse.json(
      { error: 'Failed to get email template' },
      { status: 500 }
    );
  }
}

// POST /api/admin/enrichment-config/[id]/email-template - Create email template
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

    // Check if template already exists
    const existingTemplate = await getEmailTemplate(id);
    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Email template already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Validate request body
    const validationResult = CreateEmailTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const template = await createEmailTemplate(id, validationResult.data);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/enrichment-config/[id]/email-template error:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/enrichment-config/[id]/email-template - Update email template
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

    // Get existing template
    const existingTemplate = await getEmailTemplate(id);
    if (!existingTemplate) {
      // Create new template if none exists
      const validationResult = CreateEmailTemplateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const template = await createEmailTemplate(id, validationResult.data);
      return NextResponse.json(template, { status: 201 });
    }

    // Validate request body for update
    const validationResult = UpdateEmailTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const template = await updateEmailTemplate(existingTemplate.id, validationResult.data);

    return NextResponse.json(template);
  } catch (error) {
    console.error('PUT /api/admin/enrichment-config/[id]/email-template error:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/enrichment-config/[id]/email-template - Delete email template
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Get existing template
    const existingTemplate = await getEmailTemplate(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteEmailTemplate(existingTemplate.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/enrichment-config/[id]/email-template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
