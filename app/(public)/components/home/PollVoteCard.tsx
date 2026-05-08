// // app/(public)/components/home/PollVoteCard.tsx
// 'use client';

// import { useState, useEffect } from 'react';

// interface Contestant {
//   id: string;
//   text: string;
//   imageUrl: string | null;
// }

// interface PollVoteCardProps {
//   poll: {
//     id: string;
//     title: string;
//     description: string | null;
//     type: 'POLL' | 'CONTEST';
//     endDate: Date | null;
//     requiresTicket?: boolean; // true when poll needs a token
//   };
//   contestants: Contestant[];
// }

// export default function PollVoteCard({ poll, contestants }: PollVoteCardProps) {
//   const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
//   const [token, setToken] = useState('');
//   const [voting, setVoting] = useState(false);
//   const [voted, setVoted] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [remainingVotes, setRemainingVotes] = useState<number | null>(null);

//   // Fetch remaining votes when poll requires a ticket
//   useEffect(() => {
//     if (poll.requiresTicket) {
//       fetch(`/api/polls/${poll.id}/remaining-votes`)
//         .then(res => res.json())
//         .then(data => setRemainingVotes(data.remaining))
//         .catch(() => setRemainingVotes(null));
//     }
//   }, [poll.id, poll.requiresTicket]);

//   const handleVote = async (contestantId: string) => {
//     setError(null);
//     setVoting(true);

//     try {
//       const body: any = {
//         pollId: poll.id,
//         optionId: contestantId,
//       };
//       if (poll.requiresTicket) {
//         if (!token.trim()) {
//           setError('Please enter your ticket code.');
//           setVoting(false);
//           return;
//         }
//         body.ticketCode = token.trim();
//       }

//       const response = await fetch(`/api/polls/${poll.id}/vote`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         setVoted(true);
//         setSelectedContestant(contestantId);
//         if (remainingVotes !== null) {
//           setRemainingVotes(prev => (prev && prev > 0 ? prev - 1 : 0));
//         }
//         setToken(''); // clear token after successful vote
//       } else {
//         setError(result.message || 'Voting failed.');
//       }
//     } catch (err) {
//       setError('Network error. Please try again.');
//     } finally {
//       setVoting(false);
//     }
//   };

//   const getTimeRemaining = () => {
//     if (!poll.endDate) return 'No end date';
//     const end = new Date(poll.endDate);
//     const now = new Date();
//     const diff = end.getTime() - now.getTime();
//     if (diff <= 0) return 'Ended';
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     return `${days}d ${hours}h remaining`;
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center justify-between mb-2">
//           <h2 className="text-2xl font-bold">{poll.title}</h2>
//           <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
//             {poll.type === 'CONTEST' ? '💰 Paid Contest' : '📊 Poll'}
//           </span>
//         </div>
//         {poll.description && <p className="text-gray-600 mb-3">{poll.description}</p>}
//         <div className="flex items-center text-sm text-gray-500">
//           <span className="mr-4">⏰ {getTimeRemaining()}</span>
//           <span>👥 {contestants.length} contestants</span>
//         </div>
//       </div>

//       {/* Token input (if required) */}
//       {poll.requiresTicket && !voted && (
//         <div className="mb-4">
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             🎟️ Ticket Code (from your purchase)
//           </label>
//           <input
//             type="text"
//             value={token}
//             onChange={(e) => setToken(e.target.value)}
//             placeholder="e.g. a1b2c3d4..."
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//           {remainingVotes !== null && (
//             <p className="mt-1 text-xs text-gray-500">
//               You have {remainingVotes} vote{remainingVotes !== 1 ? 's' : ''} remaining.
//             </p>
//           )}
//         </div>
//       )}

//       {error && (
//         <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
//           {error}
//         </div>
//       )}

//       {/* Voting grid */}
//       {voted ? (
//         <div className="text-center py-8 bg-green-50 rounded-lg">
//           <div className="text-4xl mb-4">✅</div>
//           <p className="text-lg font-medium text-green-800">Vote Submitted!</p>
//           <p className="text-gray-600">Thank you for voting</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {contestants.map((contestant) => (
//             <button
//               key={contestant.id}
//               onClick={() => handleVote(contestant.id)}
//               disabled={voting || (poll.requiresTicket && !token.trim())}
//               className={`p-4 rounded-lg border-2 transition-all ${
//                 selectedContestant === contestant.id
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
//               } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               <div className="flex flex-col items-center text-center">
//                 <div className="mb-3">
//                   {contestant.imageUrl ? (
//                     <img
//                       src={contestant.imageUrl}
//                       alt={contestant.text}
//                       className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
//                     />
//                   ) : (
//                     <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
//                       <span className="text-2xl">👤</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="font-medium">{contestant.text}</div>
//                 <div className="mt-3">
//                   <div className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
//                     {poll.type === 'CONTEST' ? 'Vote ($1)' : 'Vote'}
//                   </div>
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Footer stats */}
//       <div className="border-t pt-4 mt-6">
//         <div className="flex justify-between text-sm text-gray-500">
//           <div>
//             <span className="font-medium">Total Votes:</span> (load from results if needed)
//           </div>
//           <div>
//             <span className="font-medium">Your Vote:</span>{' '}
//             {selectedContestant ? 'Submitted' : 'Not yet'}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';

interface Contestant {
  id: string;
  text: string;
  imageUrl: string | null;
  votes?: number;
  percentage?: number;
}

interface PollVoteCardProps {
  poll: {
    id: string;
    title: string;
    description: string | null;
    type: 'POLL' | 'CONTEST';
    endDate: Date | null;
    requiresTicket?: boolean;
  };
  contestants: Contestant[];
}

