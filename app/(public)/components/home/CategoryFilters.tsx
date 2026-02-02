// // app/(public)/components/home/CategoryFilters.tsx - CORRECTED
// 'use client'
// import { Music, Users, Cake, Sparkles, Trophy, Utensils } from 'lucide-react'
// import { useState } from 'react'

// const categories = [
//   { id: 'all', name: 'All', icon: Sparkles, count: 24 },
//   { id: 'music', name: 'Music', icon: Music, count: 8 },
//   { id: 'sports', name: 'Sports', icon: Trophy, count: 6 }, // Changed from Football to Trophy
//   { id: 'conference', name: 'Conference', icon: Users, count: 4 },
//   { id: 'party', name: 'Party', icon: Cake, count: 5 },
//   { id: 'food', name: 'Food', icon: Utensils, count: 3 }, // Changed from null to Utensils
// ]

// export default function CategoryFilters() {
//   const [activeCategory, setActiveCategory] = useState('all')

//   return (
//     <div className="mb-12">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//         <div>
//           <h3 className="text-lg font-bold text-slate-900">Browse Categories</h3>
//           <p className="text-slate-600 text-sm mt-1">
//             Filter events by category to find exactly what you're looking for
//           </p>
//         </div>
//         <button 
//           className="text-sm text-brand-primary hover:text-brand-accent font-medium transition-colors"
//           onClick={() => setActiveCategory('all')}
//         >
//           Clear filters
//         </button>
//       </div>
      
//       <div className="flex flex-wrap gap-3">
//         {categories.map((category) => {
//           const Icon = category.icon
//           const isActive = activeCategory === category.id
          
//           return (
//             <button
//               key={category.id}
//               onClick={() => setActiveCategory(category.id)}
//               className={`group flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
//                 isActive
//                   ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg transform scale-105'
//                   : 'bg-white text-slate-700 hover:bg-brand-subtle/30 border border-brand-subtle/50 hover:border-brand-primary/30 hover:shadow-md'
//               }`}
//             >
//               {Icon && <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
//                 isActive ? 'text-white' : 'text-slate-500'
//               }`} />}
//               <span className="whitespace-nowrap">{category.name}</span>
//               <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
//                 isActive 
//                   ? 'bg-white/20 text-white' 
//                   : 'bg-brand-subtle/30 text-slate-600 group-hover:bg-brand-primary/20 group-hover:text-brand-primary'
//               }`}>
//                 {category.count}
//               </span>
//             </button>
//           )
//         })}
//       </div>
//     </div>
//   )
// }