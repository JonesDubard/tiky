// /lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// 1. Define the global object to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 2. Initialize Prisma with specific logging to catch errors early
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // Don't log every query in production to save memory
  })

// 3. In development, save the instance to the global object
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma