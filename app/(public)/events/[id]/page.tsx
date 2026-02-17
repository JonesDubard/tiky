// // app/(public)/events/[id]/page.tsx - COMPLETE FIXED VERSION
// import { prisma } from 'lib/prisma';
// import TicketSelector from 'components/Events/TicketSelector';
// import { ArrowLeft, Share2, Calendar, MapPin, Users } from 'lucide-react';
// import Link from 'next/link';
// import { notFound } from 'next/navigation';

// async function getEventData(id: string) {
//   try {
//     // Validate id is not undefined
//     if (!id || id === 'undefined') {
//       return null;
//     }

//     const event = await prisma.event.findUnique({
//       where: { id },
//       include: {
//         tickets: {
//           select: {
//             id: true,
//             type: true,
//             price: true,
//             quantity: true,
//             status: true
//           },
//           where: {
//             status: { in: ['PENDING', 'PAID'] } // Only show available tickets
//           }
//         },
//         createdBy: {
//           select: {
//             name: true,
//             email: true
//           }
//         },
//         _count: {
//           select: {
//             tickets: true
//           }
//         }
//       }
//     });

//     if (!event) {
//       return null;
//     }

//     return event;
//   } catch (error) {
//     console.error('Error fetching event:', error);
//     return null;
//   }
// }

// async function getRelatedEvents(eventId: string) {
//   try {
//     const events = await prisma.event.findMany({
//       where: {
//         published: true,
//         date: {
//           gte: new Date()
//         },
//         NOT: {
//           id: eventId
//         }
//       },
//       include: {
//         tickets: {
//           select: {
//             price: true
//           }
//         }
//       },
//       orderBy: { date: 'asc' },
//       take: 3
//     });
//     return events;
//   } catch (error) {
//     console.error('Error fetching related events:', error);
//     return [];
//   }
// }

// interface PageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function EventPage(props: PageProps) {
//   // FIX: Properly await params
//   const params = await props.params;
//   const id = params.id;
  
//   if (!id || id === 'undefined') {
//     notFound();
//   }

//   const [event, relatedEvents] = await Promise.all([
//     getEventData(id),
//     getRelatedEvents(id)
//   ]);
  
//   if (!event) {
//     notFound();
//   }

