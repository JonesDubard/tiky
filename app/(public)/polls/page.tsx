// app/(public)/polls/page.tsx
// Server component — fetches data, passes it to the client PollsGrid.
// All search/filter/sort logic lives in PollsGrid.tsx.

import { prisma } from 'lib/prisma'
import { BarChart3, Lock } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import RequestAccessBanner from "components/public/RequestAccessBanner"
import PollsGrid from "app/(public)/components/polls/PollsGrid"
import type { PollSummary } from "app/(public)/components/polls/PollsGrid"

async function getPolls(): Promise<PollSummary[]> {
  try {
    const polls = await prisma.poll.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return polls.map(poll => ({
      id:          poll.id,
      title:       poll.title,
      description: poll.description,
      status:      poll.status,
      pollType:    poll.pollType,
      endDate:     poll.endDate,
      isFeatured:  poll.isFeatured ?? false,
      totalVotes:  poll._count.votes,
      options:     poll.options.map(o => ({
        id:       o.id,
        text:     o.text,
        imageUrl: o.imageUrl,
        _count:   { votes: o._count.votes },
      })),
    }))
  } catch (error) {
    console.error('Error fetching polls:', error)
    return []
  }
}

export default async function PollsPage() {
  const [polls, session] = await Promise.all([
    getPolls(),
    getServerSession(authOptions),
  ])

  const isAdmin       = session?.user?.role === 'ADMIN' || session?.user?.role === 'ORGANIZER'
  const isRegularUser = !isAdmin

  // Static stats — computed server-side from full list
  const totalVotes   = polls.reduce((sum, p) => sum + p.totalVotes, 0)
  const featuredCount = polls.filter(p => p.isFeatured).length
  const publicCount   = polls.filter(p => p.pollType === 'PUBLIC').length
  const gatedCount    = polls.filter(p => p.pollType === 'TOKEN_GATED').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Live Polls & Surveys
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Share your opinion on topics that matter in Liberia. Vote and see real-time results.
            </p>

            {isAdmin && (
              <div className="mb-4">
                <a
                  href="/admin/polls/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:shadow-lg transition-shadow"
                >
                  <span>Create New Poll</span>
                  <Lock className="w-4 h-4" />
                </a>
                <p className="text-white/80 text-sm mt-2">
                  Admin access: You can create and manage polls
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="container mx-auto px-4 py-8 md:py-12">

        {isAdmin && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-800">Admin Mode Active</h3>
                <p className="text-purple-600 text-sm">
                  You can create and manage polls from the admin dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRegularUser && (
          <div className="mb-6">
            <RequestAccessBanner type="poll" />
          </div>
        )}

        {/* Stats — static, computed server-side */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-purple-600">{polls.length}</div>
            <div className="text-slate-600 text-sm">Active Polls</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-green-600">{totalVotes.toLocaleString()}</div>
            <div className="text-slate-600 text-sm">Total Votes</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-blue-600">{publicCount}</div>
            <div className="text-slate-600 text-sm">Public Polls</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-orange-600">{gatedCount}</div>
            <div className="text-slate-600 text-sm">Ticket-Gated</div>
          </div>
        </div>

        {/* ── PollsGrid handles all interactive filtering ── */}
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No active polls available</h3>
            <p className="text-slate-500 mb-6">
              {isAdmin
                ? "Create the first poll from the admin dashboard!"
                : "Check back soon for new polls and surveys!"}
            </p>
            {isAdmin && (
              <a
                href="/admin/polls/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                <span>Create First Poll</span>
                <Lock className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <PollsGrid polls={polls} />
        )}

        {/* Admin CTA */}
        {isAdmin && polls.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
              <h3 className="text-2xl font-bold text-slate-900">Poll Management</h3>
            </div>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              As an admin, you can create, edit, and manage all polls from the admin dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/admin/polls/create"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                Create New Poll
              </a>
              <a
                href="/admin/polls"
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Manage Polls
              </a>
            </div>
          </div>
        )}

        {isRegularUser && polls.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200">
            <RequestAccessBanner type="poll" />
          </div>
        )}
      </div>
    </div>
  )
}