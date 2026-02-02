// app/events/page.tsx
import { prisma } from '@/lib/prisma';
import EventCard from '@/components/EventCard';
import Link from 'next/link';
import { CalendarDays, MapPin, Filter } from 'lucide-react';

async function getEvents() {
  return await prisma.event.findMany({
    where: {
      published: true,
      date: { gte: new Date() }
    },
    include: {
      tickets: {
        select: {
          price: true,
          type: true
        }
      },
      organizer: {
        select: {
          name: true,
          image: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  });
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/20 rounded-lg">
              <CalendarDays className="w-6 h-6 text-brand-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Upcoming Events in <span className="text-brand-primary">Liberia</span>
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-3xl">
            Discover amazing events happening near you. From music concerts to sports tournaments, find your next experience.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-primary rounded-full animate-pulse"></div>
              <span className="font-medium">{events.length} Events</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-accent" />
              <span className="font-medium">Multiple Venues</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-subtle to-brand-primary/20 flex items-center justify-center">
              <CalendarDays className="w-16 h-16 text-brand-primary/50" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No upcoming events
            </h3>
            <p className="text-slate-600 mb-8">
              Check back soon for exciting events in Liberia!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Filter Bar */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  All Events ({events.length})
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  All Events ({events.length})
                </h2>
                <p className="text-slate-600">Book your tickets now</p>
              </div>
              <div className="flex items-center gap-4">
                <select className="px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option>Sort by: Date</option>
                  <option>Sort by: Price</option>
                  <option>Sort by: Popularity</option>
                </select>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={{
                  id: event.id,
                  title: event.title,
                  description: event.description ?? undefined,
                  date: event.date.toISOString(),
                  location: event.location ?? undefined,
                  imageUrl: event.imageUrl ?? undefined,
                  tickets: event.tickets.map(t => ({
                    type: t.type,
                    price: t.price,
                    quantity: 0
                  }))
                }} />
              ))}
            </div>

            {/* Load More (Future pagination) */}
            {events.length > 9 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 border border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors">
                  Load More Events
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}