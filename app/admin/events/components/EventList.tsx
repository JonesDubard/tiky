'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string;
  imageUrl: string | null;
  published: boolean;
  isFeatured: boolean;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    _count: {
      tickets: number;
    };
  }[];
  _count: {
    ticketTypes: number;
    polls: number;
  };
}

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete event');
      
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update event');
      
      router.refresh();
    } catch (error) {
      console.error('Publish toggle error:', error);
      alert('Failed to update event status');
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
        <p className="text-gray-500 mb-4">Get started by creating your first event</p>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create Event
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-10 w-10 rounded-lg object-cover mr-3"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-gray-500 text-xs">No img</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {format(new Date(event.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {format(new Date(event.date), 'MMM d, yyyy • h:mm a')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.location}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {event.ticketTypes.length} type(s)
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.ticketTypes.reduce((acc, t) => acc + t._count.tickets, 0)} sold
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <button
                      onClick={() => togglePublish(event.id, event.published)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        event.published ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                          event.published ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-sm text-gray-500">
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {event.isFeatured && (
                    <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deletingId === event.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}