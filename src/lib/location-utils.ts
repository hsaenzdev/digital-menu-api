/**
 * Location Utilities
 * 
 * Provides functions for geospatial operations using PostGIS:
 * - Distance calculation between coordinates
 * - Proximity search for existing locations
 * - Location matching within threshold
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default proximity threshold: 10 meters (allows for GPS variance while preventing duplicates)
export const PROXIMITY_THRESHOLD_METERS = 5

/**
 * Find customer locations within proximity threshold of given coordinates
 * 
 * @param customerId - Customer ID to search locations for
 * @param latitude - Latitude of the point to search from
 * @param longitude - Longitude of the point to search from
 * @param thresholdMeters - Maximum distance in meters (default: 50m)
 * @returns Array of matching locations with distance
 */
export async function findNearbyLocations(
  customerId: string,
  latitude: number,
  longitude: number,
  thresholdMeters: number = PROXIMITY_THRESHOLD_METERS
) {
  // Use PostGIS ST_Distance to find locations within threshold
  // ST_Distance returns distance in meters when using geography type
  const locations = await prisma.$queryRaw<Array<{
    id: string
    address: string
    label: string | null
    isPrimary: boolean
    lastUsedAt: Date
    distance: number
  }>>`
    SELECT 
      id,
      address,
      label,
      "isPrimary",
      "lastUsedAt",
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      ) as distance
    FROM customer_locations
    WHERE "customerId" = ${customerId}
    AND ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      ${thresholdMeters}
    )
    ORDER BY distance ASC
  `

  return locations
}

/**
 * Find the closest existing location for a customer, if within threshold
 * 
 * @param customerId - Customer ID
 * @param latitude - Latitude to search from
 * @param longitude - Longitude to search from
 * @param thresholdMeters - Maximum distance in meters
 * @returns Closest location or null if none within threshold
 */
export async function findClosestLocation(
  customerId: string,
  latitude: number,
  longitude: number,
  thresholdMeters: number = PROXIMITY_THRESHOLD_METERS
) {
  const locations = await findNearbyLocations(customerId, latitude, longitude, thresholdMeters)
  return locations.length > 0 ? locations[0] : null
}

/**
 * Create a new customer location with PostGIS point
 * 
 * @param customerId - Customer ID
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @param address - Human-readable address
 * @param label - Optional label (e.g., "Home", "Work")
 * @param isPrimary - Whether this is the customer's primary location
 * @returns Created customer location
 */
export async function createCustomerLocation(
  customerId: string,
  latitude: number,
  longitude: number,
  address: string,
  label?: string | null,
  isPrimary: boolean = false
) {
  // If this is set as primary, unset other primary locations for this customer
  if (isPrimary) {
    await prisma.$executeRaw`
      UPDATE customer_locations
      SET "isPrimary" = false
      WHERE "customerId" = ${customerId}
      AND "isPrimary" = true
    `
  }

  // Create the new location using raw SQL for PostGIS geometry
  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO customer_locations (
      id,
      "customerId",
      location,
      address,
      label,
      "isPrimary",
      "createdAt",
      "updatedAt",
      "lastUsedAt"
    )
    VALUES (
      gen_random_uuid()::text,
      ${customerId}::text,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
      ${address}::text,
      ${label || null},
      ${isPrimary},
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id
  `

  const locationId = result[0].id

  // Fetch and return the complete location
  const location = await prisma.customerLocation.findUnique({
    where: { id: locationId }
  })

  return location
}

/**
 * Update the lastUsedAt timestamp for a location
 * 
 * @param locationId - Location ID to update
 */
export async function updateLocationUsage(locationId: string) {
  await prisma.customerLocation.update({
    where: { id: locationId },
    data: { lastUsedAt: new Date() }
  })
}

/**
 * Get customer's primary location
 * 
 * @param customerId - Customer ID
 * @returns Primary location or null if none set
 */
export async function getPrimaryLocation(customerId: string) {
  return await prisma.customerLocation.findFirst({
    where: {
      customerId,
      isPrimary: true
    }
  })
}

/**
 * Get all locations for a customer, ordered by most recently used
 * 
 * @param customerId - Customer ID
 * @returns Array of customer locations
 */
export async function getCustomerLocations(customerId: string) {
  return await prisma.customerLocation.findMany({
    where: { customerId },
    orderBy: [
      { isPrimary: 'desc' },  // Primary first
      { lastUsedAt: 'desc' }  // Then by most recently used
    ]
  })
}

/**
 * Calculate distance between two points in meters
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export async function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ distance: number }>>`
    SELECT ST_Distance(
      ST_SetSRID(ST_MakePoint(${lon1}, ${lat1}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lon2}, ${lat2}), 4326)::geography
    ) as distance
  `

  return result[0].distance
}
