// app/components/home/SearchBar.tsx
import { Search } from 'lucide-react';

export default function SearchBar() {
  return (
    <div className="max-w-xl mx-auto mt-6"> {/* Centered with max width and top margin */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        {/* Input Field - More padding, simpler border */}
        <input
          type="search"
          name="event-search"
          placeholder="Search events..."
          className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent shadow-sm"
        />
      </div>
    </div>
  );
}