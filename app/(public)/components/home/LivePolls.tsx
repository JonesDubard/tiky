// app/(public)/components/home/LivePolls.tsx - NEW
'use client'
import { Vote, BarChart3, Clock, Users } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  votes: number
}

interface Poll {
  id: string
  title: string
  description: string
  endDate: string
  options: PollOption[]
  totalVotes: number
}

interface LivePollsProps {
  polls: Poll[]
}

export default function LivePolls({ polls }: LivePollsProps) {
  if (!polls || polls.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-brand-subtle/30 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-brand-accent/10 to-brand-primary/20 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No active polls</h3>
        <p className="text-slate-600">Check back later for community polls!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {polls.map((poll) => {
        const endDate = new Date(poll.endDate)
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        
        return (
          <div key={poll.id} className="bg-gradient-to-br from-white to-brand-subtle/20 rounded-2xl p-6 shadow-lg border border-brand-subtle/30 hover:shadow-xl transition-all duration-300">
            {/* Poll Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-brand-primary/10">
                    <Vote className="w-5 h-5 text-brand-primary" />
                  </div>
                  <span className="text-sm font-semibold text-brand-primary uppercase tracking-wide">
                    Live Poll
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">{poll.title}</h3>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{daysRemaining}d left</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                  <Users className="w-4 h-4" />
                  <span>{poll.totalVotes.toLocaleString()} votes</span>
                </div>
              </div>
            </div>

            {/* Poll Options */}
            <div className="space-y-3 mb-6">
              {poll.options.slice(0, 3).map((option, index) => {
                const percentage = poll.totalVotes > 0 
                  ? Math.round((option.votes / poll.totalVotes) * 100) 
                  : 0
                
                return (
                  <div key={option.id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          index === 0 
                            ? 'bg-brand-accent/10 text-brand-accent'
                            : 'bg-brand-subtle/30 text-brand-primary'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-medium text-slate-800 line-clamp-1">{option.text}</span>
                      </div>
                      <span className={`font-bold ${
                        index === 0 ? 'text-brand-accent' : 'text-brand-primary'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="relative h-2 bg-brand-subtle/30 rounded-full overflow-hidden">
                      <div 
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
                          index === 0
                            ? 'bg-gradient-to-r from-brand-accent to-orange-400'
                            : 'bg-gradient-to-r from-brand-primary to-sky-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Vote Button */}
            <button className="w-full btn-secondary flex items-center justify-center gap-2 py-3 text-sm font-semibold">
              <BarChart3 className="w-4 h-4" />
              Vote Now
            </button>
          </div>
        )
      })}
    </div>
  )
}