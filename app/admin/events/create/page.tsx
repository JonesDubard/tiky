// app/admin/events/create/page.tsx - FIXED VERSION
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, DollarSign, Ticket, Plus, Trash2, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import ImageUpload from "components/ui/image-upload"

type TicketType = {
  id: string
  type: string
  price: number
  quantity: number
}

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    imageUrl: "",
    isFeatured: false,
    published: true,
  })
  const [tickets, setTickets] = useState<TicketType[]>([
    { id: "1", type: "General Admission", price: 0, quantity: 100 }
  ])

  const handleAddTicket = () => {
    const newId = (tickets.length + 1).toString()
    setTickets([...tickets, { id: newId, type: "", price: 0, quantity: 1 }])
  }

  const handleRemoveTicket = (id: string) => {
    if (tickets.length > 1) {
      setTickets(tickets.filter(ticket => ticket.id !== id))
    }
  }

  const handleTicketChange = (id: string, field: keyof TicketType, value: string | number) => {
    setTickets(tickets.map(ticket => 
      ticket.id === id ? { ...ticket, [field]: value } : ticket
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (!formData.title || !formData.date || !formData.location) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    // Validate tickets
    const invalidTicket = tickets.find(t => !t.type || t.price < 0 || t.quantity < 1)
    if (invalidTicket) {
      setError("Please check all ticket fields - type is required, price and quantity must be positive")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tickets
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      // Success - redirect to events list
      router.push("/admin/events")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  // Helper function for cancel button - either navigates or prevents if loading
  const handleCancel = (e: React.MouseEvent) => {
    if (loading) {
      e.preventDefault()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            onClick={handleCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-600 mt-1">Fill in the details for your new event</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Summer Music Festival 2024"
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your event..."
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Image
            </label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData({...formData, imageUrl: url})}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Event Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., National Stadium, Monrovia"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              />
            </div>
          </div>

          {/* Ticket Management Section */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <Ticket className="inline w-4 h-4 mr-1" />
                Ticket Types & Pricing
              </label>
              <button
                type="button"
                onClick={handleAddTicket}
                disabled={loading}
                className={`inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ticket Type
              </button>
            </div>

            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div key={ticket.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="md:col-span-4">
                    <label className="block text-xs text-gray-600 mb-1">Ticket Type *</label>
                    <input
                      type="text"
                      required
                      value={ticket.type}
                      onChange={(e) => handleTicketChange(ticket.id, 'type', e.target.value)}
                      placeholder="e.g., VIP, General, Early Bird"
                      className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Price (LRD) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={ticket.price}
                        onChange={(e) => handleTicketChange(ticket.id, 'price', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-600 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={ticket.quantity}
                      onChange={(e) => handleTicketChange(ticket.id, 'quantity', parseInt(e.target.value) || 1)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    {tickets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicket(ticket.id)}
                        disabled={loading}
                        className={`w-full px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center justify-center ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>💡 Tip: Add multiple ticket types (e.g., VIP, General, Student) with different prices and quantities.</p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                className={`h-4 w-4 text-purple-600 rounded focus:ring-purple-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              />
              <label 
                htmlFor="isFeatured" 
                className={`ml-2 text-sm ${loading ? "text-gray-500" : "text-gray-700"}`}
              >
                Feature this event on homepage
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({...formData, published: e.target.checked})}
                className={`h-4 w-4 text-purple-600 rounded focus:ring-purple-500 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              />
              <label 
                htmlFor="published" 
                className={`ml-2 text-sm ${loading ? "text-gray-500" : "text-gray-700"}`}
              >
                Publish immediately (visible to public)
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {/* Cancel Button - Fixed: Use button with Link functionality */}
            <button
              type="button"
              onClick={() => !loading && router.push("/admin/events")}
              className={`px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}