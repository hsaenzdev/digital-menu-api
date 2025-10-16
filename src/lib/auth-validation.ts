/**
 * Authentication Validation
 * 
 * Reusable authentication check utility for protected endpoints
 */

import type { Context } from 'elysia'
import type { StaffTokenPayload } from './auth'

export type AuthCheckResult = 
  | { success: true; payload: StaffTokenPayload }
  | { success: false; error: string }

/**
 * Verify staff authentication via bearer token
 * Checks if bearer token exists and is valid
 * 
 * @param jwt - Elysia JWT instance
 * @param bearer - Bearer token from request headers
 * @param set - Elysia context set for response status
 * @returns AuthCheckResult with payload if successful, error message if failed
 */
export async function verifyStaffAuth(
  jwt: any,
  bearer: string | undefined,
  set: any
): Promise<AuthCheckResult> {
  // Check if bearer token is provided
  if (!bearer) {
    set.status = 401
    return {
      success: false,
      error: 'Authentication required'
    }
  }

  // Verify JWT token
  const payload = await jwt.verify(bearer) as StaffTokenPayload | false
  if (!payload) {
    set.status = 401
    return {
      success: false,
      error: 'Invalid or expired token'
    }
  }

  return {
    success: true,
    payload
  }
}

/**
 * Helper to create standardized auth error response
 * 
 * @param message - Error message
 * @returns Formatted error response object
 */
export const createAuthErrorResponse = (message: string) => {
  return {
    success: false,
    error: message
  }
}
