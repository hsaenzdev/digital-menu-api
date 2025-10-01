import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const customerPlugin = new Elysia({ prefix: '/api/customers' })
  
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

      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email }),
          ...(updateData.defaultAddress && { defaultAddress: updateData.defaultAddress }),
          ...(updateData.defaultLocation && { defaultLocation: updateData.defaultLocation }),
        }
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
  
  // Validate customer before allowing order - this is the key endpoint
  .post('/validate', async ({ body }) => {
    try {
      const { phoneNumber } = body as any

      if (!phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required'
        }
      }

      // Check if customer exists
      const customer = await prisma.customer.findUnique({
        where: { phoneNumber }
      })

      // Check for pending orders
      const pendingOrders = await prisma.order.findMany({
        where: {
          customerPhone: phoneNumber,
          status: { in: ['pending', 'confirmed', 'preparing'] }
        }
      })

      // Check if customer is blocked (we'll add this field to customer schema later)
      const isBlocked = customer?.isActive === false

      return {
        success: true,
        data: {
          customer: customer || null,
          exists: !!customer,
          isBlocked,
          pendingOrders: pendingOrders.length,
          pendingOrderDetails: pendingOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt
          })),
          canOrder: !isBlocked && pendingOrders.length < 3, // Allow max 3 pending orders
          message: isBlocked 
            ? 'Customer is blocked from ordering' 
            : pendingOrders.length >= 3 
            ? 'Too many pending orders. Please wait for current orders to complete.'
            : 'Customer can place order'
        }
      }
    } catch (error) {
      console.error('Error validating customer:', error)
      return {
        success: false,
        error: 'Failed to validate customer'
      }
    }
  })
  
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