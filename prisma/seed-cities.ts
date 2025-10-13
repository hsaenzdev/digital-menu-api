import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import type { GeoJSONFeatureCollection } from '../src/plugins/geofencing/types'

const prisma = new PrismaClient()

/**
 * Converts GeoJSON coordinates to WKT (Well-Known Text) format for PostGIS
 * Handles both Polygon and MultiPolygon geometries
 */
function geojsonToWKT(geometry: any): string {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates.map((ring: number[][]) => {
      const points = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
      return `(${points})`
    }).join(', ')
    return `POLYGON(${rings})`
  } else if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates.map((polygon: number[][][]) => {
      const rings = polygon.map((ring: number[][]) => {
        const points = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
        return `(${points})`
      }).join(', ')
      return `(${rings})`
    }).join(', ')
    return `MULTIPOLYGON(${polygons})`
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`)
}

/**
 * Calculate center point of a polygon (simple average of coordinates)
 */
function calculateCentroid(coordinates: number[][][]): { lon: number; lat: number } {
  let totalLon = 0
  let totalLat = 0
  let count = 0

  // Use outer ring only (first ring)
  const outerRing = coordinates[0]
  
  for (const coord of outerRing) {
    totalLon += coord[0]
    totalLat += coord[1]
    count++
  }

  return {
    lon: totalLon / count,
    lat: totalLat / count
  }
}

async function seedCities() {
  console.log('🌍 Seeding city geofence data...')

  try {
    // Read the Nuevo Laredo GeoJSON file
    const geojsonPath = path.join(__dirname, '..', 'data', 'cities', 'nuevo-laredo.geojson')
    const geojsonData = fs.readFileSync(geojsonPath, 'utf-8')
    const geojson: GeoJSONFeatureCollection = JSON.parse(geojsonData)

    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('No features found in GeoJSON file')
    }

    const feature = geojson.features[0]
    const geometry = feature.geometry

    // Convert Polygon to MultiPolygon (PostGIS best practice for city boundaries)
    let multiPolygonWKT: string
    let centroid: { lon: number; lat: number }

    if (geometry.type === 'Polygon') {
      // Wrap single polygon in multipolygon
      const polygonCoords = geometry.coordinates as number[][][]
      const rings = polygonCoords.map((ring: number[][]) => {
        const points = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
        return `(${points})`
      }).join(', ')
      multiPolygonWKT = `MULTIPOLYGON((${rings}))`
      centroid = calculateCentroid(polygonCoords)
    } else {
      multiPolygonWKT = geojsonToWKT(geometry)
      const multiPolygonCoords = geometry.coordinates as number[][][][]
      centroid = calculateCentroid(multiPolygonCoords[0])
    }

    console.log(`📍 Calculated centroid: ${centroid.lat}, ${centroid.lon}`)

    // Check if Nuevo Laredo already exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM cities WHERE name = 'Nuevo Laredo'
    `

    if (existing && existing.length > 0) {
      console.log('⚠️  Nuevo Laredo already exists, updating...')
      
      // Update existing city
      await prisma.$executeRawUnsafe(`
        UPDATE cities
        SET 
          boundary = ST_GeomFromText('${multiPolygonWKT}', 4326),
          "centerPoint" = ST_SetSRID(ST_MakePoint(${centroid.lon}, ${centroid.lat}), 4326),
          country = 'Mexico',
          state = 'Tamaulipas',
          timezone = 'America/Mexico_City',
          "isActive" = true,
          "updatedAt" = NOW()
        WHERE name = 'Nuevo Laredo'
      `)
      
      console.log('✅ Nuevo Laredo city boundary updated successfully!')
    } else {
      // Insert new city
      await prisma.$executeRawUnsafe(`
        INSERT INTO cities (id, name, country, state, boundary, "centerPoint", timezone, "isActive", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          'Nuevo Laredo',
          'Mexico',
          'Tamaulipas',
          ST_GeomFromText('${multiPolygonWKT}', 4326),
          ST_SetSRID(ST_MakePoint(${centroid.lon}, ${centroid.lat}), 4326),
          'America/Mexico_City',
          true,
          NOW(),
          NOW()
        )
      `)
      
      console.log('✅ Nuevo Laredo city boundary created successfully!')
    }

    // Verify the data
    const result = await prisma.$queryRaw<Array<{
      name: string
      country: string
      state: string
      isActive: boolean
    }>>`
      SELECT name, country, state, "isActive"
      FROM cities
      WHERE name = 'Nuevo Laredo'
    `

    if (result && result.length > 0) {
      console.log('📊 City details:', result[0])
    }

  } catch (error) {
    console.error('❌ Error seeding city data:', error)
    throw error
  }
}

async function main() {
  try {
    await seedCities()
    console.log('🎉 City geofence seeding completed!')
  } catch (error) {
    console.error('Failed to seed cities:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
