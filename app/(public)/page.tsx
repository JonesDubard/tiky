// app/(public)/page.tsx - UPDATED with proper type handling
import FeaturedEvents from "./components/home/FeaturedEvents";
import LivePolls from "./components/home/LivePolls";
import HeroSection from "./components/home/HeroSection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PublicEvent } from '@/types/events';

// Fetch events directly from database with proper type casting
async function getEvents(): Promise<PublicEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date()
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
      orderBy: {
        date: "asc"
      },
      take: 12
    });

    // Transform to match PublicEvent type
    const transformedEvents: PublicEvent[] = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined, // Convert null to undefined
      date: event.date,
      published: event.published,
      location: event.location,
      imageUrl: event.imageUrl || undefined, // Convert null to undefined
      createdById: event.createdById,
      organizerId: event.organizerId || undefined,
      tickets: event.tickets,
      createdAt: event.createdAt
    }));

    console.log('✅ Events fetched:', transformedEvents.length, 'events');
    return transformedEvents;
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    return [];
  }
}

// Fetch polls directly from database
async function getPolls() {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: "ACTIVE",
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
      },
      take: 6
    });

    // Transform data for LivePolls component
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
      totalVotes: poll._count.votes
    }));

    console.log('✅ Polls fetched:', transformedPolls.length, 'polls');
    return transformedPolls;
  } catch (error) {
    console.error('❌ Error fetching polls:', error);
    return [];
  }
}

export default async function HomePage() {
  // Get session on server side
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';
  
  // Fetch both in parallel
  const [events, polls] = await Promise.all([
    getEvents(),
    getPolls()
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 via-white to-white">
      {/* ... rest of your HomePage component remains the same ... */}
    </div>
  );
}