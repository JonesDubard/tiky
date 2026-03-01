"use client";

// components/polls/PollCard.tsx
import Link from "next/link";
import { BarChart2, Users, Clock, Lock, ArrowRight } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

interface PollOption {
  id: string;
  text: string;
  _count: { votes: number };
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  pollType: string;
  endDate?: Date | null;
  isFeatured?: boolean;
  totalVotes: number;
  options: PollOption[];
}

interface PollCardProps {
  poll: Poll;
  clickable?: boolean;
}

export default function PollCard({ poll, clickable = true }: PollCardProps) {
  const isActive =
    poll.status === "ACTIVE" && (!poll.endDate || !isPast(new Date(poll.endDate)));
  const isPaid = poll.pollType === "PAID";
  const totalVotes = poll.totalVotes;

  // Top option for preview bar
  const topOption =
    poll.options.length > 0
      ? [...poll.options].sort(
          (a, b) => b._count.votes - a._count.votes
        )[0]
      : null;

  const topPct =
    topOption && totalVotes > 0
      ? Math.round((topOption._count.votes / totalVotes) * 100)
      : 0;

  const card = (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        clickable ? "cursor-pointer" : ""
      } ${poll.isFeatured ? "ring-2 ring-orange-400 ring-offset-1" : ""}`}
    >
      {/* Top accent bar */}
      <div
        className={`h-1 w-full ${
          isActive
            ? isPaid
              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
              : "bg-gradient-to-r from-orange-400 to-orange-600"
            : "bg-gray-200"
        }`}
      />

      <div className="p-5">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isActive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">
              Closed
            </span>
          )}

          {isPaid ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
              <Lock className="w-3 h-3" />
              Ticket Holders
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              Public
            </span>
          )}

          {poll.isFeatured && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3
          className={`text-base font-bold mb-1 line-clamp-2 transition-colors ${
            clickable ? "group-hover:text-orange-600" : ""
          } text-gray-900`}
        >
          {poll.title}
        </h3>
        {poll.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {poll.description}
          </p>
        )}

        {/* Leading option preview bar */}
        {topOption && totalVotes > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="truncate max-w-[70%]">{topOption.text}</span>
              <span className="font-semibold text-orange-600">{topPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${topPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {totalVotes.toLocaleString()} vote{totalVotes !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5" />
              {poll.options.length} options
            </span>
          </div>

          <div className="flex items-center gap-2">
            {poll.endDate && isActive && (
              <span className="flex items-center gap-1 text-orange-600">
                <Clock className="w-3 h-3" />
                Ends{" "}
                {formatDistanceToNow(new Date(poll.endDate), {
                  addSuffix: true,
                })}
              </span>
            )}
            {clickable && (
              <span className="flex items-center gap-0.5 text-orange-500 font-medium group-hover:gap-1.5 transition-all">
                Vote <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!clickable) return card;

  return <Link href={`/polls/${poll.id}`}>{card}</Link>;
}