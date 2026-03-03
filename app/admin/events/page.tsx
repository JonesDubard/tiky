import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import DeleteButton from "app/admin/events/components/DeleteButton";

export default async function AdminEventsPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    redirect("/unauthorized");
  }

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      ...(user.role !== "ADMIN" && { createdById: user.id }),
    },
    include: {
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          _count: { select: { tickets: true } },
        },
      },
      _count: { select: { ticketTypes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user.role === "ADMIN" ? "All events" : "Your events"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/events/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
          <Link
            href="/admin/events/archive"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 transition-colors shadow-sm"
          >
            🗑 Archived Events
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No events found.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {events.map((event) => {
              const sold = event.ticketTypes.reduce((sum, t) => sum + t._count.tickets, 0);
              return (
                <div key={event.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{event.title}</div>
                      <div className="text-xs text-gray-500 truncate">{event.location}</div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
                      event.published
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {event.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mb-3">
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span>🎟 {sold} sold · {event.ticketTypes.length} type(s)</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 border-t border-gray-50 pt-3">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <DeleteButton id={event.id} type="event" title={event.title} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.location}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {event.ticketTypes.reduce((sum, t) => sum + t._count.tickets, 0)} sold
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.ticketTypes.length} type(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {event.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteButton id={event.id} type="event" title={event.title} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}