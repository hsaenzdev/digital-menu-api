import fs from 'fs'

export interface GeoJSONFeatureCollection {
  type: string
  features: Array<{
    type: string
    properties: Record<string, any>
    geometry: {
      type: string
      coordinates: number[][][] | number[][][][]
    }
  }>
}

/**
 * Read and parse a GeoJSON file
 */
export function readGeoJSON(filePath: string): GeoJSONFeatureCollection {
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

/**
 * Get all .geojson files in a directory
 */
export function getGeoJSONFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }
  
  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.geojson'))
}

/**
 * Get all city folders (folders with .geojson files inside)
 */
export function getCityFolders(citiesDir: string): string[] {
  return fs.readdirSync(citiesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
}

/**
 * Get zone name from filename
 * Example: casa-mirador.geojson → casa-mirador
 */
export function getZoneName(filename: string): string {
  return filename.replace('.geojson', '')
}

/**
 * Format zone name for display
 * Example: casa-mirador → Casa Mirador
 */
export function formatZoneName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format city name from folder name
 * Example: nuevo-laredo → Nuevo Laredo
 */
export function formatCityName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
