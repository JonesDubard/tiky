// lib/tickets/generate.ts
import { prisma } from "lib/prisma"
import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"

export async function generateTicketsForOrder(
  orderId: string,
  quantities?: Record<string, number> // ✅ Accept quantities directly
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      TicketReservation: true,
    },
  })

  if (!order) throw new Error(`Order ${orderId} not found`)
  if (order.ticketGenerated) {
    console.log(`Tickets already generated for order ${orderId}`)
    return
  }

  // ✅ Use quantities passed in directly if no reservations exist
  const hasReservations = order.TicketReservation.length > 0

  if (!hasReservations && !quantities) {
    throw new Error(`No reservations or quantities provided for order ${orderId}`)
  }

  if (hasReservations) {
    // Use reservations (production flow)
    for (const reservation of order.TicketReservation) {
      for (let i = 0; i < reservation.quantity; i++) {
        const qrCode = uuidv4()
        const qrImage = await QRCode.toDataURL(qrCode, {
          width: 300,
          margin: 2,
          color: { dark: "#1a1a1a", light: "#ffffff" },
        })
        await prisma.ticketInstance.create({
          data: { qrCode, qrImage, status: "PAID", ticketTypeId: reservation.ticketTypeId, orderId },
        })
      }
    }
  } else if (quantities) {
    // ✅ Use quantities directly (current flow without reservations)
    for (const [ticketTypeId, qty] of Object.entries(quantities)) {
      for (let i = 0; i < qty; i++) {
        const qrCode = uuidv4()
        const qrImage = await QRCode.toDataURL(qrCode, {
          width: 300,
          margin: 2,
          color: { dark: "#1a1a1a", light: "#ffffff" },
        })
        await prisma.ticketInstance.create({
          data: { qrCode, qrImage, status: "PAID", ticketTypeId, orderId },
        })
      }
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", ticketGenerated: true },
  })

  console.log(`✅ Tickets generated for order ${orderId}`)
}