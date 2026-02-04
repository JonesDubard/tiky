'use client'

import { useState } from 'react'

interface Contestant {
  id: string
  text: string
  imageUrl: string | null
}

interface PollVoteCardProps {
  poll: {
    id: string
    title: string
    description: string | null
    type: 'POLL' | 'CONTEST'
    endDate: Date | null
  }
  contestants: Contestant[]
}

export default function PollVoteCard({ poll, contestants }: PollVoteCardProps) {
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)

  const handleVote = async (contestantId: string) => {
    setVoting(true)
    
    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId: contestantId
        })
      })
      
      if (response.ok) {
        setVoted(true)
        setSelectedContestant(contestantId)
      }
    } catch (error) {
      console.error('Voting failed:', error)
    } finally {
      setVoting(false)
    }
  }

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!poll.endDate) return 'No end date'
    
    const end = new Date(poll.endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    return `${days}d ${hours}h remaining`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Poll Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{poll.title}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            poll.type === 'CONTEST' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {poll.type === 'CONTEST' ? '💰 Paid Contest' : '📊 Free Poll'}
          </span>
        </div>
        
        {poll.description && (
          <p className="text-gray-600 mb-3">{poll.description}</p>
        )}
        
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-4">⏰ {getTimeRemaining()}</span>
          <span>👥 {contestants.length} contestants</span>
        </div>
      </div>

      {/* Contestants Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Vote for your favorite:</h3>
        
        {voted ? (
          <div className="text-center py-8 bg-green-50 rounded-lg">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-lg font-medium text-green-800">Vote Submitted!</p>
            <p className="text-gray-600">Thank you for voting</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => handleVote(contestant.id)}
                disabled={voting}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedContestant === contestant.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Contestant Photo */}
                  <div className="mb-3">
                    {contestant.imageUrl ? (
                      <img
                        src={contestant.imageUrl}
                        alt={contestant.text}
                        className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Contestant Name */}
                  <div className="font-medium">{contestant.text}</div>
                  
                  {/* Vote Button */}
                  <div className="mt-3">
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      poll.type === 'CONTEST'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {poll.type === 'CONTEST' ? 'Vote ($1)' : 'Vote Free'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Poll Stats */}
      <div className="border-t pt-4">
        <div className="flex justify-between text-sm text-gray-500">
          <div>
            <span className="font-medium">Total Votes:</span> Loading...
          </div>
          <div>
            <span className="font-medium">Your Vote:</span> {selectedContestant ? 'Submitted' : 'Not yet'}
          </div>
        </div>
      </div>
    </div>
  )
}