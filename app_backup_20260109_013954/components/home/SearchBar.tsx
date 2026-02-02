// app/(public)/components/home/SearchBar.tsx
'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('search') ?? ''
  const [value, setValue] = useState(initialSearch)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }

    const timeout = setTimeout(() => {
      router.push(`/home?${params.toString()}`)
    }, 300) // debounce

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="search"
          placeholder="Search events..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm"
        />
      </div>
    </div>
  )
}
