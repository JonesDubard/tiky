// app/admin/events/page.tsx - UPDATED WITH FUNCTIONAL BUTTONS
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, Plus, Eye, Edit, Trash2, TrendingUp, Loader2 } from "lucide-react"

type EventWithDetails = {
  id: string
  title: string
  description: string | null
  date: Date
  location: string
  imageUrl: string | null
  published: boolean
  isFeatured: boolean
  createdAt: Date
  createdBy: {
    name: string | null
    email: string
  }
  _count: {
    tickets: number
    polls: number
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/events")
      
      if (!res.ok) {
        throw new Error("Failed to fetch events")
      }
      
      const data = await res.json()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
      console.error("Error fetching events:", err)
    } finally {
      setLoading(false)
    }
  }

const handleDeleteEvent = async (eventId: string) => {
  if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
    return
  }
  
  setDeletingId(eventId)
  
  try {
    console.log("Deleting event ID:", eventId)
    
    const res = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
    })
    
    console.log("Delete response status:", res.status)
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("Delete error response:", data)
      throw new Error(data.error || `Failed to delete event: ${res.status}`)
    }
    
    // Remove the event from the local state
    setEvents(prev => prev.filter(event => event.id !== eventId))
    
    console.log("Event deleted successfully")
    
  } catch (err) {
    console.error("Error in handleDeleteEvent:", err)
    alert(err instanceof Error ? err.message : "Failed to delete event. Check console for details.")
  } finally {
    setDeletingId(null)
  }
}

  const handleViewPublic = (eventId: string) => {
    // Open public event page in new tab
    window.open(`/events/${eventId}`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Events</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Events Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage all events
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md transition-shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Total Events</div>
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Published</div>
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => e.published).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Featured</div>
          <div className="text-2xl font-bold text-purple-600">
            {events.filter(e => e.isFeatured).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Upcoming</div>
          <div className="text-2xl font-bold text-blue-600">
            {events.filter(e => new Date(e.date) > new Date()).length}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          className="h-12 w-12 rounded-lg object-cover"
                          src={event.imageUrl}
                          alt={event.title}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created by: {event.createdBy.name || event.createdBy.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                        event.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.published ? 'Published' : 'Draft'}
                      </span>
                      {event.isFeatured && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full w-fit">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {event._count.tickets}
                        </div>
                        <div className="text-xs text-gray-500">Tickets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {event._count.polls}
                        </div>
                        <div className="text-xs text-gray-500">Polls</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {/* View Button - Now Functional */}
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      
                      {/* Edit Button - Now Functional */}
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      
                      {/* Delete Button - Now Functional */}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Event"
                        disabled={deletingId === event.id}
                      >
                        {deletingId === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                      
                      {/* Public View Button - Now Functional */}
                      {event.published && (
                        <button
                          onClick={() => handleViewPublic(event.id)}
                          className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                          title="View Public Page"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-6">Create your first event to get started</p>
          <Link
            href="/admin/events/create"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md transition-shadow"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Event
          </Link>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry Loading Events
          </button>
        </div>
      )}
    </div>
  )
}