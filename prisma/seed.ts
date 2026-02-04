import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@tiky.com'
  const password = 'admintiky123!'

  const hashedPassword = await bcrypt.hash(password, 12)

  // Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
    },
    create: {
      email,
      name: 'Dev Admin',
      role: 'ADMIN',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Admin user ready:', admin.email)

  // Create 5 featured events
  for (let i = 1; i <= 5; i++) {
    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + (i * 7))
    
    const event = await prisma.event.create({
      data: {
        title: `Liberian Music Festival Vol. ${i}`,
        description: `Experience the best of Liberian music with top artists at this amazing festival. Day ${i} features special performances!`,
        date: eventDate,
        location: 'Monrovia City Hall, Liberia',
        imageUrl: `https://picsum.photos/600/400?random=${i}`,
        isFeatured: true,  
        published: true,
        createdById: admin.id,
      }
    })
    
    // Add tickets to each event
    await prisma.ticket.createMany({
      data: [
        {
          type: 'General Admission',
          price: 5000,
          quantity: 100,
          eventId: event.id,
          userId: admin.id,
        },
        {
          type: 'VIP',
          price: 15000,
          quantity: 50,
          eventId: event.id,
          userId: admin.id,
        }
      ]
    })
    
    console.log(`✅ Created featured event: ${event.title}`)
  }

  console.log('🎉 Database seeded successfully!')
  console.log('🔑 Login with:', email, '/', password)
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })