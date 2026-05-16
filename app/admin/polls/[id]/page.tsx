"use client";

// app/admin/polls/[id]/page.tsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart2,
  Users,
  Edit,
  RefreshCw,
  CalendarDays,
  Link2,
  Loader2,
  CheckCircle,
  XCircle,
  Crown,
  Globe,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ResultOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface PollDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  pollType: string;
  endDate: string | null;
  isFeatured: boolean;
  eventId: string | null;
  createdAt: string;
  event?: { id: string; title: string } | null;
  creator?: { name: string | null; email: string } | null;
  _count: { votes: number; options: number };
  options: Array<{ id: string; text: string; _count: { votes: number } }>;
}

export default function AdminPollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [poll, setPoll] = useState<PollDetail | null>(null);
  const [results, setResults] = useState<ResultOption[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${id}/results`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.results ?? []);
      setTotalVotes(data.totalVotes ?? 0);
    } catch {
      // silent
    }
  }, [id]);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${id}`);
      if (!res.ok) {
        router.push("/admin/polls");
        return;
      }
      const data = await res.json();
      setPoll(data.poll ?? data);
    } catch {
      router.push("/admin/polls");
    } finally {
      setLoadingPoll(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchPoll();
    fetchResults();
    // Auto-refresh results every 10 seconds
    const interval = setInterval(fetchResults, 10000);
    return () => clearInterval(interval);
  }, [fetchPoll, fetchResults]);

  const handleToggle = async () => {
    if (!poll) return;
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/polls/${id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update status", "error");
        return;
      }
      setPoll((prev) => (prev ? { ...prev, status: data.status } : prev));
      showToast(
        data.status === "ACTIVE" ? "Poll is now active!" : "Poll has been closed.",
        "success"
      );
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loadingPoll) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!poll) return null;

  const isActive = poll.status === "ACTIVE";
  const maxVotes = results.length > 0 ? Math.max(...results.map((r) => r.votes)) : 0;

  return (
    <div className="p-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/admin/polls"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Polls
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-500 text-sm">{poll.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Link
            href={`/admin/polls/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleToggle}
            disabled={togglingStatus}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              isActive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {togglingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {isActive ? "Close Poll" : "Reopen Poll"}
          </button>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">{totalVotes}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3" /> Total Votes
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="text-2xl font-bold text-gray-900">
            {poll._count?.options ?? poll.options.length}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <BarChart2 className="w-3 h-3" /> Options
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-sm font-bold ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {poll.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Poll Status</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-1.5">
            {poll.pollType === "PAID" ? (
              <Crown className="w-4 h-4 text-yellow-500" />
            ) : (
              <Globe className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-bold text-gray-700">
              {poll.pollType === "PAID" ? "Ticket Holders" : "Public"}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Poll Type</div>
        </div>
      </div>

      {/* Extra info row */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
        {poll.endDate && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            {isActive && new Date(poll.endDate) > new Date()
              ? `Closes ${formatDistanceToNow(new Date(poll.endDate), { addSuffix: true })}`
              : `Ended ${format(new Date(poll.endDate), "MMM d, yyyy")}`}
          </span>
        )}
        {poll.event && (
          <span className="flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-orange-500" />
            Linked to:{" "}
            <Link
              href={`/admin/events/${poll.event.id}`}
              className="text-orange-600 hover:underline font-medium"
            >
              {poll.event.title}
            </Link>
          </span>
        )}
        {poll.creator && (
          <span className="text-gray-400">
            Created by {poll.creator.name || poll.creator.email}
          </span>
        )}
      </div>

      {/* Live Results */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-gray-900">Live Results</h2>
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Auto-refreshing
              </span>
            )}
          </div>
          <button
            onClick={fetchResults}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No votes yet. Share the poll to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {[...results]
              .sort((a, b) => b.votes - a.votes)
              .map((option, index) => {
                const isWinner = option.votes === maxVotes && maxVotes > 0;
                return (
                  <div key={option.id}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 && isWinner
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`font-medium ${
                            isWinner ? "text-gray-900" : "text-gray-600"
                          }`}
                        >
                          {option.text}
                        </span>
                        {isWinner && index === 0 && (
                          <span className="text-orange-500 text-xs">🏆 Leading</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-gray-400">
                          {option.votes} vote{option.votes !== 1 ? "s" : ""}
                        </span>
                        <span
                          className={`font-bold w-9 text-right ${
                            isWinner ? "text-orange-600" : "text-gray-500"
                          }`}
                        >
                          {option.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWinner
                            ? "bg-gradient-to-r from-orange-400 to-orange-500"
                            : "bg-gray-300"
                        }`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 text-right">
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Public link */}
      <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold text-orange-800">Public URL: </span>
          <code className="text-orange-700 text-xs">/polls/{id}</code>
        </div>
        <Link
          href={`/polls/${id}`}
          target="_blank"
          className="text-sm text-orange-600 hover:underline font-medium"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}