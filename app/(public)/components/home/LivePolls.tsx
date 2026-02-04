'use client'

import { Vote, BarChart3, Clock, Users } from 'lucide-react'
import { PublicPoll } from '@/types/polls'

interface LivePollsProps {
  polls: PublicPoll[]
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
        const daysRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )

        return (
          <div
            key={poll.id}
            className="bg-gradient-to-br from-white to-brand-subtle/20 rounded-2xl p-6 shadow-lg border border-brand-subtle/30"
          >
            <h3 className="text-xl font-bold mb-2">{poll.title}</h3>

            <div className="text-sm text-slate-500 mb-4">
              {daysRemaining} days left · {poll.totalVotes} votes
            </div>

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
