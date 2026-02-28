import { prisma } from "lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ticket = await prisma.ticketInstance.findUnique({
    where: { id: params.id },
  })

  if (!ticket) {
    return NextResponse.json(
      { error: "Invalid ticket" },
      { status: 404 }
    )
  }

  if (ticket.status !== "PAID") {
    return NextResponse.json(
      { error: "Ticket not valid" },
      { status: 400 }
    )
  }

  if (ticket.validatedAt) {
    return NextResponse.json(
      { error: "Ticket already used" },
      { status: 400 }
    )
  }

  await prisma.ticketInstance.update({
    where: { id: ticket.id },
    data: {
      status: "USED",
      validatedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
