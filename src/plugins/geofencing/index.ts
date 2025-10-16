import { Elysia, t } from 'elysia'
import { validateDeliveryZone } from './zone-validation'

export const geofencingPlugin = new Elysia({ prefix: '/api/geofencing' })
  
  // Validate if location is within delivery zone
  .post(
    '/validate-delivery-zone',
    async ({ body, set }) => {
      try {
        const { latitude, longitude } = body

        // Validate coordinates
        if (latitude < -90 || latitude > 90) {
          set.status = 400
          return {
            success: false,
            isValid: false,
            withinDeliveryZone: false,
            data: {
              reason: 'INVALID_COORDINATES',
              message: 'Invalid latitude. Must be between -90 and 90.',
              city: null,
              zone: null
            }
          }
        }

        if (longitude < -180 || longitude > 180) {
          set.status = 400
          return {
            success: false,
            isValid: false,
            withinDeliveryZone: false,
            data: {
              reason: 'INVALID_COORDINATES',
              message: 'Invalid longitude. Must be between -180 and 180.',
              city: null,
              zone: null
            }
          }
        }

        // Validate delivery zone
        const validation = await validateDeliveryZone(latitude, longitude)

        return {
          success: true,
          isValid: validation.isValid,
          withinDeliveryZone: validation.withinDeliveryZone,
          data: {
            reason: validation.reason,
            message: validation.message,
            city: validation.city,
            zone: validation.zone
          }
        }
      } catch (error) {
        console.error('Delivery zone validation error:', error)
        set.status = 500
        return {
          success: false,
          isValid: false,
          withinDeliveryZone: false,
          data: {
            reason: 'SERVER_ERROR',
            message: 'Unable to validate your location. Please try again.',
            city: null,
            zone: null
          }
        }
      }
    },
    {
      body: t.Object({
        latitude: t.Number(),
        longitude: t.Number()
      }),
      detail: {
        summary: 'Validate Delivery Zone',
        description: 'Check if a location is within an active delivery zone. Returns city and zone information if valid.',
        tags: ['Geofencing']
      }
    }
  )
