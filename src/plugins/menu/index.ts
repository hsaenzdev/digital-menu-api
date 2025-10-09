import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const menuPlugin = new Elysia({ prefix: '/api/menu' })
  
  // Get all categories only
  .get('/categories', async () => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      })

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      return {
        success: false,
        error: 'Failed to fetch categories'
      }
    }
  })

  // Get items by category
  .get('/categories/:categoryId/items', async ({ params: { categoryId } }) => {
    try {
      const items = await prisma.item.findMany({
        where: {
          categoryId,
          isActive: true,
          isAvailable: true
        },
        include: {
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: {
                    where: { isAvailable: true },
                    orderBy: { displayOrder: 'asc' }
                  }
                }
              }
            }
          }
        },
        orderBy: { displayOrder: 'asc' }
      })

      // Flatten the modifier groups structure
      const transformedItems = items.map(item => ({
        ...item,
        modifierGroups: item.modifierGroups.map(img => img.modifierGroup)
      }))

      return {
        success: true,
        data: transformedItems
      }
    } catch (error) {
      console.error('Error fetching category items:', error)
      return {
        success: false,
        error: 'Failed to fetch category items'
      }
    }
  })