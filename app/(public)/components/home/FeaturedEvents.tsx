// app/(public)/components/home/FeaturedEvents.tsx
import EventCard from "@/components/EventCard";
import { PublicEvent } from '@/types/events';


export interface PublicEvent {
  id: string
  title: string
  description?: string
  date: string
  location?: string
  imageUrl?: string
  tickets?: {
    type: string
    price: number
    quantity: number
  }[]
}

interface FeaturedEventsProps {
  events: PublicEvent[]
}

export default function FeaturedEvents({ events }: FeaturedEventsProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        No upcoming events
      </div>
    )
  }

  return (
    <section
      className="
        grid gap-6
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          //href={`/events/${event.id}`} // 👈 critical
        />
      ))}
    </section>
  )
}
