// components/EventCard.tsx
interface EventCardProps {
  event: {
    id: number
    title: string
    date: string
    venue: string
    image: string
    price: string
    tags: string[]
  }
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="font-bold text-blue-600">{event.price}</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>📅</span>
          <span>{event.date}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition">
          {event.title}
        </h3>
        
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <span>📍</span>
          <span>{event.venue}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {event.tags.map((tag) => (
            <span 
              key={tag} 
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition">
          Get Tickets
        </button>
      </div>
    </div>
  )
}