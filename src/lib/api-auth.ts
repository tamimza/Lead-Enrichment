// API Authentication Helper
// Verifies API keys and handles rate limiting for external API access

import { NextRequest, NextResponse } from 'next/server';
import {
  findApiKeyByValue,
  checkRateLimit,
  incrementRequestCount,
  type ApiKey,
} from './api-keys-db';

// =============================================================================
// Types
// =============================================================================

export interface ApiAuthResult {
  success: true;
  apiKey: ApiKey;
  projectId: string;
}

export interface ApiAuthError {
  success: false;
  error: 'missing_api_key' | 'invalid_api_key' | 'inactive_api_key' | 'rate_limit_exceeded';
  message: string;
  resetsAt?: string;
}

export type ApiAuthResponse = ApiAuthResult | ApiAuthError;

// =============================================================================
// Error Responses
// =============================================================================

export function createErrorResponse(
  error: ApiAuthError['error'],
  message: string,
  status: number,
  resetsAt?: Date
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      ...(resetsAt && { resetsAt: resetsAt.toISOString() }),
    },
    { status }
  );
}

export const ApiErrors = {
  missingKey: () =>
    createErrorResponse(
      'missing_api_key',
      'API key is required. Use Authorization: Bearer le_prod_xxx header.',
      401
    ),

  invalidKey: () =>
    createErrorResponse(
      'invalid_api_key',
      'Invalid or inactive API key',
      401
    ),

  inactiveKey: () =>
    createErrorResponse(
      'inactive_api_key',
      'This API key has been deactivated',
      401
    ),

  rateLimited: (limit: number, resetsAt: Date) =>
    createErrorResponse(
      'rate_limit_exceeded',
      `Daily limit of ${limit} requests exceeded`,
      429,
      resetsAt
    ),
};

// =============================================================================
// Authentication Functions
// =============================================================================

/**
 * Extract API key from Authorization header
 * Expects: "Bearer le_prod_xxxxx"
 */
export function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer xxx" and just "xxx"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // If it looks like an API key, accept it directly
  if (authHeader.startsWith('le_prod_')) {
    return authHeader;
  }

  return null;
}

/**
 * Verify API key and check rate limits
 * Call this at the start of protected API endpoints
 */
export async function verifyApiKey(request: NextRequest): Promise<ApiAuthResponse> {
  // Extract key from header
  const apiKeyValue = extractApiKey(request);

  if (!apiKeyValue) {
    return {
      success: false,
      error: 'missing_api_key',
      message: 'API key is required. Use Authorization: Bearer le_prod_xxx header.',
    };
  }

  // Find the API key in database
  const keyResult = await findApiKeyByValue(apiKeyValue);

  if (!keyResult) {
    return {
      success: false,
      error: 'invalid_api_key',
      message: 'Invalid or inactive API key',
    };
  }

  const { apiKey } = keyResult;

  // Check if key is active
  if (!apiKey.isActive) {
    return {
      success: false,
      error: 'inactive_api_key',
      message: 'This API key has been deactivated',
    };
  }

  // Check rate limit (without incrementing)
  const rateLimit = await checkRateLimit(apiKey.id);

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: 'rate_limit_exceeded',
      message: `Daily limit of ${rateLimit.rateLimitPerDay} requests exceeded`,
      resetsAt: rateLimit.resetsAt.toISOString(),
    };
  }

  // Increment usage counter
  await incrementRequestCount(apiKey.id);

  return {
    success: true,
    apiKey,
    projectId: apiKey.projectId,
  };
}

/**
 * Middleware-style wrapper for API routes
 * Verifies API key and passes projectId to handler
 */
export async function withApiAuth(
  request: NextRequest,
  handler: (projectId: string, apiKey: ApiKey) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await verifyApiKey(request);

  if (!authResult.success) {
    const { error, message, resetsAt } = authResult;

    const status =
      error === 'rate_limit_exceeded' ? 429 :
      error === 'missing_api_key' ? 401 :
      error === 'invalid_api_key' ? 401 :
      error === 'inactive_api_key' ? 403 : 401;

    return NextResponse.json(
      {
        success: false,
        error,
        message,
        ...(resetsAt && { resetsAt }),
      },
      { status }
    );
  }

  return handler(authResult.projectId, authResult.apiKey);
}

// =============================================================================
// Rate Limit Headers
// =============================================================================

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  requestsToday: number,
  rateLimitPerDay: number,
  resetsAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitPerDay.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimitPerDay - requestsToday).toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(resetsAt.getTime() / 1000).toString());
  return response;
}