//   const eventDate = new Date(event.date);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
//       {/* Header */}
//       <div className="bg-white border-b border-slate-200">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <Link 
//               href="/events"
//               className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors"
//             >
//               <ArrowLeft className="w-5 h-5" />
//               <span className="font-medium">Back to Events</span>
//             </Link>
//             <button className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors">
//               <Share2 className="w-5 h-5" />
//               <span className="font-medium">Share</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left Column - Event Details */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* Event Header */}
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 {event.isFeatured && (
//                   <div className="flex items-center gap-1.5 bg-brand-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
//                     <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
//                     FEATURED
//                   </div>
//                 )}
//                 {event.published && (
//                   <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
//                     ACTIVE
//                   </span>
//                 )}
//               </div>
//               <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
//                 {event.title}
//               </h1>
//               <p className="text-lg text-slate-600 mb-6">
//                 {event.description || "Join us for an amazing event!"}
//               </p>
//             </div>

//             {/* Event Image */}
//             <div className="relative h-64 lg:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-subtle to-brand-primary/20">
//               {event.imageUrl ? (
//                 <img 
//                   src={event.imageUrl} 
//                   alt={event.title}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-brand-primary/10 to-brand-accent/10">
//                   <span className="text-2xl font-bold text-slate-400">Event Image</span>
//                 </div>
//               )}
//               <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
//             </div>

//             {/* Event Details Card */}
//             <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
//               <h2 className="text-2xl font-bold text-slate-900 mb-6">
//                 Event Details
//               </h2>
              
//               <div className="space-y-4">
//                 <div className="flex items-start gap-4">
//                   <Calendar className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
//                   <div>
//                     <h3 className="font-bold text-slate-900">Date & Time</h3>
//                     <p className="text-slate-600">
//                       {eventDate.toLocaleDateString('en-US', {
//                         weekday: 'short',
//                         month: 'short',
//                         day: 'numeric',
//                         year: 'numeric'
//                       })}
//                     </p>
//                     <p className="text-slate-600">
//                       {eventDate.toLocaleTimeString('en-US', {
//                         hour: 'numeric',
//                         minute: '2-digit'
//                       })}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-4">
//                   <MapPin className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
//                   <div>
//                     <h3 className="font-bold text-slate-900">Location</h3>
//                     <p className="text-slate-600">{event.location || "Location to be announced"}</p>
//                     <button className="text-brand-primary hover:text-brand-accent font-medium mt-1">
//                       View on map →
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex items-start gap-4">
//                   <Users className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
//                   <div className="flex-1">
//                     <h3 className="font-bold text-slate-900 mb-2">Tickets Available</h3>
//                     {event.tickets.length === 0 ? (
//                       <p className="text-slate-500">No tickets available yet</p>
//                     ) : (
//                       <div className="space-y-3">
//                         {event.tickets.map((ticket) => (
//                           <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
//                             <div>
//                               <span className="font-medium text-slate-900">{ticket.type || "General Admission"}</span>
//                               <span className="text-sm text-slate-500 ml-3">
//                                 {ticket.quantity > 0 
//                                   ? `Remaining: ${ticket.quantity}` 
//                                   : "SOLD OUT"}
//                               </span>
//                             </div>
//                             <span className="font-bold text-brand-accent">
//                               ${ticket.price.toFixed(2)}
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                     <div className="mt-4 pt-4 border-t border-slate-100">
//                       <p className="text-sm text-slate-500">
//                         Total tickets sold: {event._count.tickets}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {event.createdBy && (
//                   <div className="flex items-start gap-4">
//                     <Users className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
//                     <div>
//                       <h3 className="font-bold text-slate-900">Organizer</h3>
//                       <p className="text-slate-600">{event.createdBy.name || event.createdBy.email}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Ticket Selector */}
//           <div className="lg:col-span-1">
//             <div className="sticky top-24">
//               <TicketSelector 
//                 event={event}
//                 tickets={event.tickets}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Related Events */}
//         {relatedEvents.length > 0 && (
//           <div className="mt-16">
//             <h2 className="text-2xl font-bold text-slate-900 mb-6">
//               You Might Also Like
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {relatedEvents.map(relatedEvent => (
//                 <Link 
//                   key={relatedEvent.id} 
//                   href={`/events/${relatedEvent.id}`}
//                   className="block"
//                 >
//                   <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
//                     <h3 className="font-bold text-slate-900 mb-2">{relatedEvent.title}</h3>
//                     <p className="text-sm text-slate-600 mb-3">
//                       {new Date(relatedEvent.date).toLocaleDateString()}
//                     </p>
//                     <p className="text-sm text-slate-500">
//                       {relatedEvent.tickets.length > 0 
//                         ? `From $${Math.min(...relatedEvent.tickets.map(t => t.price)).toFixed(2)}`
//                         : "Free"}
//                     </p>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// app/(public)/events/[id]/page.tsx
import { prisma } from "lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Clock, Ticket, Users } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getServerSession } from "next-auth";

interface EventPageProps {
  params: {
    id: string;
  };
}

async function getEvent(id: string) {
  if (!id) return null;
  
  try {
    const event = await prisma.event.findUnique({
      where: { 
        id: id // Make sure id is passed correctly
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        ticketTypes: {
          orderBy: {
            price: "asc",
          },
        },
        _count: {
          select: {
            ticketTypes: true,
          },
        },
      },
    });

    return event;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

export default async function EventPage({ params }: EventPageProps) {
  // Await params if needed (Next.js 15+)
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  // Calculate total tickets available
  const totalTickets = event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section with Event Image */}
      <div className="relative h-[40vh] md:h-[50vh] bg-gray-900">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover opacity-80"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-primary to-brand-accent flex items-center justify-center">
            <h1 className="text-6xl md:text-8xl font-bold text-white opacity-20">
              {event.title.charAt(0)}
            </h1>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm md:text-base">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {format(new Date(event.date), "h:mm a")}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2">
            {/* About Event */}
            <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {event.description || "No description available."}
              </p>
            </section>

            {/* Organizer Info */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Organizer</h2>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-brand-subtle rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">{event.createdBy.name || "Event Organizer"}</p>
                  <p className="text-sm text-gray-600">{event.createdBy.email}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Right Column (Ticket Types) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tickets</h2>
              
              {event.ticketTypes.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {event.ticketTypes.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-brand-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{ticket.name}</h3>
                        <span className="text-lg font-bold text-brand-primary">
                          ${ticket.price.toLocaleString()} USD
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {ticket.quantity > 0 
                          ? `${ticket.quantity} tickets available`
                          : "Sold out"}
                      </p>
                      <Link
                        href={`/checkout?eventId=${event.id}&ticketTypeId=${ticket.id}`}
                        className={`block w-full py-2 text-center font-medium rounded-lg transition-colors ${
                          ticket.quantity > 0
                            ? "bg-brand-primary text-white hover:bg-brand-accent"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        {ticket.quantity > 0 ? "Select Tickets" : "Sold Out"}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-6">No tickets available for this event.</p>
              )}

              {/* Event Stats */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Total tickets:</span>
                  <span className="font-semibold">{totalTickets}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Ticket types:</span>
                  <span className="font-semibold">{event.ticketTypes.length}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="text-sm text-gray-600 mb-3">We accept:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    MTN MoMo
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    Card
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full opacity-50">
                    Orange Money (Soon)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}