'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PollFormProps {
  initialData?: {
    id: string
    title: string
    description: string | null
    pollType: string
    status: string
    endDate: Date | null
    isFeatured: boolean
    options: Array<{
      id: string
      text: string
    }>
  }
}

export default function PollForm({ initialData }: PollFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const isEditMode = !!initialData

  // Options state
  const [options, setOptions] = useState<string[]>(
    initialData?.options.map(opt => opt.text) || ['', '']
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)

    // Filter out empty options
    const validOptions = options.filter(opt => opt.trim() !== '')

    if (validOptions.length < 2) {
      setError('Please add at least 2 options')
      setLoading(false)
      return
    }

    const data = {
      ...(isEditMode && { id: initialData.id }),
      title: formData.get('title'),
      description: formData.get('description'),
      pollType: formData.get('pollType') || 'FREE',
      status: formData.get('status') || 'ACTIVE',
      isFeatured: formData.get('isFeatured') === 'on',
      endDate: formData.get('endDate') || null,
      options: validOptions,
    }

    try {
      const url = isEditMode 
        ? `/api/admin/polls/${initialData.id}` 
        : '/api/admin/polls'
      
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        router.push('/admin/polls')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} poll`)
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const updateOption = (index: number, value: string) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Poll' : 'Create New Poll'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Poll Title *
            </label>
            <input
              name="title"
              type="text"
              required
              defaultValue={initialData?.title || ''}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
              placeholder="e.g., What topic should we cover next?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initialData?.description || ''}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
              placeholder="Describe your poll..."
            />
          </div>

          {/* Poll Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Poll Type
              </label>
              <select
                name="pollType"
                defaultValue={initialData?.pollType || 'FREE'}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
              >
                <option value="FREE">Free Poll</option>
                <option value="PAID">Premium Poll (Login Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                name="status"
                defaultValue={initialData?.status || 'ACTIVE'}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              End Date (Optional)
            </label>
            <input
              name="endDate"
              type="datetime-local"
              defaultValue={initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : ''}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isFeatured"
              id="isFeatured"
              defaultChecked={initialData?.isFeatured}
              className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium">
              Feature this poll on homepage
            </label>
          </div>
        </div>

        {/* Options Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Poll Options *</h3>
            <button
              type="button"
              onClick={addOption}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              + Add Option
            </button>
          </div>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary"
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Add at least 2 options for users to choose from.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-3 rounded-lg font-medium hover:bg-brand-accent disabled:opacity-50"
          >
            {loading 
              ? (isEditMode ? 'Updating Poll...' : 'Creating Poll...') 
              : (isEditMode ? 'Update Poll' : 'Create Poll')}
          </button>
        </div>
      </form>
    </div>
  )
}