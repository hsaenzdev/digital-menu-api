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

export interface ZoneInfo {
  id: string
  name: string
  description: string | null
}

export interface ZoneValidationResult {
  isValid: boolean
  withinDeliveryZone: boolean
  reason: 'WITHIN_DELIVERY_ZONE' | 'OUTSIDE_DELIVERY_ZONE' | 'OUTSIDE_CITY'
  message: string
  city: {
    id: string
    name: string
    country: string
    state: string | null
  } | null
  zone: ZoneInfo | null
}
