import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const customerPlugin = new Elysia({ prefix: '/api/customers' })
  
  // Get all customers
  .get('/', async () => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' }
      })

      // Get order counts for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const orderCount = await prisma.order.count({
            where: customer.platform === 'whatsapp'
              ? { customerPhone: customer.phoneNumber, platform: 'whatsapp' }
              : { messengerPsid: customer.messengerPsid, platform: 'messenger' }
          })

          const totalSpent = await prisma.order.aggregate({
            where: customer.platform === 'whatsapp'
              ? { customerPhone: customer.phoneNumber, platform: 'whatsapp' }
              : { messengerPsid: customer.messengerPsid, platform: 'messenger' },
            _sum: { total: true }
          })

          return {
            ...customer,
            orderCount,
            totalSpent: totalSpent._sum.total || 0
          }
        })
      )

      return {
        success: true,
        data: customersWithStats
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      return {
        success: false,
        error: 'Failed to fetch customers'
      }
    }
  })
  
  // Get customer by ID
  .get('/:customerId', async ({ params }) => {
    try {
      const { customerId } = params as { customerId: string }

      if (!customerId) {
        return {
          success: false,
          error: 'Customer ID is required'
        }
      }

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
  
  // Update customer by ID
  .put('/:customerId', async ({ params, body }) => {
    try {
      const { customerId } = params as { customerId: string }
      const updateData = body as any

      if (!customerId) {
        return {
          success: false,
          error: 'Customer ID is required'
        }
      }

      // Build update data
      const formattedData: any = {}
      if (updateData.name) formattedData.name = updateData.name
      if (updateData.email) formattedData.email = updateData.email
      
      // Update customer using Prisma
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: formattedData
      })

      return {
        success: true,
        data: customer,
        message: 'Customer updated'
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

      // Query orders based on customer's platform
      const orders = await prisma.order.findMany({
        where: customer.platform === 'whatsapp'
          ? { customerPhone: customer.phoneNumber, platform: 'whatsapp' }
          : { messengerPsid: customer.messengerPsid, platform: 'messenger' },
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

  // Toggle customer active status
  .patch('/:customerId/toggle-status', async ({ params }) => {
    try {
      const { customerId } = params as { customerId: string }

      if (!customerId) {
        return {
          success: false,
          error: 'Customer ID is required'
        }
      }

      // Get current status
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found'
        }
      }

      // Toggle status
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: { isActive: !customer.isActive }
      })

      return {
        success: true,
        data: updatedCustomer,
        message: `Customer ${updatedCustomer.isActive ? 'enabled' : 'disabled'}`
      }
    } catch (error) {
      console.error('Error toggling customer status:', error)
      return {
        success: false,
        error: 'Failed to toggle customer status'
      }
    }
  })