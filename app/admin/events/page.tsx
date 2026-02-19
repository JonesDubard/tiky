// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import Link from "next/link";
// import { EventList } from "./components/EventList";

// export default async function AdminEventsPage() {
//   const session = await getServerSession();
  
//   if (!session?.user) {
//     redirect("/login");
//   }

//   // Get user with admin/organizer role
//   const user = await prisma.user.findUnique({
//     where: { email: session.user.email },
//     select: { id: true, role: true }
//   });

//   if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
//     redirect("/unauthorized");
//   }

//   // Fetch events - admins see all, organizers see their own
//   const events = await prisma.event.findMany({
//     where: user.role === 'ADMIN' 
//       ? {} 
//       : { createdById: user.id },
//     include: {
//       createdBy: {
//         select: {
//           id: true,
//           name: true,
//           email: true
//         }
//       },
//       ticketTypes: {
//         select: {
//           id: true,
//           name: true,
//           price: true,
//           quantity: true,
//           _count: {
//             select: {
//               tickets: true
//             }
//           }
//         }
//       },
//       _count: {
//         select: {
//           ticketTypes: true,
//           polls: true
//         }
//       }
//     },
//     orderBy: {
//       createdAt: 'desc'
//     }
//   });

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Events</h1>
//           <p className="text-sm text-gray-600 mt-1">
//             {user.role === 'ADMIN' ? 'All events' : 'Your events'}
//           </p>
//         </div>
//         <Link
//           href="/admin/events/create"
//           className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
//         >
//           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//           </svg>
//           Create Event
//         </Link>
//       </div>

//       <EventList events={events} />
//     </div>
//   );
// }

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import DeleteButton from "app/admin/events/components/DeleteButton";

export default async function AdminEventsPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
    redirect("/unauthorized");
  }

  // Fetch events with ticket counts
  const events = await prisma.event.findMany({
    where: {
    deletedAt: null,
    ...(user.role !== 'ADMIN' && { createdById: user.id }),
  },
    include: {
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          _count: {
            select: { tickets: true }
          }
        }
      },
      _count: {
        select: {
          ticketTypes: true
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
        <Link
          href="/admin/events/archive"
          className="block px-4 py-2 text-sm hover:bg-gray-100 rounded"
          >
           🗑 Archived Events
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No events found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500">{event.location}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {event.ticketTypes.reduce((sum, t) => sum + t._count.tickets, 0)} sold
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.ticketTypes.length} type(s)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteButton 
                      id={event.id} 
                      type="event" 
                      title={event.title} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

