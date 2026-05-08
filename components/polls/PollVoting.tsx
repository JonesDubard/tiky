// "use client";

// // components/polls/PollVoting.tsx
// //
// // KEY FIX: Split isActive (true poll status) from canVote (user eligibility).
// // blockReason explains WHY the user can't vote without hiding the poll state.
// //
// // blockReason values:
// //   "closed"        → poll is actually closed
// //   "not_logged_in" → poll is open but user not authenticated
// //   "no_ticket"     → poll is open, user logged in, but no ticket for this event
// //   null            → user can vote freely

// import { useState, useEffect } from "react";
// import {
//   CheckCircle, Lock, LogIn, Loader2,
//   BarChart2, User, Ticket, ShoppingBag,
// } from "lucide-react";
// import { useSession } from "next-auth/react";

// interface PollOption {
//   id: string;
//   text: string;
//   votes: number;
//   imageUrl?: string | null;
// }

// export type VoteBlockReason =
//   | "closed"
//   | "not_logged_in"
//   | "no_ticket"
//   | "enter_code"
//   | null;

// interface PollVotingProps {
//   pollId: string;
//   options: PollOption[];
//   totalVotes: number;
//   // ✅ TRUE poll status — never set to false just because user can't vote
//   isActive: boolean;
//   pollType: string;
//   requiresTicket?: boolean;
//   eventId?: string | null;
//   eventTitle?: string | null;
//   userVotedOptionId?: string | null;
//   // ✅ NEW: why the user can't vote (separate from poll status)
//   blockReason?: VoteBlockReason;
// }

// interface ResultOption {
//   id: string;
//   text: string;
//   votes: number;
//   percentage: number;
//   imageUrl?: string | null;
// }

// export default function PollVoting({
//   pollId,
//   options,
//   totalVotes: initialTotal,
//   isActive,
//   pollType,
//   requiresTicket = false,
//   eventId,
//   eventTitle,
//   userVotedOptionId: initialVotedId = null,
//   blockReason = null,
// }: PollVotingProps) {
//   const { data: session, status: authStatus } = useSession();
//   const [selected, setSelected]               = useState<string | null>(null);
//   const [results, setResults]                 = useState<ResultOption[] | null>(null);
//   const [totalVotes, setTotalVotes]           = useState(initialTotal);
//   const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(initialVotedId);
//   const [loading, setLoading]                 = useState(false);
//   const [ticketCode, setTicketCode]           = useState("");
//   const [toast, setToast]                     = useState<{
//     msg: React.ReactNode; type: "success" | "error"
//   } | null>(null);

//   const hasVoted       = !!userVotedOptionId;
//   // ✅ Show results if voted OR poll is actually closed — NOT based on blockReason
//   const showResults    = hasVoted || !isActive;
//   const isTokenGated   = pollType === "TOKEN_GATED";
//   const needsTicketCode = isTokenGated && requiresTicket;
//   // ✅ User can interact with voting UI only if poll is active AND no block reason
//   const canInteract    = isActive && !blockReason;

//   const showToast = (msg: React.ReactNode, type: "success" | "error") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 4000);
//   };

//   // Load live results
//   useEffect(() => {
//     if (authStatus === "loading") return;
//     const loadResults = async () => {
//       try {
//         const res  = await fetch(`/api/polls/${pollId}/results`);
//         if (!res.ok) return;
//         const data = await res.json();
//         const merged = (data.results ?? []).map((r: ResultOption) => ({
//           ...r,
//           imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
//         }));
//         setResults(merged);
//         setTotalVotes(data.totalVotes);
//         if (data.userVotedOptionId) setUserVotedOptionId(data.userVotedOptionId);
//       } catch {}
//     };
//     loadResults();
//   }, [pollId, authStatus, options]);

