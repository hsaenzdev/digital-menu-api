export interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  open: string // "HH:MM" format
  close: string // "HH:MM" format
  closed: boolean
}

export interface SpecialHours {
  date: string // "YYYY-MM-DD" format
  open?: string // "HH:MM" format
  close?: string // "HH:MM" format
  closed: boolean
  reason?: string // e.g., "Christmas", "New Year"
}

export interface RestaurantStatus {
  isOpen: boolean
  currentStatus: 'open' | 'closed' | 'opening_soon' | 'closing_soon'
  message: string
  todayHours: {
    open: string
    close: string
    closed: boolean
  } | null
  nextOpening: {
    day: string
    date: string
    time: string
    hoursUntil: number
    minutesUntil: number
  } | null
  specialHoursToday: SpecialHours | null
}

export interface CustomerStatusValidation {
  isActive: boolean
  canOrder: boolean
  message: string
}

export interface ValidationResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