export default function PollVoteCard({ poll, contestants: initialContestants }: PollVoteCardProps) {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [voting, setVoting] = useState(false);
  const [hasVotedAtLeastOnce, setHasVotedAtLeastOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);

  // Sync contestants on re-render
  useEffect(() => {
    setContestants(initialContestants);
  }, [initialContestants]);

  // Fetch remaining votes for token‑gated polls
  useEffect(() => {
  if (poll.requiresTicket) {
    // Token‑gated poll
    fetch(`/api/polls/${poll.id}/remaining-votes`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setRemainingVotes(data.remaining ?? 0);
        // If they've already used at least one ticket, show results
        if (data.totalTickets > 0 && data.remaining < data.totalTickets) {
          setHasVotedAtLeastOnce(true);
        }
      })
      .catch(() => setRemainingVotes(null));
  } else {
    // Public poll – check if user already voted
    fetch(`/api/polls/${poll.id}/remaining-votes`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.hasVoted) {
          setHasVotedAtLeastOnce(true);
          setRemainingVotes(0); // no votes left
        } else {
          setRemainingVotes(1); // can vote once
        }
      })
      .catch(() => setRemainingVotes(null));
  }
}, [poll.id, poll.requiresTicket]);

  const canVote = remainingVotes !== null && remainingVotes > 0;

  const handleVote = async (contestantId: string) => {
    setError(null);
    if (!canVote) return;

    if (poll.requiresTicket && !token.trim()) {
      setToast({ msg: 'Please enter your ticket code.', type: 'error' });
      return;
    }

    setVoting(true);
    try {
      const body: any = {
        pollId: poll.id,
        optionId: contestantId,
      };
      if (poll.requiresTicket) {
        body.ticketCode = token.trim();
      }

      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        setHasVotedAtLeastOnce(true);
        setSelectedContestant(contestantId);
        setRemainingVotes(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        setToken('');

        // Update results from API response
        if (result.results && Array.isArray(result.results)) {
          setContestants(prev =>
            prev.map(c => {
              const fresh = result.results.find((r: any) => r.id === c.id);
              return fresh ? { ...c, votes: fresh.votes, percentage: fresh.percentage } : c;
            })
          );
          setTotalVotes(result.totalVotes ?? 0);
        }
        setToast({ msg: 'Your vote was recorded! 🎉 Thank you for voting!', type: 'success' });
        setTimeout(() => setToast(null), 5000);
      } else {
        setError(result.message || 'Voting failed.');
        setToast({ msg: result.message || 'Voting failed.', type: 'error' });
      }
    } catch (err) {
      setToast({ msg: 'Network error. Please try again.', type: 'error' });
    } finally {
      setVoting(false);
    }
  };

  const getTimeRemaining = () => {
    if (!poll.endDate) return 'No end date';
    const end = new Date(poll.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{poll.title}</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {poll.type === 'CONTEST' ? '💰 Paid Contest' : '📊 Poll'}
          </span>
        </div>
        {poll.description && <p className="text-gray-600 mb-3">{poll.description}</p>}
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-4">⏰ {getTimeRemaining()}</span>
          <span>👥 {contestants.length} contestants</span>
        </div>
      </div>

      {/* Token input (only for token‑gated polls with remaining votes) */}
      {poll.requiresTicket && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🎟️ Ticket Code (from your purchase)
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g. a1b2c3d4..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {remainingVotes !== null && remainingVotes > 0 && (
  <p className="mt-1 text-xs text-gray-500">
    You have {remainingVotes} vote{remainingVotes !== 1 ? 's' : ''} remaining.
  </p>
)}
        </div>
      )}
      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Show live results if user has voted at least once, otherwise voting grid ── */}
      {hasVotedAtLeastOnce ? (
        <div className="space-y-4">
          {contestants
            .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
            .map((contestant) => {
              const pct = contestant.percentage ?? 0;
              const voteCount = contestant.votes ?? 0;
              return (
                <div key={contestant.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {contestant.imageUrl ? (
                      <img src={contestant.imageUrl} alt={contestant.text} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">👤</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{contestant.text}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{pct}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Show vote button only if user can still vote */}
                  {canVote && (
                    <button
                      onClick={() => handleVote(contestant.id)}
                      disabled={voting || (poll.requiresTicket && !token.trim())}
                      className="w-full mt-2 py-1.5 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      {voting ? 'Submitting...' : 'Vote'}
                    </button>
                  )}
                </div>
              );
            })}
          <p className="text-center text-xs text-gray-400 mt-2">
            Total votes: {totalVotes}
          </p>
        </div>
      ) : (
        /* Voting grid (before first vote) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contestants.map((contestant) => (
            <button
              key={contestant.id}
              onClick={() => handleVote(contestant.id)}
              disabled={voting || (poll.requiresTicket && !token.trim()) || !canVote}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedContestant === contestant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
              } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  {contestant.imageUrl ? (
                    <img src={contestant.imageUrl} alt={contestant.text} className="h-20 w-20 rounded-full object-cover border-4 border-white shadow" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                </div>
                <div className="font-medium">{contestant.text}</div>
                <div className="mt-3">
                  <div className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    {poll.type === 'CONTEST' ? 'Vote ($1)' : 'Vote'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between text-sm text-gray-500">
          <div>
            <span className="font-medium">Total Votes:</span> {totalVotes || 0}
          </div>
          <div>
            {poll.requiresTicket ? (
              <span className="font-medium">
                Remaining: {remainingVotes ?? 0} vote{remainingVotes !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>
                <span className="font-medium">Your Vote:</span>{' '}
                {hasVotedAtLeastOnce ? 'Submitted' : 'Not yet'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}