import { prisma } from "lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ticket = await prisma.ticketInstance.findUnique({
    where: { id: (await params).id },
    include: { ticketType: true, order: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const html = `
    <html>
      <body style="font-family:sans-serif;">
        <h1>${ticket.ticketType.name}</h1>
        <p>Order: ${ticket.orderId}</p>
        <img src="${ticket.qrImage}" />
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}
