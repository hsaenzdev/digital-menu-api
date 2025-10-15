/**
 * Customer Locations Plugin
 * 
 * Endpoints for managing customer delivery locations:
 * - POST /resolve - Smart location resolution with proximity matching
 * - GET / - List customer locations
 * - GET /:id - Get specific location
 * - PATCH /:id - Update location (address, label)
 * - DELETE /:id - Delete location
 * - PATCH /:id/primary - Set as primary location
 */

import { Elysia, t } from 'elysia'
import {
  findClosestLocation,
  createCustomerLocation,
  updateLocationUsage,
  getCustomerLocations,
  getPrimaryLocation,
  PROXIMITY_THRESHOLD_METERS
} from '../../lib/location-utils'
import { prisma } from '../../lib/prisma'

export const customerLocationsPlugin = new Elysia({ prefix: '/api/customers/:customerId/locations' })
  /**
   * POST /api/customers/:customerId/locations/resolve
   * Smart location resolution with proximity matching
   * 
   * Algorithm:
   * 1. Check if location exists within 10m for this customer
   * 2. If found → return existing location, update lastUsedAt
   * 3. If not → create new location with provided address (or empty if not provided)
   */
  .post(
    '/resolve',
    async ({ params, body }) => {
      const { customerId } = params
      const { latitude, longitude, address } = body

      // Validate customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found'
        }
      }

      // Step 1: Search for existing location within proximity threshold
      const existingLocation = await findClosestLocation(
        customerId,
        latitude,
        longitude,
        PROXIMITY_THRESHOLD_METERS
      )

      if (existingLocation) {
        // Found existing location within 50m - reuse it
        await updateLocationUsage(existingLocation.id)

        return {
          success: true,
          location: {
            id: existingLocation.id,
            address: existingLocation.address,
            label: existingLocation.label,
            isPrimary: existingLocation.isPrimary,
            isExisting: true,
            distance: existingLocation.distance
          },
          message: `Using existing location "${existingLocation.label || existingLocation.address}" (${Math.round(existingLocation.distance)}m away)`
        }
      }

      // Step 2: No existing location found - create new one
      // Use provided address or empty string (customer must fill it manually)
      const resolvedAddress = address || ''

      // Check if this is the customer's first location → make it primary
      const existingLocations = await getCustomerLocations(customerId)
      const isPrimary = existingLocations.length === 0

      const newLocation = await createCustomerLocation(
        customerId,
        latitude,
        longitude,
        resolvedAddress,
        null, // No label initially
        isPrimary
      )

      // Prepare response message based on whether address was resolved
      let message = ''
      if (!resolvedAddress) {
        message = 'Location saved. Please enter your delivery address.'
      } else if (isPrimary) {
        message = 'New location saved as your primary address'
      } else {
        message = 'New location saved'
      }

      return {
        success: true,
        location: {
          id: newLocation!.id,
          address: newLocation!.address,
          label: newLocation!.label,
          isPrimary: newLocation!.isPrimary,
          isExisting: false
        },
        message
      }
    },
    {
      params: t.Object({
        customerId: t.String()
      }),
      body: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
        address: t.Optional(t.String()) // Optional - customer can provide or leave empty
      })
    }
  )

  /**
   * GET /api/customers/:customerId/locations
   * List all locations for a customer
   */
  .get(
    '/',
    async ({ params }) => {
      const { customerId } = params

      const locations = await getCustomerLocations(customerId)

      return {
        success: true,
        locations: locations.map(loc => ({
          id: loc.id,
          address: loc.address,
          label: loc.label,
          isPrimary: loc.isPrimary,
          lastUsedAt: loc.lastUsedAt,
          createdAt: loc.createdAt
        }))
      }
    },
    {
      params: t.Object({
        customerId: t.String()
      })
    }
  )

  /**
   * GET /api/customers/:customerId/locations/primary
   * Get customer's primary location
   */
  .get(
    '/primary',
    async ({ params }) => {
      const { customerId } = params

      const location = await getPrimaryLocation(customerId)

      if (!location) {
        return {
          success: false,
          error: 'No primary location set'
        }
      }

      return {
        success: true,
        location: {
          id: location.id,
          address: location.address,
          label: location.label,
          isPrimary: location.isPrimary,
          lastUsedAt: location.lastUsedAt
        }
      }
    },
    {
      params: t.Object({
        customerId: t.String()
      })
    }
  )

  /**
   * PATCH /api/customers/:customerId/locations/:locationId
   * Update location address or label
   */
  .patch(
    '/:locationId',
    async ({ params, body }) => {
      const { customerId, locationId } = params
      const { address, label } = body

      // Verify location belongs to customer
      const location = await prisma.customerLocation.findFirst({
        where: {
          id: locationId,
          customerId
        }
      })

      if (!location) {
        return {
          success: false,
          error: 'Location not found'
        }
      }

      // Update location
      const updated = await prisma.customerLocation.update({
        where: { id: locationId },
        data: {
          address: address ?? undefined,
          label: label !== undefined ? label : undefined,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        location: {
          id: updated.id,
          address: updated.address,
          label: updated.label,
          isPrimary: updated.isPrimary
        },
        message: 'Location updated successfully'
      }
    },
    {
      params: t.Object({
        customerId: t.String(),
        locationId: t.String()
      }),
      body: t.Object({
        address: t.Optional(t.String()),
        label: t.Optional(t.Union([t.String(), t.Null()]))
      })
    }
  )

  /**
   * PATCH /api/customers/:customerId/locations/:locationId/primary
   * Set location as primary
   */
  .patch(
    '/:locationId/primary',
    async ({ params }) => {
      const { customerId, locationId } = params

      // Verify location belongs to customer
      const location = await prisma.customerLocation.findFirst({
        where: {
          id: locationId,
          customerId
        }
      })

      if (!location) {
        return {
          success: false,
          error: 'Location not found'
        }
      }

      // Unset other primary locations
      await prisma.$executeRaw`
        UPDATE customer_locations
        SET "isPrimary" = false
        WHERE "customerId" = ${customerId}
        AND "isPrimary" = true
      `

      // Set this location as primary
      const updated = await prisma.customerLocation.update({
        where: { id: locationId },
        data: { isPrimary: true }
      })

      return {
        success: true,
        location: {
          id: updated.id,
          address: updated.address,
          label: updated.label,
          isPrimary: updated.isPrimary
        },
        message: 'Primary location updated'
      }
    },
    {
      params: t.Object({
        customerId: t.String(),
        locationId: t.String()
      })
    }
  )

  /**
   * DELETE /api/customers/:customerId/locations/:locationId
   * Delete a location
   */
  .delete(
    '/:locationId',
    async ({ params }) => {
      const { customerId, locationId } = params

      // Verify location belongs to customer
      const location = await prisma.customerLocation.findFirst({
        where: {
          id: locationId,
          customerId
        }
      })

      if (!location) {
        return {
          success: false,
          error: 'Location not found'
        }
      }

      // Check if location is being used by any orders
      const ordersCount = await prisma.order.count({
        where: { customerLocationId: locationId }
      })

      if (ordersCount > 0) {
        return {
          success: false,
          error: `Cannot delete location - it's used by ${ordersCount} order(s)`
        }
      }

      // Delete the location
      await prisma.customerLocation.delete({
        where: { id: locationId }
      })

      // If deleted location was primary, set another as primary
      if (location.isPrimary) {
        const nextLocation = await prisma.customerLocation.findFirst({
          where: { customerId },
          orderBy: { lastUsedAt: 'desc' }
        })

        if (nextLocation) {
          await prisma.customerLocation.update({
            where: { id: nextLocation.id },
            data: { isPrimary: true }
          })
        }
      }

      return {
        success: true,
        message: 'Location deleted successfully'
      }
    },
    {
      params: t.Object({
        customerId: t.String(),
        locationId: t.String()
      })
    }
  )
