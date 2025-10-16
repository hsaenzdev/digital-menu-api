import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { prisma } from '../../lib/prisma'
import { jwtConfig, type StaffTokenPayload } from '../../lib/auth'

export const settingsPlugin = new Elysia({ prefix: '/api/settings' })
  .use(jwt(jwtConfig))
  .use(bearer())

  // Public endpoint for bank transfer settings (no auth required)
  .get(
    '/public/bank-transfer',
    async ({ set }) => {
      try {
        const settings = await prisma.settings.findFirst()

        if (!settings) {
          // Return defaults if no settings found
          return {
            bankTransferEnabled: false,
            bankName: '',
            bankAccountNumber: '',
            bankAccountHolder: '',
            bankTransferInstructions: ''
          }
        }

        // Only return public bank transfer information
        return {
          bankTransferEnabled: settings.bankTransferEnabled ?? false,
          bankName: settings.bankName || '',
          bankAccountNumber: settings.bankAccountNumber || '',
          bankAccountHolder: settings.bankAccountHolder || '',
          bankTransferInstructions: settings.bankTransferInstructions || ''
        }
      } catch (error) {
        set.status = 500
        return { error: 'Failed to fetch bank settings' }
      }
    }
  )

  .get(
    '/',
    async ({ jwt, bearer, set }) => {
      if (!bearer) {
        set.status = 401
        return { error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { error: 'Invalid or expired token' }
      }

      try {
        let settings = await prisma.settings.findFirst()

        if (!settings) {
          settings = await prisma.settings.create({
            data: {
              restaurantName: 'My Restaurant',
              description: 'Welcome to our restaurant!',
              phone: '',
              email: '',
              taxRate: 0,
              serviceFeeType: 'fixed',
              serviceFeeAmount: 0,
              minimumOrderAmount: 0,
              currencySymbol: '$',
              currencyCode: 'USD',
              tipSuggestions: [10, 15, 18, 20],
              baseDeliveryFee: 0,
              estimatedDeliveryMinutes: 30,
              estimatedDeliveryMaxMinutes: 45,
              autoAcceptOrders: false,
              cancellationWindowMinutes: 5,
              averagePrepTimeMinutes: 25,
              allowSpecialInstructions: true,
              requireCustomerPhone: true,
              requireCustomerEmail: false,
              leadTimeMinutes: 30,
              whatsappEnabled: false,
              messengerEnabled: false,
              primaryColor: '#3b82f6',
              secondaryColor: '#10b981',
              fontFamily: 'Inter',
              theme: 'light',
              menuDisplayStyle: 'grid',
              twoFactorEnabled: false,
              businessHours: {
                monday: { open: '11:00', close: '22:00', closed: false },
                tuesday: { open: '11:00', close: '22:00', closed: false },
                wednesday: { open: '11:00', close: '22:00', closed: false },
                thursday: { open: '11:00', close: '22:00', closed: false },
                friday: { open: '11:00', close: '22:00', closed: false },
                saturday: { open: '11:00', close: '22:00', closed: false },
                sunday: { open: '11:00', close: '22:00', closed: false },
              },
              specialHours: [],
              notificationSettings: {
                newOrder: { email: true, sms: false, whatsapp: false },
                dailyReport: { email: true, time: '09:00' },
                lowStock: { email: true },
                customerFeedback: { email: true },
              },
            },
          })
        }

        return { settings }
      } catch (error) {
        set.status = 500
        return { error: 'Failed to fetch settings' }
      }
    }
  )

  .patch(
    '/',
    async ({ jwt, bearer, set, body }) => {
      if (!bearer) {
        set.status = 401
        return { error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { error: 'Invalid or expired token' }
      }

      try {
        let settings = await prisma.settings.findFirst()

        if (!settings) {
          set.status = 404
          return { error: 'Settings not found. Please initialize settings first.' }
        }

        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: body,
        })

        return { 
          message: 'Settings updated successfully',
          settings 
        }
      } catch (error) {
        set.status = 500
        return { error: 'Failed to update settings' }
      }
    },
    {
      body: t.Any()
    }
  )
