import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const orderPlugin = new Elysia({ prefix: '/api/orders' })
  
  // Create a new order
  .post('/', async ({ body }) => {
    try {
      const orderData = body as any

      // Create the order
      const order = await prisma.order.create({
        data: {
          customerPhone: orderData.customerPhone,
          customerName: orderData.customerName,
          location: orderData.location,
          address: orderData.address,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          tip: orderData.tip,
          total: orderData.total,
          items: {
            create: orderData.items.map((item: any) => ({
              itemId: item.itemId,
              itemName: item.itemName,
              itemPrice: item.itemPrice,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              specialNotes: item.specialNotes,
              selectedModifiers: item.selectedModifiers
            }))
          }
        },
        include: {
          items: true
        }
      })

      return {
        success: true,
        data: order,
        message: `Order #${order.orderNumber} created successfully`
      }
    } catch (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: 'Failed to create order'
      }
    }
  })

  // Get order by ID
  .get('/:orderId', async ({ params: { orderId } }) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      return {
        success: true,
        data: order
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return {
        success: false,
        error: 'Failed to fetch order'
      }
    }
  })

  // Get order by order number
  .get('/number/:orderNumber', async ({ params: { orderNumber } }) => {
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber: parseInt(orderNumber) },
        include: {
          items: true
        }
      })

      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        }
      }

      return {
        success: true,
        data: order
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return {
        success: false,
        error: 'Failed to fetch order'
      }
    }
  })

  // Get orders by phone number
  .get('/customer/:phone', async ({ params: { phone } }) => {
    try {
      const orders = await prisma.order.findMany({
        where: { customerPhone: phone },
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

  // Update order status
  .patch('/:orderId/status', async ({ params: { orderId }, body }) => {
    try {
      const { status } = body as any

      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
        }
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          items: true
        }
      })

      return {
        success: true,
        data: order,
        message: `Order #${order.orderNumber} status updated to ${status}`
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      return {
        success: false,
        error: 'Failed to update order status'
      }
    }
  })

  // Get all orders (for restaurant management)
  .get('/', async ({ query: { status, limit = '50', offset = '0' } }) => {
    try {
      const whereClause: any = {}
      
      if (status) {
        whereClause.status = status
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      })

      const totalCount = await prisma.order.count({ where: whereClause })

      return {
        success: true,
        data: orders,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return {
        success: false,
        error: 'Failed to fetch orders'
      }
    }
  })