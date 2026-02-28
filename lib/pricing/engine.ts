import { prisma } from "lib/prisma"

export async function calculateTicketPrice(ticketTypeId: string, quantity: number) {
  const now = new Date()

  const ticketType = await prisma.ticketType.findUnique({
  where: { id: ticketTypeId },
  include: {
    pricingRules: true,
  },
})


  if (!ticketType) throw new Error("Ticket type not found")

  let finalPrice = ticketType.price

  for (const rule of ticketType.pricingRules) {
    if (
      rule.startDate &&
      rule.endDate &&
      now >= rule.startDate &&
      now <= rule.endDate
    ) {
      if (rule.price) {
        finalPrice = rule.price
      }
    }
  }

  return finalPrice * quantity
}
