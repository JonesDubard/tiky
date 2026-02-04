// // app/events/[id]/page.tsx
// import { prisma } from 'lib/prisma';
// import { notFound } from 'next/navigation';
// import Image from 'next/image';
// import { CalendarDays, MapPin, Ticket, Clock, Users, Share2 } from 'lucide-react';
// import TicketSelector from 'components/Events/TicketSelector';

// async function getEvent(id: string) {
//   const event = await prisma.event.findUnique({
//     where: {
//       id,
//       published: true,
//     },
//     include: {
//       tickets: true,
//       organizer: {
//         select: {
//           name: true,
//           image: true,
//         }
//       },
//       polls: {
//         where: {
//           status: 'ACTIVE',
//         },
//         take: 3,
//       }
//     }
//   });
  
//   if (!event) return null;
//   return event;
// }

// interface EventPageProps {
//   params: Promise<{ id: string }>;
// }

// export default async function EventPage({ params }: EventPageProps) {
//   const { id } = await params;
//   const event = await getEvent(id);
  
//   if (!event) {
//     notFound();
//   }

//   const eventDate = new Date(event.date);
//   const formattedDate = eventDate.toLocaleDateString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
//   const formattedTime = eventDate.toLocaleTimeString('en-US', {
//     hour: 'numeric',
//     minute: '2-digit',
//   });

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-brand-subtle/5 to-white">
//       {/* Event Header */}
//       <div className="bg-slate-900 text-white">
//         <div className="max-w-7xl mx-auto px-4 py-8">
//           <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
//             <a href="/events" className="hover:text-white transition-colors">
//               Events
//             </a>
//             <span>•</span>
//             <span>{event.location}</span>
//           </div>
          
//           <h1 className="text-4xl md:text-5xl font-bold mb-6">
//             {event.title}
//           </h1>
          
//           <div className="flex flex-wrap gap-6">
//             <div className="flex items-center gap-2">
//               <CalendarDays className="w-5 h-5" />
//               <span className="font-medium">{formattedDate}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Clock className="w-5 h-5" />
//               <span className="font-medium">{formattedTime}</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <MapPin className="w-5 h-5" />
//               <span className="font-medium">{event.location}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left Column - Event Details */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* Event Image */}
//             <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
//               {event.imageUrl ? (
//                 <div className="relative h-96">
//                   <Image
//                     src={event.imageUrl}
//                     alt={event.title}
//                     fill
//                     className="object-cover"
//                     sizes="(max-width: 1024px) 100vw, 66vw"
//                   />
//                 </div>
//               ) : (
//                 <div className="h-96 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center">
//                   <CalendarDays className="w-32 h-32 text-brand-primary/30" />
//                 </div>
//               )}
//             </div>

//             {/* Event Description */}
//             <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
//               <h2 className="text-2xl font-bold text-slate-900 mb-6">
//                 About This Event
//               </h2>
//               <div className="prose prose-lg max-w-none">
//                 <p className="text-slate-700 leading-relaxed">
//                   {event.description || "Join us for an unforgettable experience! This event promises excitement, entertainment, and great memories."}
//                 </p>
//               </div>
              
//               {/* Organizer Info */}
//               {event.organizer && (
//                 <div className="mt-8 pt-8 border-t border-slate-200">
//                   <h3 className="text-xl font-bold text-slate-900 mb-4">
//                     Organized By
//                   </h3>
//                   <div className="flex items-center gap-4">
//                     {event.organizer.image ? (
//                       <Image
//                         src={event.organizer.image}
//                         alt={event.organizer.name || 'Organizer'}
//                         width={64}
//                         height={64}
//                         className="rounded-full"
//                       />
//                     ) : (
//                       <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-xl">
//                         {event.organizer.name?.[0] || 'O'}
//                       </div>
//                     )}
//                     <div>
//                       <h4 className="font-bold text-slate-900">
//                         {event.organizer.name || 'Event Organizer'}
//                       </h4>
//                       <p className="text-slate-600">
//                         Professional event organizer with verified events
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right Column - Ticket Selection */}
//           <div className="lg:col-span-1">
//             <TicketSelector event={event} tickets={event.tickets} />
            