//   // ── Error code → friendly message ─────────────────────────────────────────
//   const getErrorMessage = (errorCode: string) => {
//     switch (errorCode) {
//       case "AUTH_REQUIRED":
//         return { title: "You must be logged in to vote.", action: { label: "Log in", href: "/login" } };
//       case "NO_TICKET":
//         return { title: "You need a ticket for this event to vote.", action: { label: "Buy Ticket", href: eventId ? `/events/${eventId}` : "/events" } };
//       case "TICKET_REQUIRED":
//         return { title: "Please enter your ticket code to vote." };
//       case "INVALID_TICKET":
//         return { title: "Ticket not found. Please check the code." };
//       case "WRONG_EVENT":
//         return { title: "This ticket is not valid for this poll's event." };
//       case "TICKET_NOT_PAID":
//         return { title: "Only paid tickets can be used to vote." };
//       case "TICKET_ALREADY_USED":
//         return { title: "This ticket has already been used to vote on this poll." };
//       case "ALREADY_VOTED":
//         return { title: "You have already voted on this poll." };
//       case "POLL_CLOSED":
//       case "POLL_ENDED":
//         return { title: "This poll is no longer active." };
//       default:
//         return { title: "Unable to cast vote. Please try again." };
//     }
//   };

//   const handleVote = async () => {
//     if (!selected) { showToast("Please select an option first", "error"); return; }
//     if (needsTicketCode && !ticketCode.trim()) { showToast("Please enter your ticket code", "error"); return; }

//     setLoading(true);
//     try {
//       const payload: Record<string, string> = { optionId: selected };
//       if (needsTicketCode) payload.ticketCode = ticketCode.trim();

//       const res  = await fetch(`/api/polls/${pollId}/vote`, {
//         method:  "POST",
//         headers: { "Content-Type": "application/json" },
//         body:    JSON.stringify(payload),
//       });
//       const data = await res.json();

//       if (!res.ok) {
//         const friendly = getErrorMessage(data.error);
//         showToast(
//           friendly.action ? (
//             <span>
//               {friendly.title}{" "}
//               <a href={friendly.action.href} className="underline font-bold">
//                 {friendly.action.label}
//               </a>
//             </span>
//           ) : friendly.title,
//           "error"
//         );
//         return;
//       }

//       const merged = (data.results ?? []).map((r: ResultOption) => ({
//         ...r,
//         imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
//       }));
//       setResults(merged);
//       setTotalVotes(data.totalVotes);
//       setUserVotedOptionId(selected);
//       showToast("Your vote has been recorded! 🎉", "success");
//       setTicketCode("");
//     } catch {
//       showToast("Something went wrong. Please try again.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const baseOptions: ResultOption[] = results
//     ? results
//     : options.map((o) => ({
//         ...o,
//         percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
//       }));

//   const displayOptions = showResults
//     ? [...baseOptions].sort((a, b) => b.votes - a.votes)
//     : baseOptions;

//   const winnerVotes = showResults ? Math.max(...displayOptions.map((o) => o.votes)) : -1;

//   // ── Block reason banners ───────────────────────────────────────────────────
//   const renderBlockBanner = () => {
//     if (!blockReason || !isActive || hasVoted) return null;

//     if (blockReason === "not_logged_in") {
//       return (
//         <div className="mb-5 flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
//           <LogIn className="w-5 h-5 text-orange-500 shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-orange-800">Login required to vote</p>
//             <p className="text-sm text-orange-700 mt-0.5">
//               <a href="/login" className="underline font-medium">Log in</a> or{" "}
//               <a href="/signup" className="underline font-medium">sign up</a> to cast your vote.
//             </p>
//           </div>
//         </div>
//       );
//     }

//     if (blockReason === "no_ticket") {
//       return (
//         <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
//           <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
//           <div className="flex-1">
//             <p className="text-sm font-semibold text-amber-800">
//               Ticket required to vote
//             </p>
//             <p className="text-sm text-amber-700 mt-0.5">
//               You need a ticket for{" "}
//               <span className="font-medium">{eventTitle ?? "this event"}</span> to participate
//               in this poll.
//             </p>
//             <a
//               href={eventId ? `/events/${eventId}` : "/events"}
//               className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
//             >
//               <Ticket className="w-3.5 h-3.5" />
//               Get a Ticket
//             </a>
//           </div>
//         </div>
//       );
//     }

