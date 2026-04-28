// app/admin/polls/page.tsx
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import DeleteButton from "app/admin/polls/components/DeleteButton";

export default async function AdminPollsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    redirect("/unauthorized");
  }

  const polls = await prisma.poll.findMany({
    where: {
      deletedAt: null,
      ...(user.role !== "ADMIN" && { createdById: user.id }),
    },
    include: {
      _count: { select: { options: true, votes: true } },
      creator: { select: { name: true, email: true } },
      event: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user.role === "ADMIN" ? "All polls" : "Your polls"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/polls/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Poll
          </Link>
          <Link
            href="/admin/polls/archive"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 transition-colors shadow-sm text-sm"
          >
            Archived
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No polls found.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {polls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{poll.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      By {poll.creator?.name || poll.creator?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
  Event: {poll.event?.title || "—"}
</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                    poll.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {poll.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{poll._count.votes} votes</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      poll.pollType === "PAID" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {poll.pollType || "FREE"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/polls/${poll.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/admin/polls/${poll.id}/edit`} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteButton id={poll.id} type="poll" title={poll.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poll</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Event</th>
    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
  </tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
  {polls.map((poll) => (
    <tr key={poll.id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{poll.title}</div>
        <div className="text-sm text-gray-500">
          By {poll.creator?.name || poll.creator?.email || "Unknown"}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">{poll._count.options}</td>
      <td className="px-6 py-4 text-sm text-gray-900">{poll._count.votes}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full ${
          poll.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {poll.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded-full ${
          poll.pollType === "PAID" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
        }`}>
          {poll.pollType || "FREE"}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {poll.event?.title || "—"}
      </td>
      <td className="px-6 py-4 text-right space-x-1">
        <Link href={`/admin/polls/${poll.id}`} className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
          <Eye className="w-4 h-4" />
        </Link>
        <Link href={`/admin/polls/${poll.id}/edit`} className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg">
          <Edit className="w-4 h-4" />
        </Link>
        <DeleteButton id={poll.id} type="poll" title={poll.title} />
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
