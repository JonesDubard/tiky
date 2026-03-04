'use client';

// components/polls/PollsSearchFilter.tsx
import { useState, useCallback, useRef, useTransition } from 'react';
import { Search, Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import PollCard from './PollCard';

type PollOption = {
  id: string;
  _count: { votes: number };
  [key: string]: unknown;
};

type Poll = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  isFeatured: boolean;
  totalVotes: number;
  options: PollOption[];
  createdAt: Date | string;
  [key: string]: unknown;
};

type Props = {
  initialPolls: Poll[];
  initialTotal: number;
};

type Filters = {
  featured: boolean;
  live:     boolean;
  sort:     'newest' | 'oldest' | 'votes';
};

const DEFAULT_FILTERS: Filters = {
  featured: false,
  live:     false,
  sort:     'newest',
};

function buildQueryString(search: string, filters: Filters) {
  const params = new URLSearchParams();
  if (search)           params.set('search',   search);
  if (filters.featured) params.set('featured', 'true');
  if (filters.live)     params.set('live',     'true');
  if (filters.sort)     params.set('sort',      filters.sort);
  return params.toString();
}

export default function PollsSearchFilter({ initialPolls, initialTotal }: Props) {
  const [search,       setSearch]       = useState('');
  const [filters,      setFilters]      = useState<Filters>(DEFAULT_FILTERS);
  const [polls,        setPolls]        = useState<Poll[]>(initialPolls);
  const [total,        setTotal]        = useState(initialTotal);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending,    startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPolls = useCallback((newSearch: string, newFilters: Filters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const qs = buildQueryString(newSearch, newFilters);
          const res = await fetch(`/api/polls?${qs}`);
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setPolls(data.polls);
          setTotal(data.total);
        } catch {
          // keep previous results on error
        }
      });
    }, 350);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchPolls(value, filters);
  };

  const handleFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    fetchPolls(search, next);
  };

  const clearAll = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
    setPolls(initialPolls);
    setTotal(initialTotal);
  };

  const activeFilterCount = [
    filters.featured,
    filters.live,
  ].filter(Boolean).length;

  const featuredPolls = polls.filter(p => p.isFeatured);

  return (
    <div>
      {/* Search + Filter bar — drop-in replacement for the hero bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
        <div className="flex flex-col md:flex-row gap-2">

          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 w-5 h-5 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search polls by title, topic, or description..."
              className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/70 focus:outline-none"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={e => handleFilter({ sort: e.target.value as Filters['sort'] })}
              className="h-full px-4 py-3 bg-white/20 text-white rounded-lg border-none focus:outline-none appearance-none pr-8 cursor-pointer"
            >
              <option value="newest" className="text-slate-800">Sort: Newest</option>
              <option value="oldest" className="text-slate-800">Sort: Oldest</option>
              <option value="votes"  className="text-slate-800">Sort: Most Votes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
          </div>

          {/* Filters button */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(v => !v)}
              className="relative px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-purple-600 text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Filters</h3>
                  <button
                    onClick={() => { handleFilter(DEFAULT_FILTERS); setShowDropdown(false); }}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                </div>

                {/* Live now */}
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => handleFilter({ live: !filters.live })}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                        filters.live ? 'bg-green-500' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${
                        filters.live ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">Live now</span>
                      {filters.live && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                  </label>
                </div>

                {/* Featured */}
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => handleFilter({ featured: !filters.featured })}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                        filters.featured ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${
                        filters.featured ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Featured only</span>
                  </label>
                </div>

                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {(search || activeFilterCount > 0) && (
        <div className="flex flex-wrap gap-2 mt-3">
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
              "{search}"
              <button onClick={() => handleSearch('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.live && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
              Live now
              <button onClick={() => handleFilter({ live: false })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.featured && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
              Featured
              <button onClick={() => handleFilter({ featured: false })}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearAll} className="px-3 py-1 text-white/70 text-sm hover:text-white underline">
            Clear all
          </button>
        </div>
      )}

      {/* Polls Results Grid */}
      <div className="mt-8">
        {polls.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">No polls found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
            <button onClick={clearAll} className="mt-4 text-purple-600 text-sm font-medium hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {featuredPolls.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Featured Polls</h2>
                    <p className="text-slate-600">Highlighted polls with high engagement</p>
                  </div>
                  <div className="text-sm text-purple-600 font-medium">{featuredPolls.length} featured</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredPolls.map(poll => (
                    <PollCard key={poll.id} poll={poll as never} clickable={true} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {search || activeFilterCount > 0 ? 'Search Results' : 'All Active Polls'}
                  </h2>
                  <p className="text-slate-600">
                    {search || activeFilterCount > 0
                      ? `${total} poll${total !== 1 ? 's' : ''} matched`
                      : 'Browse and vote on all available polls'}
                  </p>
                </div>
                <div className="text-sm text-slate-600">{total} polls</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {polls.map(poll => (
                  <PollCard key={poll.id} poll={poll as never} clickable={true} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating loading toast */}
      {isPending && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm text-slate-600 z-50">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          Searching…
        </div>
      )}
    </div>
  );
}