//     if (blockReason === "enter_code") {
//       return (
//         <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
//           <Lock className="w-4 h-4 text-blue-600 shrink-0" />
//           <p className="text-sm text-blue-700">Enter your ticket code below to vote.</p>
//         </div>
//       );
//     }

//     return null;
//   };

//   return (
//     <div className="relative">
//       {/* Toast */}
//       {toast && (
//         <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
//           toast.type === "success" ? "bg-green-500" : "bg-red-500"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-2">
//             <BarChart2 className="w-5 h-5 text-orange-500" />
//             <h2 className="text-lg font-semibold text-gray-900">
//               {showResults ? "Live Results" : "Cast Your Vote"}
//             </h2>
//           </div>
//           <span className="text-sm text-gray-500">
//             {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? "s" : ""}
//           </span>
//         </div>

//         {/* ✅ Block reason banner — shown instead of "poll closed" when poll is still active */}
//         {renderBlockBanner()}

//         {/* Ticket code input */}
//         {canInteract && needsTicketCode && (
//           <div className="mb-4">
//             <label htmlFor="ticketCode" className="block text-sm font-medium text-gray-700 mb-1">
//               Ticket Code
//             </label>
//             <input
//               id="ticketCode"
//               type="text"
//               value={ticketCode}
//               onChange={e => setTicketCode(e.target.value)}
//               placeholder="Enter the code from your ticket"
//               className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
//               disabled={loading}
//             />
//             <p className="text-xs text-gray-500 mt-1">
//               The code printed on your physical/digital ticket.
//             </p>
//           </div>
//         )}

//         {/* Options */}
//         <div className="space-y-2.5">
//           {displayOptions.map(option => {
//             const isWinner = showResults && option.votes === winnerVotes && winnerVotes > 0;
//             const isMyVote = option.id === userVotedOptionId;
//             const isChosen = option.id === selected && !showResults;

//             return (
//               <button
//                 key={option.id}
//                 onClick={() => canInteract && setSelected(option.id)}
//                 disabled={!canInteract || loading}
//                 className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
//                   showResults
//                     ? isWinner
//                       ? "border-orange-300 bg-gradient-to-r from-orange-50 to-white"
//                       : "border-gray-100 bg-white"
//                     : canInteract
//                     ? isChosen
//                       ? "border-orange-500 bg-orange-50 shadow-sm"
//                       : "border-gray-200 hover:border-orange-300 hover:bg-gray-50 cursor-pointer"
//                     : "border-gray-100 bg-gray-50 cursor-default opacity-75"
//                 }`}
//               >
//                 <div className="flex items-center gap-3 p-3">
//                   <div className="shrink-0 relative">
//                     {option.imageUrl ? (
//                       <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
//                         <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover" />
//                       </div>
//                     ) : (
//                       <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
//                         isChosen || isMyVote ? "bg-orange-100" : isWinner ? "bg-orange-50" : "bg-gray-100"
//                       }`}>
//                         <User className={`w-6 h-6 ${
//                           isChosen || isMyVote || isWinner ? "text-orange-400" : "text-gray-400"
//                         }`} />
//                       </div>
//                     )}
//                     {isMyVote && (
//                       <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow">
//                         <CheckCircle className="w-3.5 h-3.5 text-white" />
//                       </div>
//                     )}
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between gap-2 mb-1.5">
//                       <span className={`text-sm font-semibold truncate ${
//                         isWinner ? "text-orange-900" : "text-gray-800"
//                       }`}>
//                         {isWinner && <span className="mr-1">🏆</span>}
//                         {option.text}
//                       </span>
//                       {showResults && (
//                         <div className="flex items-center gap-2 shrink-0">
//                           <span className="text-xs text-gray-400">{option.votes.toLocaleString()}</span>
//                           <span className={`text-sm font-bold w-10 text-right ${
//                             isWinner ? "text-orange-600" : "text-gray-500"
//                           }`}>
//                             {option.percentage}%
//                           </span>
//                         </div>
//                       )}
//                     </div>

