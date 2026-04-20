"use client"

// app/(public)/components/home/EventsGrid.tsx
// Fully client-side filtering + sorting for the events page.
// Receives the full event list from the server component and handles
// search, sort, price filter, and availability filter entirely in-browser —
// no extra API calls, instant response.

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"
import EventCard from "./EventCard"

export interface EventSummary {
  id: string
  title: string
  description: string | null
  date: Date
  location: string
  imageUrl: string | null
  isFeatured: boolean
  ticketTypes: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  minPrice: number
}

type SortKey = "date-asc" | "date-desc" | "price-asc" | "price-desc" | "name-asc"
type AvailabilityFilter = "all" | "available" | "free" | "sold-out"

interface Props {
  events: EventSummary[]
}

export default function EventsGrid({ events }: Props) {
  const [search, setSearch]             = useState("")
  const [sort, setSort]                 = useState<SortKey>("date-asc")
  const [availability, setAvailability] = useState<AvailabilityFilter>("all")
  const [showFilters, setShowFilters]   = useState(false)

  // ── Filtering + sorting ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return events
      .filter(e => {
        if (q) {
          const haystack = [e.title, e.location, e.description ?? ""]
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }

        const hasAvailable = e.ticketTypes.some(t => t.quantity > 0)
        const isFree       = e.minPrice === 0
        const isSoldOut    = e.ticketTypes.length > 0 && !hasAvailable

        if (availability === "available" && !hasAvailable) return false
        if (availability === "free"      && !isFree)       return false
        if (availability === "sold-out"  && !isSoldOut)    return false

        return true
      })
      .sort((a, b) => {
        switch (sort) {
          case "date-asc":   return new Date(a.date).getTime() - new Date(b.date).getTime()
          case "date-desc":  return new Date(b.date).getTime() - new Date(a.date).getTime()
          case "price-asc":  return a.minPrice - b.minPrice
          case "price-desc": return b.minPrice - a.minPrice
          case "name-asc":   return a.title.localeCompare(b.title)
          default:           return 0
        }
      })
  }, [events, search, sort, availability])

  const featured = filtered.filter(e => e.isFeatured)
  const rest     = filtered.filter(e => !e.isFeatured)

  const activeFilterCount = [
    search.trim() !== "",
    availability !== "all",
    sort !== "date-asc",
  ].filter(Boolean).length

  const clearAll = () => {
    setSearch("")
    setSort("date-asc")
    setAvailability("all")
  }

  return (
    <div>
      {/* ── Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        {/* Search + sort row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-slate-100">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, location, or description…"
              className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="appearance-none pl-3 pr-8 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary cursor-pointer transition-all"
              >
                <option value="date-asc">Soonest first</option>
                <option value="date-desc">Latest first</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all whitespace-nowrap ${
                showFilters || activeFilterCount > 0
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable filter chips */}
        {showFilters && (
          <div className="p-3 bg-slate-50 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Availability
            </span>
            {(
              [
                { key: "all",       label: "All" },
                { key: "available", label: "✓ Available" },
                { key: "free",      label: "Free" },
                { key: "sold-out",  label: "Sold Out" },
              ] as { key: AvailabilityFilter; label: string }[]
            ).map(opt => (
              <button
                key={opt.key}
                onClick={() => setAvailability(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  availability === opt.key
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Result count ── */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {filtered.length === events.length
            ? `${events.length} event${events.length !== 1 ? "s" : ""}`
            : (
              <>
                <span className="font-semibold text-slate-700">{filtered.length}</span>
                {" "}of {events.length} events
              </>
            )}
          {search.trim() && (
            <span className="ml-1 text-brand-primary font-medium">
              for "{search.trim()}"
            </span>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No events match your filters
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Try a different search term or adjust your filters
          </p>
          <button
            onClick={clearAll}
            className="text-sm font-medium text-brand-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Featured section ── */}
      {featured.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Featured Events</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
              {featured.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* ── Rest ── */}
      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-900">All Events</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">
                {rest.length}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}