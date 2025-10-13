import { prisma } from '../../lib/prisma'
import type { CityInfo } from './types'

/**
 * Validates if a given coordinate point is within any active city boundary
 * Uses PostGIS ST_Contains function for accurate polygon-based geofencing
 */
export async function validateCityGeofence(
  latitude: number,
  longitude: number
): Promise<{ isValid: boolean; city?: CityInfo }> {
  try {
    // Query using PostGIS ST_Contains to check if point is within city boundary
    // Note: PostGIS uses (longitude, latitude) order, SRID 4326 is WGS84
    const result = await prisma.$queryRaw<Array<{
      id: string
      name: string
      country: string
      state: string | null
    }>>`
      SELECT id, name, country, state
      FROM cities
      WHERE ST_Contains(
        boundary,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      AND "isActive" = true
      LIMIT 1
    `

    if (result && result.length > 0) {
      const city = result[0]
      return {
        isValid: true,
        city: {
          id: city.id,
          name: city.name,
          country: city.country,
          state: city.state || undefined
        }
      }
    }

    return { isValid: false }
  } catch (error) {
    console.error('City geofence validation error:', error)
    throw new Error('Failed to validate location')
  }
}

/**
 * Get all active cities
 */
export async function getActiveCities(): Promise<CityInfo[]> {
  try {
    const cities = await prisma.$queryRaw<Array<{
      id: string
      name: string
      country: string
      state: string | null
    }>>`
      SELECT id, name, country, state
      FROM cities
      WHERE "isActive" = true
      ORDER BY name ASC
    `

    return cities.map(city => ({
      id: city.id,
      name: city.name,
      country: city.country,
      state: city.state || undefined
    }))
  } catch (error) {
    console.error('Error fetching active cities:', error)
    throw new Error('Failed to fetch cities')
  }
}
