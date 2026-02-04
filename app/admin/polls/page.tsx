import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { BarChart, Edit, Trash2, Eye, Plus } from 'lucide-react'

export default async function PollsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const polls = await prisma.poll.findMany({
    include: {
      options: true,
      _count: {
        select: { votes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Polls Management</h1>
            <p className="text-slate-600 mt-2">Manage all voting polls in the system</p>
          </div>
          <a 
            href="/admin/polls/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Poll
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{poll.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{poll.description}</p>
                  </div>
                  {poll.isFeatured && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {poll.options.slice(0, 3).map((option) => (
                    <div key={option.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{option.text}</span>
                    </div>
                  ))}
                  {poll.options.length > 3 && (
                    <div className="text-sm text-slate-500">
                      +{poll.options.length - 3} more options
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-600">
                    {poll._count.votes} votes
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`/polls/${poll.id}`}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <a 
                      href={`/admin/polls/edit/${poll.id}`}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </a>
                    <button
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {polls.length === 0 && (
          <div className="text-center py-12">
            <BarChart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No polls yet</h3>
            <p className="text-slate-500 mt-2">Create your first poll to engage your audience</p>
            <a 
              href="/admin/polls/create"
              className="inline-block mt-4 btn-primary"
            >
              Create Poll
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
