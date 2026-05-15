// app/(public)/events/[id]/PollSection.tsx
"use client";
import PollVoteCard from "app/(public)/components/home/PollVoteCard";

type PollData = {
  id: string;
  title: string;
  description: string | null;
  pollType: string;
  endDate: Date | null;
  requiresTicket: boolean;
  votePrice?: number | null; 
  options: Array<{
    id: string;
    text: string;
    imageUrl: string | null;
  }>;
};

export default function PollSection({ poll }: { poll: PollData }) {
  const pollProps = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    type: (poll.pollType === "CONTEST" ? "CONTEST" : "POLL") as "POLL" | "CONTEST",
    endDate: poll.endDate ? new Date(poll.endDate) : null,
    votePrice: poll.votePrice ?? null, // ← FIXED: was never forwarded
  };

  return <PollVoteCard poll={pollProps} contestants={poll.options.map((opt) => ({
    id: opt.id,
    text: opt.text,
    imageUrl: opt.imageUrl ?? null,
  }))} />;
}