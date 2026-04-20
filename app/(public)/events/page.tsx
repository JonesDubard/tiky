// app/(public)/events/page.tsx
// Server component — fetches data, passes it to the client EventsGrid.
// All search/filter/sort logic lives in EventsGrid.tsx.

import { prisma } from 'lib/prisma'
import { Calendar, Lock } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import Link from 'next/link'
import RequestAccessBanner from "components/public/RequestAccessBanner"
import EventsGrid from "../components/home/EventsGrid"
import type { EventSummary } from "../components/home/EventsGrid"

async function getEvents(): Promise<EventSummary[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: { gte: new Date() },
        deletedAt: null,
      },
      include: {
        ticketTypes: {
          select: { id: true, name: true, price: true, quantity: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    return events.map(event => {
      const ticketTypes = event.ticketTypes ?? []
      const minPrice = ticketTypes.length > 0
        ? Math.min(...ticketTypes.map(t => t.price))
        : 0

      return {
        id:          event.id,
        title:       event.title,
        description: event.description,
        date:        event.date,
        location:    event.location,
        imageUrl:    event.imageUrl,
        isFeatured:  event.isFeatured ?? false,
        ticketTypes: ticketTypes.map(t => ({
          id:       t.id,
          name:     t.name,
          price:    t.price,
          quantity: t.quantity,
        })),
        minPrice,
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export default async function EventsPage() {
  const [events, session] = await Promise.all([
    getEvents(),
    getServerSession(authOptions),
  ])

  const isAdmin       = session?.user?.role === 'ADMIN' || session?.user?.role === 'ORGANIZER'
  const isRegularUser = !isAdmin

  // Static stats (computed from full list, not affected by client filters)
  const featuredCount  = events.filter(e => e.isFeatured).length
  const thisWeekCount  = events.filter(e => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return new Date(e.date) <= nextWeek
  }).length
  const freeCount = events.filter(e => e.ticketTypes.some(t => t.price === 0)).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-accent">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Public Events in Liberia
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Browse all published events. Only verified organizers can create events.
            </p>

            {isAdmin && (
              <div className="mb-8">
                <Link
                  href="/admin/events/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:shadow-lg transition-shadow"
                >
                  <span>Create New Event</span>
                  <Lock className="w-4 h-4" />
                </Link>
                <p className="text-white/80 text-sm mt-2">
                  Admin access: You can create and manage events
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="container mx-auto px-4 py-8 md:py-12">

        {/* Admin notice */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Admin Mode Active</h3>
                <p className="text-blue-600 text-sm">
                  You can create and manage events from the admin dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRegularUser && (
          <div className="mb-6">
            <RequestAccessBanner type="event" />
          </div>
        )}

        {/* Stats — static, computed server-side */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={events.length}  label="Published Events" color="brand-primary" />
          <StatCard value={featuredCount}  label="Featured"         color="green" />
          <StatCard value={thisWeekCount}  label="This Week"        color="blue" />
          <StatCard value={freeCount}      label="Free Events"      color="purple" />
        </div>

        {/* ── EventsGrid handles all interactive filtering ── */}
        {events.length === 0 ? (
          <EmptyState isAdmin={isAdmin} />
        ) : (
          <EventsGrid events={events} />
        )}

        {/* Admin CTA */}
        {isAdmin && events.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-brand-primary" />
              <h3 className="text-2xl font-bold text-slate-900">Event Management</h3>
            </div>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              As an admin, you can create, edit, and manage all events from the admin dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/admin/events/create"
                className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
              >
                Create New Event
              </Link>
              <Link
                href="/admin/events"
                className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Manage Events
              </Link>
            </div>
          </div>
        )}

        {isRegularUser && events.length > 0 && (
          <div className="mt-12 pt-12 border-t border-slate-200">
            <RequestAccessBanner type="event" />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    'brand-primary': 'text-brand-primary',
    'green':  'text-green-600',
    'blue':   'text-blue-600',
    'purple': 'text-purple-600',
  }
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-slate-600 text-sm">{label}</div>
    </div>
  )
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Calendar className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">No events published yet</h3>
      <p className="text-slate-500 mb-6">
        {isAdmin
          ? "Create the first event from the admin dashboard!"
          : "Check back soon for upcoming events in Liberia!"}
      </p>
      {isAdmin && (
        <Link
          href="/admin/events/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold rounded-lg hover:shadow-lg transition-shadow"
        >
          <span>Create First Event</span>
          <Lock className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}