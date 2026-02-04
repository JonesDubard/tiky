// app/(public)/page.tsx - UPDATED
import FeaturedEvents from './components/home/FeaturedEvents'
import LivePolls from './components/home/LivePolls'
import HeroSection from './components/home/HeroSection'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { PublicEvent } from '@/types/events'
import { PublicPoll } from '@/types/polls'

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date() // Only future events
        }
      },
      include: {
        tickets: {
          select: {
            type: true,
            price: true,
            quantity: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 12
    })

    return events.map((event: typeof events[number]) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      date: event.date.toISOString(),
      location: event.location ?? undefined,
      imageUrl: event.imageUrl ?? undefined,
      published: event.published,
      tickets: event.tickets,
      createdAt: event.createdAt
    }))
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return []
  }
}

async function getPolls(): Promise<PublicPoll[]> {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true // 👈 ADD THIS FILTER
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
      take: 6
    })

    return polls.map((poll: typeof polls[number]) => ({
      id: poll.id,
      title: poll.title,
      description: poll.description ?? '',
      endDate: poll.endDate?.toISOString() ?? new Date().toISOString(),
      options: poll.options.map((o: typeof poll.options[number]) => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes
      })),
      totalVotes: poll._count.votes
    }))
  } catch (error) {
    console.error('❌ Error fetching polls:', error)
    return []
  }
}

export default async function HomePage() {
  await getServerSession(authOptions)

  const [events, polls] = await Promise.all([
    getEvents(),
    getPolls()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 via-white to-white">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
        {/* Pass events as prop */}
        <FeaturedEvents events={events} />
        <LivePolls polls={polls} />
      </div>
    </div>
  )
}