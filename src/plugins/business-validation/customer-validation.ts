import { prisma } from '../../lib/prisma'
import type { CustomerStatusValidation } from './types'

/**
 * Validate customer status and check if they can place orders
 */
export async function validateCustomerStatus(customerId: string): Promise<CustomerStatusValidation> {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId
      },
      select: {
        id: true,
        isActive: true,
        name: true
      }
    })

    if (!customer) {
      return {
        isActive: false,
        canOrder: false,
        message: 'Customer account not found. Please contact support.'
      }
    }

    if (!customer.isActive) {
      return {
        isActive: false,
        canOrder: false,
        message: 'Your account has been suspended. Please contact our support team for assistance.'
      }
    }

    return {
      isActive: true,
      canOrder: true,
      message: 'Account is active and in good standing.'
    }

  } catch (error) {
    console.error('Error validating customer status:', error)
    throw error
  }
}
