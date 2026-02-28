import { prisma } from "lib/prisma"

export async function cleanupExpiredReservations() {
  const expired = await prisma.ticketReservation.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  if (!expired.length) return

  await prisma.ticketReservation.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })

  console.log(`🧹 Cleaned ${expired.length} expired reservations`)
}
