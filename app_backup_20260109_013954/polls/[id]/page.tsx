import { prisma } from '@/lib/prisma'
import PollVoteCard from '@/components/PollVoteCard'
import { notFound } from 'next/navigation'

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params Promise
    const { id } = await params
    
    const poll = await prisma.poll.findUnique({
      where: { id: id },  // Use the awaited id
      include: {
        options: true
      }
    })

    if (!poll) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <PollVoteCard 
            poll={{
              id: poll.id,
              title: poll.title,
              description: poll.description,
              type: poll.type as 'POLL' | 'CONTEST',
              endDate: poll.endDate
            }}
            contestants={poll.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              imageUrl: opt.imageUrl
            }))}
          />
          
          {/* Results Preview (Admin only later) */}
          <div className="mt-8 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Live Results</h3>
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📈</div>
              <p>Results will appear here as people vote</p>
              <p className="text-sm">Admins can see detailed analytics in dashboard</p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading poll:', error)
    notFound()
  }
}