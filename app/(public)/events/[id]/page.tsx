// app/(public)/events/[id]/page.tsx
import { prisma } from "lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Calendar, MapPin, Clock, Users } from "lucide-react"
import { format } from "date-fns"
import TicketPurchaseCard from "components/Events/TicketPurchaseCard"


// ── Force dynamic rendering ───────────────────────────────────────────────────
// Without this Next.js caches the page at build time and ticket quantities
// shown to users will never update after a purchase. Setting dynamic to
// "force-dynamic" ensures every request hits the database for fresh data.
// revalidatePath() calls in the payment route will also work correctly.

export const dynamic = "force-dynamic"

interface EventPageProps {
  params: Promise<{ id: string }>
}

async function getEvent(id: string) {
  if (!id) return null

  try {
    return await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { name: true, email: true } },
        ticketTypes: { orderBy: { price: "asc" } },
        _count: { select: { ticketTypes: true } },
      },
    })
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

// Fetch poll separately (it does not belong inside getEvent)
async function getPollForEvent(eventId: string) {
  try {
    return await prisma.poll.findFirst({
      where: {
        eventId,
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        options: { orderBy: { createdAt: "asc" } },
      },
    })
  } catch (error) {
    console.error("Error fetching poll:", error)
    return null
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  if (!id) notFound()

  // Fetch event and poll in parallel (both independent)
  const [event, poll] = await Promise.all([
    getEvent(id),
    getPollForEvent(id),
  ])

  if (!event) notFound()

  const totalRemaining = event.ticketTypes.reduce((sum, t) => sum + t.quantity, 0)
  const isSoldOut = totalRemaining === 0

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gray-900">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover opacity-80"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-primary to-brand-accent flex items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white opacity-20">
              {event.title.charAt(0)}
            </h1>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              {isSoldOut && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Sold Out
                </span>
              )}
              {!isSoldOut && totalRemaining <= 10 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Only {totalRemaining} left!
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {format(new Date(event.date), "h:mm a")}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {event.description || "No description available."}
              </p>
            </section>

            {poll && (

  <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">

    <div className="flex items-start justify-between gap-4">

      <div className="flex-1">

        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 block">

          Live Voting

        </span>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{poll.title}</h3>

        {poll.description && (

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{poll.description}</p>

        )}

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
          <span>🗳️ {poll.options.length} contestants</span>
          {poll.endDate && (
            <span>⏰ Ends {format(new Date(poll.endDate), "MMM d, yyyy")}</span>
          )}
        </div>
        
        <a
          href={`/polls/${poll.id}`}
          className="inline-block px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          Vote Now →
        </a>

      </div>

    </div>

  </section>

)}
            {/* Live ticket availability summary */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Availability</h2>
              {event.ticketTypes.length === 0 ? (
                <p className="text-gray-500">No tickets configured for this event yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {event.ticketTypes.map((ticket) => (
                    <li key={ticket.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold text-gray-900">{ticket.name}</p>
                        <p className="text-sm text-gray-500">
                          {ticket.quantity > 0 ? (
                            <>
                              <span className="text-green-600 font-medium">
                                {ticket.quantity} remaining
                              </span>
                            </>
                          ) : (
                            <span className="text-red-500 font-medium">Sold out</span>
                          )}
                        </p>
                      </div>
                      <span className="font-bold text-brand-accent">
                        ${ticket.price.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Organizer */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">
                    {event.createdBy.name || "Event Organizer"}
                  </p>
                  <p className="text-sm text-gray-600">{event.createdBy.email}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right — purchase card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <TicketPurchaseCard eventId={event.id} tickets={event.ticketTypes} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}