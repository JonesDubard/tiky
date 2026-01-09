// app/components/home/FeaturedEvents.tsx
import EventCard from '@/components/EventCard'; // We will update this component last

const featuredEvents = [
  {
    id: 1,
    title: 'Afro Nation Liberia',
    date: 'Thu, May 15 • 6:00 PM',
    location: 'Liberia National Stadium',
    category: 'Music',
    price: 15,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop',
  },
  // ... Add more events as needed
];

export default function FeaturedEvents() {
  return (
    <section className="px-6 py-12 max-w-7xl mx-auto">
      {/* Header aligned as per your second screenshot */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black tracking-tight">Featured Events</h2>
        <a
          href="#"
          className="text-sm font-semibold text-gray-600 hover:text-black" // "See All" is gray, not orange
        >
          See All
        </a>
      </div>

      {/* Grid for cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}