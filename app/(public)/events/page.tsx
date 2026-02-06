// app/(public)/events/page.tsx - UPDATED FOR ADMIN-ONLY CREATION
import { prisma } from 'lib/prisma';
import EventCard from '../components/home/EventCard';
import { Calendar, MapPin, Filter, Search, Lock } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';

async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date() // Only future events
        }
      },
      include: {
        tickets: {
          select: {
            id: true,
            type: true,
            price: true,
            quantity: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      },
      orderBy: {
        date: 'asc' // Soonest first
      }
    });
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const [events, session] = await Promise.all([
    getEvents(),
    getServerSession(authOptions)
  ]);
  
  const isAdmin = session?.user?.role === 'ADMIN';

// In the eventsWithPrices mapping section, update to:
const eventsWithPrices = events.map(event => {
  const tickets = event.tickets || [];
  const minPrice = tickets.length > 0 
    ? Math.min(...tickets.map(t => t.price))
    : 0;
  
  const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const ticketsSold = Math.floor(totalTickets * 0.7); // Mock sold tickets for display
  
  return {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    date: event.date.toISOString(), // Convert Date to string
    location: event.location || undefined,
    imageUrl: event.imageUrl || undefined,
    tickets: tickets.map(ticket => ({
      type: ticket.type || 'General Admission',
      price: ticket.price,
      quantity: ticket.quantity
    }))
    // Note: minPrice, totalTickets, ticketsSold are NOT included
    // because your EventCard interface doesn't expect them
    // They're only used for calculations in this file
  };
});

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-accent">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Public Events in Liberia
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Browse all published events. Only verified organizers can create events.
            </p>
            
            {/* Admin Create Button */}
            {isAdmin && (
              <div className="mb-8">
                <a 
                  href="/admin/events/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:shadow-lg transition-shadow"
                >
                  <span>Create New Event</span>
                  <Lock className="w-4 h-4" />
                </a>
                <p className="text-white/80 text-sm mt-2">
                  Admin access: You can create and manage events
                </p>
              </div>
            )}
            
            {/* Search Bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                    <input
                      type="search"
                      placeholder="Search events by name, location, or category..."
                      className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/70 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Stats & Admin Notice */}
        <div className="mb-8">
          {isAdmin ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-800">Admin Mode Active</h3>
                  <p className="text-blue-600 text-sm">
                    You can create and manage events from the admin dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-slate-600 text-sm">
                Want to host an event? Contact an administrator or request organizer access.
              </p>
            </div>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-brand-primary">{events.length}</div>
              <div className="text-slate-600 text-sm">Published Events</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.isFeatured).length}
              </div>
              <div className="text-slate-600 text-sm">Featured</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => new Date(e.date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-slate-600 text-sm">This Week</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-purple-600">
                {events.filter(e => e.tickets.some(t => t.price === 0)).length}
              </div>
              <div className="text-slate-600 text-sm">Free Events</div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No events published yet</h3>
            <p className="text-slate-500 mb-6">
              {isAdmin 
                ? "Create the first event from the admin dashboard!"
                : "Check back soon for upcoming events in Liberia!"
              }
            </p>
            {isAdmin && (
              <a 
                href="/admin/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                <span>Create First Event</span>
                <Lock className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <div>
            {/* Featured Events Section */}
            {eventsWithPrices.filter(e => e.isFeatured).length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Featured Events</h2>
                    <p className="text-slate-600">Highlighted events you don't want to miss</p>
                  </div>
                  <div className="text-sm text-brand-primary font-medium">
                    {eventsWithPrices.filter(e => e.isFeatured).length} featured
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsWithPrices
                    .filter(event => event.isFeatured)
                    .map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                </div>
              </div>
            )}

            {/* All Events Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">All Published Events</h2>
                  <p className="text-slate-600">Browse all upcoming public events</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600">
                    {events.length} events
                  </div>
                  <select className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none">
                    <option>Sort by: Date</option>
                    <option>Sort by: Price</option>
                    <option>Sort by: Name</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsWithPrices.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Admin Call to Action */}
        {isAdmin && events.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-brand-primary" />
              <h3 className="text-2xl font-bold text-slate-900">Event Management</h3>
            </div>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              As an admin, you can create, edit, and manage all events from the admin dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="/admin/events/create"
                className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                Create New Event
              </a>
              <a 
                href="/admin/events"
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Manage Events
              </a>
            </div>
          </div>
        )}

        {/* Public Call to Action */}
        {!isAdmin && events.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Interested in hosting an event?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Event creation is managed by verified administrators. Contact support for organizer access or event submission.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold rounded-lg hover:shadow-lg transition-shadow">
              Contact for Event Submission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}