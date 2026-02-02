// // components/polls/PollCard.tsx - NEW
// 'use client';
// import { Vote, BarChart3, Clock, Users } from 'lucide-react';

// interface PollCardProps {
//   poll: {
//     id: string;
//     title: string;
//     description: string;
//     endDate: string;
//     options: Array<{
//       id: string;
//       text: string;
//       votes: number;
//     }>;
//     totalVotes: number;
//   };
// }

// export default function PollCard({ poll }: PollCardProps) {
//   const endDate = new Date(poll.endDate);
//   const timeRemaining = Math.max(0, endDate.getTime() - Date.now());
//   const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

//   return (
//     <div className="bg-gradient-to-br from-white to-brand-subtle/20 rounded-2xl p-6 shadow-lg border border-brand-subtle/30 hover:shadow-xl transition-all duration-300">
//       {/* Poll Header */}
//       <div className="flex items-start justify-between mb-4">
//         <div>
//           <div className="flex items-center gap-2 mb-2">
//             <div className="p-2 rounded-lg bg-brand-primary/10">
//               <Vote className="w-5 h-5 text-brand-primary" />
//             </div>
//             <span className="text-sm font-semibold text-brand-primary uppercase tracking-wide">
//               Live Poll
//             </span>
//           </div>
//           <h3 className="text-xl font-bold text-slate-900 mb-2">{poll.title}</h3>
//           <p className="text-slate-600 text-sm mb-4">{poll.description}</p>
//         </div>
        
//         <div className="text-right">
//           <div className="flex items-center gap-1 text-sm text-slate-500">
//             <Clock className="w-4 h-4" />
//             <span className="font-medium">{daysRemaining}d left</span>
//           </div>
//           <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
//             <Users className="w-4 h-4" />
//             <span>{poll.totalVotes.toLocaleString()} votes</span>
//           </div>
//         </div>
//       </div>

//       {/* Poll Options */}
//       <div className="space-y-3 mb-6">
//         {poll.options.map((option, index) => {
//           const percentage = poll.totalVotes > 0 
//             ? Math.round((option.votes / poll.totalVotes) * 100) 
//             : 0;
          
//           return (
//             <div key={option.id} className="group">
//               <div className="flex items-center justify-between mb-1.5">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
//                     index === 0 
//                       ? 'bg-brand-accent/10 text-brand-accent'
//                       : 'bg-brand-subtle/30 text-brand-primary'
//                   }`}>
//                     {String.fromCharCode(65 + index)}
//                   </div>
//                   <span className="font-medium text-slate-800">{option.text}</span>
//                 </div>
//                 <span className={`font-bold ${
//                   index === 0 ? 'text-brand-accent' : 'text-brand-primary'
//                 }`}>
//                   {percentage}%
//                 </span>
//               </div>
              
//               <div className="relative h-3 bg-brand-subtle/30 rounded-full overflow-hidden">
//                 <div 
//                   className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
//                     index === 0
//                       ? 'bg-gradient-to-r from-brand-accent to-orange-400'
//                       : 'bg-gradient-to-r from-brand-primary to-sky-400'
//                   }`}
//                   style={{ width: `${percentage}%` }}
//                 />
//               </div>
              
//               <div className="text-right mt-1">
//                 <span className="text-xs text-slate-500">
//                   {option.votes.toLocaleString()} votes
//                 </span>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Action Button */}
//       <button className="w-full btn-secondary flex items-center justify-center gap-2 py-3.5 text-lg font-semibold">
//         <BarChart3 className="w-5 h-5" />
//         Vote Now
//       </button>
//     </div>
//   );
// }

// components/polls/PollCard.tsx - UPDATED with clickable prop
'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Clock, Vote } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  endDate: string;
  options: PollOption[];
  totalVotes: number;
}

interface PollCardProps {
  poll: Poll;
  clickable?: boolean; // Add this prop
}

export default function PollCard({ poll, clickable = true }: PollCardProps) {
  const router = useRouter();
  
  const handleCardClick = () => {
    if (clickable) {
      router.push(`/polls/${poll.id}`);
    }
  };

  const endDate = new Date(poll.endDate);
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${
        clickable ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{poll.title}</h3>
            <p className="text-slate-600 mt-1">{poll.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{daysLeft} days left</span>
          </div>
        </div>

        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = poll.totalVotes > 0 
              ? Math.round((option.votes / poll.totalVotes) * 100) 
              : 0;

            return (
              <div
                key={option.id}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-brand-accent transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{option.text}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-brand-accent h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-slate-600">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-sm text-slate-600">
                    {option.votes} votes
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-600">
            <Vote className="w-5 h-5" />
            <span className="text-sm">{poll.totalVotes} total votes</span>
          </div>
          <button className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors">
            Vote Now
          </button>
        </div>
      </div>
    </div>
  );
}