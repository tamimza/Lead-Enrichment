// Lead Enrichment Application - Authentication API
// POST /api/auth - Admin login

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_DURATION } from '@/lib/auth';
import { z } from 'zod';

const LoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth
 * Verify admin password and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = LoginSchema.parse(body);

    // Verify password
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = createSessionToken();

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    // Set HTTP-only cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('POST /api/auth error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth
 * Logout - clear session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
