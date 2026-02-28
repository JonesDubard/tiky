"use client";

import React, { useState } from "react";

interface Poll {
  id: string;
  title: string;
  deletedAt: Date | null;
}

interface Props {
  initialPolls: Poll[];
}

export default function ArchivedPollsClient({ initialPolls }: Props) {
  const [polls, setPolls] = useState(initialPolls);

  const restorePoll = async (id: string) => {
    try {
      const res = await fetch(`/admin/polls/${id}/restore`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      // Remove restored polls from state so it disappears from archive
      setPolls(polls.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to restore poll");
    }
  };

  if (polls.length === 0) return <p>No archived polls found.</p>;

  return (
    <div>
      {polls.map((poll) => (
        <div
          key={poll.id}
          className="border p-4 mb-2 rounded flex justify-between items-center"
        >
          <div>
            <h2 className="font-semibold">{poll.title}</h2>
            <p className="text-sm text-gray-500"> Deleted at: {poll.deletedAt?.toLocaleString()}</p>
          </div>
          <button
            onClick={() => restorePoll(poll.id)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
