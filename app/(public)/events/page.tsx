// app/(public)/events/page.tsx - FIXED VERSION
import EventCard from 'components/Events/EventCard'
import { prisma } from 'lib/prisma'
import { PublicEvent } from '@/types/events'

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date()
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        published: true,
        isFeatured: true,
        price: true,
        createdAt: true,
        tickets: {
          select: {
            type: true,
            price: true,
            quantity: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 24
    })

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      date: event.date.toISOString(),
      location: event.location ?? undefined,
      imageUrl: event.imageUrl ?? undefined,
      published: event.published,
      isFeatured: event.isFeatured,
      price: event.price,
      // Convert nullable type to string with default
      tickets: event.tickets.map(ticket => ({
        type: ticket.type ?? 'General Admission',  // Default value for null
        price: ticket.price,
        quantity: ticket.quantity
      })),
      createdAt: event.createdAt
    }))
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return []
  }
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 via-white to-white">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Discover amazing experiences, concerts, workshops, and more happening near you.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}  // This will now match the expected type
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No upcoming events</h3>
            <p className="text-slate-500">Check back later for new events!</p>
          </div>
        )}
      </div>
    </div>
  )
}