//             {/* Share Event */}
//             <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
//               <h3 className="text-lg font-bold text-slate-900 mb-4">
//                 Share This Event
//               </h3>
//               <div className="flex gap-3">
//                 <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
//                   <Share2 className="w-4 h-4" />
//                   <span className="text-sm font-medium">Share</span>
//                 </button>
//                 <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
//                   <Users className="w-4 h-4" />
//                   <span className="text-sm font-medium">Invite</span>
//                 </button>
//               </div>
//             </div>

//             {/* Event Stats */}
//             <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
//               <h3 className="text-lg font-bold text-slate-900 mb-4">
//                 Event Details
//               </h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Date & Time</span>
//                   <span className="font-medium">{formattedDate} at {formattedTime}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Venue</span>
//                   <span className="font-medium text-right">{event.location}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Tickets Available</span>
//                   <span className="font-medium">
//                     {event.tickets.reduce((sum, t) => sum + t.quantity, 0)}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// app/events/[id]/page.tsx
import { prisma } from 'lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { CalendarDays, MapPin, Ticket, Clock, Users, Share2, CreditCard } from 'lucide-react';
import TicketSelector from 'components/Events/TicketSelector';
import MockPaymentButton from 'components/Payment/MockPaymentButton';

async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: {
      id,
      published: true,
    },
    include: {
      tickets: true,
      organizer: {
        select: {
          name: true,
          image: true,
        }
      },
      polls: {
        where: {
          status: 'ACTIVE',
        },
        take: 3,
      }
    }
  });
  
  if (!event) return null;
  return event;
}

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  
  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/5 to-white">
      {/* Event Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <a href="/events" className="hover:text-white transition-colors">
              Events
            </a>
            <span>•</span>
            <span>{event.location}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              {event.imageUrl ? (
                <div className="relative h-96">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
              ) : (
                <div className="h-96 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center">
                  <CalendarDays className="w-32 h-32 text-brand-primary/30" />
                </div>
              )}
            </div>

            {/* Event Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                About This Event
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-slate-700 leading-relaxed">
                  {event.description || "Join us for an unforgettable experience! This event promises excitement, entertainment, and great memories."}
                </p>
              </div>
              
              {/* Organizer Info */}
              {event.organizer && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Organized By
                  </h3>
                  <div className="flex items-center gap-4">
                    {event.organizer.image ? (
                      <Image
                        src={event.organizer.image}
                        alt={event.organizer.name || 'Organizer'}
                        width={64}
                        height={64}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-xl">
                        {event.organizer.name?.[0] || 'O'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {event.organizer.name || 'Event Organizer'}
                      </h4>
                      <p className="text-slate-600">
                        Professional event organizer with verified events
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Ticket Selection & Payment */}
          <div className="lg:col-span-1">
            <TicketSelector event={event} tickets={event.tickets} />
            
            {/* Mock Payment Section */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Quick Checkout (Demo)
                </h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Test the payment flow with our mock payment system. This simulates a real transaction.
              </p>
              
              <MockPaymentButton eventId={event.id} />
              
              <div className="mt-4 text-xs text-slate-500">
                <p>• No real money is charged</p>
                <p>• Generates a test ticket with QR code</p>
                <p>• Full payment flow simulation</p>
              </div>
            </div>

            {/* Share Event */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Share This Event
              </h3>
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Invite</span>
                </button>
              </div>
            </div>

            {/* Event Stats */}
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Event Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Date & Time</span>
                  <span className="font-medium">{formattedDate} at {formattedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Venue</span>
                  <span className="font-medium text-right">{event.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tickets Available</span>
                  <span className="font-medium">
                    {event.tickets.reduce((sum, t) => sum + t.quantity, 0)}
                  </span>
                </div>
                {event.price && event.price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ticket Price</span>
                    <span className="font-medium text-green-600">
                      ${event.price.toFixed(2)} LRD
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}