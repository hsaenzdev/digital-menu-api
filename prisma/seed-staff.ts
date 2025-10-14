/**
 * Seed staff members for development
 * Creates admin, manager, and staff users with demo PINs
 */

import { PrismaClient } from '@prisma/client'
import { hashPin } from '../src/lib/auth'

const prisma = new PrismaClient()

async function seedStaff() {
  console.log('🔐 Seeding staff members...')

  // Admin user
  const adminPin = await hashPin('1234')
  const admin = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      pin: adminPin,
      role: 'ADMIN',
      firstName: 'Carlos',
      lastName: 'Administrador',
      isActive: true
    }
  })
  console.log(`  ✓ Admin: ${admin.username} (PIN: 1234)`)

  // Manager user
  const managerPin = await hashPin('5678')
  const manager = await prisma.staff.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      pin: managerPin,
      role: 'MANAGER',
      firstName: 'Maria',
      lastName: 'Gerente',
      isActive: true
    }
  })
  console.log(`  ✓ Manager: ${manager.username} (PIN: 5678)`)

  // Regular staff user
  const staffPin = await hashPin('9999')
  const staff = await prisma.staff.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      pin: staffPin,
      role: 'STAFF',
      firstName: 'Juan',
      lastName: 'Empleado',
      isActive: true
    }
  })
  console.log(`  ✓ Staff: ${staff.username} (PIN: 9999)`)

  console.log(`✅ Created ${3} staff members\n`)
}

export { seedStaff }

// Run directly if this file is executed
if (require.main === module) {
  seedStaff()
    .catch((e) => {
      console.error('❌ Error seeding staff:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
