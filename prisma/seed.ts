import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seeding...')

  // Create admin user
  const adminPassword = await hash("Admin123!", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@tikky.com" },
    update: {},
    create: {
      email: "admin@tikky.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN"
    }
  })
  console.log('✅ Admin created:', admin.email)

  // Create organizer user
  const organizerPassword = await hash("Organizer123!", 10)
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@tikky.com" },
    update: {},
    create: {
      email: "organizer@tikky.com",
      name: "Event Organizer",
      password: organizerPassword,
      role: "ORGANIZER"
    }
  })
  console.log('✅ Organizer created:', organizer.email)

  // Create regular user
  const userPassword = await hash("User123!", 10)
  const user = await prisma.user.upsert({
    where: { email: "user@tikky.com" },
    update: {},
    create: {
      email: "user@tikky.com",
      name: "Regular User",
      password: userPassword,
      role: "USER"
    }
  })
  console.log('✅ Regular user created:', user.email)

  // Create sample event
  const event = await prisma.event.create({
    data: {
      title: "Liberia Tech Conference 2026",
      description: "Join us for the biggest tech conference in Liberia!",
      date: new Date("2026-03-15T09:00:00Z"),
      location: "Monrovia City Hall, Liberia",
      imageUrl: "/images/tech-conference.jpg",
      published: true,
      isFeatured: true,
      createdById: organizer.id,
      ticketTypes: {
        create: [
          {
            name: "Early Bird",
            price: 2500, // LRD
            quantity: 100,
            maxPerOrder: 2,
            description: "Limited early bird tickets"
          },
          {
            name: "Regular",
            price: 3500,
            quantity: 200,
            maxPerOrder: 5,
            description: "Regular admission"
          },
          {
            name: "VIP",
            price: 5000,
            quantity: 50,
            maxPerOrder: 1,
            description: "VIP access with lunch"
          }
        ]
      }
    }
  })
  console.log('✅ Sample event created:', event.title)

  // Create sample poll
  const poll = await prisma.poll.create({
    data: {
      title: "What topics interest you most?",
      description: "Help us plan future events",
      status: "ACTIVE",
      endDate: new Date("2026-03-01T23:59:59Z"),
      isFeatured: true,
      creatorId: organizer.id,
      eventId: event.id,
      options: {
        create: [
          { text: "Web Development" },
          { text: "Mobile Apps" },
          { text: "AI & Machine Learning" },
          { text: "Cybersecurity" },
          { text: "Startup Funding" }
        ]
      }
    }
  })
  console.log('✅ Sample poll created:', poll.title)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })