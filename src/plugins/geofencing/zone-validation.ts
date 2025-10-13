import { prisma } from '../../lib/prisma'
import type { ZoneInfo, ZoneValidationResult } from './types'

/**
 * Validates if a coordinate is within an active delivery zone of a city
 * First checks if the point is within the city boundary, then checks delivery zones
 */
export async function validateDeliveryZone(
  latitude: number,
  longitude: number
): Promise<ZoneValidationResult> {
  try {
    // First check if the point is within any active city
    const cityResult = await prisma.$queryRawUnsafe<Array<{
      id: string
      name: string
      country: string
      state: string | null
    }>>(
      `SELECT id, name, country, state 
       FROM cities 
       WHERE ST_Contains(boundary, ST_SetSRID(ST_Point($1, $2), 4326))
       AND "isActive" = true
       LIMIT 1`,
      longitude,
      latitude
    )

    if (!cityResult || cityResult.length === 0) {
      return {
        isValid: false,
        withinDeliveryZone: false,
        reason: 'OUTSIDE_CITY',
        message: 'Location is outside any active city boundary',
        city: null,
        zone: null
      }
    }

    const city = cityResult[0]

    // Now check if the point is within any active delivery zone of this city
    const zoneResult = await prisma.$queryRawUnsafe<Array<{
      id: string
      name: string
      description: string | null
      city_id: string
      city_name: string
      city_country: string
      city_state: string | null
    }>>(
      `SELECT 
         dz.id,
         dz.name,
         dz.description,
         c.id as city_id,
         c.name as city_name,
         c.country as city_country,
         c.state as city_state
       FROM delivery_zones dz
       JOIN cities c ON dz."cityId" = c.id
       WHERE dz."cityId" = $1
       AND dz."isActive" = true
       AND c."isActive" = true
       AND ST_Contains(dz.boundary, ST_SetSRID(ST_Point($2, $3), 4326))
       LIMIT 1`,
      city.id,
      longitude,
      latitude
    )

    if (!zoneResult || zoneResult.length === 0) {
      return {
        isValid: false,
        withinDeliveryZone: false,
        reason: 'OUTSIDE_DELIVERY_ZONE',
        message: 'Location is within city but outside any delivery zone',
        city: {
          id: city.id,
          name: city.name,
          country: city.country,
          state: city.state
        },
        zone: null
      }
    }

    const zone = zoneResult[0]

    return {
      isValid: true,
      withinDeliveryZone: true,
      reason: 'WITHIN_DELIVERY_ZONE',
      message: 'Location is within an active delivery zone',
      city: {
        id: zone.city_id,
        name: zone.city_name,
        country: zone.city_country,
        state: zone.city_state
      },
      zone: {
        id: zone.id,
        name: zone.name,
        description: zone.description
      }
    }

  } catch (error) {
    console.error('Error validating delivery zone:', error)
    throw error
  }
}

/**
 * Gets all active delivery zones for a specific city
 */
export async function getActiveZonesByCity(cityId: string): Promise<ZoneInfo[]> {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: {
        cityId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description
    }))
  } catch (error) {
    console.error('Error fetching zones by city:', error)
    throw error
  }
}

/**
 * Gets all active delivery zones across all cities
 */
export async function getAllActiveZones(): Promise<Array<ZoneInfo & { cityId: string, cityName: string }>> {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: {
        isActive: true,
        city: {
          isActive: true
        }
      },
      include: {
        city: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { city: { name: 'asc' } },
        { name: 'asc' }
      ]
    })

    return zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      description: zone.description,
      cityId: zone.city.id,
      cityName: zone.city.name
    }))
  } catch (error) {
    console.error('Error fetching all zones:', error)
    throw error
  }
}
