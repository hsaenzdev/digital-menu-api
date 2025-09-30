import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const customerPlugin = new Elysia({ prefix: '/api/customers' })
  
  // Create or update customer
  .post('/', async ({ body }) => {
    try {
      const customerData = body as any

      // Check if customer exists by phone
      const existingCustomer = await prisma.customer.findUnique({
        where: { phoneNumber: customerData.phoneNumber }
      })

      let customer
      if (existingCustomer) {
        // Update existing customer
        customer = await prisma.customer.update({
          where: { phoneNumber: customerData.phoneNumber },
          data: {
            name: customerData.name,
            email: customerData.email,
            defaultAddress: customerData.defaultAddress,
            defaultLocation: customerData.defaultLocation,
          }
        })
      } else {
        // Create new customer
        customer = await prisma.customer.create({
          data: {
            phoneNumber: customerData.phoneNumber,
            name: customerData.name,
            email: customerData.email,
            defaultAddress: customerData.defaultAddress,
            defaultLocation: customerData.defaultLocation,
          }
        })
      }

      return {
        success: true,
        data: customer,
        message: existingCustomer ? 'Customer updated' : 'Customer created'
      }
    } catch (error) {
      console.error('Error creating/updating customer:', error)
      return {
        success: false,
        error: 'Failed to create/update customer'
      }
    }
  })

  // Get customer by phone number
  .get('/phone/:phone', async ({ params: { phone } }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { phoneNumber: phone }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      return {
        success: false,
        error: 'Failed to fetch customer'
      }
    }
  })

  // Get customer by ID
  .get('/:customerId', async ({ params: { customerId } }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found'
        }
      }

      return {
        success: true,
        data: customer
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      return {
        success: false,
        error: 'Failed to fetch customer'
      }
    }
  })

  // Update customer
  .patch('/:customerId', async ({ params: { customerId }, body }) => {
    try {
      const updateData = body as any

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: updateData
      })

      return {
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      return {
        success: false,
        error: 'Failed to update customer'
      }
    }
  })

  // Get customer orders
  .get('/:customerId/orders', async ({ params: { customerId } }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found'
        }
      }

      const orders = await prisma.order.findMany({
        where: { customerPhone: customer.phoneNumber },
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        data: orders
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return {
        success: false,
        error: 'Failed to fetch customer orders'
      }
    }
  })