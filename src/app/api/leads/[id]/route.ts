// Lead Enrichment Application - Individual Lead API
// DELETE /api/leads/[id] - Delete a lead (admin only)
// GET /api/leads/[id] - Get a single lead (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { deleteLead, getLead } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/leads/[id]
 * Get a single lead by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!verifySessionToken(sessionToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lead = await getLead(params.id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error(`GET /api/leads/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch lead', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead by ID (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!verifySessionToken(sessionToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await deleteLead(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error: any) {
    console.error(`DELETE /api/leads/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete lead', message: error.message },
      { status: 500 }
    );
  }
}
