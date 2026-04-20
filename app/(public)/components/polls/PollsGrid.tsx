"use client"

// app/(public)/components/polls/PollsGrid.tsx  (or components/polls/PollsGrid.tsx)
// Client-side search, sort, and filtering for the polls listing page.
// Receives the full poll list from the server component — no extra fetches.

import { useState, useMemo } from "react"
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react"
import PollCard from "components/polls/PollCard"

// ── Match the shape getPolls() returns ────────────────────────────────────────
interface PollOption {
  id: string
  text: string
  imageUrl?: string | null
  _count: { votes: number }
}

export interface PollSummary {
  id: string
  title: string
  description?: string | null
  status: string
  pollType: string        // "PUBLIC" | "TOKEN_GATED"
  endDate?: Date | null
  isFeatured: boolean
  totalVotes: number
  options: PollOption[]
}

type SortKey = "newest" | "oldest" | "most-votes" | "ending-soon"
type TypeFilter = "all" | "PUBLIC" | "TOKEN_GATED"

interface Props {
  polls: PollSummary[]
}

export default function PollsGrid({ polls }: Props) {
  const [search, setSearch]           = useState("")
  const [sort, setSort]               = useState<SortKey>("newest")
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>("all")
  const [showFilters, setShowFilters] = useState(false)

  // ── Filtering + sorting ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return polls
      .filter(p => {
        // Search across title and description
        if (q) {
          const haystack = [p.title, p.description ?? ""].join(" ").toLowerCase()
          if (!haystack.includes(q)) return false
        }

        // Poll type filter
        if (typeFilter !== "all" && p.pollType !== typeFilter) return false

        return true
      })
      .sort((a, b) => {
        switch (sort) {
          case "newest":
            // Fall back to id comparison since createdAt isn't in the summary type
            return b.id.localeCompare(a.id)
          case "oldest":
            return a.id.localeCompare(b.id)
          case "most-votes":
            return b.totalVotes - a.totalVotes
          case "ending-soon": {
            // Nulls go to the end
            const aTime = a.endDate ? new Date(a.endDate).getTime() : Infinity
            const bTime = b.endDate ? new Date(b.endDate).getTime() : Infinity
            return aTime - bTime
          }
          default:
            return 0
        }
      })
  }, [polls, search, sort, typeFilter])

  const featured = filtered.filter(p => p.isFeatured)
  const rest     = filtered.filter(p => !p.isFeatured)

  const activeFilterCount = [
    search.trim() !== "",
    typeFilter !== "all",
    sort !== "newest",
  ].filter(Boolean).length

  const clearAll = () => {
    setSearch("")
    setSort("newest")
    setTypeFilter("all")
  }

  return (
    <div>
      {/* ── Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        {/* Search + sort row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-slate-100">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search polls by title or description…"
              className="w-full pl-9 pr-9 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 transition-all"
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
                className="appearance-none pl-3 pr-8 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-500 cursor-pointer transition-all"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="most-votes">Most votes</option>
                <option value="ending-soon">Ending soon</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all whitespace-nowrap ${
                showFilters || activeFilterCount > 0
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
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
              Type
            </span>
            {(
              [
                { key: "all",         label: "All Polls" },
                { key: "PUBLIC",      label: "🌐 Public" },
                { key: "TOKEN_GATED", label: "🎟 Ticket Holders" },
              ] as { key: TypeFilter; label: string }[]
            ).map(opt => (
              <button
                key={opt.key}
                onClick={() => setTypeFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  typeFilter === opt.key
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-400/40 hover:text-purple-700"
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
          {filtered.length === polls.length
            ? `${polls.length} poll${polls.length !== 1 ? "s" : ""}`
            : (
              <>
                <span className="font-semibold text-slate-700">{filtered.length}</span>
                {" "}of {polls.length} polls
              </>
            )}
          {search.trim() && (
            <span className="ml-1 text-purple-600 font-medium">
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
            No polls match your filters
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Try a different search or adjust your filters
          </p>
          <button
            onClick={clearAll}
            className="text-sm font-medium text-purple-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Featured section ── */}
      {featured.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Featured Polls</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
              {featured.length}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {featured.map(poll => (
              <PollCard key={poll.id} poll={poll} clickable />
            ))}
          </div>
        </div>
      )}

      {/* ── Rest ── */}
      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-900">All Active Polls</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">
                {rest.length}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {rest.map(poll => (
              <PollCard key={poll.id} poll={poll} clickable />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}