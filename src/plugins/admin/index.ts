import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const adminPlugin = new Elysia({ prefix: '/api/admin' })
  
  // Get restaurant dashboard stats
  .get('/dashboard', async () => {
    try {
      const [
        totalOrders,
        todayOrders,
        pendingOrders,
        totalCustomers,
        totalRevenue,
        popularItems
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.order.count({
          where: { status: 'pending' }
        }),
        prisma.customer.count(),
        prisma.order.aggregate({
          _sum: { total: true }
        }),
        prisma.orderItem.groupBy({
          by: ['itemName'],
          _count: { itemName: true },
          _sum: { quantity: true },
          orderBy: { _count: { itemName: 'desc' } },
          take: 5
        })
      ])

      return {
        success: true,
        data: {
          totalOrders,
          todayOrders,
          pendingOrders,
          totalCustomers,
          totalRevenue: totalRevenue._sum.total || 0,
          popularItems
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        success: false,
        error: 'Failed to fetch dashboard stats'
      }
    }
  })

  // Toggle item availability
  .patch('/items/:itemId/availability', async ({ params: { itemId }, body }) => {
    try {
      const { isAvailable } = body as any

      const item = await prisma.item.update({
        where: { id: itemId },
        data: { isAvailable }
      })

      return {
        success: true,
        data: item,
        message: `Item ${isAvailable ? 'enabled' : 'disabled'} successfully`
      }
    } catch (error) {
      console.error('Error updating item availability:', error)
      return {
        success: false,
        error: 'Failed to update item availability'
      }
    }
  })

  // Update item stock
  .patch('/items/:itemId/stock', async ({ params: { itemId }, body }) => {
    try {
      const { stockCount } = body as any

      const item = await prisma.item.update({
        where: { id: itemId },
        data: { stockCount }
      })

      return {
        success: true,
        data: item,
        message: 'Stock updated successfully'
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      return {
        success: false,
        error: 'Failed to update stock'
      }
    }
  })

  // Get low stock items
  .get('/inventory/low-stock', async () => {
    try {
      const lowStockItems = await prisma.item.findMany({
        where: {
          AND: [
            { stockCount: { not: null } },
            { lowStockAlert: { not: null } },
            {
              stockCount: {
                lte: prisma.item.fields.lowStockAlert
              }
            }
          ]
        },
        include: { category: true }
      })

      return {
        success: true,
        data: lowStockItems
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      return {
        success: false,
        error: 'Failed to fetch low stock items'
      }
    }
  })

  // Get recent orders for kitchen display
  .get('/kitchen/orders', async ({ query: { status = 'confirmed,preparing' } }) => {
    try {
      const statusArray = (status as string).split(',')
      
      const orders = await prisma.order.findMany({
        where: {
          status: { in: statusArray }
        },
        include: {
          items: true
        },
        orderBy: { createdAt: 'asc' },
        take: 20
      })

      return {
        success: true,
        data: orders
      }
    } catch (error) {
      console.error('Error fetching kitchen orders:', error)
      return {
        success: false,
        error: 'Failed to fetch kitchen orders'
      }
    }
  })