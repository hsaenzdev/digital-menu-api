import { Elysia } from 'elysia'
import { prisma } from '../../lib/prisma'

export const menuPlugin = new Elysia({ prefix: '/api/menu' })
  
  // Get all categories with their items
  .get('/', async () => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          items: {
            where: { isActive: true, isAvailable: true },
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      })

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      return {
        success: false,
        error: 'Failed to fetch menu'
      }
    }
  })

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

  // Get specific item details
  .get('/items/:itemId', async ({ params: { itemId } }) => {
    try {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: {
          category: true,
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
        }
      })

      if (!item) {
        return {
          success: false,
          error: 'Item not found'
        }
      }

      // Flatten the modifier groups structure
      const transformedItem = {
        ...item,
        modifierGroups: item.modifierGroups.map(img => img.modifierGroup)
      }

      return {
        success: true,
        data: transformedItem
      }
    } catch (error) {
      console.error('Error fetching item:', error)
      return {
        success: false,
        error: 'Failed to fetch item'
      }
    }
  })

  // Search items
  .get('/search', async ({ query: { q, category, dietary } }) => {
    try {
      const whereClause: any = {
        isActive: true,
        isAvailable: true,
      }

      // Add search query filter
      if (q) {
        whereClause.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      }

      // Add category filter
      if (category) {
        whereClause.categoryId = category
      }

      // Add dietary filters
      if (dietary) {
        const dietaryFilters = dietary.split(',')
        for (const filter of dietaryFilters) {
          switch (filter.toLowerCase()) {
            case 'vegetarian':
              whereClause.isVegetarian = true
              break
            case 'vegan':
              whereClause.isVegan = true
              break
            case 'gluten-free':
              whereClause.isGlutenFree = true
              break
          }
        }
      }

      const items = await prisma.item.findMany({
        where: whereClause,
        include: {
          category: true,
        },
        orderBy: { displayOrder: 'asc' }
      })

      return {
        success: true,
        data: items
      }
    } catch (error) {
      console.error('Error searching items:', error)
      return {
        success: false,
        error: 'Failed to search items'
      }
    }
  })