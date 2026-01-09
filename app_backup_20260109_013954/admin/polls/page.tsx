import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PollsPage() {
  try {
    // Fetch polls WITH options
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        options: true,
        _count: {
          select: { votes: true }
        }
      }
    })

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Polls & Contests</h1>
            <p className="text-gray-600">Manage voting polls and paid contests</p>
          </div>
          <Link
            href="/admin/polls/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            + New Poll
          </Link>
        </div>

        {/* Polls Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No polls yet</h3>
              <p className="text-gray-600 mb-4">Create your first poll to engage users</p>
              <Link
                href="/admin/polls/new"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Poll
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poll
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {polls.map((poll: any) => (
                  <tr key={poll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{poll.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {poll.description || 'No description'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {poll.options.length} options
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          poll.type === 'CONTEST' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {poll.type}
                        </span>
                        <div className="text-xs text-gray-500">
                          {poll.isFeatured ? '⭐ Featured' : 'Standard'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold">{poll._count.votes}</div>
                      <div className="text-xs text-gray-500">total votes</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {poll.endDate 
                        ? new Date(poll.endDate).toLocaleDateString()
                        : 'No end date'
                      }
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        View Results
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading polls:', error)
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium mb-2">Error loading polls</h3>
        <p className="text-gray-600">Please try again later</p>
      </div>
    )
  }
}