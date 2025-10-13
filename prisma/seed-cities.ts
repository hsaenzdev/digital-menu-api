import { PrismaClient } from '@prisma/client'
import path from 'path'
import { readGeoJSON, getGeoJSONFiles, formatCityName } from './utils/geojson-reader'
import { convertPolygonToMultiPolygonWKT, calculateCentroid } from './utils/geometry-converter'

const prisma = new PrismaClient()

async function seedCities() {
  console.log('🌍 Seeding city geofence data...')

  try {
    // Read the Nuevo Laredo GeoJSON file
    const geojsonPath = path.join(__dirname, '..', 'data', 'cities', 'nuevo-laredo.geojson')
    const geojson = readGeoJSON(geojsonPath)

    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('No features found in GeoJSON file')
    }

    const feature = geojson.features[0]
    const geometry = feature.geometry

    // Convert Polygon to MultiPolygon and calculate centroid
    const multiPolygonWKT = convertPolygonToMultiPolygonWKT(geometry)
    const polygonCoords = geometry.type === 'Polygon' 
      ? geometry.coordinates as number[][][]
      : (geometry.coordinates as number[][][][])[0]
    const centroid = calculateCentroid(polygonCoords)

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
