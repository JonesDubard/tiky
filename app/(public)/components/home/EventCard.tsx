'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from "next/link";
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    location: string;
    imageUrl: string | null;
    isFeatured?: boolean;
    ticketTypes: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get lowest ticket price
  const lowestPrice = event.ticketTypes.length > 0 
    ? Math.min(...event.ticketTypes.map(t => t.price))
    : 0;

  // Check if any tickets available
  const ticketsAvailable = event.ticketTypes.some(t => t.quantity > 0);

  // Format price consistently - CHANGED TO USD
  const formattedPrice = lowestPrice > 0 
    ? `$${lowestPrice.toLocaleString()}` 
    : 'Free';

  const eventHref = `/events/${event.id}`;

  // During SSR, render a simpler version
  if (!mounted) {
    return (
      <div className="block group">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-48 h-48 md:h-auto bg-gray-100">
              {event.imageUrl ? (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-accent" />
              )}
            </div>
            <div className="flex-1 p-5">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={eventHref} className="block group">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative w-full md:w-48 h-48 md:h-auto bg-gray-100">
            {event.imageUrl ? (
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 192px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {event.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {lowestPrice > 0 && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-sm font-semibold text-gray-900">
                  {formattedPrice}
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors">
                  {event.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {event.description || 'No description available'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-brand-primary flex-shrink-0" />
                    <span suppressHydrationWarning>
                      {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-brand-primary flex-shrink-0" />
                    <span suppressHydrationWarning>
                      {format(new Date(event.date), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-brand-primary flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  {ticketsAvailable ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {event.ticketTypes.length} ticket type{event.ticketTypes.length !== 1 ? 's' : ''} available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Sold Out
                    </span>
                  )}
                </div>
                
                <button 
                  className="inline-flex items-center px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-accent transition-colors duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = eventHref;
                  }}
                >
                  Buy Tickets
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}