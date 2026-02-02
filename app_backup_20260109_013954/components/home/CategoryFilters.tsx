// app/(public)/components/home/CategoryFilters.tsx
'use client'

import { Music, Users, Cake, Sparkles, Trophy, Utensils } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

const categories = [
  { id: 'all', name: 'All', icon: Sparkles },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'sports', name: 'Sports', icon: Trophy },
  { id: 'conference', name: 'Conference', icon: Users },
  { id: 'party', name: 'Party', icon: Cake },
  { id: 'food', name: 'Food', icon: Utensils },
]

export default function CategoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'all'

  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (category === 'all') {
      params.delete('category')
    } else {
      params.set('category', category)
    }

    router.push(`/home?${params.toString()}`)
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Browse Categories</h3>
          <p className="text-slate-600 text-sm mt-1">
            Filter events by category
          </p>
        </div>

        <button
          onClick={() => setCategory('all')}
          className="text-sm text-brand-primary hover:text-brand-accent font-medium"
        >
          Clear filters
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map(({ id, name, icon: Icon }) => {
          const isActive = activeCategory === id

          return (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg scale-105'
                  : 'bg-white text-slate-700 border border-brand-subtle/50 hover:bg-brand-subtle/30'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
