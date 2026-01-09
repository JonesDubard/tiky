'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import  ImageUpload  from '@/components/ui/image-upload' // Import the upload component

interface TicketTypeInput {
  name: string
  price: string
  quantity: string
}

export default function EventForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState('') // Store image URL
  
  // Ticket types state
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: 'General Admission', price: '15', quantity: '100' }
  ])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      date: formData.get('date'),
      location: formData.get('location'), // Changed from venue to location
      imageUrl: imageUrl || formData.get('imageUrl') || '', // Use uploaded image first
      tickets: ticketTypes.filter(t => t.name && t.price && t.quantity).map(ticket => ({
        type: ticket.name, // Changed from name to type
        price: parseFloat(ticket.price),
        quantity: parseInt(ticket.quantity)
      }))
    }

    console.log('Submitting:', data)

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        router.push('/admin/events')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create event')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Add new ticket type
  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', quantity: '' }])
  }

  // Update ticket type
  const updateTicketType = (index: number, field: keyof TicketTypeInput, value: string) => {
    const updated = [...ticketTypes]
    updated[index][field] = value
    setTicketTypes(updated)
  }

  // Remove ticket type
  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========== EVENT BASIC INFO ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Event Title *
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g., Afro Nation Liberia"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Describe your event..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Date & Time *
            </label>
            <input
              name="date"
              type="datetime-local"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Venue/Location *
            </label>
            <input
              name="location" // Changed from venue to location
              type="text"
              required
              placeholder="e.g., Liberia National Stadium"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Cover Image
            </label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              disabled={loading}
            />
            
            {/* Fallback URL input (optional) */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Or enter image URL (optional)
              </label>
              <input
                name="imageUrl"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!!imageUrl} // Disable if uploaded image exists
              />
              <p className="text-sm text-gray-500 mt-1">
                {imageUrl 
                  ? "Using uploaded image. Clear upload to use URL instead." 
                  : "Leave empty for default placeholder"}
              </p>
            </div>
          </div>
        </div>

        {/* ========== TICKET TYPES SECTION ========== */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ticket Types *</h3>
            <button
              type="button"
              onClick={addTicketType}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              disabled={loading}
            >
              + Add Ticket Type
            </button>
          </div>
          
          <div className="space-y-4">
            {ticketTypes.map((ticket, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Ticket Name *</label>
                  <input
                    type="text"
                    value={ticket.name}
                    onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                    placeholder="e.g., General Admission, VIP"
                    className="w-full p-2 border rounded"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="block text-sm font-medium mb-1">Price ($) *</label>
                  <input
                    type="number"
                    value={ticket.price}
                    onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={ticket.quantity}
                    onChange={(e) => updateTicketType(index, 'quantity', e.target.value)}
                    min="1"
                    className="w-full p-2 border rounded"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="pt-6 md:pt-0 self-center">
                  <button
                    type="button"
                    onClick={() => removeTicketType(index)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    disabled={ticketTypes.length <= 1 || loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Add at least one ticket type. Customers will see these options when booking.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
}