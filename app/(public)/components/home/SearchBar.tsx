// app/(public)/components/home/SearchBar.tsx - UPDATED
'use client'
import { Search, MapPin, Calendar, Filter } from 'lucide-react'
import { useState } from 'react'

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="mb-6">
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-brand-primary transition-colors z-10" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events, concerts, sports, venues, artists..."
          className="w-full pl-16 pr-32 py-4 text-lg bg-white rounded-2xl border-2 border-brand-subtle/50 focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 shadow-lg transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2.5 rounded-xl bg-brand-subtle/20 text-slate-600 hover:text-brand-primary hover:bg-brand-subtle/30 transition-colors"
            aria-label="Toggle filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button className="btn-primary px-6 py-2.5">
            Search
          </button>
        </div>
      </div>
      
      {/* Advanced Search Filters (Conditional) */}
      {showFilters && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-brand-subtle/30 shadow-lg animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-primary" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <select className="w-full p-2.5 bg-brand-subtle/10 rounded-lg border border-brand-subtle/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-sm">
                  <option>Any Location</option>
                  <option>Monrovia</option>
                  <option>Paynesville</option>
                  <option>Gbarnga</option>
                  <option>Buchanan</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-primary" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                <select className="w-full p-2.5 bg-brand-subtle/10 rounded-lg border border-brand-subtle/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-sm">
                  <option>Any Date</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Next Month</option>
                  <option>Next 3 Months</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Range</label>
                <select className="w-full p-2.5 bg-brand-subtle/10 rounded-lg border border-brand-subtle/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-sm">
                  <option>Any Price</option>
                  <option>Under $20</option>
                  <option>$20 - $50</option>
                  <option>$50 - $100</option>
                  <option>Over $100</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-5 h-5" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                <select className="w-full p-2.5 bg-brand-subtle/10 rounded-lg border border-brand-subtle/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-sm">
                  <option>Any Type</option>
                  <option>Concert</option>
                  <option>Conference</option>
                  <option>Sports</option>
                  <option>Festival</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-brand-subtle/30">
            <button 
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button className="btn-primary px-6 py-2 text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}