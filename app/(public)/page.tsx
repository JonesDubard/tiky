// app/(public)/page.tsx - UPDATED
import FeaturedEvents from './components/home/FeaturedEvents'
import LivePolls from './components/home/LivePolls'
import HeroSection from './components/home/HeroSection'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { PublicEvent } from '@/types/events'
import { PublicPoll } from '@/types/polls'

// app/(public)/page.tsx - UPDATED getEvents()
// app/(public)/page.tsx - FINAL FIX
async function getEvents(): Promise<PublicEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date()
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        published: true,
        isFeatured: true,
        price: true,
        createdAt: true,
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

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      date: event.date.toISOString(),
      location: event.location ?? undefined,
      imageUrl: event.imageUrl ?? undefined,
      published: event.published,
      isFeatured: event.isFeatured,
      price: event.price,
      // Convert nullable type to string with default
      tickets: event.tickets.map(ticket => ({
        type: ticket.type ?? 'General Admission',  // Default value
        price: ticket.price,
        quantity: ticket.quantity
      })),
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
        status: { in: ['ACTIVE', 'LIVE'] }, // Show both ACTIVE and LIVE polls
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

    return polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description ?? '',
      endDate: poll.endDate?.toISOString() ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: poll.options.map(o => ({
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