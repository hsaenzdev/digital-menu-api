/**
 * Convert GeoJSON Polygon to WKT format
 */
export function convertPolygonToWKT(geometry: any): string {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates.map((ring: number[][]) => {
      const points = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
      return `(${points})`
    }).join(', ')
    return `POLYGON(${rings})`
  }
  
  throw new Error(`Unsupported geometry type: ${geometry.type}`)
}

/**
 * Convert GeoJSON Polygon to MultiPolygon WKT format
 */
export function convertPolygonToMultiPolygonWKT(geometry: any): string {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates.map((ring: number[][]) => {
      const points = ring.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')
      return `(${points})`
    }).join(', ')
    return `MULTIPOLYGON((${rings}))`
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
 * Calculate centroid of a polygon
 */
export function calculateCentroid(coordinates: number[][][]): { lon: number; lat: number } {
  let totalLon = 0
  let totalLat = 0
  let count = 0

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
