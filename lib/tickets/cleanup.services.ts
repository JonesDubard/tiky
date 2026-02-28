import { prisma } from "lib/prisma"

export async function cleanupExpiredReservations() {
  await prisma.ticketReservation.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}
