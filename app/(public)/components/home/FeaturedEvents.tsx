// app/(public)/components/home/FeaturedEvents.tsx - UPDATED
import EventCard from './EventCard'
import { PublicEvent } from 'types/events'

interface FeaturedEventsProps {
  events: PublicEvent[]
}

const toSafeISOString = (date: unknown): string => {
  if (!date) return new Date().toISOString()
  if (typeof date === 'string') return date
  if (date && typeof date === 'object' && 'toISOString' in date) {
    try { return (date as any).toISOString() } catch {}
  }
  try {
    const d = new Date(date as any)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch {}
  return new Date().toISOString()
}

export default function FeaturedEvents({ events }: FeaturedEventsProps) {
  if (!events || events.length === 0) {
    return (
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Events</h2>
        <div className="text-center py-20 text-slate-500">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No featured events yet</h3>
          <p>Check back soon for exciting events!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Featured Events</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const safeEvent = {
            ...event,
            date: toSafeISOString(event.date),
            // Map tickets → ticketTypes for EventCard compatibility
            ticketTypes: event.ticketTypes ?? (event as any).tickets?.map((t: any) => ({
              id: t.id,
              name: t.type ?? t.name ?? 'General',
              price: t.price ?? 0,
              quantity: t.quantity ?? 0,
            })) ?? [],
          }

          return <EventCard key={event.id} event={safeEvent} />
        })}
      </div>
    </section>
  )
}