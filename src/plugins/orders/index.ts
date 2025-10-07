import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

// Helper function to parse selectedModifiers JSON string to array
const parseOrderData = (order: any) => {
  return {
    ...order,
    items: order.items.map((item: any) => ({
      ...item,
      selectedModifiers: item.selectedModifiers 
        ? JSON.parse(item.selectedModifiers) 
        : []
    }))
  }
}

export const orderPlugin = new Elysia({ prefix: '/api/orders' })
  
  // Create a new order
  .post('/', async ({ body }) => {
    try {
      const orderData = body as any

      // Platform-specific validation
      const platform = orderData.platform || 'whatsapp'
      
      if (platform === 'whatsapp' && !orderData.customerPhone) {
        return {
          success: false,
          error: 'Customer phone is required for WhatsApp orders'
        }
      }

      if (platform === 'messenger' && !orderData.messengerPsid) {
        return {
          success: false,
          error: 'Messenger PSID is required for Messenger orders'
        }
      }

      // Create the order
      const order = await prisma.order.create({
        data: {
          platform,
          customerPhone: orderData.customerPhone,
          messengerPsid: orderData.messengerPsid,
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
                ? JSON.stringify(item.selectedModifiers) 
                : null
            }))
          }
        },
        include: {
          items: true
        }
      })

      // Platform-specific notifications
      const platformEmoji = platform === 'whatsapp' ? '📱' : '💙'
      const platformName = platform === 'whatsapp' ? 'WhatsApp' : 'Messenger'
      console.log(`${platformEmoji} Sending ${platformName} notifications for order #${order.orderNumber}`)
      
      // You can call the platform-specific endpoints from here in a real implementation
      // if (platform === 'whatsapp') {
      //   await fetch('/api/whatsapp/send-order-confirmation', { ... })
      // } else {
      //   await fetch('/api/messenger/send-order-confirmation', { ... })
      // }

      return {
        success: true,
        data: parseOrderData(order),
        message: `Order #${order.orderNumber} created successfully. ${platformName} notifications sent!`
      }
    } catch (error) {
      console.error('Error creating order:', error)
      return {
        success: false,
        error: 'Failed to create order'
      }
    }
  })

  // Get order by order number (specific route first)
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
        data: parseOrderData(order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return {
        success: false,
        error: 'Failed to fetch order'
      }
    }
  })

  // Get orders by phone number (specific route)
  .get('/customer/:phone', async ({ params: { phone } }) => {
    try {
      const orders = await prisma.order.findMany({
        where: { 
          customerPhone: phone,
          platform: 'whatsapp'
        },
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        data: orders.map(order => parseOrderData(order))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return {
        success: false,
        error: 'Failed to fetch orders'
      }
    }
  })

  // Get orders by Messenger PSID (specific route)
  .get('/messenger/:psid', async ({ params: { psid } }) => {
    try {
      const orders = await prisma.order.findMany({
        where: { 
          messengerPsid: psid,
          platform: 'messenger'
        },
        include: {
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return {
        success: true,
        data: orders.map(order => parseOrderData(order))
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return {
        success: false,
        error: 'Failed to fetch orders'
      }
    }
  })

  // Get order by ID (generic route last)
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
        data: parseOrderData(order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      return {
        success: false,
        error: 'Failed to fetch order'
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

      // Mock WhatsApp status notification
      console.log(`📱 Sending status update for order #${order.orderNumber}: ${status}`)
      
      // In real app: await fetch('/api/whatsapp/send-status-update', { ... })

      return {
        success: true,
        data: parseOrderData(order),
        message: `Order #${order.orderNumber} status updated to ${status}. Customer notified via WhatsApp!`
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
        data: orders.map(order => parseOrderData(order)),
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