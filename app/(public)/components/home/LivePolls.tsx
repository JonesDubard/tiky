// // app/(public)/components/home/LivePolls.tsx
// 'use client'

// import { useState } from 'react'
// import { Check, BarChart, TrendingUp, Clock } from 'lucide-react'
// import { PublicPoll } from 'types/polls'

// interface LivePollsProps {
//   polls: PublicPoll[]
// }

// export default function LivePolls({ polls }: LivePollsProps) {
//   const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

//   if (!polls || polls.length === 0) {
//     return (
//       <section className="py-12">
//         <div className="flex items-center gap-3 mb-8">
//           <BarChart className="w-8 h-8 text-brand-primary" />
//           <h2 className="text-3xl font-bold text-slate-900">Live Polls</h2>
//         </div>
//         <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-brand-subtle/30">
//           <p className="text-slate-500">No active polls at the moment</p>
//           <p className="text-sm text-slate-400 mt-2">Check back later for voting opportunities</p>
//         </div>
//       </section>
//     )
//   }

//   const handleVote = (pollId: string, optionId: string) => {
//     setSelectedOptions(prev => ({
//       ...prev,
//       [pollId]: optionId
//     }))
//     // In production: Call API to record vote
//     console.log(`Voted for poll ${pollId}, option ${optionId}`)
//   }

//   const getTimeRemaining = (endDate: string) => {
//     const now = new Date()
//     const end = new Date(endDate)
//     const diffMs = end.getTime() - now.getTime()
    
//     if (diffMs <= 0) return "Ended"
    
//     const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
//     const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
//     if (days > 0) return `${days}d ${hours}h`
//     if (hours > 0) return `${hours}h`
    
//     const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
//     return `${minutes}m`
//   }

//   return (
//     <section className="py-12">
//       <div className="flex items-center gap-3 mb-8">
//         <BarChart className="w-8 h-8 text-brand-primary" />
//         <h2 className="text-3xl font-bold text-slate-900">Live Polls</h2>
//       </div>

//       <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
//         {polls.map((poll) => {
//           const totalVotes = poll.totalVotes || poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
//           const selectedOptionId = selectedOptions[poll.id]
          
//           // ADD THIS: Calculate leading option
//           const leadingOption = poll.options.length > 0 
//             ? poll.options.reduce((prev, current) => 
//                 (prev.votes || 0) > (current.votes || 0) ? prev : current
//               )
//             : { text: "No options", votes: 0, id: "" }
          
//           const leadingPercentage = totalVotes > 0 
//             ? Math.round((leadingOption.votes / totalVotes) * 100) 
//             : 0
          
//           const timeRemaining = getTimeRemaining(poll.endDate)

//           return (
//             <div key={poll.id} className="bg-white rounded-2xl shadow-lg p-6 border border-brand-subtle/30">
//               <div className="flex justify-between items-start mb-6">
//                 <div className="flex-1">
//                   <h3 className="text-xl font-bold text-slate-900 mb-2">{poll.title}</h3>
//                   <p className="text-slate-600 text-sm mb-4">{poll.description}</p>
                  
//                   {/* ADD THIS: Leading Option Display */}
//                   {leadingOption.votes > 0 && (
//                     <div className="mb-4 p-3 bg-brand-subtle/10 rounded-lg">
//                       <div className="flex justify-between text-sm mb-1">
//                         <span className="font-medium text-slate-700 flex items-center gap-1">
//                           <TrendingUp className="w-3 h-3" />
//                           Leading:
//                         </span>
//                         <span className="font-bold text-brand-primary">{leadingPercentage}%</span>
//                       </div>
//                       <div className="h-2 bg-brand-subtle rounded-full overflow-hidden">
//                         <div 
//                           className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full"
//                           style={{ width: `${leadingPercentage}%` }}
//                         />
//                       </div>
//                       <p className="text-xs text-slate-500 mt-1 truncate">
//                         "{leadingOption.text}"
//                       </p>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex flex-col items-end gap-2 ml-4">
//                   <span className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full text-sm font-semibold">
//                     LIVE
//                   </span>
//                   <div className="flex items-center text-xs text-slate-500">
//                     <Clock className="w-3 h-3 mr-1" />
//                     <span>{timeRemaining}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4 mb-6">
//                 {poll.options.map((option) => {
//                   const optionVotes = option.votes || 0
//                   const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0
//                   const isSelected = selectedOptionId === option.id
                  
//                   return (
//                     <button
//                       key={option.id}
//                       onClick={() => handleVote(poll.id, option.id)}
//                       disabled={!!selectedOptionId}
//                       className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
//                         isSelected
//                           ? 'border-brand-primary bg-brand-primary/5'
//                           : 'border-brand-subtle hover:border-brand-primary/50 hover:bg-brand-subtle/20'
//                       } ${selectedOptionId && !isSelected ? 'opacity-50' : ''}`}
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-medium text-slate-800">{option.text}</span>
//                         {isSelected && <Check className="w-5 h-5 text-brand-primary" />}
//                       </div>
                      
//                       <div className="flex items-center gap-3">
//                         <div className="flex-1 h-2 bg-brand-subtle rounded-full overflow-hidden">
//                           <div
//                             className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-500"
//                             style={{ width: `${percentage}%` }}
//                           />
//                         </div>
//                         <span className="text-sm font-semibold text-slate-700">
//                           {percentage}%
//                         </span>
//                       </div>
                      
//                       <div className="text-xs text-slate-500 mt-2">
//                         {optionVotes} vote{optionVotes !== 1 ? 's' : ''}
//                       </div>
//                     </button>
//                   )
//                 })}
//               </div>

//               <div className="flex items-center justify-between pt-4 border-t border-brand-subtle/30">
//                 <div className="text-sm text-slate-500">
//                   {selectedOptionId ? 'Thanks for voting!' : 'Cast your vote!'}
//                 </div>
//                 <div className="text-sm font-semibold text-slate-700">
//                   {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </section>
//   )
// }

// app/(public)/components/home/LivePolls.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

// export const dynamic = "force-dynamic";

interface LivePollsProps {
  polls: {
    id: string;
    title: string;
    description: string;
    endDate: string;
    options: {
      id: string;
      text: string;
      votes: number;
    }[];
    totalVotes: number;
  }[];
}

export default function LivePolls({ polls }: LivePollsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {polls.map((poll) => (
        <Link key={poll.id} href={`/polls/${poll.id}`} className="block group">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-brand-primary transition-colors">
                  {poll.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {poll.description}
                </p>
              </div>
              <div className="bg-brand-subtle p-2 rounded-lg">
                <BarChart className="w-5 h-5 text-brand-primary" />
              </div>
            </div>

            {/* Preview of first 2 options */}
            <div className="space-y-2 mb-4">
              {poll.options.slice(0, 2).map((option) => (
                <div key={option.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{option.text}</span>
                  <span className="text-gray-500">{option.votes} votes</span>
                </div>
              ))}
              {poll.options.length > 2 && (
                <p className="text-sm text-gray-500">
                  +{poll.options.length - 2} more options
                </p>
              )}
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1 text-brand-primary" />
                <span>{poll.totalVotes} votes</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1 text-brand-primary" />
                <span>Ends {format(new Date(poll.endDate), 'MMM d')}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}