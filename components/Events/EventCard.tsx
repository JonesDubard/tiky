// app/(public)/components/home/EventCard.tsx
'use client';
import { Calendar, MapPin, Users, Ticket as TicketIcon } from 'lucide-react';
import Image from 'next/image';
import Link from "next/link";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    location?: string | null;
    imageUrl?: string | null;
    isFeatured?: boolean;
    price?: number | null;
    ticketTypes: Array<{
      id?: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const ticketTypes = event.ticketTypes || [];
  const lowestPrice = ticketTypes.length > 0
    ? Math.min(...ticketTypes.map(t => t.price))
    : 0;
  const totalTickets = ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const ticketsSold = Math.floor(totalTickets * 0.7);

  return (
    <Link href={`/events/${event.id}`} className="block focus:outline-none">
      <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 card-hover border border-brand-subtle/30">
        
        {event.isFeatured && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-1.5 bg-brand-accent text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              FEATURED
            </div>
          </div>
        )}

        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-brand-subtle to-brand-primary/20">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TicketIcon className="w-16 h-16 text-brand-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-primary transition-colors">
            {event.title}
          </h3>

          <p className="text-slate-600 mb-4 line-clamp-2 text-sm">
            {event.description || 'Join us for an unforgettable experience!'}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium">
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-sm">
                {eventDate.toLocaleTimeString('en-US', {
                  hour: 'numeric', minute: '2-digit',
                })}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span className="text-sm font-medium">{event.location}</span>
              </div>
            )}

            {ticketTypes.length > 0 && (
              <div className="flex items-center gap-3 text-slate-600">
                <Users className="w-4 h-4 text-brand-primary" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Tickets Available</span>
                    <span className="font-bold text-brand-primary">
                      {ticketsSold}/{totalTickets}
                    </span>
                  </div>
                  <div className="h-2 bg-brand-subtle/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-500"
                      style={{ width: `${totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-brand-subtle/30">
            <div>
              <div className="text-xs text-slate-500 mb-1">Starting from</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-brand-accent">
                  ${lowestPrice.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">/ticket</span>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm px-6 py-3">
              <TicketIcon className="w-4 h-4" />
              Book Now
            </button>
          </div>
        </div>

        <div className="absolute inset-0 border-2 border-transparent group-hover:border-brand-primary/20 rounded-2xl pointer-events-none transition-all duration-300" />
      </div>
    </Link>
  );
}