import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function EventsPage() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tickets: true
      }
    })

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600">Manage all events on your platform</p>
          </div>
          <Link
            href="/admin/events/new"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700"
          >
            + New Event
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">ðŸŽª</div>
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">Create your first event to get started</p>
              <Link
                href="/admin/events/new"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Create Event
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => {
                  const totalCapacity = event.tickets?.reduce(
                    (sum, ticket) => sum + (ticket.quantity || 0), 
                    0
                  ) || 0
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-md bg-cover bg-center mr-4 bg-gray-200"
                            style={{ 
                              backgroundImage: event.imageUrl 
                                ? `url(${event.imageUrl})` 
                                : 'none'
                            }}
                          >
                            {!event.imageUrl && (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                ðŸŽª
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.location}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Created {new Date(event.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {event.tickets?.length || 0} ticket types
                          </div>
                          <div className="text-xs text-gray-500">
                            Capacity: {totalCapacity}
                          </div>
                          {event.tickets?.slice(0, 2).map((ticket) => (
                            <div key={ticket.id} className="text-xs text-gray-600">
                              â€¢ {ticket.type}: ${ticket.price} ({ticket.quantity} available)
                            </div>
                          ))}
                          {event.tickets?.length > 2 && (
                            <div className="text-xs text-gray-400">
                              +{event.tickets.length - 2} more types
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.published
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/admin/events/${event.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Edit
                        </Link>
                        <button className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading events:', error)
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">âŒ</div>
        <h3 className="text-lg font-medium mb-2">Error loading events</h3>
        <p className="text-gray-600">Please try again later</p>
      </div>
    )
  }
}
