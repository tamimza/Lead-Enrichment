// External API: POST /api/v1/enrich
// Submit a lead for enrichment via API key authentication

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/api-auth';
import { createLead } from '@/lib/db';
import { addEnrichmentJob } from '@/lib/queue';
import { checkRateLimit } from '@/lib/api-keys-db';
import type { EnrichmentTier } from '@/types';

// =============================================================================
// Validation Schema
// =============================================================================

const enrichRequestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  tier: z.enum(['standard', 'medium', 'premium']).default('standard'),
});

// =============================================================================
// POST /api/v1/enrich
// =============================================================================

export async function POST(request: NextRequest) {
  return withApiAuth(request, async (projectId, apiKey) => {
    try {
      // Parse request body
      const body = await request.json();

      // Validate input
      const validation = enrichRequestSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'validation_error',
            message: 'Invalid request data',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Create lead in database
      const lead = await createLead({
        fullName: data.fullName,
        companyName: data.companyName,
        email: data.email,
        jobTitle: data.jobTitle || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
        companyWebsite: data.companyWebsite || undefined,
        enrichmentTier: data.tier as EnrichmentTier,
        projectId,
      });

      // Queue enrichment job
      await addEnrichmentJob(lead.id);

      // Get rate limit info for headers
      const rateLimit = await checkRateLimit(apiKey.id);

      // Calculate reset time
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      // Create response
      const response = NextResponse.json(
        {
          success: true,
          leadId: lead.id,
          status: 'queued',
          tier: data.tier,
          message: 'Lead queued for enrichment',
        },
        { status: 201 }
      );

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimit.rateLimitPerDay.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        Math.max(0, rateLimit.rateLimitPerDay - rateLimit.requestsToday - 1).toString()
      );
      response.headers.set('X-RateLimit-Reset', Math.floor(tomorrow.getTime() / 1000).toString());

      return response;
    } catch (error: unknown) {
      console.error('[API v1/enrich] Error:', error);

      // Handle duplicate email error
      if (error instanceof Error && error.message === 'Email already exists') {
        return NextResponse.json(
          {
            success: false,
            error: 'duplicate_email',
            message: 'A lead with this email already exists',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'internal_error',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  });
}

// =============================================================================
// OPTIONS (CORS preflight)
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
