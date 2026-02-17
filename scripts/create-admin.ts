// scripts/create-admin.ts
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash("admin123", 10)
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@Tiky.com" },
    update: {},
    create: {
      email: "admin@Tiky.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  })
  
  console.log("✅ Admin user created/updated:", admin.email)
  console.log("📧 Email: admin@Tiky.com")
  console.log("🔑 Password: admin123")
  console.log("👑 Role: ADMIN")
}

createAdminUser()
  .catch((e) => {
    console.error("❌ Error creating admin:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
