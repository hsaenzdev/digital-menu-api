/**
 * Menu Manager API
 * Staff-only endpoints for managing menu items, categories, and modifiers
 */

import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { prisma } from '../../lib/prisma'
import { jwtConfig, type StaffTokenPayload } from '../../lib/auth'
import { verifyStaffAuth } from '../../lib/auth-validation'

export const menuManagerPlugin = new Elysia({ prefix: '/api/menu-manager' })
  .use(jwt(jwtConfig))
  .use(bearer())

  // ============================================
  // CATEGORIES
  // ============================================

  /**
   * POST /api/menu-manager/categories
   * Create a new category
   */
  .post(
    '/categories',
    async ({ body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      const { name, description, displayOrder, isActive } = body

      try {
        const category = await prisma.category.create({
          data: {
            name,
            description,
            displayOrder: displayOrder ?? 0,
            isActive: isActive ?? true
          }
        })

        return {
          success: true,
          category
        }
      } catch (error) {
        console.error('Error creating category:', error)
        set.status = 500
        return { success: false, error: 'Failed to create category' }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * PATCH /api/menu-manager/categories/:id
   * Update an existing category
   */
  .patch(
    '/categories/:id',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const category = await prisma.category.update({
          where: { id: params.id },
          data: body
        })

        return {
          success: true,
          category
        }
      } catch (error) {
        console.error('Error updating category:', error)
        set.status = 500
        return { success: false, error: 'Failed to update category' }
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * DELETE /api/menu-manager/categories/:id
   * Delete a category (soft delete by setting isActive to false)
   */
  .delete(
    '/categories/:id',
    async ({ params, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        // Soft delete by setting isActive to false
        const category = await prisma.category.update({
          where: { id: params.id },
          data: { isActive: false }
        })

        return {
          success: true,
          message: 'Category deactivated successfully',
          category
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        set.status = 500
        return { success: false, error: 'Failed to delete category' }
      }
    }
  )

  // ============================================
  // MODIFIER GROUPS
  // ============================================

  /**
   * GET /api/menu-manager/modifier-groups
   * Get all modifier groups with their modifiers
   */
  .get(
    '/modifier-groups',
    async ({ jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const groups = await prisma.modifierGroup.findMany({
          include: {
            modifiers: {
              orderBy: { displayOrder: 'asc' }
            }
          },
          orderBy: { displayOrder: 'asc' }
        })

        return {
          success: true,
          groups
        }
      } catch (error) {
        console.error('Error fetching modifier groups:', error)
        set.status = 500
        return { success: false, error: 'Failed to fetch modifier groups' }
      }
    }
  )

  /**
   * POST /api/menu-manager/modifier-groups
   * Create a new modifier group
   */
  .post(
    '/modifier-groups',
    async ({ body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const group = await prisma.modifierGroup.create({
          data: body
        })

        return {
          success: true,
          group
        }
      } catch (error) {
        console.error('Error creating modifier group:', error)
        set.status = 500
        return { success: false, error: 'Failed to create modifier group' }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        isRequired: t.Optional(t.Boolean()),
        minSelection: t.Optional(t.Number()),
        maxSelection: t.Optional(t.Number()),
        displayOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * PATCH /api/menu-manager/modifier-groups/:id
   * Update a modifier group
   */
  .patch(
    '/modifier-groups/:id',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const group = await prisma.modifierGroup.update({
          where: { id: params.id },
          data: body
        })

        return {
          success: true,
          group
        }
      } catch (error) {
        console.error('Error updating modifier group:', error)
        set.status = 500
        return { success: false, error: 'Failed to update modifier group' }
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        isRequired: t.Optional(t.Boolean()),
        minSelection: t.Optional(t.Number()),
        maxSelection: t.Optional(t.Number()),
        displayOrder: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * DELETE /api/menu-manager/modifier-groups/:id
   * Delete a modifier group
   */
  .delete(
    '/modifier-groups/:id',
    async ({ params, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        await prisma.modifierGroup.update({
          where: { id: params.id },
          data: { isActive: false }
        })

        return {
          success: true,
          message: 'Modifier group deactivated successfully'
        }
      } catch (error) {
        console.error('Error deleting modifier group:', error)
        set.status = 500
        return { success: false, error: 'Failed to delete modifier group' }
      }
    }
  )

  // ============================================
  // MODIFIERS
  // ============================================

  /**
   * POST /api/menu-manager/modifiers
   * Create a new modifier within a group
   */
  .post(
    '/modifiers',
    async ({ body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const modifier = await prisma.modifier.create({
          data: body
        })

        return {
          success: true,
          modifier
        }
      } catch (error) {
        console.error('Error creating modifier:', error)
        set.status = 500
        return { success: false, error: 'Failed to create modifier' }
      }
    },
    {
      body: t.Object({
        modifierGroupId: t.String(),
        name: t.String(),
        priceAdjustment: t.Optional(t.Number()),
        displayOrder: t.Optional(t.Number()),
        isAvailable: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * PATCH /api/menu-manager/modifiers/:id
   * Update a modifier
   */
  .patch(
    '/modifiers/:id',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const modifier = await prisma.modifier.update({
          where: { id: params.id },
          data: body
        })

        return {
          success: true,
          modifier
        }
      } catch (error) {
        console.error('Error updating modifier:', error)
        set.status = 500
        return { success: false, error: 'Failed to update modifier' }
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        priceAdjustment: t.Optional(t.Number()),
        displayOrder: t.Optional(t.Number()),
        isAvailable: t.Optional(t.Boolean())
      })
    }
  )

  /**
   * DELETE /api/menu-manager/modifiers/:id
   * Delete a modifier
   */
  .delete(
    '/modifiers/:id',
    async ({ params, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        await prisma.modifier.delete({
          where: { id: params.id }
        })

        return {
          success: true,
          message: 'Modifier deleted successfully'
        }
      } catch (error) {
        console.error('Error deleting modifier:', error)
        set.status = 500
        return { success: false, error: 'Failed to delete modifier' }
      }
    }
  )

  // ============================================
  // ITEMS
  // ============================================

  /**
   * GET /api/menu-manager/items
   * Get all items (including inactive) for management
   */
  .get(
    '/items',
    async ({ query, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const { categoryId } = query
        const where: any = {}

        if (categoryId) {
          where.categoryId = categoryId
        }

        const items = await prisma.item.findMany({
          where,
          include: {
            category: true,
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: true
                  }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        })

        return {
          success: true,
          items
        }
      } catch (error) {
        console.error('Error fetching items:', error)
        set.status = 500
        return { success: false, error: 'Failed to fetch items' }
      }
    },
    {
      query: t.Object({
        categoryId: t.Optional(t.String())
      })
    }
  )

  /**
   * POST /api/menu-manager/items
   * Create a new menu item
   */
  .post(
    '/items',
    async ({ body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const item = await prisma.item.create({
          data: body
        })

        return {
          success: true,
          item
        }
      } catch (error) {
        console.error('Error creating item:', error)
        set.status = 500
        return { success: false, error: 'Failed to create item' }
      }
    },
    {
      body: t.Object({
        categoryId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        price: t.Number(),
        imageUrl: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
        isAvailable: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        calories: t.Optional(t.Number()),
        prepTime: t.Optional(t.Number()),
        spicyLevel: t.Optional(t.Number()),
        isVegetarian: t.Optional(t.Boolean()),
        isVegan: t.Optional(t.Boolean()),
        isGlutenFree: t.Optional(t.Boolean()),
        allergens: t.Optional(t.String()),
        stockCount: t.Optional(t.Number()),
        lowStockAlert: t.Optional(t.Number())
      })
    }
  )

  /**
   * PATCH /api/menu-manager/items/:id
   * Update a menu item
   */
  .patch(
    '/items/:id',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const item = await prisma.item.update({
          where: { id: params.id },
          data: body
        })

        return {
          success: true,
          item
        }
      } catch (error) {
        console.error('Error updating item:', error)
        set.status = 500
        return { success: false, error: 'Failed to update item' }
      }
    },
    {
      body: t.Object({
        categoryId: t.Optional(t.String()),
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number()),
        imageUrl: t.Optional(t.String()),
        displayOrder: t.Optional(t.Number()),
        isAvailable: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        calories: t.Optional(t.Number()),
        prepTime: t.Optional(t.Number()),
        spicyLevel: t.Optional(t.Number()),
        isVegetarian: t.Optional(t.Boolean()),
        isVegan: t.Optional(t.Boolean()),
        isGlutenFree: t.Optional(t.Boolean()),
        allergens: t.Optional(t.String()),
        stockCount: t.Optional(t.Number()),
        lowStockAlert: t.Optional(t.Number())
      })
    }
  )

  /**
   * DELETE /api/menu-manager/items/:id
   * Delete a menu item (soft delete)
   */
  .delete(
    '/items/:id',
    async ({ params, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        await prisma.item.update({
          where: { id: params.id },
          data: { isActive: false }
        })

        return {
          success: true,
          message: 'Item deactivated successfully'
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        set.status = 500
        return { success: false, error: 'Failed to delete item' }
      }
    }
  )

  /**
   * PATCH /api/menu-manager/items/:id/availability
   * Quick toggle item availability
   */
  .patch(
    '/items/:id/availability',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const item = await prisma.item.update({
          where: { id: params.id },
          data: { isAvailable: body.isAvailable }
        })

        return {
          success: true,
          item
        }
      } catch (error) {
        console.error('Error toggling item availability:', error)
        set.status = 500
        return { success: false, error: 'Failed to toggle availability' }
      }
    },
    {
      body: t.Object({
        isAvailable: t.Boolean()
      })
    }
  )

  // ============================================
  // ITEM-MODIFIER ASSOCIATIONS
  // ============================================

  /**
   * POST /api/menu-manager/items/:id/modifier-groups
   * Link a modifier group to an item
   */
  .post(
    '/items/:id/modifier-groups',
    async ({ params, body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const association = await prisma.itemModifierGroup.create({
          data: {
            itemId: params.id,
            modifierGroupId: body.modifierGroupId
          }
        })

        return {
          success: true,
          association
        }
      } catch (error) {
        console.error('Error linking modifier group:', error)
        set.status = 500
        return { success: false, error: 'Failed to link modifier group' }
      }
    },
    {
      body: t.Object({
        modifierGroupId: t.String()
      })
    }
  )

  /**
   * DELETE /api/menu-manager/items/:id/modifier-groups/:groupId
   * Unlink a modifier group from an item
   */
  .delete(
    '/items/:id/modifier-groups/:groupId',
    async ({ params, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        await prisma.itemModifierGroup.deleteMany({
          where: {
            itemId: params.id,
            modifierGroupId: params.groupId
          }
        })

        return {
          success: true,
          message: 'Modifier group unlinked successfully'
        }
      } catch (error) {
        console.error('Error unlinking modifier group:', error)
        set.status = 500
        return { success: false, error: 'Failed to unlink modifier group' }
      }
    }
  )

  // ============================================
  // IMAGE UPLOAD
  // ============================================

  /**
   * POST /api/menu-manager/upload
   * Upload an image for menu items
   */
  .post(
    '/upload',
    async ({ body, jwt, bearer, set }) => {
      const auth = await verifyStaffAuth(jwt, bearer, set)
      if (!auth.success) {
        return { success: false, error: auth.error }
      }

      try {
        const { image } = body
        
        if (!image) {
          set.status = 400
          return { success: false, error: 'No image provided' }
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const filename = `menu-item-${timestamp}-${randomStr}.${image.type.split('/')[1]}`
        
        // Save to public/uploads/menu-items/
        const uploadDir = './public/uploads/menu-items'
        
        // Create directory if it doesn't exist
        await Bun.write(`${uploadDir}/.gitkeep`, '')
        
        // Write file
        await Bun.write(`${uploadDir}/${filename}`, image)

        // Return public URL
        const imageUrl = `/uploads/menu-items/${filename}`

        return {
          success: true,
          imageUrl
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        set.status = 500
        return { success: false, error: 'Failed to upload image' }
      }
    },
    {
      body: t.Object({
        image: t.File({
          type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          maxSize: 5 * 1024 * 1024 // 5MB
        })
      })
    }
  )
