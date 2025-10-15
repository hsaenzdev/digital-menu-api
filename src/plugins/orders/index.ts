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

      // Validate customerId is provided
      if (!orderData.customerId) {
        return {
          success: false,
          error: 'Customer ID is required'
        }
      }

      // Validate customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: orderData.customerId }
      })

      if (!customer) {
        return {
          success: false,
          error: 'Invalid customer ID'
        }
      }

      // Create the order
      const order = await prisma.order.create({
        data: {
          customerId: orderData.customerId,
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
          customer: true, // Include customer data in response
          items: true
        }
      })

      // Update location separately if provided (expecting "lat,lon" format)
      if (orderData.location) {
        const [lat, lon] = orderData.location.split(',').map((n: string) => parseFloat(n.trim()))
        if (!isNaN(lat) && !isNaN(lon)) {
          // Use raw SQL to update PostGIS Point (lon, lat order for PostGIS)
          await prisma.$executeRawUnsafe(
            `UPDATE orders SET location = ST_GeomFromText('POINT(${lon} ${lat})', 4326) WHERE id = $1`,
            order.id
          )
        }
      }

      return {
        success: true,
        data: parseOrderData(order),
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
          customer: true, // Include customer data
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