//                     {showResults ? (
//                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full transition-all duration-700 ${
//                             isWinner ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gray-300"
//                           }`}
//                           style={{ width: `${option.percentage}%` }}
//                         />
//                       </div>
//                     ) : (
//                       <div className="flex items-center gap-1.5">
//                         <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
//                           isChosen ? "border-orange-500 bg-orange-500" : "border-gray-300"
//                         }`}>
//                           {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
//                         </div>
//                         <span className="text-xs text-gray-400">
//                           {isChosen ? "Selected" : canInteract ? "Tap to select" : ""}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {/* Submit button — only shown when user can actually interact */}
//         {canInteract && !hasVoted && (
//           <div className="mt-6">
//             <button
//               onClick={handleVote}
//               disabled={!selected || loading}
//               className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
//                 selected && !loading
//                   ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
//                   : "bg-gray-100 text-gray-400 cursor-not-allowed"
//               }`}
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Submitting…
//                 </span>
//               ) : (
//                 "Submit Vote"
//               )}
//             </button>
//           </div>
//         )}

//         {/* ✅ "Poll closed" only shown when poll is ACTUALLY closed — not when user just can't vote */}
//         {!isActive && (
//           <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-3">
//             This poll is closed — results are final.
//           </div>
//         )}

//         {isActive && hasVoted && (
//           <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
//             <CheckCircle className="w-4 h-4" />
//             <span>You voted — results update in real time.</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle, Lock, LogIn, Loader2,
  BarChart2, User, Ticket, ShoppingBag,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface PollOption {
  id: string;
  text: string;
  votes: number;
  imageUrl?: string | null;
}

export type VoteBlockReason =
  | "closed"
  | "not_logged_in"
  | "no_ticket"
  | "enter_code"
  | null;

interface PollVotingProps {
  pollId: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  pollType: string;
  requiresTicket?: boolean;
  eventId?: string | null;
  eventTitle?: string | null;
  userVotedOptionId?: string | null;
  blockReason?: VoteBlockReason;
}

interface ResultOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  imageUrl?: string | null;
}

