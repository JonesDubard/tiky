// app/(public)/components/home/FeaturedEvents.tsx
import EventCard from "@/components/EventCard"

interface FeaturedEventsProps {
  events?: any[]   // 👈 optional
}

export default function FeaturedEvents({ events = [] }: FeaturedEventsProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No upcoming events
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

