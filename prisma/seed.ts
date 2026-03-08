import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding...')

  // Clear existing data (optional - be careful in production!)
  // await prisma.$executeRaw`DELETE FROM User;`
  
  const password = await bcrypt.hash('password123', 10)

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: password,
      role: 'ADMIN',
      status: 'active',
    },
  })
  console.log('Created admin:', admin.email)

  // Create Organizer User
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      name: 'Organizer User',
      password: password,
      role: 'ORGANIZER',
      status: 'active',
    },
  })
  console.log('Created organizer:', organizer.email)

  // Create Regular User
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: password,
      role: 'USER',
      status: 'active',
    },
  })
  console.log('Created user:', user.email)

  // Create a test event for the organizer
  if (organizer) {
    await prisma.event.upsert({
      where: { id: 'test-event-1' },
      update: {},
      create: {
        id: 'test-event-1',
        title: 'Test Event 2024',
        description: 'This is a test event',
        date: new Date('2024-12-31'),
        location: 'Test Location',
        published: true,
        createdById: organizer.id,
      },
    })
    console.log('Created test event')
  }

  console.log('Seeding completed!')
  console.log('\nTest credentials:')
  console.log('Admin: admin@example.com / password123')
  console.log('Organizer: organizer@example.com / password123')
  console.log('User: user@example.com / password123')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })