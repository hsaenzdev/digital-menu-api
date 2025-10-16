import { prisma } from '../../lib/prisma'
import type { BusinessHours, DayHours, SpecialHours, RestaurantStatus } from './types'

/**
 * Get current day name in lowercase
 */
function getCurrentDay(): keyof BusinessHours {
  const days: Array<keyof BusinessHours> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const now = new Date()
  return days[now.getDay()]
}

/**
 * Get current time in HH:MM format
 */
function getCurrentTime(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Check if current time is within open hours
 */
function isTimeWithinHours(currentTime: string, openTime: string, closeTime: string): boolean {
  const current = timeToMinutes(currentTime)
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (close < open) {
    return current >= open || current < close
  }

  return current >= open && current < close
}

/**
 * Check if opening soon (within 1 hour)
 */
function isOpeningSoon(currentTime: string, openTime: string): boolean {
  const current = timeToMinutes(currentTime)
  const open = timeToMinutes(openTime)
  const diff = open - current

  return diff > 0 && diff <= 60
}

/**
 * Check if closing soon (within 30 minutes)
 */
function isClosingSoon(currentTime: string, closeTime: string): boolean {
  const current = timeToMinutes(currentTime)
  const close = timeToMinutes(closeTime)
  const diff = close - current

  return diff > 0 && diff <= 30
}

/**
 * Get next opening time
 */
function getNextOpeningTime(businessHours: BusinessHours, specialHours: SpecialHours[]): RestaurantStatus['nextOpening'] {
  const days: Array<keyof BusinessHours> = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const now = new Date()
  const currentDay = now.getDay()

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(now)
    checkDate.setDate(checkDate.getDate() + i)
    checkDate.setHours(0, 0, 0, 0)

    const dayIndex = checkDate.getDay()
    const dayName = days[dayIndex]
    const dateString = checkDate.toISOString().split('T')[0]

    // Check if there's a special hours for this date
    const specialDay = specialHours.find(sh => sh.date === dateString)
    
    if (specialDay) {
      if (!specialDay.closed && specialDay.open) {
        const openingDateTime = new Date(checkDate)
        const [hours, minutes] = specialDay.open.split(':').map(Number)
        openingDateTime.setHours(hours, minutes, 0, 0)

        const hoursUntil = Math.floor((openingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60))
        const minutesUntil = Math.floor((openingDateTime.getTime() - now.getTime()) / (1000 * 60)) % 60

        return {
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          date: dateString,
          time: specialDay.open,
          hoursUntil,
          minutesUntil
        }
      }
    } else {
      const dayHours = businessHours[dayName]
      if (!dayHours.closed) {
        const openingDateTime = new Date(checkDate)
        const [hours, minutes] = dayHours.open.split(':').map(Number)
        openingDateTime.setHours(hours, minutes, 0, 0)

        const hoursUntil = Math.floor((openingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60))
        const minutesUntil = Math.floor((openingDateTime.getTime() - now.getTime()) / (1000 * 60)) % 60

        return {
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          date: dateString,
          time: dayHours.open,
          hoursUntil,
          minutesUntil
        }
      }
    }
  }

  return null
}

/**
 * Validate if restaurant is currently open
 */
