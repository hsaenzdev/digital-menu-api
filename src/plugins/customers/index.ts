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

      // Build update data (without location)
      const formattedData: any = {}
      if (updateData.name) formattedData.name = updateData.name
      if (updateData.email) formattedData.email = updateData.email
      if (updateData.defaultAddress) formattedData.defaultAddress = updateData.defaultAddress
      
      // Update other fields using Prisma
      const customer = await prisma.customer.update({
        where: { id: customerId },
        data: formattedData
      })

      // Update location separately if provided (expecting "lat,lon" format)
      if (updateData.defaultLocation) {
        const [lat, lon] = updateData.defaultLocation.split(',').map((n: string) => parseFloat(n.trim()))
        if (!isNaN(lat) && !isNaN(lon)) {
          // Use raw SQL to update PostGIS Point (lon, lat order for PostGIS)
          await prisma.$executeRawUnsafe(
            `UPDATE customers SET "defaultLocation" = ST_GeomFromText('POINT(${lon} ${lat})', 4326) WHERE id = $1`,
            customerId
          )
        }
      }

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
      const { platform = 'whatsapp', phoneNumber, messengerPsid } = body as any

      // Platform-specific validation
      if (platform === 'whatsapp' && !phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required for WhatsApp platform'
        }
      }

      if (platform === 'messenger' && !messengerPsid) {
        return {
          success: false,
          error: 'Messenger PSID is required for Messenger platform'
        }
      }

      // Check if customer exists based on platform
      const customer = await prisma.customer.findUnique({
        where: platform === 'whatsapp' 
          ? { phoneNumber } 
          : { messengerPsid }
      })

      // Check for pending orders based on platform
      const pendingOrders = await prisma.order.findMany({
        where: platform === 'whatsapp'
          ? {
              customerPhone: phoneNumber,
              platform: 'whatsapp',
              status: { in: ['pending', 'confirmed', 'preparing'] }
            }
          : {
              messengerPsid,
              platform: 'messenger',
              status: { in: ['pending', 'confirmed', 'preparing'] }
            }
      })

      // Check if customer is blocked
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
      const { platform = 'whatsapp', phoneNumber, messengerPsid, ...customerData } = body as any

      // Platform-specific validation
      if (platform === 'whatsapp' && !phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required for WhatsApp customers'
        }
      }

      if (platform === 'messenger' && !messengerPsid) {
        return {
          success: false,
          error: 'Messenger PSID is required for Messenger customers'
        }
      }

      // Check if customer exists based on platform
      const existingCustomer = await prisma.customer.findUnique({
        where: platform === 'whatsapp' 
          ? { phoneNumber } 
          : { messengerPsid }
      })

      // Prepare base data without location
      const baseData: any = {
        platform,
        ...(phoneNumber && { phoneNumber }),
        ...(messengerPsid && { messengerPsid }),
        ...(customerData.name && { name: customerData.name }),
        ...(customerData.email && { email: customerData.email }),
        ...(customerData.defaultAddress && { defaultAddress: customerData.defaultAddress }),
      }

      let customer
      if (existingCustomer) {
        // Update existing customer
        customer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: baseData
        })
        
        // Update location separately if provided
        if (customerData.defaultLocation) {
          const [lat, lon] = customerData.defaultLocation.split(',').map((n: string) => parseFloat(n.trim()))
          if (!isNaN(lat) && !isNaN(lon)) {
            await prisma.$executeRawUnsafe(
              `UPDATE customers SET "defaultLocation" = ST_GeomFromText('POINT(${lon} ${lat})', 4326) WHERE id = $1`,
              customer.id
            )
          }
        }
      } else {
        // Create new customer
        customer = await prisma.customer.create({
          data: baseData
        })
        
        // Update location separately if provided
        if (customerData.defaultLocation) {
          const [lat, lon] = customerData.defaultLocation.split(',').map((n: string) => parseFloat(n.trim()))
          if (!isNaN(lat) && !isNaN(lon)) {
            await prisma.$executeRawUnsafe(
              `UPDATE customers SET "defaultLocation" = ST_GeomFromText('POINT(${lon} ${lat})', 4326) WHERE id = $1`,
              customer.id
            )
          }
        }
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

  // Get customer by Messenger PSID
  .get('/messenger/:psid', async ({ params: { psid } }) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { messengerPsid: psid }
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