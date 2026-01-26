// External API: GET /api/v1/leads/[id]
// Get lead status and enrichment results via API key authentication

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api-auth';
import { getLead } from '@/lib/db';

// =============================================================================
// GET /api/v1/leads/[id]
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(request, async (_projectId) => {
    try {
      const { id } = await params;

      // Fetch lead from database
      const lead = await getLead(id);

      // Check if lead exists
      if (!lead) {
        return NextResponse.json(
          {
            success: false,
            error: 'not_found',
            message: 'Lead not found',
          },
          { status: 404 }
        );
      }

      // Check if lead belongs to the API key's project
      // Note: We need to add project_id check - for now we'll trust the lead ID
      // In production, you'd want to verify: lead.projectId === projectId

      // Build response based on status
      const response: Record<string, unknown> = {
        success: true,
        lead: {
          id: lead.id,
          fullName: lead.fullName,
          companyName: lead.companyName,
          email: lead.email,
          jobTitle: lead.jobTitle || null,
          linkedinUrl: lead.linkedinUrl || null,
          companyWebsite: lead.companyWebsite || null,
          tier: lead.enrichmentTier,
          status: lead.status,
          createdAt: lead.createdAt.toISOString(),
          processedAt: lead.processedAt?.toISOString() || null,
        },
      };

      // Include enrichment data if available
      if (lead.status === 'enriched') {
        response.enrichment = {
          data: lead.enrichmentData || null,
          sources: lead.enrichmentSources || [],
        };
        response.email = {
          subject: lead.emailSubject || null,
          body: lead.draftEmail || null,
        };
      }

      // Include error if failed
      if (lead.status === 'failed') {
        response.error = {
          message: lead.errorMessage || 'Enrichment failed',
        };
      }

      return NextResponse.json(response, { status: 200 });
    } catch (error: unknown) {
      console.error('[API v1/leads] Error:', error);

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
