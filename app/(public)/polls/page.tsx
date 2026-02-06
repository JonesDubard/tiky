// app/(public)/polls/page.tsx - UPDATED WITH MATCHING DESIGN
import { prisma } from 'lib/prisma';
import PollCard from 'components/polls/PollCard';
import { BarChart3, Vote, TrendingUp, Filter, Search, Lock } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';

async function getPolls() {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: { in: ["ACTIVE", "LIVE"] },
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Transform data for PollCard component
    const transformedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description || "",
      endDate: poll.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option._count.votes
      })),
      totalVotes: poll._count.votes,
      isFeatured: poll.isFeatured,
      status: poll.status
    }));

    return transformedPolls;
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
}

export default async function PollsPage() {
  const [polls, session] = await Promise.all([
    getPolls(),
    getServerSession(authOptions)
  ]);
  
  const isAdmin = session?.user?.role === 'ADMIN';
  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Matching Events Page Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        
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
            
            {/* Admin Create Button */}
            {isAdmin && (
              <div className="mb-8">
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
            
            {/* Search Bar - Matching Events Page */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                    <input
                      type="search"
                      placeholder="Search polls by title, topic, or description..."
                      className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/70 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Stats & Admin Notice */}
        <div className="mb-8">
          {isAdmin ? (
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
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-slate-600 text-sm">
                Want to create a poll? Contact an administrator or request organizer access.
              </p>
            </div>
          )}
          
          {/* Stats - Matching Events Page Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-purple-600">{polls.length}</div>
              <div className="text-slate-600 text-sm">Active Polls</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-green-600">{totalVotes}</div>
              <div className="text-slate-600 text-sm">Total Votes</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-blue-600">
                {polls.filter(p => p.status === 'LIVE').length}
              </div>
              <div className="text-slate-600 text-sm">Live Now</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="text-2xl font-bold text-orange-600">
                {polls.filter(p => p.isFeatured).length}
              </div>
              <div className="text-slate-600 text-sm">Featured</div>
            </div>
          </div>
        </div>

        {/* Polls Grid */}
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No active polls available</h3>
            <p className="text-slate-500 mb-6">
              {isAdmin 
                ? "Create the first poll from the admin dashboard!"
                : "Check back soon for new polls and surveys!"
              }
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
          <div>
            {/* Featured Polls Section */}
            {polls.filter(p => p.isFeatured).length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Featured Polls</h2>
                    <p className="text-slate-600">Highlighted polls with high engagement</p>
                  </div>
                  <div className="text-sm text-purple-600 font-medium">
                    {polls.filter(p => p.isFeatured).length} featured
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {polls
                    .filter(poll => poll.isFeatured)
                    .map(poll => (
                      <PollCard key={poll.id} poll={poll} clickable={true} />
                    ))}
                </div>
              </div>
            )}

            {/* All Polls Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">All Active Polls</h2>
                  <p className="text-slate-600">Browse and vote on all available polls</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600">
                    {polls.length} polls
                  </div>
                  <select className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-sm focus:outline-none">
                    <option>Sort by: Newest</option>
                    <option>Sort by: Most Votes</option>
                    <option>Sort by: Ending Soon</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {polls.map(poll => (
                  <PollCard key={poll.id} poll={poll} clickable={true} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Admin Call to Action */}
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

        {/* Public Call to Action */}
        {!isAdmin && polls.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Want to create your own poll?</h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Poll creation is managed by verified administrators. Contact support for organizer access.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow">
              Request Poll Creation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}