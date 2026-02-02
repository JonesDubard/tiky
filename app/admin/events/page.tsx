// app/admin/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, Calendar, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  imageUrl: string | null;
  published: boolean;
  tickets: {
    type: string;
    price: number;
    quantity: number;
  }[];
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeletingId(eventId);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting event');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus })
      });

      if (response.ok) {
        // Update local state
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, published: !currentStatus }
            : event
        ));
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage your events</p>
        </div>
        <Link
          href="/admin/events/create"
          className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          + Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-subtle to-brand-primary/20 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-brand-primary/40" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No events created yet
          </h3>
          <p className="text-gray-600 mb-8">
            Get started by creating your first event
          </p>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
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
                  const eventDate = new Date(event.date);
                  const formattedDate = eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  
                  const totalTickets = event.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
                  const cheapestTicket = event.tickets.length > 0 
                    ? Math.min(...event.tickets.map(t => t.price))
                    : 0;

                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-16 h-16 object-cover rounded-lg mr-4"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 rounded-lg flex items-center justify-center mr-4">
                              <Calendar className="w-8 h-8 text-brand-primary/40" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                              {event.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formattedDate}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">{event.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Ticket className="w-4 h-4 text-gray-400" />
                            {totalTickets} total tickets
                          </div>
                          {cheapestTicket > 0 && (
                            <div className="text-green-600 font-medium mt-1">
                              From ${cheapestTicket.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => togglePublish(event.id, event.published)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            event.published
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          }`}
                        >
                          {event.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${event.id}`}
                            target="_blank"
                            className="p-2 text-gray-600 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/events/edit/${event.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}