export async function isRestaurantOpen(): Promise<RestaurantStatus> {
  try {
    const settings = await prisma.settings.findFirst()

    if (!settings) {
      throw new Error('Settings not found')
    }

    const businessHours = settings.businessHours as unknown as BusinessHours
    const specialHours = (settings.specialHours as unknown as SpecialHours[]) || []
    
    const currentDay = getCurrentDay()
    const currentTime = getCurrentTime()
    const currentDate = getCurrentDate()

    // Check for special hours today
    const specialToday = specialHours.find(sh => sh.date === currentDate)

    if (specialToday) {
      // Special hours override regular hours
      if (specialToday.closed) {
        const nextOpening = getNextOpeningTime(businessHours, specialHours)
        return {
          isOpen: false,
          currentStatus: 'closed',
          message: specialToday.reason 
            ? `We're closed today for ${specialToday.reason}.`
            : "We're closed today for a special occasion.",
          todayHours: {
            open: '',
            close: '',
            closed: true
          },
          nextOpening,
          specialHoursToday: specialToday
        }
      }

      if (specialToday.open && specialToday.close) {
        const isOpen = isTimeWithinHours(currentTime, specialToday.open, specialToday.close)
        const openingSoon = !isOpen && isOpeningSoon(currentTime, specialToday.open)
        const closingSoon = isOpen && isClosingSoon(currentTime, specialToday.close)

        if (isOpen) {
          return {
            isOpen: true,
            currentStatus: closingSoon ? 'closing_soon' : 'open',
            message: closingSoon 
              ? `We're closing soon at ${specialToday.close}. Hurry up!`
              : `We're open! ${specialToday.reason ? `Special hours for ${specialToday.reason}.` : ''}`,
            todayHours: {
              open: specialToday.open,
              close: specialToday.close,
              closed: false
            },
            nextOpening: null,
            specialHoursToday: specialToday
          }
        }

        if (openingSoon) {
          const openMinutes = timeToMinutes(specialToday.open) - timeToMinutes(currentTime)
          return {
            isOpen: false,
            currentStatus: 'opening_soon',
            message: `Opening soon at ${specialToday.open}! (in ${openMinutes} minutes)`,
            todayHours: {
              open: specialToday.open,
              close: specialToday.close,
              closed: false
            },
            nextOpening: null,
            specialHoursToday: specialToday
          }
        }

        const nextOpening = getNextOpeningTime(businessHours, specialHours)
        return {
          isOpen: false,
          currentStatus: 'closed',
          message: "We're currently closed. Come back later!",
          todayHours: {
            open: specialToday.open,
            close: specialToday.close,
            closed: false
          },
          nextOpening,
          specialHoursToday: specialToday
        }
      }
    }

    // Regular business hours
    const todayHours = businessHours[currentDay]

    if (todayHours.closed) {
      const nextOpening = getNextOpeningTime(businessHours, specialHours)
      return {
        isOpen: false,
        currentStatus: 'closed',
        message: "We're closed today. See you tomorrow!",
        todayHours: {
          open: '',
          close: '',
          closed: true
        },
        nextOpening,
        specialHoursToday: null
      }
    }

    const isOpen = isTimeWithinHours(currentTime, todayHours.open, todayHours.close)
    const openingSoon = !isOpen && isOpeningSoon(currentTime, todayHours.open)
    const closingSoon = isOpen && isClosingSoon(currentTime, todayHours.close)

    if (isOpen) {
      return {
        isOpen: true,
        currentStatus: closingSoon ? 'closing_soon' : 'open',
        message: closingSoon 
          ? `We're closing soon at ${todayHours.close}. Order now!`
          : "We're open and ready to serve you!",
        todayHours: {
          open: todayHours.open,
          close: todayHours.close,
          closed: false
        },
        nextOpening: null,
        specialHoursToday: null
      }
    }

    if (openingSoon) {
      const openMinutes = timeToMinutes(todayHours.open) - timeToMinutes(currentTime)
      return {
        isOpen: false,
        currentStatus: 'opening_soon',
        message: `Opening soon at ${todayHours.open}! (in ${openMinutes} minutes)`,
        todayHours: {
          open: todayHours.open,
          close: todayHours.close,
          closed: false
        },
        nextOpening: null,
        specialHoursToday: null
      }
    }

    const nextOpening = getNextOpeningTime(businessHours, specialHours)
    return {
      isOpen: false,
      currentStatus: 'closed',
      message: "We're currently closed. Come back during our business hours!",
      todayHours: {
        open: todayHours.open,
        close: todayHours.close,
        closed: false
      },
      nextOpening,
      specialHoursToday: null
    }

  } catch (error) {
    console.error('Error checking restaurant status:', error)
    throw error
  }
}

/**
 * Get business hours for the week
 */
export async function getBusinessHours(): Promise<BusinessHours> {
  try {
    const settings = await prisma.settings.findFirst()

    if (!settings) {
      throw new Error('Settings not found')
    }

    return settings.businessHours as unknown as BusinessHours
  } catch (error) {
    console.error('Error fetching business hours:', error)
    throw error
  }
}
