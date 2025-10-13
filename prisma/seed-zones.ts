import { PrismaClient } from '@prisma/client'
import path from 'path'
import { 
  getCityFolders, 
  getGeoJSONFiles, 
  readGeoJSON, 
  getZoneName, 
  formatCityName 
} from './utils/geojson-reader'
import { convertPolygonToWKT } from './utils/geometry-converter'

const prisma = new PrismaClient()

async function seedZones() {
  console.log('🗺️  Seeding delivery zones...\n')
  
  const citiesDir = path.join(__dirname, '..', 'data', 'cities')
  const cityFolders = getCityFolders(citiesDir)
  
  if (cityFolders.length === 0) {
    console.log('⚠️  No city folders found')
    return
  }
  
  let totalAdded = 0
  let totalUpdated = 0
  let totalRemoved = 0
  let totalSkipped = 0
  
  for (const cityFolderName of cityFolders) {
    console.log(`📦 Processing zones for: ${cityFolderName}`)
    
    // Get city from database
    const cityName = formatCityName(cityFolderName)
    const city = await prisma.city.findUnique({
      where: { name: cityName }
    })
    
    if (!city) {
      console.log(`   ⚠️  City not found in database: ${cityName}`)
      console.log(`   💡 Run: bun prisma/seed-cities.ts first\n`)
      continue
    }
    
    console.log(`   ✅ City found: ${cityName} (${city.id})`)
    
    // Get all zone files for this city
    const cityZonesDir = path.join(citiesDir, cityFolderName)
    const zoneFiles = getGeoJSONFiles(cityZonesDir)
    
    if (zoneFiles.length === 0) {
      console.log(`   ⚠️  No zone files found\n`)
      continue
    }
    
    console.log(`   📂 Found ${zoneFiles.length} zone file(s)`)
    
    // Get existing zones from database
    const existingZones = await prisma.deliveryZone.findMany({
      where: { cityId: city.id }
    })
    
    const existingZoneNames = existingZones.map(z => z.name)
    const fileZoneNames = zoneFiles.map(f => getZoneName(f))
    
    // Process each zone file
    for (const file of zoneFiles) {
      const zoneName = getZoneName(file)
      const filePath = path.join(cityZonesDir, file)
      
      try {
        // Read and parse GeoJSON
        const geojson = readGeoJSON(filePath)
        
        if (!geojson.features || geojson.features.length === 0) {
          console.log(`   ❌ ${zoneName}: No features found`)
          totalSkipped++
          continue
        }
        
        const geometry = geojson.features[0].geometry
        
        if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
          console.log(`   ❌ ${zoneName}: Invalid geometry`)
          totalSkipped++
          continue
        }
        
        // Convert to WKT
        const wkt = convertPolygonToWKT(geometry)
        
        // Check if zone exists
        const existingZone = existingZones.find(z => z.name === zoneName)
        
        if (existingZone) {
          // Update existing zone
          await prisma.$executeRawUnsafe(`
            UPDATE delivery_zones
            SET 
              boundary = ST_GeomFromText('${wkt}', 4326),
              "updatedAt" = NOW()
            WHERE id = '${existingZone.id}'
          `)
          console.log(`   🔄 ${zoneName} (updated)`)
          totalUpdated++
        } else {
          // Insert new zone
          await prisma.$executeRawUnsafe(`
            INSERT INTO delivery_zones (id, "cityId", name, boundary, "isActive", "createdAt", "updatedAt")
            VALUES (
              gen_random_uuid(),
              '${city.id}',
              '${zoneName}',
              ST_GeomFromText('${wkt}', 4326),
              true,
              NOW(),
              NOW()
            )
          `)
          console.log(`   ➕ ${zoneName} (added)`)
          totalAdded++
        }
        
      } catch (error) {
        console.error(`   ❌ ${zoneName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        totalSkipped++
      }
    }
    
    // Remove orphaned zones (in DB but not in files)
    const orphanedZones = existingZones.filter(z => !fileZoneNames.includes(z.name))
    
    for (const zone of orphanedZones) {
      await prisma.deliveryZone.delete({
        where: { id: zone.id }
      })
      console.log(`   ➖ ${zone.name} (removed - not in files)`)
      totalRemoved++
    }
    
    console.log('')
  }
  
  // Summary
  console.log('📊 Summary:')
  console.log(`   Zones added: ${totalAdded}`)
  console.log(`   Zones updated: ${totalUpdated}`)
  console.log(`   Zones removed: ${totalRemoved}`)
  console.log(`   Zones skipped: ${totalSkipped}`)
  console.log('\n🎉 Zone seeding complete!')
}

async function main() {
  try {
    await seedZones()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
