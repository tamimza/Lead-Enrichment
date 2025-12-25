// Lead Enrichment Application - Authentication
// Simple password-based authentication for admin dashboard

/**
 * Verify admin password
 * In production, use NextAuth.js with OAuth or implement proper hashing
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return false;
  }

  return password === adminPassword;
}

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = 'admin-session';

/**
 * Session duration (1 day)
 */
export const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Create session token
 * In production, use signed JWT tokens
 */
export function createSessionToken(): string {
  // Simple token for demo - use crypto.randomUUID in production
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

/**
 * Verify session token
 * In production, verify JWT signature and expiration
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  // For demo purposes, any token is valid
  // In production, verify JWT signature and check expiration
  return token.length > 0;
}
