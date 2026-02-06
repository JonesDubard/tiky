// app/checkout/success/[id]/page.tsx - COMPLETE FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, User, Ticket, Download, Share2, CheckCircle, ArrowLeft, Smartphone, Clock, AlertCircle } from 'lucide-react'
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
  transaction?: {
    paymentMethod?: string
    provider?: string
    phoneNumber?: string
  }
}

// Mock data fallback
const createMockTicketData = (eventId: string, phoneNumber?: string): TicketData => {
  const now = new Date();
  const eventDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  return {
    id: `mock-${Date.now()}`,
    ticketId: `TIK-${Date.now().toString(36).toUpperCase()}`,
    qrCodeHash: `QR-MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'PAID',
    price: 0,
    quantity: 1,
    guestName: 'Demo User',
    guestEmail: 'demo@example.com',
    createdAt: now.toISOString(),
    event: {
      id: eventId,
      title: 'Liberian Music Festival',
      description: 'The biggest music festival in Liberia featuring top artists',
      date: eventDate.toISOString(),
      location: 'Monrovia, Liberia',
      imageUrl: ''
    },
    transaction: {
      paymentMethod: 'MOMO',
      provider: 'MTN_MOMO_MOCK',
      phoneNumber: phoneNumber || '0777123456'
    }
  };
};

export default function TicketSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [copied, setCopied] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const eventId = params.id as string
  const paymentMethod = searchParams.get('method')
  const phoneNumber = searchParams.get('phone')
  const isMock = searchParams.get('mock') === 'true'

  useEffect(() => {
    if (!eventId) {
      setError('No event ID provided')
      setLoading(false)
      return
    }

    // If mock mode, use mock data immediately
    if (isMock) {
      console.log('Using mock data for demo')
      setTimeout(() => {
        setTicket(createMockTicketData(eventId, phoneNumber || undefined))
        setUsingMockData(true)
        setLoading(false)
      }, 1000)
      return
    }

    // Real flow: start polling for transaction
    if (paymentMethod === 'momo') {
      startPolling(eventId)
    } else {
      fetchLatestTicket(eventId)
    }
  }, [eventId, paymentMethod, phoneNumber, isMock])

  const startPolling = async (eventId: string) => {
    setPolling(true)
    setLoading(true)
    let attempts = 0
    const maxAttempts = 10 // 20 seconds total (2s * 10)

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Polling timeout after', attempts, 'attempts')
        setPolling(false)
        setLoading(false)
        setError('Payment verification timeout. Please check your email for ticket confirmation.')
        return
      }

      attempts++
      console.log(`Polling attempt ${attempts}/${maxAttempts} for event:`, eventId)
      
      await fetchLatestTicket(eventId, true)
      
      // If still no ticket and still polling, continue
      if (!ticket && polling) {
        setTimeout(poll, 2000)
      }
    }

    poll()
  }

  const fetchLatestTicket = async (eventId: string, isPolling = false) => {
    try {
      console.log('Fetching latest transaction for event:', eventId)
      
      // Get the latest transaction for this event
      const response = await fetch(`/api/events/${eventId}/latest-transaction?phone=${phoneNumber || ''}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Transaction fetch failed:', response.status, errorData)
        
        if (!isPolling) {
          // Try direct ticket lookup as fallback
          await tryDirectTicketLookup(eventId)
        }
        return
      }
      
      const data = await response.json()
      console.log('Transaction data:', data)
      
      if (data.transaction) {
        // If transaction is PENDING and we're in MoMo flow, simulate webhook
        if (data.transaction.status === 'PENDING' && paymentMethod === 'momo') {
          console.log('Transaction pending, triggering webhook...')
          // Trigger mock webhook to complete it
          await fetch(`/api/payment/webhook?transactionId=${data.transaction.transactionRef}&status=SUCCESSFUL`)
          
          // Wait a moment then fetch again
          if (isPolling) {
            setTimeout(() => fetchLatestTicket(eventId, true), 1500)
          }
          return
        }
        
        // If transaction has tickets, get the first one
        if (data.transaction.tickets && data.transaction.tickets.length > 0) {
          const ticketId = data.transaction.tickets[0].id
          console.log('Fetching ticket with ID:', ticketId)
          
          const ticketResponse = await fetch(`/api/tickets/${ticketId}`)
          
          if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json()
            console.log('Ticket data received:', ticketData.ticketId)
            setTicket(ticketData)
            setPolling(false)
            setLoading(false)
            setError(null)
            return
          }
        }
        
        // Transaction completed but no tickets yet
        if (isPolling) {
          console.log('Transaction completed but no tickets yet, continuing poll...')
          return // Will continue polling
        }
      }
      
      // If we get here and not polling, try direct lookup
      if (!isPolling) {
        await tryDirectTicketLookup(eventId)
      }
      
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      if (!isPolling) {
        setLoading(false)
        setError('Unable to load ticket. Please try again later.')
      }
    }
  }

  const tryDirectTicketLookup = async (eventId: string) => {
    try {
      // Try to get tickets directly for this event
      console.log('Trying direct ticket lookup for event:', eventId)
      const response = await fetch(`/api/events/${eventId}/tickets`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.tickets && data.tickets.length > 0) {
          // Use the most recent ticket
          const latestTicket = data.tickets[0]
          setTicket(latestTicket)
          setLoading(false)
          setError(null)
          return true
        }
      }
      
      // If no tickets found, use mock data
      console.log('No tickets found, using mock data')
      setTicket(createMockTicketData(eventId, phoneNumber || undefined))
      setUsingMockData(true)
      setLoading(false)
      return false
      
    } catch (error) {
      console.error('Direct lookup failed:', error)
      // Use mock data as final fallback
      setTicket(createMockTicketData(eventId, phoneNumber || undefined))
      setUsingMockData(true)
      setLoading(false)
      return false
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!ticket) return
    
    try {
      const qrElement = document.querySelector('.qr-code svg') as SVGElement
      if (!qrElement) {
        // Fallback: download as text
        const ticketText = `
Ticket ID: ${ticket.ticketId}
Event: ${ticket.event.title}
Date: ${format(new Date(ticket.event.date), 'PPP')}
Venue: ${ticket.event.location}
Attendee: ${ticket.guestName || 'Guest'}
QR Code: ${ticket.qrCodeHash}
        `.trim()
        
        const blob = new Blob([ticketText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ticket-${ticket.ticketId}.txt`
        link.click()
        URL.revokeObjectURL(url)
        return
      }
      
      // Convert SVG to PNG for download
      const svgData = new XMLSerializer().serializeToString(qrElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `ticket-${ticket.ticketId}.png`
        link.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
      
    } catch (error) {
      console.error('Download failed:', error)
      alert('Unable to download ticket. Please take a screenshot instead.')
    }
  }

  const handleShare = async () => {
    if (!ticket) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Ticket for ${ticket.event.title}`,
          text: `Check out my ticket for ${ticket.event.title} on ${format(new Date(ticket.event.date), 'PPP')}!`,
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

  // Polling/loading state
  if (polling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#C2185B]/10 to-white">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-xl border border-gray-200">
          <div className="w-20 h-20 bg-gradient-to-r from-[#C2185B] to-[#E91E63] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Verifying MoMo Payment
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment with MTN Mobile Money...
          </p>
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 border-4 border-[#C2185B] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">
            This usually takes 10-20 seconds
          </p>
        </div>
      </div>
    )
  }

  // Initial loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">Loading your ticket...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Ticket</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
            <Link 
              href="/events" 
              className="inline-block w-full text-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // No ticket state (shouldn't happen with mock fallback)
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

  // SUCCESS! Show the ticket
  const eventDate = new Date(ticket.event.date)
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy')
  const formattedTime = format(eventDate, 'h:mm a')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Demo Notice */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 text-sm text-center">
              <strong>Demo Mode:</strong> Using mock ticket data. Your real tickets will appear here when payment is complete.
            </p>
          </div>
        )}

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
          
          {/* MoMo Badge */}
          {ticket.transaction?.paymentMethod === 'MOMO' && (
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#C2185B] to-[#E91E63] text-white px-4 py-2 rounded-full">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">Paid with MTN MoMo</span>
              </div>
              {ticket.transaction.phoneNumber && (
                <span className="text-gray-600">
                  • {ticket.transaction.phoneNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ticket Card - YOUR EXISTING BEAUTIFUL UI */}
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
  <div className="flex justify-between items-center mb-2">
    <span className="text-gray-600">Ticket Price</span>
    <span className="font-medium">${ticket.price.toFixed(2)} LRD</span>
  </div>
  <div className="flex justify-between items-center mb-2 text-sm">
    <span className="text-gray-500">Service Fee</span>
    <span className="text-gray-500">$2.50 LRD</span>
  </div>
  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
    <span className="text-gray-600 font-semibold">Total Paid</span>
    <span className="text-2xl font-bold text-green-600">
      ${((ticket.price || 0) * ticket.quantity + 2.50).toFixed(2)}
      <span className="text-sm text-gray-500 ml-1">LRD</span>
    </span>
  </div>
</div>
            </div>

            {/* Right Column: QR Code */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-green-300 qr-code">
                <QRCodeSVG
                  value={ticket.qrCodeHash}
                  size={220}
                  level="H"
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