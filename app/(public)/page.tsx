
// ─── app/(public)/page.tsx ───────────────────────────────────────────────────

import { prisma } from "lib/prisma";
import HeroSection from "app/(public)/components/home/HeroSection";
import EventCard from "app/(public)/components/home/EventCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
export const revalidate = 60;

interface PublicPost {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  createdAt: Date;
  author: { name: string | null };
}

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string;
  imageUrl: string | null;
  ticketTypes: { id: string; name: string; price: number; quantity: number }[];
  hasPoll?: boolean;
}

interface PublicPoll {
  id: string;
  title: string;
  description: string;
  endDate: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
}

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: { gte: startOfTodayUTC },
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        ticketTypes: { select: { id: true, name: true, price: true, quantity: true } },
        polls: {
          where: { status: "ACTIVE", deletedAt: null },
          select: { id: true },
          take: 1, 
        },
      },
      orderBy: { date: "asc" },
      take: 4
    });

    return events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      location: e.location,
      imageUrl: e.imageUrl,
      ticketTypes: e.ticketTypes,
      hasPoll: e.polls.length > 0, 
    }));
  } catch { return []; }
}
async function getBlogPosts(): Promise<PublicPost[]> {
  try {
    return await prisma.post.findMany({
      where: { published: true, deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
  } catch { return []; }
}

async function getPolls(): Promise<PublicPoll[]> {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ endDate: { gte: new Date() } }, { endDate: null }],
        deletedAt: null
      },
      select: {
        id: true, title: true, description: true, endDate: true,
        options: { select: { id: true, text: true, _count: { select: { votes: true } } } },
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 4
    });
    return polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description || "",
      endDate: poll.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: poll.options.map(o => ({ id: o.id, text: o.text, votes: o._count.votes })),
      totalVotes: poll._count.votes
    }));
  } catch { return []; }
}

export default async function HomePage() {
  const [events, polls, posts] = await Promise.all([getEvents(), getPolls(), getBlogPosts()]);

  return (
    <main className="min-h-screen">
      <HeroSection />

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Discover and book amazing events in Liberia</p>
          </div>
          {events.length > 0 && (
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-sm sm:text-base text-brand-primary hover:text-brand-accent font-medium transition-colors shrink-0 ml-4"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">No upcoming events at the moment.</p>
          </div>
        )}
      </section>

      {/* Latest News / Blog */}
      {posts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Latest News</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Stories and highlights from our community
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm sm:text-base text-brand-primary hover:text-brand-accent font-medium transition-colors shrink-0 ml-4"
            >
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-primary/20 transition-all duration-200 active:scale-[0.99] h-full flex flex-col">
                  <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/10 to-brand-accent/10">
                        <span className="text-4xl">📰</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                      <span className="font-medium">{post.author.name ?? "Tiky Team"}</span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live Polls */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Polls</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Share your opinion on trending topics</p>
            </div>
            {polls.length > 0 && (
              <Link
                href="/polls"
                className="inline-flex items-center gap-1 text-sm sm:text-base text-brand-primary hover:text-brand-accent font-medium transition-colors shrink-0 ml-4"
              >
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {polls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {polls.map((poll) => (
                <Link key={poll.id} href={`/polls/${poll.id}`} className="block group">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-brand-primary/20 transition-all duration-200 active:scale-[0.99]">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 group-hover:text-brand-primary transition-colors line-clamp-2">
                      {poll.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{poll.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="font-medium">{poll.totalVotes} votes</span>
                      <span>Ends {new Date(poll.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500 text-sm">No active polls at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}