export default function PollVoting({
  pollId,
  options,
  totalVotes: initialTotal,
  isActive,
  pollType,
  requiresTicket = false,
  eventId,
  eventTitle,
  userVotedOptionId: initialVotedId = null,
  blockReason = null,
}: PollVotingProps) {
  const { data: session, status: authStatus } = useSession();
  const [selected, setSelected]               = useState<string | null>(null);
  const [results, setResults]                 = useState<ResultOption[] | null>(null);
  const [totalVotes, setTotalVotes]           = useState(initialTotal);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(initialVotedId);
  const [loading, setLoading]                 = useState(false);
  const [ticketCode, setTicketCode]           = useState("");
  const [toast, setToast]                     = useState<{
    msg: React.ReactNode; type: "success" | "error"
  } | null>(null);

  const [remainingVotes, setRemainingVotes]   = useState<number | null>(null);  
  const [hasVotedAtLeastOnce, setHasVotedAtLeastOnce] = useState(false);

  const isTokenGated   = pollType === "TOKEN_GATED";
  const needsTicketCode = isTokenGated && requiresTicket;
  // User can interact if poll active, no external block reasons (like not_logged_in, no_ticket),
  // and they have remaining votes.
 
  const canInteract = isActive && (remainingVotes ?? 0) > 0 &&
  (!blockReason || blockReason === "enter_code");

  const showToast = (msg: React.ReactNode, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load initial results and remaining votes
  useEffect(() => {
    if (authStatus === "loading") return;

    const loadData = async () => {
      try {
        // Fetch results (always public)
        const resResults = await fetch(`/api/polls/${pollId}/results`);
        if (resResults.ok) {
          const data = await resResults.json();
          const merged = (data.results ?? []).map((r: ResultOption) => ({
            ...r,
            imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
          }));
          setResults(merged);
          setTotalVotes(data.totalVotes);
        }

        // Fetch remaining votes / prior vote status
        if (isTokenGated) {
          const resRemaining = await fetch(`/api/polls/${pollId}/remaining-votes`, { cache: 'no-store' });
          if (resRemaining.ok) {
            const remData = await resRemaining.json();
            const rem = remData.remaining ?? 0;
            const totalTickets = remData.totalTickets ?? 0;
            setRemainingVotes(rem);
            // If they've already used at least one ticket, mark that they've voted
            if (totalTickets > 0 && rem < totalTickets) {
              setHasVotedAtLeastOnce(true);
            }
          }
        } else {
          // Public poll: check if user already voted
          const resRemaining = await fetch(`/api/polls/${pollId}/remaining-votes`, { cache: 'no-store' });
          if (resRemaining.ok) {
            const remData = await resRemaining.json();
            if (remData.hasVoted) {
              setHasVotedAtLeastOnce(true);
              setRemainingVotes(0);
            } else {
              setRemainingVotes(1);
            }
          }
        }
      } catch {}
    };
    loadData();
  }, [pollId, authStatus, options, isTokenGated]);

  // Show results if user has voted at least once OR poll is closed
  const showResults = hasVotedAtLeastOnce || !isActive;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "AUTH_REQUIRED":
        return { title: "You must be logged in to vote.", action: { label: "Log in", href: "/login" } };
      case "NO_TICKET":
        return { title: "You need a ticket for this event to vote.", action: { label: "Buy Ticket", href: eventId ? `/events/${eventId}` : "/events" } };
      case "TICKET_REQUIRED":
        return { title: "Please enter your ticket code to vote." };
      case "INVALID_TICKET":
        return { title: "Ticket not found. Please check the code." };
      case "WRONG_EVENT":
        return { title: "This ticket is not valid for this poll's event." };
      case "TICKET_NOT_PAID":
        return { title: "Only paid tickets can be used to vote." };
      case "TICKET_ALREADY_USED":
        return { title: "This ticket has already been used to vote on this poll." };
      case "ALREADY_VOTED":
        return { title: "You have already voted on this poll." };
      case "POLL_CLOSED":
      case "POLL_ENDED":
        return { title: "This poll is no longer active." };
      default:
        return { title: "Unable to cast vote. Please try again." };
    }
  };

  const handleVote = async () => {
    if (!selected) { showToast("Please select an option first", "error"); return; }
    if (needsTicketCode && !ticketCode.trim()) { showToast("Please enter your ticket code", "error"); return; }

    setLoading(true);
    try {
      const payload: Record<string, string> = { optionId: selected };
      if (needsTicketCode) payload.ticketCode = ticketCode.trim();

      const res  = await fetch(`/api/polls/${pollId}/vote`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const friendly = getErrorMessage(data.error);
        showToast(
          friendly.action ? (
            <span>
              {friendly.title}{" "}
              <a href={friendly.action.href} className="underline font-bold">
                {friendly.action.label}
              </a>
            </span>
          ) : friendly.title,
          "error"
        );
        return;
      }

      // Update UI with fresh results
      const merged = (data.results ?? []).map((r: ResultOption) => ({
        ...r,
        imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
      }));
      setResults(merged);
      setTotalVotes(data.totalVotes);
      setUserVotedOptionId(selected);
      setHasVotedAtLeastOnce(true);
      setRemainingVotes(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      setTicketCode("");
      setSelected(null);
      showToast("Your vote has been recorded! 🎉", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const baseOptions: ResultOption[] = results
    ? results
    : options.map((o) => ({
        ...o,
        percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
      }));

  const displayOptions = showResults
    ? [...baseOptions].sort((a, b) => b.votes - a.votes)
    : baseOptions;

  const winnerVotes = showResults ? Math.max(...displayOptions.map((o) => o.votes)) : -1;

  const renderBlockBanner = () => {
    if (!blockReason || !isActive || hasVotedAtLeastOnce) return null;

    if (blockReason === "not_logged_in") {
      return (
        <div className="mb-5 flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <LogIn className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Login required to vote</p>
            <p className="text-sm text-orange-700 mt-0.5">
              <a href="/login" className="underline font-medium">Log in</a> or{" "}
              <a href="/signup" className="underline font-medium">sign up</a> to cast your vote.
            </p>
          </div>
        </div>
      );
    }

    if (blockReason === "no_ticket") {
      return (
        <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Ticket required to vote
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              You need a ticket for{" "}
              <span className="font-medium">{eventTitle ?? "this event"}</span> to participate
              in this poll.
            </p>
            <a
              href={eventId ? `/events/${eventId}` : "/events"}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              Get a Ticket
            </a>
          </div>
        </div>
      );
    }

    if (blockReason === "enter_code") {
      return (
        <div className="mb-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700">Enter your ticket code below to vote.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {showResults ? "Live Results" : "Cast Your Vote"}
            </h2>
          </div>
          <span className="text-sm text-gray-500">
            {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        </div>

        {renderBlockBanner()}

        {/* Ticket code + remaining votes display (only for token-gated polls with votes left) */}
        {needsTicketCode && (
          <div className="mb-4">
            <label htmlFor="ticketCode" className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Code
            </label>
            <input
              id="ticketCode"
              type="text"
              value={ticketCode}
              onChange={e => setTicketCode(e.target.value)}
              placeholder="Enter the code from your ticket"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
           {remainingVotes !== null && remainingVotes > 0 && (
  <p className="text-xs text-gray-500 mt-1">
    You have {remainingVotes} vote{remainingVotes !== 1 ? 's' : ''} remaining.
  </p>
)}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2.5">
          {displayOptions.map(option => {
            const isWinner = showResults && option.votes === winnerVotes && winnerVotes > 0;
            const isMyVote = option.id === userVotedOptionId;
            const isChosen = option.id === selected && !showResults;

            return (
              <button
                key={option.id}
                onClick={() => canInteract && setSelected(option.id)}
                disabled={!canInteract || loading}
                className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
                  showResults
                    ? isWinner
                      ? "border-orange-300 bg-gradient-to-r from-orange-50 to-white"
                      : "border-gray-100 bg-white"
                    : canInteract && !showResults
                    ? isChosen
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-gray-200 hover:border-orange-300 hover:bg-gray-50 cursor-pointer"
                    : "border-gray-100 bg-gray-50 cursor-default opacity-75"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="shrink-0 relative">
                    {option.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
                        <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isChosen || isMyVote ? "bg-orange-100" : isWinner ? "bg-orange-50" : "bg-gray-100"
                      }`}>
                        <User className={`w-6 h-6 ${
                          isChosen || isMyVote || isWinner ? "text-orange-400" : "text-gray-400"
                        }`} />
                      </div>
                    )}
                    {isMyVote && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-sm font-semibold truncate ${
                        isWinner ? "text-orange-900" : "text-gray-800"
                      }`}>
                        {isWinner && <span className="mr-1">🏆</span>}
                        {option.text}
                      </span>
                      {showResults && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{option.votes.toLocaleString()}</span>
                          <span className={`text-sm font-bold w-10 text-right ${
                            isWinner ? "text-orange-600" : "text-gray-500"
                          }`}>
                            {option.percentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    {showResults ? (
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isWinner ? "bg-gradient-to-r from-orange-400 to-orange-500" : "bg-gray-300"
                          }`}
                          style={{ width: `${option.percentage}%` }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isChosen ? "border-orange-500 bg-orange-500" : "border-gray-300"
                        }`}>
                          {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs text-gray-400">
                          {isChosen ? "Selected" : canInteract ? "Tap to select" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit button — only when user can interact and hasn't voted with all tickets yet */}
        {canInteract && (
          <div className="mt-6">
            <button
              onClick={handleVote}
              disabled={!selected || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                selected && !loading
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : (
                "Submit Vote"
              )}
            </button>
          </div>
        )}

        {/* Closed poll message */}
        {!isActive && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-3">
            This poll is closed — results are final.
          </div>
        )}

        {/* Confirmation after voting */}
        {isActive && hasVotedAtLeastOnce && remainingVotes === 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>You participated — results update in real time.</span>
          </div>
        )}

        {/* Hint for token-gated polls with remaining votes */}
       {isActive && hasVotedAtLeastOnce && (remainingVotes ?? 0) > 0 && (
  <div className="mt-4 text-center text-sm text-blue-600 bg-blue-50 rounded-xl py-2">
    You have {remainingVotes} more vote{remainingVotes !== 1 ? 's' : ''} — enter another ticket code and submit again.
  </div>
)}
      </div>
    </div>
  );
}