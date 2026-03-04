'use client';

// components/events/EventsSearchFilter.tsx
import { useState, useCallback, useRef, useTransition } from 'react';
import { Search, Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import EventCard from './EventCard';

type TicketType = { id: string; name: string; price: number; quantity: number };

type Event = {
  id: string;
  title: string;
  description: string | null;
  date: Date | string;
  location: string;
  imageUrl: string | null;
  isFeatured: boolean;
  ticketTypes: TicketType[];
  minPrice: number;
};

type Props = {
  initialEvents: Event[];
  initialTotal: number;
};

type Filters = {
  timeframe: '' | 'week' | 'month';
  pricing:   '' | 'free' | 'paid';
  featured:  boolean;
  sort:      'date' | 'name' | 'price';
};

const DEFAULT_FILTERS: Filters = {
  timeframe: '',
  pricing:   '',
  featured:  false,
  sort:      'date',
};

function buildQueryString(search: string, filters: Filters) {
  const params = new URLSearchParams();
  if (search)            params.set('search',    search);
  if (filters.timeframe) params.set('timeframe', filters.timeframe);
  if (filters.pricing)   params.set('pricing',   filters.pricing);
  if (filters.featured)  params.set('featured',  'true');
  if (filters.sort)      params.set('sort',       filters.sort);
  return params.toString();
}

export default function EventsSearchFilter({ initialEvents, initialTotal }: Props) {
  const [search,      setSearch]      = useState('');
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [events,      setEvents]      = useState<Event[]>(initialEvents);
  const [total,       setTotal]       = useState(initialTotal);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPending,   startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEvents = useCallback((newSearch: string, newFilters: Filters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const qs = buildQueryString(newSearch, newFilters);
          const res = await fetch(`/api/events?${qs}`);
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setEvents(data.events);
          setTotal(data.total);
        } catch {
          // keep previous results on error
        }
      });
    }, 350);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchEvents(value, filters);
  };

  const handleFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    fetchEvents(search, next);
  };

  const clearAll = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
    setEvents(initialEvents);
    setTotal(initialTotal);
  };

  const activeFilterCount = [
    filters.timeframe !== '',
    filters.pricing   !== '',
    filters.featured,
  ].filter(Boolean).length;

  const featuredEvents = events.filter(e => e.isFeatured);
  const allEvents      = events;

  return (
    <div>
      {/* Search + Filter bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 w-5 h-5 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search events by name or location..."
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
              <option value="date"  className="text-slate-800">Sort: Date</option>
              <option value="name"  className="text-slate-800">Sort: Name</option>
              <option value="price" className="text-slate-800">Sort: Price</option>
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
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-brand-primary text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Filters</h3>
                  <button
                    onClick={() => { handleFilter(DEFAULT_FILTERS); setShowDropdown(false); }}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                </div>

                {/* Timeframe */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Timeframe</p>
                  <div className="flex gap-2 flex-wrap">
                    {([['', 'Any time'], ['week', 'This week'], ['month', 'This month']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => handleFilter({ timeframe: val })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          filters.timeframe === val
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Pricing</p>
                  <div className="flex gap-2">
                    {([['', 'All'], ['free', 'Free'], ['paid', 'Paid']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => handleFilter({ pricing: val })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          filters.pricing === val
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Featured */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => handleFilter({ featured: !filters.featured })}
                      className={`w-10 h-6 rounded-full transition-colors flex items-center ${
                        filters.featured ? 'bg-brand-primary' : 'bg-slate-200'
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
                  className="mt-4 w-full py-2 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
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
          {filters.timeframe && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
              {filters.timeframe === 'week' ? 'This week' : 'This month'}
              <button onClick={() => handleFilter({ timeframe: '' })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.pricing && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white text-sm rounded-full">
              {filters.pricing === 'free' ? 'Free' : 'Paid'}
              <button onClick={() => handleFilter({ pricing: '' })}><X className="w-3 h-3" /></button>
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

      {/* Results — rendered below the hero, passed down via props */}
      <div data-results-total={total} data-featured-count={featuredEvents.length} />

      {/* Loading overlay hint */}
      {isPending && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm text-slate-600 z-50">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
          Searching…
        </div>
      )}
    </div>
  );
}