// app/(public)/components/polls/PollSection.tsx
"use client";

import PollVoting from "components/polls/PollVoting";

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
    _count?: { votes: number };
  }>;
};

export default function PollSection({ poll }: { poll: PollData }) {
  const isActive =
    (!poll.endDate || new Date(poll.endDate) > new Date());

  return (
    <PollVoting
      pollId={poll.id}
      options={poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl ?? null,
        votes: opt._count?.votes ?? 0,
      }))}
      totalVotes={poll.options.reduce((sum, o) => sum + (o._count?.votes ?? 0), 0)}
      isActive={isActive}
      pollType={poll.pollType}
      votePrice={poll.votePrice ?? null}
    />
  );
}