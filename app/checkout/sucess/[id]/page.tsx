// app/checkout/success/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'
import { Calendar, MapPin, User, Ticket, Download, Share2, CheckCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface TicketData {
  id: string
  ticketId: string
  qrCodeHash: string
  status: string
  price: number
  quantity: number
  guestName?: string
  guestEmail?: string
  createdAt: string
  event: {
    id: string
    title: string
    description?: string
    date: string
    location: string
    imageUrl?: string
  }
  user?: {
    name?: string
    email?: string
  }
}

export default function TicketSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTicketData(params.id as string)
    }
  }, [params.id])

  const fetchTicketData = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch ticket')
      }
      const data = await response.json()
      setTicket(data)
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      // Redirect to home if ticket not found
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${ticket?.ticketId}.png`
      link.click()
    }
  }

  const handleShare = async () => {
    if (navigator.share && ticket) {
      try {
        await navigator.share({
          title: `My Ticket for ${ticket.event.title}`,
          text: `Check out my ticket for ${ticket.event.title}!`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Sharing cancelled or failed')
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h1>
          <p className="text-gray-600 mb-6">The ticket you're looking for doesn't exist or has been cancelled.</p>
          <Link 
            href="/events" 
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  const eventDate = new Date(ticket.event.date)
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(eventDate, 'h:mm a')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link 
          href="/events" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Link>

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your ticket has been confirmed. Save or share it below.</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-green-200 mb-8">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{ticket.event.title}</h2>
                <p className="text-green-100 opacity-90">{ticket.event.description}</p>
              </div>
              <div className="bg-white text-green-800 px-4 py-2 rounded-full font-bold">
                {ticket.status === 'PAID' ? 'CONFIRMED' : ticket.status}
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Event Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold text-gray-900">{formattedDate}</p>
                  <p className="text-gray-600">{formattedTime}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Venue</p>
                  <p className="font-semibold text-gray-900">{ticket.event.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Attendee</p>
                  <p className="font-semibold text-gray-900">
                    {ticket.guestName || ticket.user?.name || 'Guest'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {ticket.guestEmail || ticket.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-amber-100 p-3 rounded-xl">
                  <Ticket className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket Details</p>
                  <p className="font-semibold text-gray-900">
                    {ticket.quantity} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}
                  </p>
                  <p className="text-gray-600">#{ticket.ticketId}</p>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(ticket.price * ticket.quantity).toFixed(2)}
                    <span className="text-sm text-gray-500 ml-1">LRD</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: QR Code */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-green-300">
                <QRCode
                  id="qr-code"
                  value={ticket.qrCodeHash}
                  size={220}
                  level="H"
                  includeMargin
                  fgColor="#059669"
                  bgColor="#ffffff"
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Ticket Code</p>
                <p className="font-mono text-lg font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
                  {ticket.qrCodeHash.substring(0, 16)}...
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 w-full">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Save Ticket</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-600">
              Present this QR code at the event entrance. Keep it secure!
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ticket generated on {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/events" 
              className="text-center p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">Browse More Events</p>
            </Link>
            <Link 
              href={`/events/${ticket.event.id}`} 
              className="text-center p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">View Event Details</p>
            </Link>
            <Link 
              href="/profile/tickets" 
              className="text-center p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <p className="font-semibold text-gray-900">My Tickets</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}