import { Elysia } from 'elysia'
import { isRestaurantOpen } from './hours-validation'
import { validateCustomerStatus } from './customer-validation'
import type { ValidationResponse, RestaurantStatus, CustomerStatusValidation } from './types'

export const businessValidation = new Elysia({ prefix: '/api/business' })
  /**
   * GET /api/business/status
   * Check if restaurant is currently open
   */
  .get('/status', async (): Promise<ValidationResponse<RestaurantStatus>> => {
    try {
      const status = await isRestaurantOpen()
      return {
        success: true,
        data: status
      }
    } catch (error) {
      console.error('Error checking restaurant status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check restaurant status'
      }
    }
  })

  /**
   * GET /api/business/customer/:customerId/status
   * Validate customer account status
   */
  .get('/customer/:customerId/status', async ({ params }): Promise<ValidationResponse<CustomerStatusValidation>> => {
    try {
      const { customerId } = params
      const validation = await validateCustomerStatus(customerId)
      return {
        success: true,
        data: validation
      }
    } catch (error) {
      console.error('Error validating customer status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate customer status'
      }
    }
  })
