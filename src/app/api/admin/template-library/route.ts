import { NextRequest, NextResponse } from 'next/server';
import {
  listTemplateLibrary,
  createTemplateFromConfig,
  getEnrichmentConfig,
  createEnrichmentConfig,
  getTemplateLibraryItem,
  incrementTemplateUseCount,
} from '@/lib/enrichment-config-db';
import {
  CreateTemplateLibrarySchema,
  ApplyTemplateSchema,
  TemplateQuerySchema,
} from '@/lib/enrichment-config-validations';
import type { EnrichmentTierConfig } from '@/types/enrichment-config';

// GET /api/admin/template-library - List all templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');
    const tierParam = searchParams.get('tier');

    // Validate query params
    const queryResult = TemplateQuerySchema.safeParse({
      category: categoryParam || undefined,
      tier: tierParam || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const templates = await listTemplateLibrary(
      queryResult.data.category,
      queryResult.data.tier as EnrichmentTierConfig | undefined
    );

    return NextResponse.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('GET /api/admin/template-library error:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/template-library - Create a new template from config or apply a template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a "create from config" or "apply template" request
    if (body.templateId) {
      // Apply template to create a new config
      const validationResult = ApplyTemplateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      const template = await getTemplateLibraryItem(validationResult.data.templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      // Create a new config from the template snapshot
      const config = await createEnrichmentConfig({
        tier: validationResult.data.tier,
        name: validationResult.data.name,
        description: `Created from template: ${template.name}`,
        maxTurns: template.configSnapshot.maxTurns,
        maxBudgetUsd: template.configSnapshot.maxBudgetUsd,
        allowedTools: template.configSnapshot.allowedTools,
        emailTone: template.configSnapshot.emailTone,
        emailMinWords: template.configSnapshot.emailMinWords,
        emailMaxWords: template.configSnapshot.emailMaxWords,
      });

      // Increment template use count
      await incrementTemplateUseCount(template.id);

      return NextResponse.json({ config, fromTemplate: template.id }, { status: 201 });
    } else if (body.configId) {
      // Create template from existing config
      const validationResult = CreateTemplateLibrarySchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: validationResult.error.flatten() },
          { status: 400 }
        );
      }

      // Verify source config exists
      const sourceConfig = await getEnrichmentConfig(validationResult.data.configId);
      if (!sourceConfig) {
        return NextResponse.json(
          { error: 'Source configuration not found' },
          { status: 404 }
        );
      }

      const template = await createTemplateFromConfig(
        validationResult.data.configId,
        validationResult.data.name,
        validationResult.data.description || '',
        validationResult.data.category,
        validationResult.data.tags
      );

      return NextResponse.json(template, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Missing templateId (to apply) or configId (to create from)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('POST /api/admin/template-library error:', error);
    return NextResponse.json(
      { error: 'Failed to process template request' },
      { status: 500 }
    );
  }
}
