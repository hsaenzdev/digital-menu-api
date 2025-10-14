/**
 * Staff authentication endpoints
 * Handles login, logout, session verification, and staff management
 */

import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { prisma } from '../../lib/prisma'
import { verifyPin, jwtConfig, type StaffTokenPayload } from '../../lib/auth'

export const staffPlugin = new Elysia({ prefix: '/api/staff' })
  .use(jwt(jwtConfig))
  .use(bearer())

  /**
   * POST /api/staff/login
   * Authenticate staff member with username and PIN
   */
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const { username, pin } = body

      // Find staff member
      const staff = await prisma.staff.findUnique({
        where: { username }
      })

      if (!staff) {
        set.status = 401
        return {
          success: false,
          error: 'Invalid username or PIN'
        }
      }

      // Check if staff is active
      if (!staff.isActive) {
        set.status = 403
        return {
          success: false,
          error: 'Account is inactive. Please contact an administrator.'
        }
      }

      // Verify PIN
      const isValidPin = await verifyPin(pin, staff.pin)
      if (!isValidPin) {
        set.status = 401
        return {
          success: false,
          error: 'Invalid username or PIN'
        }
      }

      // Update last login
      await prisma.staff.update({
        where: { id: staff.id },
        data: { lastLoginAt: new Date() }
      })

      // Generate JWT token
      const payload: StaffTokenPayload = {
        staffId: staff.id,
        username: staff.username,
        role: staff.role
      }
      const token = await jwt.sign(payload)

      return {
        success: true,
        token,
        staff: {
          id: staff.id,
          username: staff.username,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role
        }
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 50 }),
        pin: t.String({ pattern: '^\\d{4}$' })
      })
    }
  )

  /**
   * GET /api/staff/me
   * Get current authenticated staff member's information
   * Requires: Bearer token in Authorization header
   */
  .get(
    '/me',
    async ({ jwt, bearer, set }) => {
      if (!bearer) {
        set.status = 401
        return {
          success: false,
          error: 'Authorization token required'
        }
      }

      // Verify token
      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return {
          success: false,
          error: 'Invalid or expired token'
        }
      }

      // Get staff from database
      const staff = await prisma.staff.findUnique({
        where: { id: payload.staffId }
      })

      if (!staff || !staff.isActive) {
        set.status = 404
        return {
          success: false,
          error: 'Staff member not found or inactive'
        }
      }

      return {
        success: true,
        staff: {
          id: staff.id,
          username: staff.username,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
          lastLoginAt: staff.lastLoginAt
        }
      }
    }
  )

  /**
   * GET /api/staff/list
   * List all staff members (ADMIN only)
   * Requires: Bearer token in Authorization header with ADMIN role
   */
  .get(
    '/list',
    async ({ jwt, bearer, set }) => {
      if (!bearer) {
        set.status = 401
        return {
          success: false,
          error: 'Authorization token required'
        }
      }

      // Verify token
      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return {
          success: false,
          error: 'Invalid or expired token'
        }
      }

      // Check if user is admin
      if (payload.role !== 'ADMIN') {
        set.status = 403
        return {
          success: false,
          error: 'Admin access required'
        }
      }

      // Get all staff
      const staff = await prisma.staff.findMany({
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return {
        success: true,
        count: staff.length,
        staff
      }
    }
  )

  /**
   * POST /api/staff/logout
   * Logout endpoint (token invalidation handled client-side)
   */
  .post('/logout', async () => {
    // In a stateless JWT setup, logout is handled client-side by removing the token
    // For token blacklisting, you would add the token to a blacklist here
    return {
      success: true,
      message: 'Logged out successfully'
    }
  })
