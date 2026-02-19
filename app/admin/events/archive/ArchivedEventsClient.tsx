"use client";

import React, { useState } from "react";

interface Event {
  id: string;
  title: string;
  deletedAt: Date | null;
}

interface Props {
  initialEvents: Event[];
}

export default function ArchivedEventsClient({ initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);

  const restoreEvent = async (id: string) => {
    try {
      const res = await fetch(`/admin/events/${id}/restore`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to restore");
      // Remove restored event from state so it disappears from archive
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to restore event");
    }
  };

  if (events.length === 0) return <p>No archived events found.</p>;

  return (
    <div>
      {events.map((event) => (
        <div
          key={event.id}
          className="border p-4 mb-2 rounded flex justify-between items-center"
        >
          <div>
            <h2 className="font-semibold">{event.title}</h2>
            <p className="text-sm text-gray-500"> Deleted at: {event.deletedAt?.toLocaleString()}</p>
          </div>
          <button
            onClick={() => restoreEvent(event.id)}
            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
