import Elysia from "elysia";
import { prisma } from "../../lib/prisma";

export const healthRoutes = new Elysia({
  name: "health",
  prefix: "/api/health",
})
  // Test server
  .get("/", () => ({
    ok: true,
    ts: new Date().toISOString(),
    service: "Digital Menu API",
    version: "1.0.0"
  }))
  
  // Database health check
  .get("/db", async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        ok: true,
        database: "connected",
        ts: new Date().toISOString()
      }
    } catch (error) {
      return {
        ok: false,
        database: "disconnected",
        error: error instanceof Error ? error.message : 'Unknown error',
        ts: new Date().toISOString()
      }
    }
  })
  
  // API status with basic stats
  .get("/status", async () => {
    try {
      const [categoryCount, itemCount, orderCount] = await Promise.all([
        prisma.category.count(),
        prisma.item.count(),
        prisma.order.count()
      ])
      
      return {
        ok: true,
        stats: {
          categories: categoryCount,
          items: itemCount,
          orders: orderCount
        },
        ts: new Date().toISOString()
      }
    } catch (error) {
      return {
        ok: false,
        error: "Failed to fetch stats",
        ts: new Date().toISOString()
      }
    }
  })
