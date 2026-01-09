// components/EventCard.tsx
import { Calendar, MapPin } from 'lucide-react';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    date: string; // e.g., "Thu, May 15 • 6:00 PM"
    location: string;
    category: string;
    price: number;
    image: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-gray-200 
transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">


      {/* Image and Category Tag */}
      <div className="relative h-48 w-full overflow-hidden">
  <div
    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
    style={{ backgroundImage: `url(${event.image})` }}
  />

        {/* Category Tag - Top Left */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-semibold 
bg-black/80 text-white backdrop-blur-sm">
          {event.category}
        </span>
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Event Title */}
        <h3 className="font-bold text-xl text-black mb-3">{event.title}</h3>

        {/* Date and Location */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Price and CTA Button - Side by side */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="text-xl font-black text-black">${event.price}</p>
          </div>
          <button className="px-6 py-3 bg-black text-white font-semibold rounded-xl
hover:shadow-lg hover:-translate-y-[1px]
active:scale-[0.97] transition-all duration-200">
  Book Now
</button>
        </div>
      </div>
    </article>
  );
}