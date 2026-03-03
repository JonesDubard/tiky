import { prisma } from "lib/prisma"

const RESERVATION_MINUTES = 10

export async function createReservation(
  userId: string,
  ticketTypeId: string,
  orderId: string,      // ✅ added required parameter
  quantity: number
) {
  return await prisma.$transaction(async (tx) => {
    const ticketType = await tx.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        tickets: true,
        reservations: true,
      },
    })

    if (!ticketType) throw new Error("Ticket type not found")

    const activeReservations = ticketType.reservations.filter(
      (r) => r.expiresAt > new Date()
    )

    const soldCount = ticketType.tickets.length
    const reservedCount = activeReservations.length

    const available =
      ticketType.quantity - soldCount - reservedCount

    if (available < quantity) {
      throw new Error("Not enough tickets available")
    }

    const reservations = []

    for (let i = 0; i < quantity; i++) {
      const reservation = await tx.ticketReservation.create({
        data: {
          userId,
          ticketTypeId,
          orderId,                 // ✅ required field added
          quantity: 1,             // ✅ required field added (each reservation holds one ticket)
          expiresAt: new Date(
            Date.now() + RESERVATION_MINUTES * 60 * 1000
          ),
        },
      })

      reservations.push(reservation)
    }

    return reservations
  })
}