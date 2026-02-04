// components/polls/PollVoting.tsx - FIXED VERSION
"use client"

import { useState } from "react"
import { CheckCircle, AlertCircle, BarChart3 } from "lucide-react"
import Image from "next/image"

type Option = {
  id: string
  text: string
  votes: number
  imageUrl?: string
}

interface PollVotingProps {
  pollId: string
  options: Option[]
  pollType: string  // 'single' or 'multiple'
  hasEnded: boolean // Fixed: Now definitely boolean
  totalVotes: number
}

export default function PollVoting({ 
  pollId, 
  options, 
  pollType, 
  hasEnded, 
  totalVotes 
}: PollVotingProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasVoted, setHasVoted] = useState(false)
  const [localOptions, setLocalOptions] = useState(options)

  const handleOptionSelect = (optionId: string) => {
    if (hasEnded || hasVoted || loading) return

    if (pollType === "single") {
      // Single choice - replace selection
      setSelectedOptions([optionId])
    } else {
      // Multiple choice - toggle selection
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || hasEnded || hasVoted || loading) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: selectedOptions }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit vote")
      }

      // Update local options with new vote counts
      const updatedOptions = localOptions.map(option => ({
        ...option,
        votes: selectedOptions.includes(option.id) 
          ? option.votes + 1 
          : option.votes
      }))

      setLocalOptions(updatedOptions)
      setHasVoted(true)
      
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (votes: number) => {
    const newTotal = totalVotes + (hasVoted ? selectedOptions.length : 0)
    if (newTotal === 0) return 0
    return Math.round((votes / newTotal) * 100)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {hasEnded && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-700 font-medium">
            This poll has ended. Viewing results only.
          </p>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-4">
        {localOptions.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          const percentage = calculatePercentage(option.votes)
          const showResults = hasVoted || hasEnded

          return (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleOptionSelect(option.id)}
                disabled={hasEnded || hasVoted || loading}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? "border-purple-600 bg-purple-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                } ${(hasEnded || hasVoted || loading) ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {option.imageUrl && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={option.imageUrl}
                          alt={option.text}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="text-left">
                      <h3 className="font-medium text-slate-900">{option.text}</h3>
                      {showResults && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-purple-600">
                            {percentage}%
                          </span>
                          <span className="text-xs text-slate-500">
                            ({option.votes} {option.votes === 1 ? 'vote' : 'votes'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                </div>

                {/* Results Bar */}
                {showResults && (
                  <div className="mt-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        {!hasVoted && !hasEnded && (
          <>
            <button
              onClick={handleSubmitVote}
              disabled={selectedOptions.length === 0 || loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Vote...
                </span>
              ) : (
                "Submit Vote"
              )}
            </button>
            
            <button
              onClick={() => setSelectedOptions([])}
              disabled={selectedOptions.length === 0 || loading}
              className="px-6 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Selection
            </button>
          </>
        )}

        {hasVoted && !hasEnded && (
          <div className="flex-1 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Thank you for voting!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Your vote has been recorded. You can see live results above.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Poll Statistics</span>
          </div>
          <div>
            <span className="font-medium text-slate-900">
              {totalVotes + (hasVoted ? selectedOptions.length : 0)}
            </span>
            <span className="ml-1">votes</span>
          </div>
        </div>
        
        {pollType === "multiple" && !hasEnded && !hasVoted && (
          <p className="text-xs text-slate-500 mt-2">
            💡 This is a multiple-choice poll. You can select more than one option.
          </p>
        )}
      </div>
    </div>
  )
}