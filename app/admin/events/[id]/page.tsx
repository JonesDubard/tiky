// app/admin/events/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Ticket, 
  Users, 
  ArrowLeft, 
  Edit, 
  Eye,
  Loader,
  CheckCircle,
  XCircle
} from "lucide-react"
import Image from "next/image"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])

  const eventId = params.id as string

  useEffect(() => {
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch event")
      
      setEvent(data.event || data)
      
      // Fetch tickets for this event
      const ticketsRes = await fetch(`/api/events/${eventId}/tickets`)
      const ticketsData = await ticketsRes.json()
      
      if (ticketsRes.ok) {
        setTickets(ticketsData)
      }
    } catch (err) {
      console.error("Error fetching event:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been deleted.</p>
          <Link
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 text-sm rounded-full ${
              event.published
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {event.published ? 'Published' : 'Draft'}
            </span>
            {event.isFeatured && (
              <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                Featured
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/events/${eventId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Link>
          {event.published && (
            <Link
              href={`/events/${eventId}`}
              target="_blank"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Public
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          {event.imageUrl && (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="relative h-64 md:h-80">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">{new Date(event.date).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
              
              {event.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Tickets & Stats */}
        <div className="space-y-6">
          {/* Ticket Types */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Ticket className="w-5 h-5 mr-2" />
              Ticket Types
            </h2>
            
            <div className="space-y-4">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{ticket.type}</h3>
                      <span className="font-bold text-purple-600">
                        LRD {ticket.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Available: {ticket.quantity}</span>
                      <span>Sold: {ticket.quantity - ticket.available || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No tickets configured</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">Total Tickets</span>
                </div>
                <span className="font-bold text-gray-900">
                  {tickets.reduce((sum, t) => sum + t.quantity, 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">Revenue Potential</span>
                </div>
                <span className="font-bold text-green-600">
                  LRD {tickets.reduce((sum, t) => sum + (t.price * t.quantity), 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">Event Status</span>
                </div>
                <span className={`font-bold ${
                  new Date(event.date) > new Date() 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                }`}>
                  {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                </span>
              </div>
            </div>
          </div>

          {/* Created By */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Creator</h2>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mr-3">
                <span className="font-medium text-purple-600">
                  {event.createdBy?.name?.charAt(0) || event.createdBy?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {event.createdBy?.name || event.createdBy?.email}
                </p>
                <p className="text-sm text-gray-600">
                  Created on {new Date(event.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}