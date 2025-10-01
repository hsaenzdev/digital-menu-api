import { Elysia } from 'elysia'

export const whatsappPlugin = new Elysia({ prefix: '/api/whatsapp' })
  
  // Send order confirmation to customer
  .post('/send-order-confirmation', async ({ body }) => {
    try {
      const { phoneNumber, orderNumber, total, items, customerName } = body as any

      // Mock WhatsApp message logic
      const message = `
🍽️ *Order Confirmation*

Hi ${customerName}! 

Your order #${orderNumber} has been confirmed!

📋 *Order Details:*
${items.map((item: any) => `• ${item.quantity}x ${item.itemName} - $${item.totalPrice}`).join('\n')}

💰 *Total: $${total}*

⏰ Estimated prep time: 15-20 minutes

Thank you for your order! We'll send you updates as your food is prepared.
      `.trim()

      // Mock sending logic - in real implementation this would call Twilio
      console.log(`📱 Mock WhatsApp message to ${phoneNumber}:`)
      console.log(message)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        data: {
          messageId: `mock_msg_${Date.now()}`,
          phoneNumber,
          message,
          status: 'sent'
        },
        message: 'Order confirmation sent to customer'
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      return {
        success: false,
        error: 'Failed to send WhatsApp message'
      }
    }
  })

  // Send order notification to restaurant
  .post('/send-restaurant-notification', async ({ body }) => {
    try {
      const { orderNumber, total, items, customerName, customerPhone, address } = body as any

      const restaurantPhone = process.env.RESTAURANT_PHONE || '+1234567890'

      const message = `
🔔 *New Order Alert*

Order #${orderNumber}

👤 *Customer:* ${customerName}
📞 *Phone:* ${customerPhone}
📍 *Address:* ${address || 'Pickup'}

📋 *Items:*
${items.map((item: any) => `• ${item.quantity}x ${item.itemName}${item.selectedModifiers ? ` (${item.selectedModifiers})` : ''}`).join('\n')}

💰 *Total: $${total}*

Please start preparing this order!
      `.trim()

      console.log(`📱 Mock WhatsApp message to restaurant ${restaurantPhone}:`)
      console.log(message)

      await new Promise(resolve => setTimeout(resolve, 300))

      return {
        success: true,
        data: {
          messageId: `mock_restaurant_${Date.now()}`,
          phoneNumber: restaurantPhone,
          message,
          status: 'sent'
        },
        message: 'Order notification sent to restaurant'
      }
    } catch (error) {
      console.error('Error sending restaurant notification:', error)
      return {
        success: false,
        error: 'Failed to send restaurant notification'
      }
    }
  })

  // Send order status update
  .post('/send-status-update', async ({ body }) => {
    try {
      const { phoneNumber, orderNumber, status, customerName } = body as any

      const statusMessages = {
        confirmed: '✅ Your order has been confirmed and is being prepared!',
        preparing: '👨‍🍳 Your order is being prepared!',
        ready: '🎉 Your order is ready for pickup/delivery!',
        delivered: '✅ Your order has been delivered! Enjoy your meal!',
        cancelled: '❌ Your order has been cancelled.'
      }

      const message = `
🍽️ *Order Update*

Hi ${customerName}!

Order #${orderNumber}: ${statusMessages[status as keyof typeof statusMessages] || 'Status updated'}

Thank you for choosing us!
      `.trim()

      console.log(`📱 Mock WhatsApp status update to ${phoneNumber}:`)
      console.log(message)

      await new Promise(resolve => setTimeout(resolve, 200))

      return {
        success: true,
        data: {
          messageId: `mock_status_${Date.now()}`,
          phoneNumber,
          message,
          status: 'sent'
        },
        message: 'Status update sent to customer'
      }
    } catch (error) {
      console.error('Error sending status update:', error)
      return {
        success: false,
        error: 'Failed to send status update'
      }
    }
  })