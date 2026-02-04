// app/polls/[id]/page.tsx - USE EXISTING FIELDS
import { notFound } from 'next/navigation'
import { prisma } from 'lib/prisma'
import PollVoting from 'components/polls/PollVoting'
import { Vote, Calendar, User, BarChart3 } from 'lucide-react'

interface PollPageProps {
  params: {
    id: string
  }
}

export default async function PollPage({ params }: PollPageProps) {
  // First, check if params.id exists
  if (!params?.id) {
    notFound()
  }

  // Use findFirst() instead of findUnique() when using OR conditions
  const poll = await prisma.poll.findFirst({
    where: {
      id: params.id,
      status: {
        in: ['ACTIVE', 'LIVE'] // Use "in" operator instead of OR
      }
    },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true }
          }
        }
      },
      creator: {
        select: {
          name: true,
          image: true
        }
      },
      _count: {
        select: { votes: true }
      }
    }
  })

  if (!poll) {
    notFound()
  }

  const totalVotes = poll._count.votes
  const hasEnded = poll.endDate ? new Date(poll.endDate) < new Date() : false
  
  // Use default pollType since it doesn't exist in schema
  const pollType = 'single' // Default to single choice

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 via-white to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Poll Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-slate-600 text-lg mb-4">
                  {poll.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center text-slate-500">
                  <User className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Created by {poll.creator?.name || 'Anonymous'}
                  </span>
                </div>
                
                {poll.endDate && (
                  <div className="flex items-center text-slate-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {hasEnded ? 'Ended' : 'Ends'} {new Date(poll.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center text-slate-500">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
              {poll.type === 'POLL' ? 'Poll' : 'Contest'}
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="flex items-center mb-6">
                <Vote className="w-6 h-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-bold text-slate-900">
                  Cast Your Vote
                </h2>
              </div>
              
              <PollVoting 
                pollId={poll.id}
                options={poll.options.map(option => ({
                  id: option.id,
                  text: option.text,
                  votes: option._count.votes,
                  imageUrl: option.imageUrl || undefined
                }))}
                pollType={pollType}  // Use default or hardcoded value
                hasEnded={hasEnded}
                totalVotes={totalVotes}
              />
            </div>
          </div>
          
          {/* Poll Stats Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Poll Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className={`font-medium ${
                    hasEnded ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {hasEnded ? 'Ended' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Voting Type</span>
                  <span className="font-medium text-slate-900">
                    Single Choice {/* Hardcoded for now */}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Votes</span>
                  <span className="font-bold text-purple-600">{totalVotes}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Share This Poll</h3>
              <p className="text-sm text-slate-600 mb-4">
                Invite others to vote on this poll
              </p>
              <button className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-md transition-shadow">
                Copy Share Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}