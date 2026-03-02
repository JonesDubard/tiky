"use client";

// components/polls/PollCard.tsx
import Link from "next/link";
import { BarChart2, Users, Clock, Ticket, Globe, ArrowRight } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";

interface PollOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  _count: { votes: number };
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  pollType: string; // "PUBLIC" | "TOKEN_GATED"
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
  const isTokenGated = poll.pollType === "TOKEN_GATED";
  const totalVotes = poll.totalVotes;

  // Top option for preview bar
  const topOption =
    poll.options.length > 0
      ? [...poll.options].sort((a, b) => b._count.votes - a._count.votes)[0]
      : null;
  const topPct =
    topOption && totalVotes > 0
      ? Math.round((topOption._count.votes / totalVotes) * 100)
      : 0;

  // Candidate photos (up to 3)
  const optionsWithPhotos = poll.options.filter((o) => o.imageUrl).slice(0, 3);
  const hasPhotos = optionsWithPhotos.length > 0;

  const card = (
    <div className={`group bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
      clickable ? "cursor-pointer" : ""
    } ${poll.isFeatured ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-100"}`}>

      {/* Top accent */}
      <div className={`h-1 w-full ${
        isActive
          ? isTokenGated
            ? "bg-gradient-to-r from-amber-400 to-orange-500"
            : "bg-gradient-to-r from-blue-400 to-orange-500"
          : "bg-gray-200"
      }`} />

      <div className="p-5">
        {/* Badges */}
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

          {isTokenGated ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
              <Ticket className="w-3 h-3" />
              Ticket Holders Only
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
              <Globe className="w-3 h-3" />
              Public
            </span>
          )}

          {poll.isFeatured && (
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-base font-bold mb-1 line-clamp-2 transition-colors ${
          clickable ? "group-hover:text-orange-600" : ""
        } text-gray-900`}>
          {poll.title}
        </h3>
        {poll.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{poll.description}</p>
        )}

        {/* Candidate photo strip */}
        {hasPhotos && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex -space-x-2">
              {optionsWithPhotos.map((o) => (
                <img
                  key={o.id}
                  src={o.imageUrl!}
                  alt={o.text}
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
              ))}
            </div>
            {poll.options.length > 3 && (
              <span className="text-xs text-gray-400">
                +{poll.options.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Leading option bar */}
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

        {/* Footer */}
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
                {formatDistanceToNow(new Date(poll.endDate), { addSuffix: true })}
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