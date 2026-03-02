"use client";

// components/polls/PollVoting.tsx
import { useState, useEffect } from "react";
import { CheckCircle, Lock, LogIn, Loader2, BarChart2, User } from "lucide-react";
import { useSession } from "next-auth/react";

interface PollOption {
  id: string;
  text: string;
  votes: number;
  imageUrl?: string | null;
}

interface PollVotingProps {
  pollId: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  pollType: string; // "PUBLIC" | "TOKEN_GATED"
  userVotedOptionId?: string | null;
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
  userVotedOptionId: initialVotedId = null,
}: PollVotingProps) {
  const { data: session, status: authStatus } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<ResultOption[] | null>(null);
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(initialVotedId);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const hasVoted = !!userVotedOptionId;
  const showResults = hasVoted || !isActive;
  const isTokenGated = pollType === "TOKEN_GATED";

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (authStatus === "loading") return;
    const load = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/results`);
        if (!res.ok) return;
        const data = await res.json();
        const merged = (data.results ?? []).map((r: ResultOption) => ({
          ...r,
          imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
        }));
        setResults(merged);
        setTotalVotes(data.totalVotes);
        if (data.userVotedOptionId) setUserVotedOptionId(data.userVotedOptionId);
      } catch { /* silent */ }
    };
    load();
  }, [pollId, authStatus]);

  const handleVote = async () => {
    if (!selected) return showToast("Please select a candidate first", "error");
    if (authStatus !== "authenticated" && isTokenGated) {
      return showToast("Please log in to vote on this poll", "error");
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to cast vote", "error");

      const merged = (data.results ?? []).map((r: ResultOption) => ({
        ...r,
        imageUrl: options.find((o) => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
      }));
      setResults(merged);
      setTotalVotes(data.totalVotes);
      setUserVotedOptionId(selected);
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

  const winnerVotes = showResults
    ? Math.max(...displayOptions.map((o) => o.votes))
    : -1;

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
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

        {/* Auth banners */}
        {authStatus === "unauthenticated" && isActive && !isTokenGated && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
            <LogIn className="w-4 h-4 shrink-0" />
            <span>
              Voting as guest.{" "}
              <a href="/login" className="underline font-medium">Log in</a>{" "}
              to prevent duplicate votes.
            </span>
          </div>
        )}
        {authStatus === "unauthenticated" && isActive && isTokenGated && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              <a href="/login" className="underline font-medium">Log in</a>{" "}
              with your ticket account to vote on this poll.
            </span>
          </div>
        )}

        {/* Candidate list */}
        <div className="space-y-2.5">
          {displayOptions.map((option) => {
            const isWinner = showResults && option.votes === winnerVotes && winnerVotes > 0;
            const isMyVote = option.id === userVotedOptionId;
            const isChosen = option.id === selected && !showResults;

            return (
              <button
                key={option.id}
                onClick={() => !showResults && isActive && setSelected(option.id)}
                disabled={showResults || !isActive || loading}
                className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
                  showResults
                    ? isWinner
                      ? "border-orange-300 bg-gradient-to-r from-orange-50 to-white"
                      : "border-gray-100 bg-white"
                    : isChosen
                    ? "border-orange-500 bg-orange-50 shadow-sm"
                    : "border-gray-200 hover:border-orange-300 hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Photo / avatar */}
                  <div className="shrink-0 relative">
                    {option.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
                        <img
                          src={option.imageUrl}
                          alt={option.text}
                          className="w-full h-full object-cover"
                        />
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
                    {/* My vote badge */}
                    {isMyVote && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Name + bar or radio */}
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
                          <span className="text-xs text-gray-400">
                            {option.votes.toLocaleString()}
                          </span>
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
                            isWinner
                              ? "bg-gradient-to-r from-orange-400 to-orange-500"
                              : "bg-gray-300"
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
                          {isChosen ? "Selected" : "Tap to select"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit */}
        {!showResults && isActive && (
          <div className="mt-6">
            <button
              onClick={handleVote}
              disabled={!selected || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                selected && !loading
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </span>
              ) : "Submit Vote"}
            </button>
          </div>
        )}

        {!isActive && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-3">
            This poll is closed — results are final.
          </div>
        )}

        {isActive && hasVoted && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>You voted — results update in real time.</span>
          </div>
        )}
      </div>
    </div>
  );
}