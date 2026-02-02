// components/events/EventCard.tsx
'use client';

import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { EventWithDetails } from '@/types';

interface EventCardProps {
  event: EventWithDetails;
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  
  const cheapestTicket = event.tickets.length > 0 
    ? Math.min(...event.tickets.map(t => t.price))
    : null;

  return (
    <Link 
      href={`/events/${event.id}`}
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.99]"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center">
            <CalendarDays className="w-16 h-16 text-brand-primary/40" />
          </div>
        )}
        {/* Date Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-sm">
          <div className="text-sm font-bold text-brand-primary">
            {eventDate.getDate()}
          </div>
          <div className="text-xs text-slate-500 uppercase">
            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-brand-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">
              {event.description || 'Join us for an unforgettable experience!'}
            </p>
          </div>
        </div>

        {/* Info Icons */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CalendarDays className="w-4 h-4 text-brand-primary" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-brand-accent" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          
          {/* Tickets Info */}
          {cheapestTicket && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Tickets from</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                ${cheapestTicket.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button className="w-full mt-4 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 group-hover:gap-3 group-hover:scale-[1.02]">
          View Details
        </button>
      </div>
    </Link>
  );
}