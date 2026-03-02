"use client";

// app/admin/components/OrganizerDashboard.tsx
import Link from "next/link";
import {
  Calendar, Vote, Ticket, TrendingUp,
  Plus, ArrowRight, CheckCircle, Clock,
} from "lucide-react";

interface OrganizerDashboardProps {
  user: { id: string; name: string | null; email: string; role: string };
  myEvents: {
    id: string;
    title: string;
    date: string | null;
    published: boolean;
    ticketsSold: number;
  }[];
  myPollsCount: number;
  myOrdersCount: number;
  myRevenue: number;
}

export default function OrganizerDashboard({
  user,
  myEvents,
  myPollsCount,
  myOrdersCount,
  myRevenue,
}: OrganizerDashboardProps) {
  const firstName = user.name?.split(" ")[0] || "Organizer";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Here's how your events and polls are performing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/events/create"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Event
          </Link>
          <Link
            href="/admin/polls/create"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Poll
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Calendar className="w-5 h-5 text-blue-500" />,
            label: "My Events",
            value: myEvents.length,
            bg: "bg-blue-50",
          },
          {
            icon: <Vote className="w-5 h-5 text-purple-500" />,
            label: "My Polls",
            value: myPollsCount,
            bg: "bg-purple-50",
          },
          {
            icon: <Ticket className="w-5 h-5 text-orange-500" />,
            label: "Tickets Sold",
            value: myOrdersCount,
            bg: "bg-orange-50",
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-green-500" />,
            label: "My Revenue",
            value: `$${myRevenue.toFixed(2)}`,
            bg: "bg-green-50",
          },
        ].map(({ icon, label, value, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              {icon}
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* My Events */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">My Events</h2>
          <Link
            href="/admin/events"
            className="text-xs text-orange-500 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {myEvents.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400 mb-4">No events yet</p>
            <Link
              href="/admin/events/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.date
                      ? new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No date set"}
                    {" · "}
                    {event.ticketsSold} tickets sold
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {event.published ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {event.published ? "Published" : "Draft"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { href: "/admin/polls", label: "My Polls", emoji: "📊" },
          { href: "/admin/orders", label: "Orders", emoji: "📦" },
          { href: "/admin/tickets/validate", label: "Validate Tickets", emoji: "🎫" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-orange-200 hover:bg-orange-50 transition-all"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <ArrowRight className="w-4 h-4 text-gray-300 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}