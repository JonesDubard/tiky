import { prisma } from "lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const { qrCode } = body

  const ticket = await prisma.ticketInstance.findUnique({
    where: { qrCode },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Invalid ticket" }, { status: 404 })
  }

  if (ticket.status === "USED") {
    return NextResponse.json({ error: "Already used" }, { status: 400 })
  }

  if (ticket.status !== "PAID") {
    return NextResponse.json({ error: "Not valid" }, { status: 400 })
  }

  await prisma.ticketInstance.update({
    where: { id: ticket.id },
    data: {
      status: "USED",
      scannedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}

// // After the update, you can return more info
// const updatedTicket = await prisma.ticketInstance.update({
//   where: { id: ticket.id },
//   data: {
//     status: "USED",
//     scannedAt: new Date(),
//   },
//   include: {
//     // If you have a relation to the order/user, include it here
//     order: { include: { User: true } } 
//   }
// })

// return NextResponse.json({ 
//   success: true, 
//   message: `Ticket validated for ${updatedTicket.order.User.name}` 
// })