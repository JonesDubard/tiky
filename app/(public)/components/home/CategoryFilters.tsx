// app/components/home/CategoryFilters.tsx
'use client';

// Updated categories to match your screenshot
const categories = ['All', 'Music', 'Sports', 'Conference', 'Party', 'Food'];

export default function CategoryFilters() {
  const activeCategory = 'All';

  return (
    <div className="mt-6 px-6"> {/* Adjusted padding to match HeroSection */}
      {/* Removed the "Browse Categories" subheader as per your design */}
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap
transition-all duration-200 active:scale-95
${activeCategory === category
  ? 'bg-black text-white shadow-md'
  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-[1px]'
}`}

          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}