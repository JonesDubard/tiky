// app/(public)/components/home/FeaturedEvents.tsx - FIXED
import EventCard from './EventCard'
import { PublicEvent } from '@/types/events'

interface FeaturedEventsProps {
  events: PublicEvent[]
}

export default function FeaturedEvents({ events }: FeaturedEventsProps) {
  if (!events || events.length === 0) {
    return (
      <section className="py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Featured Events
        </h2>
        <div className="text-center py-20 text-slate-500">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No featured events yet
          </h3>
          <p className="text-slate-500">
            Check back soon for exciting events!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">
        Featured Events
      </h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={{
              ...event,
              date: typeof event.date === 'string' ? event.date : event.date.toISOString(),
            }}
          />
        ))}
      </div>
    </section>
  )
}