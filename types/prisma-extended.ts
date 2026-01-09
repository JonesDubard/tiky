import { PrismaClient } from '@prisma/client'

// Prevent multiple instances in development (Next.js hot reload)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query'], // Optional: Logs SQL queries in development
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma