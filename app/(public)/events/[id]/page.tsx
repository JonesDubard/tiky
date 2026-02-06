// app/(public)/events/[id]/page.tsx - COMPLETE FIXED VERSION
import { prisma } from 'lib/prisma';
import TicketSelector from 'components/Events/TicketSelector';
import { ArrowLeft, Share2, Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getEventData(id: string) {
  try {
    // Validate id is not undefined
    if (!id || id === 'undefined') {
      return null;
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        tickets: {
          select: {
            id: true,
            type: true,
            price: true,
            quantity: true,
            status: true
          },
          where: {
            status: { in: ['PENDING', 'PAID'] } // Only show available tickets
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    if (!event) {
      return null;
    }

    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

async function getRelatedEvents(eventId: string) {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date()
        },
        NOT: {
          id: eventId
        }
      },
      include: {
        tickets: {
          select: {
            price: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 3
    });
    return events;
  } catch (error) {
    console.error('Error fetching related events:', error);
    return [];
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage(props: PageProps) {
  // FIX: Properly await params
  const params = await props.params;
  const id = params.id;
  
  if (!id || id === 'undefined') {
    notFound();
  }

  const [event, relatedEvents] = await Promise.all([
    getEventData(id),
    getRelatedEvents(id)
  ]);
  
  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.date);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/events"
              className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Events</span>
            </Link>
            <button className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {event.isFeatured && (
                  <div className="flex items-center gap-1.5 bg-brand-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    FEATURED
                  </div>
                )}
                {event.published && (
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {event.title}
              </h1>
              <p className="text-lg text-slate-600 mb-6">
                {event.description || "Join us for an amazing event!"}
              </p>
            </div>

            {/* Event Image */}
            <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-subtle to-brand-primary/20">
              {event.imageUrl ? (
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-brand-primary/10 to-brand-accent/10">
                  <span className="text-2xl font-bold text-slate-400">Event Image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Event Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Date & Time</h3>
                    <p className="text-slate-600">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-slate-600">
                      {eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900">Location</h3>
                    <p className="text-slate-600">{event.location || "Location to be announced"}</p>
                    <button className="text-brand-primary hover:text-brand-accent font-medium mt-1">
                      View on map →
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Users className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2">Tickets Available</h3>
                    {event.tickets.length === 0 ? (
                      <p className="text-slate-500">No tickets available yet</p>
                    ) : (
                      <div className="space-y-3">
                        {event.tickets.map((ticket) => (
                          <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                            <div>
                              <span className="font-medium text-slate-900">{ticket.type || "General Admission"}</span>
                              <span className="text-sm text-slate-500 ml-3">
                                {ticket.quantity > 0 
                                  ? `Remaining: ${ticket.quantity}` 
                                  : "SOLD OUT"}
                              </span>
                            </div>
                            <span className="font-bold text-brand-accent">
                              ${ticket.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Total tickets sold: {event._count.tickets}
                      </p>
                    </div>
                  </div>
                </div>

                {event.createdBy && (
                  <div className="flex items-start gap-4">
                    <Users className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-slate-900">Organizer</h3>
                      <p className="text-slate-600">{event.createdBy.name || event.createdBy.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Selector */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <TicketSelector 
                event={event}
                tickets={event.tickets}
              />
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map(relatedEvent => (
                <Link 
                  key={relatedEvent.id} 
                  href={`/events/${relatedEvent.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-900 mb-2">{relatedEvent.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      {new Date(relatedEvent.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">
                      {relatedEvent.tickets.length > 0 
                        ? `From $${Math.min(...relatedEvent.tickets.map(t => t.price)).toFixed(2)}`
                        : "Free"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}