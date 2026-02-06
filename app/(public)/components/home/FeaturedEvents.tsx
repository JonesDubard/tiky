// app/(public)/components/home/FeaturedEvents.tsx - SIMPLER VERSION
import EventCard from './EventCard'
import { PublicEvent } from 'types/events'

interface FeaturedEventsProps {
  events: PublicEvent[]
}

// Helper function to safely convert to ISO string
const toSafeISOString = (date: unknown): string => {
  if (!date) {
    return new Date().toISOString();
  }
  
  // If it's already a string, return it
  if (typeof date === 'string') {
    return date;
  }
  
  // If it quacks like a Date, try to convert it
  if (date && typeof date === 'object' && 'toISOString' in date) {
    try {
      return (date as any).toISOString();
    } catch (error) {
      console.warn('Failed to convert Date to ISO string:', error);
    }
  }
  
  // Try to parse it as a Date
  try {
    const dateObj = new Date(date as any);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString();
    }
  } catch (error) {
    console.warn('Failed to parse date:', date);
  }
  
  // Fallback
  return new Date().toISOString();
};

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
        {events.map((event) => {
          // Transform the event with safe date handling
          const safeEvent = {
            ...event,
            date: toSafeISOString(event.date)
          };
          
          return (
            <EventCard
              key={event.id}
              event={safeEvent}
            />
          );
        })}
      </div>
    </section>
  )
}