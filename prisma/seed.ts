// prisma/seed.ts - CORRECTED VERSION
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedPolls(adminId: string) {
  console.log('📊 Creating featured polls...')
  
  const polls = [
    {
      title: 'Which Liberian artist should headline our next festival?',
      description: 'Help us decide the main act for the upcoming music festival',
      options: ['K-Zee', 'Takun J', 'CIC', 'F.A.', 'DenG']
    },
    {
      title: 'What type of events do you want to see more in Liberia?',
      description: 'Your opinion helps us bring better events to the community',
      options: ['Music Concerts', 'Tech Conferences', 'Food Festivals', 'Sports Events', 'Art Exhibitions']
    },
    {
      title: 'Which payment method do you prefer for tickets?',
      description: 'We want to improve our payment options',
      options: ['MTN MoMo', 'Orange Money', 'Bank Card', 'Cash on Delivery']
    }
  ]

  for (const [index, pollData] of polls.entries()) {
    const poll = await prisma.poll.create({
      data: {
        title: pollData.title,
        description: pollData.description,
        isFeatured: true,
        status: 'ACTIVE',
        creatorId: adminId,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    })

    // Add options
    for (const [optIndex, optionText] of pollData.options.entries()) {
      await prisma.option.create({
        data: {
          text: optionText,
          pollId: poll.id,
        }
      })
    }

    // Add some demo votes
    for (let i = 0; i < 10 + Math.random() * 20; i++) {
      const options = await prisma.option.findMany({
        where: { pollId: poll.id }
      })
      const randomOption = options[Math.floor(Math.random() * options.length)]
      
      await prisma.vote.create({
        data: {
          pollId: poll.id,
          optionId: randomOption.id,
          userId: `demo-voter-${i}-${poll.id}`
        }
      })
    }

    console.log(`✅ Created poll: ${poll.title} with ${pollData.options.length} options`)
  }
}

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

  // 🎯 CRITICAL: CALL THE SEED POLLS FUNCTION
  await seedPolls(admin.id)

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