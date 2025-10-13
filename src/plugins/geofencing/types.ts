export interface CityInfo {
  id: string
  name: string
  country: string
  state?: string
}

export interface ValidationResult {
  success: boolean
  isValid: boolean
  data: {
    withinServiceArea: boolean
    city?: CityInfo
    message: string
  }
}

export interface GeoJSONFeature {
  type: string
  properties: Record<string, any>
  geometry: {
    type: string
    coordinates: number[][][] | number[][][][]
  }
}

export interface GeoJSONFeatureCollection {
  type: string
  features: GeoJSONFeature[]
}
