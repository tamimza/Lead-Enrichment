// Lead Enrichment Application - Leads API
// POST /api/leads - Create new lead and queue enrichment
// GET /api/leads - List leads with pagination (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { createLead, listLeads } from '@/lib/db';
import { addEnrichmentJob } from '@/lib/queue';
import { LeadSchema, PaginationSchema } from '@/lib/validations';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import type { LeadCreateResponse, LeadsListResponse } from '@/types';

/**
 * POST /api/leads
 * Create new lead and queue enrichment job
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = LeadSchema.parse(body);

    // Create lead in database
    const lead = await createLead(validatedData);

    // Queue enrichment job
    await addEnrichmentJob(lead.id);

    const response: LeadCreateResponse = {
      id: lead.id,
      status: lead.status,
      message: 'Lead submitted successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/leads error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle duplicate email
    if (error.message === 'Email already exists') {
      return NextResponse.json(
        {
          error: 'Email already exists',
          message: 'A lead with this email has already been submitted',
        },
        { status: 409 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to create lead',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads
 * List leads with pagination and filtering (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!verifySessionToken(sessionToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
    };

    // Validate pagination params
    const validatedParams = PaginationSchema.parse(params);

    // Fetch leads from database
    const { leads, total } = await listLeads({
      page: validatedParams.page,
      limit: validatedParams.limit,
      status: validatedParams.status,
    });

    const response: LeadsListResponse = {
      leads,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        totalPages: Math.ceil(total / validatedParams.limit),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('GET /api/leads error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to fetch leads',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
