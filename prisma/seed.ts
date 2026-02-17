// import { PrismaClient } from '@prisma/client'
// import { hash } from 'bcryptjs'

// const prisma = new PrismaClient()

// async function main() {
//   console.log('🌱 Starting seeding...')

//   // Create admin user
//   const adminPassword = await hash("Admin123!", 10)
//   const admin = await prisma.user.upsert({
//     where: { email: "admin@Tiky.com" },
//     update: {},
//     create: {
//       email: "admin@Tiky.com",
//       name: "Admin User",
//       password: adminPassword,
//       role: "ADMIN"
//     }
//   })
//   console.log('✅ Admin created:', admin.email)

//   // Create organizer user
//   const organizerPassword = await hash("Organizer123!", 10)
//   const organizer = await prisma.user.upsert({
//     where: { email: "organizer@Tiky.com" },
//     update: {},
//     create: {
//       email: "organizer@Tiky.com",
//       name: "Event Organizer",
//       password: organizerPassword,
//       role: "ORGANIZER"
//     }
//   })
//   console.log('✅ Organizer created:', organizer.email)

//   // Create regular user
//   const userPassword = await hash("User123!", 10)
//   const user = await prisma.user.upsert({
//     where: { email: "user@Tiky.com" },
//     update: {},
//     create: {
//       email: "user@Tiky.com",
//       name: "Regular User",
//       password: userPassword,
//       role: "USER"
//     }
//   })
//   console.log('✅ Regular user created:', user.email)

//   // Create sample event
//   const event = await prisma.event.create({
//     data: {
//       title: "Liberia Tech Conference 2026",
//       description: "Join us for the biggest tech conference in Liberia!",
//       date: new Date("2026-03-15T09:00:00Z"),
//       location: "Monrovia City Hall, Liberia",
//       imageUrl: "/images/tech-conference.jpg",
//       published: true,
//       isFeatured: true,
//       createdById: organizer.id,
//       ticketTypes: {
//         create: [
//           {
//             name: "Early Bird",
//             price: 2500, // LRD
//             quantity: 100,
//             maxPerOrder: 2,
//             description: "Limited early bird tickets"
//           },
//           {
//             name: "Regular",
//             price: 3500,
//             quantity: 200,
//             maxPerOrder: 5,
//             description: "Regular admission"
//           },
//           {
//             name: "VIP",
//             price: 5000,
//             quantity: 50,
//             maxPerOrder: 1,
//             description: "VIP access with lunch"
//           }
//         ]
//       }
//     }
//   })
//   console.log('✅ Sample event created:', event.title)

//   // Create sample poll
//   const poll = await prisma.poll.create({
//     data: {
//       title: "What topics interest you most?",
//       description: "Help us plan future events",
//       status: "ACTIVE",
//       endDate: new Date("2026-03-01T23:59:59Z"),
//       isFeatured: true,
//       creatorId: organizer.id,
//       eventId: event.id,
//       options: {
//         create: [
//           { text: "Web Development" },
//           { text: "Mobile Apps" },
//           { text: "AI & Machine Learning" },
//           { text: "Cybersecurity" },
//           { text: "Startup Funding" }
//         ]
//       }
//     }
//   })
//   console.log('✅ Sample poll created:', poll.title)

//   console.log('🎉 Seeding completed successfully!')
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seeding failed:', e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })

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