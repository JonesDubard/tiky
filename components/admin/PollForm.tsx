'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PollOptionInput {
  text: string
  imageUrl: string
}

export default function PollForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Poll options state - start with 2 empty contestants
  const [options, setOptions] = useState<PollOptionInput[]>([
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' }
  ])

  // Add new contestant
  const addOption = () => {
    setOptions([...options, { text: '', imageUrl: '' }])
  }

  // Update contestant
  const updateOption = (index: number, field: keyof PollOptionInput, value: string) => {
    const updated = [...options]
    updated[index][field] = value
    setOptions(updated)
  }

  // Remove contestant
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
      endDate: formData.get('endDate') || null,
      isFeatured: formData.get('isFeatured') === 'on',
      options: options.filter(opt => opt.text.trim() !== '') // Only include options with text
    }

    console.log('Submitting poll:', data)

    try {
      const response = await fetch('/api/admin/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        router.push('/admin/polls')
        router.refresh()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create poll')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Poll/Contest</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========== POLL BASIC INFO ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Poll Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Poll Title *
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="e.g., Best Music Artist 2025"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="What is this poll about?"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Poll Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Type *
            </label>
            <select
              name="type"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="POLL"
            >
              <option value="POLL">Free Poll</option>
              <option value="CONTEST">Paid Contest</option>
            </select>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              End Date (Optional)
            </label>
            <input
              name="endDate"
              type="datetime-local"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Featured */}
          <div className="md:col-span-2 flex items-center">
            <input
              name="isFeatured"
              type="checkbox"
              id="isFeatured"
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
              Feature this poll on homepage
            </label>
          </div>
        </div>

        {/* ========== CONTESTANTS SECTION ========== */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Contestants *</h3>
              <p className="text-sm text-gray-500">Add contestants with names and photos</p>
            </div>
            <button
              type="button"
              onClick={addOption}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              + Add Contestant
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium">Contestant #{index + 1}</div>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                    disabled={options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Contestant Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contestant Name *
                    </label>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder="e.g., Burna Boy, Davido, Wizkid"
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  
                  {/* Contestant Photo */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Photo URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={option.imageUrl}
                      onChange={(e) => updateOption(index, 'imageUrl', e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full p-2 border rounded"
                    />
                    
                    {/* Photo Preview */}
                    {option.imageUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Preview:</p>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={option.imageUrl} 
                            alt={`Contestant ${index + 1} preview`}
                            className="h-16 w-16 object-cover rounded-full border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                              const parent = (e.target as HTMLImageElement).parentElement
                              if (parent) {
                                const errorMsg = document.createElement('p')
                                errorMsg.className = 'text-xs text-red-500'
                                errorMsg.textContent = 'Image failed to load'
                                parent.appendChild(errorMsg)
                              }
                            }}
                          />
                          <div className="text-xs text-gray-600">
                            Circular photo next to name
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Suggested Image Sources */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Get free photos from:</p>
                      <div className="text-xs space-x-2">
                        <a 
                          href="https://unsplash.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Unsplash
                        </a>
                        <span>•</span>
                        <a 
                          href="https://pexels.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Pexels
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            Users will see contestants with photos and names. Each contestant gets votes.
            {options.filter(opt => opt.text.trim() !== '').length < 2 && (
              <span className="text-red-500 ml-2">Need at least 2 contestants with names</span>
            )}
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || options.filter(opt => opt.text.trim() !== '').length < 2}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Poll...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  )
}