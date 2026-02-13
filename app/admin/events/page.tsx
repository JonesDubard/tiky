import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EventList } from "./components/EventList";

export default async function AdminEventsPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Get user with admin/organizer role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
    redirect("/unauthorized");
  }

  // Fetch events - admins see all, organizers see their own
  const events = await prisma.event.findMany({
    where: user.role === 'ADMIN' 
      ? {} 
      : { createdById: user.id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          _count: {
            select: {
              tickets: true
            }
          }
        }
      },
      _count: {
        select: {
          ticketTypes: true,
          polls: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user.role === 'ADMIN' ? 'All events' : 'Your events'}
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </Link>
      </div>

      <EventList events={events} />
    </div>
  );
}