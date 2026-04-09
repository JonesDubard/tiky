// app/(public)/profile/tickets/page.tsx (or my-tickets/page.tsx)
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import MyTicketsClient from "./MyTicketsClient"

export const dynamic = "force-dynamic"

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/my-tickets")
  }

  // Fetch user's orders with tickets
  const rawOrders = await prisma.order.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      createdAt: true,
      referenceCode: true,
      paymentMethod: true,
      proofUrl: true,
      tickets: {
        select: {
          id: true,
          status: true,
          qrCode: true,
          qrImage: true,
          createdAt: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              price: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  date: true,
                  location: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Convert all Date objects to ISO strings
  const orders: OrderWithTickets[] = rawOrders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    tickets: order.tickets.map((ticket) => ({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      ticketType: {
        ...ticket.ticketType,
        event: {
          ...ticket.ticketType.event,
          date: ticket.ticketType.event.date.toISOString(),
        },
      },
    })),
  }))

  const userName = session.user.name ?? session.user.email.split("@")[0]

  return <MyTicketsClient orders={orders} userName={userName} />
}

// Type export so client component can import it
export type TicketItem = {
  id: string
  status: string
  qrCode: string
  qrImage: string | null
  createdAt: string
  ticketType: {
    id: string
    name: string
    price: number
    event: {
      id: string
      title: string
      date: string
      location: string
      imageUrl: string | null
    }
  }
}

export type OrderWithTickets = {
  id: string
  status: string
  totalPrice: number
  createdAt: string
  referenceCode: string | null
  paymentMethod: string | null
  proofUrl: string | null
  tickets: TicketItem[]
}