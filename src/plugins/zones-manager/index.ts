import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { prisma } from '../../lib/prisma'
import { jwtConfig, type StaffTokenPayload } from '../../lib/auth'

export const zonesManagerPlugin = new Elysia({ prefix: '/api/zones-manager' })
  .use(jwt(jwtConfig))
  .use(bearer())

  /**
   * GET /api/zones-manager/zones
   * Get all delivery zones (including inactive)
   * 
   * @authentication Bearer token (staff)
   * @returns Array of delivery zones with city information
   */
  .get(
    '/zones',
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

      try {
        const zones = await prisma.$queryRaw`
          SELECT 
            dz.id,
            dz."cityId",
            dz.name,
            dz.description,
            ST_AsGeoJSON(dz.boundary)::json as boundary,
            dz."isActive",
            dz."createdAt",
            dz."updatedAt",
            c.name as "cityName"
          FROM delivery_zones dz
          JOIN cities c ON dz."cityId" = c.id
          ORDER BY dz."createdAt" DESC
        `

        return {
          success: true,
          data: zones
        }
      } catch (error) {
        console.error('Error fetching zones:', error)
        set.status = 500
        return { success: false, error: 'Failed to fetch delivery zones' }
      }
    }
  )

  /**
   * POST /api/zones-manager/zones
   * Create a new delivery zone
   * 
   * @authentication Bearer token (staff)
   * @body cityId, name, description (optional), coordinates (array of [lng, lat] pairs)
   * @returns Created zone
   */
  .post(
    '/zones',
    async ({ jwt, bearer, set, body }) => {
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

      try {
        const { cityId, name, description, coordinates } = body as {
          cityId: string
          name: string
          description?: string
          coordinates: [number, number][]
        }

        // Validate coordinates
        if (!coordinates || coordinates.length < 3) {
          set.status = 400
          return { 
            success: false, 
            error: 'A polygon must have at least 3 coordinates' 
          }
        }

        // Ensure polygon is closed (first and last points must be the same)
        const firstPoint = coordinates[0]
        const lastPoint = coordinates[coordinates.length - 1]
        const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]
        
        const finalCoordinates = isClosed 
          ? coordinates 
          : [...coordinates, firstPoint]

        // Format coordinates for PostGIS: "POLYGON((lng lat, lng lat, ...))"
        const coordsString = finalCoordinates
          .map(coord => `${coord[0]} ${coord[1]}`)
          .join(', ')
        
        const polygonWKT = `POLYGON((${coordsString}))`

        // Create zone using raw SQL
        const result = await prisma.$queryRaw`
          INSERT INTO delivery_zones ("id", "cityId", "name", "description", "boundary", "isActive", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${cityId}::text,
            ${name}::text,
            ${description || null}::text,
            ST_GeomFromText(${polygonWKT}, 4326),
            true,
            NOW(),
            NOW()
          )
          RETURNING 
            id,
            "cityId",
            name,
            description,
            ST_AsGeoJSON(boundary)::json as boundary,
            "isActive",
            "createdAt",
            "updatedAt"
        `

        return {
          success: true,
          data: Array.isArray(result) ? result[0] : result,
          message: 'Delivery zone created successfully'
        }
      } catch (error: any) {
        console.error('Error creating zone:', error)
        
        // Handle unique constraint violation
        if (error?.code === '23505') {
          set.status = 400
          return { 
            success: false, 
            error: 'A zone with this name already exists in this city' 
          }
        }

        set.status = 500
        return { success: false, error: 'Failed to create delivery zone' }
      }
    },
    {
      body: t.Object({
        cityId: t.String(),
        name: t.String(),
        description: t.Optional(t.String()),
        coordinates: t.Array(t.Array(t.Number()))
      })
    }
  )

  /**
   * PATCH /api/zones-manager/zones/:id
   * Update a delivery zone
   * 
   * @authentication Bearer token (staff)
   * @body name (optional), description (optional), coordinates (optional)
   * @returns Updated zone
   */
  .patch(
    '/zones/:id',
    async ({ jwt, bearer, set, params, body }) => {
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

      try {
        const { id } = params
        const { name, description, coordinates } = body as {
          name?: string
          description?: string
          coordinates?: [number, number][]
        }

        // Build update parts
        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (name !== undefined) {
          updates.push(`name = $${paramIndex}`)
          values.push(name)
          paramIndex++
        }

        if (description !== undefined) {
          updates.push(`description = $${paramIndex}`)
          values.push(description)
          paramIndex++
        }

        if (coordinates && coordinates.length >= 3) {
          // Ensure polygon is closed
          const firstPoint = coordinates[0]
          const lastPoint = coordinates[coordinates.length - 1]
          const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]
          
          const finalCoordinates = isClosed 
            ? coordinates 
            : [...coordinates, firstPoint]

          const coordsString = finalCoordinates
            .map(coord => `${coord[0]} ${coord[1]}`)
            .join(', ')
          
          const polygonWKT = `POLYGON((${coordsString}))`
          
          updates.push(`boundary = ST_GeomFromText($${paramIndex}, 4326)`)
          values.push(polygonWKT)
          paramIndex++
        }

        if (updates.length === 0) {
          set.status = 400
          return { success: false, error: 'No fields to update' }
        }

        updates.push(`"updatedAt" = NOW()`)

        // Execute update
        const query = `
          UPDATE delivery_zones
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING 
            id,
            "cityId",
            name,
            description,
            ST_AsGeoJSON(boundary)::json as boundary,
            "isActive",
            "createdAt",
            "updatedAt"
        `
        values.push(id)

        const result = await prisma.$queryRawUnsafe(query, ...values)

        if (!result || (Array.isArray(result) && result.length === 0)) {
          set.status = 404
          return { success: false, error: 'Delivery zone not found' }
        }

        return {
          success: true,
          data: Array.isArray(result) ? result[0] : result,
          message: 'Delivery zone updated successfully'
        }
      } catch (error: any) {
        console.error('Error updating zone:', error)
        
        if (error?.code === '23505') {
          set.status = 400
          return { 
            success: false, 
            error: 'A zone with this name already exists in this city' 
          }
        }

        set.status = 500
        return { success: false, error: 'Failed to update delivery zone' }
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        coordinates: t.Optional(t.Array(t.Array(t.Number())))
      })
    }
  )

  /**
   * PATCH /api/zones-manager/zones/:id/toggle
   * Toggle zone active status
   * 
   * @authentication Bearer token (staff)
   * @returns Updated zone
   */
  .patch(
    '/zones/:id/toggle',
    async ({ jwt, bearer, set, params }) => {
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

      try {
        const { id } = params

        const result = await prisma.$queryRaw`
          UPDATE delivery_zones
          SET "isActive" = NOT "isActive",
              "updatedAt" = NOW()
          WHERE id = ${id}::text
          RETURNING 
            id,
            "cityId",
            name,
            description,
            ST_AsGeoJSON(boundary)::json as boundary,
            "isActive",
            "createdAt",
            "updatedAt"
        `

        if (!result || (Array.isArray(result) && result.length === 0)) {
          set.status = 404
          return { success: false, error: 'Delivery zone not found' }
        }

        const zone = Array.isArray(result) ? result[0] : result

        return {
          success: true,
          data: zone,
          message: `Zone ${(zone as any).isActive ? 'enabled' : 'disabled'} successfully`
        }
      } catch (error) {
        console.error('Error toggling zone status:', error)
        set.status = 500
        return { success: false, error: 'Failed to toggle zone status' }
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )

  /**
   * DELETE /api/zones-manager/zones/:id
   * Delete a delivery zone
   * 
   * @authentication Bearer token (staff)
   * @returns Success message
   */
  .delete(
    '/zones/:id',
    async ({ jwt, bearer, set, params }) => {
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

      try {
        const { id } = params

        const result = await prisma.$executeRaw`
          DELETE FROM delivery_zones
          WHERE id = ${id}::text
        `

        if (result === 0) {
          set.status = 404
          return { success: false, error: 'Delivery zone not found' }
        }

        return {
          success: true,
          message: 'Delivery zone deleted successfully'
        }
      } catch (error) {
        console.error('Error deleting zone:', error)
        set.status = 500
        return { success: false, error: 'Failed to delete delivery zone' }
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )

  /**
   * GET /api/zones-manager/cities
   * Get all cities for zone management
   * 
   * @authentication Bearer token (staff)
   * @returns Array of cities
   */
  .get(
    '/cities',
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

      try {
        const cities = await prisma.$queryRaw`
          SELECT 
            id,
            name,
            country,
            state,
            ST_AsGeoJSON("centerPoint")::json as "centerPoint",
            "isActive",
            timezone,
            "createdAt",
            "updatedAt"
          FROM cities
          ORDER BY name ASC
        `

        return {
          success: true,
          data: cities
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
        set.status = 500
        return { success: false, error: 'Failed to fetch cities' }
      }
    }
  )

  /**
   * POST /api/zones-manager/test-location
   * Test if a location is within a specific zone
   * 
   * @authentication Bearer token (staff)
   * @body zoneId, latitude, longitude
   * @returns Boolean indicating if location is in zone
   */
  .post(
    '/test-location',
    async ({ jwt, bearer, set, body }) => {
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

      try {
        const { zoneId, latitude, longitude } = body as {
          zoneId: string
          latitude: number
          longitude: number
        }

        const result = await prisma.$queryRaw`
          SELECT 
            dz.id,
            dz.name,
            ST_Contains(
              dz.boundary,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
            ) as "isInside"
          FROM delivery_zones dz
          WHERE dz.id = ${zoneId}::text
        `

        if (!result || (Array.isArray(result) && result.length === 0)) {
          set.status = 404
          return { success: false, error: 'Zone not found' }
        }

        const zone = Array.isArray(result) ? result[0] : result

        return {
          success: true,
          data: {
            zoneId: (zone as any).id,
            zoneName: (zone as any).name,
            isInside: (zone as any).isInside,
            message: (zone as any).isInside 
              ? `Location is inside ${(zone as any).name}` 
              : `Location is outside ${(zone as any).name}`
          }
        }
      } catch (error) {
        console.error('Error testing location:', error)
        set.status = 500
        return { success: false, error: 'Failed to test location' }
      }
    },
    {
      body: t.Object({
        zoneId: t.String(),
        latitude: t.Number(),
        longitude: t.Number()
      })
    }
  )
