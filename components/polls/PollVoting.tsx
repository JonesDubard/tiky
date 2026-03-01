"use client";

// components/polls/PollVoting.tsx
import { useState, useEffect } from "react";
import { CheckCircle, Lock, LogIn, Loader2, BarChart2 } from "lucide-react";
import { useSession } from "next-auth/react";

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
  pollType: string;
  userVotedOptionId?: string | null;
}

interface ResultOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
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

  // Show toast then auto-dismiss
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // On mount: check if user already voted by hitting results API
  useEffect(() => {
    if (authStatus === "loading") return;

    const checkVote = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/results`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.userVotedOptionId) {
          setUserVotedOptionId(data.userVotedOptionId);
          setResults(data.results);
          setTotalVotes(data.totalVotes);
        } else {
          // Still load live result percentages for display
          setResults(data.results);
          setTotalVotes(data.totalVotes);
        }
      } catch {
        // silently ignore
      }
    };

    checkVote();
  }, [pollId, authStatus]);

  const handleVote = async () => {
    if (!selected) {
      showToast("Please select an option first", "error");
      return;
    }

    if (authStatus !== "authenticated" && pollType === "PAID") {
      showToast("Please log in to vote on this poll", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to cast vote", "error");
        return;
      }

      setResults(data.results);
      setTotalVotes(data.totalVotes);
      setUserVotedOptionId(selected);
      showToast("Your vote has been recorded!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const optionsWithPercentage: ResultOption[] = results
    ? results
    : options.map((o) => ({
        ...o,
        percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
      }));

  // Sort by votes descending when showing results
  const displayOptions = showResults
    ? [...optionsWithPercentage].sort((a, b) => b.votes - a.votes)
    : optionsWithPercentage;

  const winnerVotes = showResults
    ? Math.max(...displayOptions.map((o) => o.votes))
    : -1;

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {showResults ? "Results" : "Cast Your Vote"}
            </h2>
          </div>
          <span className="text-sm text-gray-500">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Not logged in warning for FREE polls */}
        {authStatus === "unauthenticated" && isActive && pollType === "FREE" && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
            <LogIn className="w-4 h-4 shrink-0" />
            <span>
              You can vote as a guest, but{" "}
              <a href="/login" className="underline font-medium">
                logging in
              </a>{" "}
              prevents duplicate votes.
            </span>
          </div>
        )}

        {/* Login required for PAID polls */}
        {authStatus === "unauthenticated" && isActive && pollType === "PAID" && (
          <div className="mb-4 flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              <a href="/login" className="underline font-medium">
                Log in
              </a>{" "}
              with your ticket account to vote on this poll.
            </span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
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
                    ? "cursor-default"
                    : isChosen
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-gray-50 cursor-pointer"
                } ${isWinner && showResults ? "border-orange-400" : showResults ? "border-gray-100" : ""}`}
              >
                {showResults ? (
                  /* Results bar view */
                  <div className="relative p-4">
                    {/* Background progress bar */}
                    <div
                      className={`absolute inset-0 rounded-xl transition-all duration-700 ${
                        isWinner ? "bg-orange-100" : "bg-gray-50"
                      }`}
                      style={{ width: `${option.percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isMyVote && (
                          <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        )}
                        {isWinner && !isMyVote && (
                          <span className="text-orange-500 shrink-0">🏆</span>
                        )}
                        <span
                          className={`text-sm font-medium truncate ${
                            isWinner ? "text-orange-900" : "text-gray-700"
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs text-gray-500">
                          {option.votes} vote{option.votes !== 1 ? "s" : ""}
                        </span>
                        <span
                          className={`text-sm font-bold w-10 text-right ${
                            isWinner ? "text-orange-600" : "text-gray-600"
                          }`}
                        >
                          {option.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Voting selection view */
                  <div className="p-4 flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isChosen
                          ? "border-orange-500 bg-orange-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isChosen && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {option.text}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Vote button */}
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
              ) : (
                "Submit Vote"
              )}
            </button>
          </div>
        )}

        {/* Poll closed notice */}
        {!isActive && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-3">
            This poll is closed — results are final.
          </div>
        )}

        {/* Already voted notice */}
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