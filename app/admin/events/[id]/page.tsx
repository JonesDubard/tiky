// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import { notFound } from "next/navigation";
// import Link from "next/link";
// import { Calendar, MapPin, Users, Ticket, ArrowLeft, Edit } from "lucide-react";
// import { format } from "date-fns";

// export default async function AdminEventViewPage({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const session = await getServerSession();
  
//   if (!session?.user?.email) {
//     redirect("/admin/login");
//   }

//   const event = await prisma.event.findUnique({
//     where: { id: params.id },
//     include: {
//       createdBy: {
//         select: {
//           name: true,
//           email: true,
//           role: true,
//         },
//       },
//       ticketTypes: {
//         include: {
//           tickets: {
//             where: { status: 'PAID' },
//             select: { id: true }
//           }
//         }
//       },
//       _count: {
//         select: {
//           ticketTypes: true,
//         },
//       },
//     },
//   });

//   if (!event) {
//     notFound();
//   }

//   // Check permissions
//   const user = await prisma.user.findUnique({
//     where: { email: session.user.email },
//     select: { id: true, role: true },
//   });

//   if (
//     !user ||
//     (user.role !== "ADMIN" && event.createdById !== user.id)
//   ) {
//     redirect("/admin/events");
//   }

//  
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";

// IMPORTANT: In Next.js 15+, params is a Promise that needs to be awaited
export default async function AdminEventViewPage({
  params,
}: {
  params: Promise<{ id: string }>; // 👈 Note: params is a Promise
}) {
  // 👇 AWAIT the params first!
  const { id } = await params;
  
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  // Now use the extracted id
  const event = await prisma.event.findUnique({
    where: { id }, // 👈 Use the awaited id
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      ticketTypes: {
        include: {
          tickets: {
            where: { status: 'PAID' },
            select: { id: true }
          }
        }
      },
      _count: {
        select: {
          ticketTypes: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Check permissions
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (
    !user ||
    (user.role !== "ADMIN" && event.createdById !== user.id)
  ) {
    redirect("/admin/events");
  }

   const totalTicketsSold = event.ticketTypes.reduce(
    (sum, type) => sum + type.tickets.length,
    0
  );
  const totalTicketsAvailable = event.ticketTypes.reduce(
    (sum, type) => sum + type.quantity,
    0
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/events"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Created by {event.createdBy.name || event.createdBy.email}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Event
        </Link>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        event.published 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            event.published ? 'text-green-800' : 'text-yellow-800'
          }`}>
            Status: {event.published ? 'Published' : 'Draft'}
          </span>
          {!event.published && (
            <span className="text-sm text-gray-600">
              - This event is not visible on the public homepage
            </span>
          )}
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(event.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Organizer</p>
                  <p className="text-sm text-gray-600">
                    {event.createdBy.name || event.createdBy.email} ({event.createdBy.role})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Ticket Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Tickets</span>
                <span className="font-medium">{totalTicketsAvailable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sold</span>
                <span className="font-medium text-green-600">{totalTicketsSold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available</span>
                <span className="font-medium">{totalTicketsAvailable - totalTicketsSold}</span>
              </div>
            </div>
          </div>

          {/* Ticket Types */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Ticket Types</h2>
            <div className="space-y-4">
              {event.ticketTypes.map((type) => (
                <div key={type.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{type.name}</span>
                    <span className="text-sm text-brand-primary font-medium">
                      USD {type.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sold: {type.tickets.length}</span>
                    <span>Available: {type.quantity - type.tickets.length}/{type.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}