/**
 * Orders Manager API
 * Staff-only endpoints for managing restaurant orders
 */

import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { prisma } from '../../lib/prisma'
import { jwtConfig, type StaffTokenPayload } from '../../lib/auth'
import { isValidTransition, getActiveStatuses, isTerminalStatus } from './status-validation'

/**
 * Helper function to parse order data from database format to API format
 * Converts selectedModifiers from JSON string to parsed array
 * @param order - Raw order object from database
 * @returns Order with parsed selectedModifiers
 */
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

export const ordersManagerPlugin = new Elysia({ prefix: '/api/orders-manager' })
  .use(jwt(jwtConfig))
  .use(bearer())

  /**
   * GET /api/orders-manager/orders
   * List orders with optional filters
   * 
   * @authentication Bearer token (staff)
   * @query status - Filter by order status (pending|confirmed|preparing|ready|delivered|cancelled|all). Default: active orders only
   * @query platform - Filter by platform (whatsapp|messenger)
   * @query date - Filter by date (YYYY-MM-DD format)
   * @query limit - Maximum number of orders to return (default: 100)
   * @returns Array of orders with parsed modifiers and item details
   */
  .get(
    '/orders',
    async ({ query, jwt, bearer, set }) => {
      // Verify authentication
      if (!bearer) {
        set.status = 401
        return { success: false, error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { success: false, error: 'Invalid or expired token' }
      }

      // Build filters
      const { status, platform, date, limit } = query
      const where: any = {}

      // Filter by status (default: active orders only)
      if (status === 'all') {
        // No status filter
      } else if (status) {
        where.status = status
      } else {
        // Default: show only active orders (not delivered or cancelled)
        where.status = {
          in: getActiveStatuses()
        }
      }

      // Filter by platform
      if (platform) {
        where.platform = platform
      }

      // Filter by date
      if (date) {
        const startDate = new Date(date as string)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date as string)
        endDate.setHours(23, 59, 59, 999)
        
        where.createdAt = {
          gte: startDate,
          lte: endDate
        }
      }

      // Fetch orders
      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit ? parseInt(limit as string) : 100
      })

      // Parse and return
      const parsedOrders = orders.map(parseOrderData)

      return {
        success: true,
        count: parsedOrders.length,
        orders: parsedOrders
      }
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        platform: t.Optional(t.String()),
        date: t.Optional(t.String()),
        limit: t.Optional(t.String())
      })
    }
  )

  /**
   * GET /api/orders-manager/orders/:id
   * Get detailed information for a single order
   * 
   * @authentication Bearer token (staff)
   * @param id - Order ID
   * @returns Full order details with customer info, items, and parsed modifiers
   */
  .get(
    '/orders/:id',
    async ({ params, jwt, bearer, set }) => {
      // Verify authentication
      if (!bearer) {
        set.status = 401
        return { success: false, error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { success: false, error: 'Invalid or expired token' }
      }

      const order = await prisma.order.findUnique({
        where: { id: params.id },
        include: {
          items: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })

      if (!order) {
        set.status = 404
        return { success: false, error: 'Order not found' }
      }

      return {
        success: true,
        order: parseOrderData(order)
      }
    }
  )

  /**
   * PATCH /api/orders-manager/orders/:id/status
   * Update order status with validation
   * 
   * @authentication Bearer token (staff)
   * @param id - Order ID
   * @body status - New status (pending|confirmed|preparing|ready|delivered|cancelled)
   * @body note - Optional note explaining the status change
   * @returns Updated order with new status
   * @throws 400 if status transition is invalid
   * @throws 404 if order not found
   */
  .patch(
    '/orders/:id/status',
    async ({ params, body, jwt, bearer, set }) => {
      // Verify authentication
      if (!bearer) {
        set.status = 401
        return { success: false, error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { success: false, error: 'Invalid or expired token' }
      }

      const { status, note } = body

      // Get current order
      const order = await prisma.order.findUnique({
        where: { id: params.id }
      })

      if (!order) {
        set.status = 404
        return { success: false, error: 'Order not found' }
      }

      // Validate status transition
      if (!isValidTransition(order.status, status)) {
        set.status = 400
        return {
          success: false,
          error: `Invalid status transition from '${order.status}' to '${status}'`
        }
      }

      // Check if status is terminal
      if (isTerminalStatus(order.status)) {
        set.status = 400
        return {
          success: false,
          error: `Cannot update order with status '${order.status}'`
        }
      }

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          items: true
        }
      })

      return {
        success: true,
        message: `Order #${order.orderNumber} updated to ${status}`,
        order: parseOrderData(updatedOrder)
      }
    },
    {
      body: t.Object({
        status: t.String(),
        note: t.Optional(t.String())
      })
    }
  )

  /**
   * GET /api/orders-manager/stats
   * Get order statistics for dashboard analytics
   * 
   * @authentication Bearer token (staff)
   * @returns Object with counts by status and today's revenue
   */
  .get(
    '/stats',
    async ({ jwt, bearer, set }) => {
      // Verify authentication
      if (!bearer) {
        set.status = 401
        return { success: false, error: 'Authentication required' }
      }

      const payload = await jwt.verify(bearer) as StaffTokenPayload | false
      if (!payload) {
        set.status = 401
        return { success: false, error: 'Invalid or expired token' }
      }

      // Get counts by status
      const [pending, confirmed, preparing, ready, todayTotal] = await Promise.all([
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.order.count({ where: { status: 'confirmed' } }),
        prisma.order.count({ where: { status: 'preparing' } }),
        prisma.order.count({ where: { status: 'ready' } }),
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ])

      return {
        success: true,
        stats: {
          pending,
          confirmed,
          preparing,
          ready,
          todayTotal,
          activeTotal: pending + confirmed + preparing + ready
        }
      }
    }
  )
