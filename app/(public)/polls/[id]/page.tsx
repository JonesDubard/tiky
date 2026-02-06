// app/(public)/polls/[id]/page.tsx - FIXED
import { prisma } from 'lib/prisma';
import { BarChart3, Vote, Clock, Users, Share2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';

async function getPollData(id: string) {
  try {
    // Validate id is not undefined
    if (!id || id === 'undefined') {
      return null;
    }

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { votes: true } },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!poll) {
      return null;
    }

    return poll;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return null;
  }
}

async function getRelatedPolls(pollId: string) {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: { in: ["ACTIVE", "LIVE"] },
        NOT: { id: pollId }
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    return polls;
  } catch (error) {
    console.error('Error fetching related polls:', error);
    return [];
  }
}

// FIX: Add proper type for params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage(props: PageProps) {
  // FIX: Properly await params in Next.js 15
  const params = await props.params;
  const id = params.id;
  
  // Validate id immediately
  if (!id || id === 'undefined') {
    notFound();
  }

  const [poll, session, relatedPolls] = await Promise.all([
    getPollData(id),
    getServerSession(authOptions),
    getRelatedPolls(id)
  ]);
  
  if (!poll) {
    notFound();
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const totalVotes = poll._count.votes;
  const endDate = poll.endDate ? new Date(poll.endDate) : null;
  const isEndingSoon = endDate && (endDate.getTime() - Date.now()) < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/polls"
              className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Polls</span>
            </Link>
            <button className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Poll Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Poll Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  {poll.status}
                </div>
                {poll.isFeatured && (
                  <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                    FEATURED
                  </span>
                )}
                {isEndingSoon && (
                  <span className="text-sm font-medium bg-red-100 text-red-800 px-3 py-1 rounded-full">
                    ENDING SOON
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {poll.title}
              </h1>
              
              <p className="text-lg text-slate-600 mb-6">
                {poll.description || "Share your opinion on this topic"}
              </p>

              {/* Poll Stats */}
              <div className="flex flex-wrap gap-6 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">{totalVotes} votes</span>
                </div>
                {poll.creator && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">By {poll.creator.name || poll.creator.email}</span>
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">
                      {isEndingSoon ? 'Ends soon' : `Ends ${endDate.toLocaleDateString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Voting Options */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Vote Now
              </h2>
              
              <div className="space-y-4">
                {poll.options.map((option) => {
                  const percentage = totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={option.id} className="group">
                      <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 group-hover:shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">{option.text}</span>
                          <span className="text-sm font-semibold text-purple-700">
                            {option._count.votes} votes
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        <div className="text-right mt-1">
                          <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Vote Button */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-xl hover:shadow-lg transition-shadow">
                  Submit Your Vote
                </button>
                <p className="text-center text-slate-500 text-sm mt-3">
                  {isAdmin ? "As admin, you can vote and edit this poll" : "Your vote is anonymous"}
                </p>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span>Admin Controls</span>
                  <Lock className="w-5 h-5" />
                </h3>
                <div className="grid grid-col-1 md:grid-col-2 gap-4">
                  <a 
                    href={`/admin/polls/${poll.id}/edit`}
                    className="px-4 py-3 bg-white text-blue-700 font-semibold rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors text-center"
                  >
                    Edit Poll
                  </a>
                  <button className="px-4 py-3 bg-red-50 text-red-700 font-semibold rounded-lg border border-red-200 hover:bg-red-100 transition-colors">
                    Delete Poll
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Poll Info & Related */}
          <div className="lg:col-span-1 space-y-6">
            {/* Poll Information Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Poll Information</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Status</div>
                  <div className="font-medium text-slate-900">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${poll.status === 'LIVE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {poll.status}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-500 mb-1">Created</div>
                  <div className="font-medium text-slate-900">
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {endDate && (
                  <div>
                    <div className="text-sm text-slate-500 mb-1">Ends</div>
                    <div className={`font-medium ${isEndingSoon ? 'text-red-600' : 'text-slate-900'}`}>
                      {endDate.toLocaleDateString()}
                      {isEndingSoon && ' ⚠️'}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-slate-500 mb-1">Poll Type</div>
                  <div className="font-medium text-slate-900">{poll.pollType || 'Single Choice'}</div>
                </div>
              </div>
            </div>

            {/* Related Polls */}
            {relatedPolls.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Related Polls</h3>
                
                <div className="space-y-4">
                  {relatedPolls.map(relatedPoll => (
                    <Link 
                      key={relatedPoll.id} 
                      href={`/polls/${relatedPoll.id}`}
                      className="block p-4 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                    >
                      <h4 className="font-medium text-slate-900 mb-1 line-clamp-1">
                        {relatedPoll.title}
                      </h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{relatedPoll._count.votes} votes</span>
                        <span className="text-purple-600 font-medium">Vote →</span>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <Link 
                  href="/polls"
                  className="block mt-4 text-center text-purple-600 hover:text-purple-800 font-medium"
                >
                  View all polls →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}