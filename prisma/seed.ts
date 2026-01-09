// prisma/seed.js (ES Module version)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create admin user - use string 'ADMIN' instead of Role.ADMIN
    const admin = await prisma.user.upsert({
      where: { email: 'admin@tikky.com' },
      update: {},
      create: {
        email: 'admin@tikky.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',  // ← string value
        emailVerified: new Date(),
      },
    })
    
    console.log(`✅ Created admin: ${admin.email}`)
    console.log('🔑 Password: admin123')
    
    // Create regular user
    const user = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        password: await bcrypt.hash('user123', 12),
        role: 'USER',  // ← string value
        emailVerified: new Date(),
      },
    })
    
    console.log(`✅ Created user: ${user.email}`)
    console.log('🎉 Seeding complete!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })