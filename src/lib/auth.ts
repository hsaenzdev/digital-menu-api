/**
 * Staff authentication utilities
 * Handles PIN hashing, verification, and JWT token management
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '24h' // Token expires in 24 hours

/**
 * Hash a 4-digit PIN for secure storage
 */
export async function hashPin(pin: string): Promise<string> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits')
  }
  return bcrypt.hash(pin, SALT_ROUNDS)
}

/**
 * Verify a PIN against a hashed PIN
 */
export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(pin)) {
    return false
  }
  return bcrypt.compare(pin, hashedPin)
}

/**
 * JWT token payload for staff authentication
 */
export interface StaffTokenPayload {
  staffId: string
  username: string
  role: string
  [key: string]: any // Allow additional JWT claims
}

/**
 * Generate JWT configuration for Elysia
 * Use this in your Elysia app with @elysiajs/jwt plugin
 */
export const jwtConfig = {
  name: 'jwt',
  secret: JWT_SECRET,
  exp: JWT_EXPIRY
}
