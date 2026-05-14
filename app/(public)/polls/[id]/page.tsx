// app/(public)/polls/[id]/page.tsx
import { prisma } from "lib/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { BarChart, Clock, Users } from "lucide-react"
import PollVoting from "components/polls/PollVoting"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface PollPageProps {
  params: Promise<{ id: string }>
}

async function getPoll(id: string) {
  try {
    return await prisma.poll.findUnique({
      where: { id, deletedAt: null },
      include: {
        creator: { select: { name: true, email: true } },
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { votes: true } },
        event: { select: { id: true, title: true } },
      },
    })
  } catch {
    return null
  }
}

async function getRelatedPolls(pollId: string) {
  try {
    return await prisma.poll.findMany({
      where: { status: "ACTIVE", NOT: { id: pollId }, deletedAt: null },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    })
  } catch {
    return []
  }
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params
  const poll = await getPoll(id)

  if (!poll) notFound()

  // Simple active check — no user gating
  const isActive =
    poll.status === "ACTIVE" &&
    (!poll.endDate || new Date(poll.endDate) > new Date())

  const isEndingSoon =
    poll.endDate &&
    new Date(poll.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000

  const relatedPolls = await getRelatedPolls(id)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/polls"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Polls</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  {poll.title}
                </h1>
                {poll.votePrice && poll.votePrice > 0 ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    💰 ${poll.votePrice.toFixed(2)} / vote
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                    📊 Free Poll
                  </span>
                )}
                {poll.isFeatured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                    ⭐ Featured
                  </span>
                )}
                {isEndingSoon && isActive && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    ⏰ Ending Soon
                  </span>
                )}
              </div>
              {poll.description && (
                <p className="text-lg text-gray-600">{poll.description}</p>
              )}
            </div>
            <div className={`ml-4 px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${
              isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {isActive ? "Active" : "Closed"}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-orange-500" />
              <span>{poll._count.votes} total votes</span>
            </div>
            {poll.endDate && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>
                  {isActive
                    ? `Ends ${format(new Date(poll.endDate), "MMMM d, yyyy")}`
                    : `Ended ${format(new Date(poll.endDate), "MMMM d, yyyy")}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-500" />
              <span>By {poll.creator?.name || poll.creator?.email || "Anonymous"}</span>
            </div>
          </div>
        </div>

        {/* PollVoting — no blockReason, no requiresTicket, open to everyone */}
        <PollVoting
          pollId={poll.id}
          options={poll.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            imageUrl: opt.imageUrl ?? null,
            votes: opt._count.votes,
          }))}
          totalVotes={poll._count.votes}
          isActive={isActive}
          pollType={poll.pollType}
          votePrice={poll.votePrice ?? null}
        />

        {relatedPolls.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">More Polls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relatedPolls.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/polls/${rp.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{rp.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{rp._count.votes} votes</span>
                    <span className="text-orange-500 font-medium">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}