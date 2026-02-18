// app/(public)/components/polls/PollVoting.tsx - UPDATED
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle, Crown, AlertCircle, BarChart } from 'lucide-react';
import Link from 'next/link';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollVotingProps {
  pollId: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  pollType?: string;
}

export default function PollVoting({ 
  pollId, 
  options: initialOptions, 
  totalVotes: initialTotal, 
  isActive, 
  pollType = 'FREE' 
}: PollVotingProps) {
  const { data: session } = useSession();
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState(0);
  const [deviceId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('pollDeviceId');
      if (!id) {
        id = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('pollDeviceId', id);
      }
      return id;
    }
    return '';
  });

  // Check if user has already voted
  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const url = `/api/polls/${pollId}/vote${
          session?.user ? '' : `?deviceId=${deviceId}`
        }`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.votes?.length > 0) {
            setHasVoted(true);
            setSelectedOption(data.votes[0].optionId);
          }
          setRemainingVotes(data.remainingVotes || 0);
        }
      } catch (error) {
        console.error('Failed to check vote status:', error);
      }
    };

    if (pollId) {
      checkVoteStatus();
    }
  }, [pollId, session, deviceId]);

  const handleVote = async () => {
    if (!selectedOption || !isActive || hasVoted) return;
    if (pollType === 'PAID' && !session) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          optionId: selectedOption,
          ...(!session?.user && { deviceId })
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote');
      }

      // Update local state with real-time results
      if (data.poll) {
        setOptions(data.poll.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          votes: opt._count.votes
        })));
        setTotalVotes(data.poll._count.votes);
      }

      setHasVoted(true);
      setRemainingVotes(data.remainingVotes || 0);
      setSuccess(data.message);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // If paid poll and not logged in
  if (pollType === 'PAID' && !session) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <Crown className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Poll</h3>
        <p className="text-gray-600 mb-6">
          Please log in to vote in this premium poll.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-accent transition-colors"
        >
          Log in to Vote
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      {/* Show remaining votes for premium polls */}
      {pollType === 'PAID' && session && remainingVotes > 0 && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700">
            <Crown className="w-5 h-5" />
            <p className="text-sm font-medium">
              You have {remainingVotes} vote{remainingVotes !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {hasVoted ? "Results" : "Cast Your Vote"}
      </h2>

      {!hasVoted ? (
        <>
          <div className="space-y-3 mb-8">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                disabled={!isActive}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedOption === option.id
                    ? "border-brand-primary bg-brand-subtle/20"
                    : "border-gray-200 hover:border-brand-primary/50"
                } ${!isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="font-medium text-gray-900">{option.text}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleVote}
            disabled={!selectedOption || !isActive || isSubmitting}
            className="w-full py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-accent transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </button>

          {!isActive && (
            <p className="text-center text-gray-600 mt-4">
              This poll is no longer accepting votes.
            </p>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {options.map((option) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;
            
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    {option.text}
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </span>
                  <span className="text-gray-600">
                    {option.votes} votes ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-green-500' : 'bg-brand-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          
          <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl mt-6">
            <BarChart className="w-5 h-5" />
            <span className="font-medium">Total Votes: {totalVotes}</span>
          </div>

          {/* Show remaining votes message */}
          {pollType === 'PAID' && remainingVotes > 0 && (
            <div className="text-center text-purple-600 bg-purple-50 p-4 rounded-xl">
              <p className="font-medium">
                You have {remainingVotes} more vote{remainingVotes !== 1 ? 's' : ''} remaining
              </p>
              <button
                onClick={() => setHasVoted(false)}
                className="mt-2 text-sm underline hover:text-purple-800"
              >
                Vote again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}