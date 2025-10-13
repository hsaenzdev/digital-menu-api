import { Elysia, t } from 'elysia'
import { validateCityGeofence, getActiveCities } from './city-validation'
import type { ValidationResult } from './types'

export const geofencingPlugin = new Elysia({ prefix: '/api/geofencing' })
  
  // Validate if location is within service area
  .post(
    '/validate-location',
    async ({ body, set }) => {
      try {
        const { latitude, longitude } = body

        // Validate coordinates
        if (latitude < -90 || latitude > 90) {
          set.status = 400
          return {
            success: false,
            isValid: false,
            data: {
              withinServiceArea: false,
              message: 'Invalid latitude. Must be between -90 and 90.'
            }
          }
        }

        if (longitude < -180 || longitude > 180) {
          set.status = 400
          return {
            success: false,
            isValid: false,
            data: {
              withinServiceArea: false,
              message: 'Invalid longitude. Must be between -180 and 180.'
            }
          }
        }

        // Validate city geofence
        const validation = await validateCityGeofence(latitude, longitude)

        if (validation.isValid && validation.city) {
          return {
            success: true,
            isValid: true,
            data: {
              withinServiceArea: true,
              city: validation.city,
              message: `Great! We deliver to ${validation.city.name}.`
            }
          } as ValidationResult
        } else {
          return {
            success: true,
            isValid: false,
            data: {
              withinServiceArea: false,
              message: "Sorry, we don't deliver to your area yet. We're working on expanding our service!"
            }
          } as ValidationResult
        }
      } catch (error) {
        console.error('Validation error:', error)
        set.status = 500
        return {
          success: false,
          isValid: false,
          data: {
            withinServiceArea: false,
            message: 'Unable to validate your location. Please try again.'
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
        summary: 'Validate Location',
        description: 'Check if a location is within the service area (city boundaries)',
        tags: ['Geofencing']
      }
    }
  )

  // Get all active cities
  .get(
    '/cities',
    async ({ set }) => {
      try {
        const cities = await getActiveCities()
        
        return {
          success: true,
          data: cities
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
        set.status = 500
        return {
          success: false,
          error: 'Failed to fetch cities'
        }
      }
    },
    {
      detail: {
        summary: 'Get Active Cities',
        description: 'Get list of all cities where service is available',
        tags: ['Geofencing']
      }
    }
  )
