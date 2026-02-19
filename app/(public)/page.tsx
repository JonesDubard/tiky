// // app/(public)/page.tsx
// import { prisma } from "lib/prisma";
// import HeroSection from "app/(public)/components/home/HeroSection";
// import FeaturedEvents from "app/(public)/components/home/FeaturedEvents";
// import LivePolls from "app/(public)/components/home/LivePolls";
// import Footer from "app/(public)/components/home/Footer";
// import Link from "next/link";
// import { ArrowRight } from "lucide-react";

// // Types
// interface PublicEvent {
//   id: string;
//   title: string;
//   description: string | null;
//   date: Date;
//   location: string;
//   imageUrl: string | null;
//   ticketTypes: {
//     id: string;
//     name: string;
//     price: number;
//     quantity: number;
//   }[];
// }

// interface PublicPoll {
//   id: string;
//   title: string;
//   description: string;
//   endDate: string;
//   options: {
//     id: string;
//     text: string;
//     votes: number;
//   }[];
//   totalVotes: number;
// }

// async function getEvents(): Promise<PublicEvent[]> {
//   try {
//     const events = await prisma.event.findMany({
//       where: {
//         published: true,
//         date: {
//           gte: new Date()
//         }
//       },
//       select: {
//         id: true,
//         title: true,
//         description: true,
//         date: true,
//         location: true,
//         imageUrl: true,
//         ticketTypes: {
//           select: {
//             id: true,
//             name: true,
//             price: true,
//             quantity: true
//           }
//         }
//       },
//       orderBy: {
//         date: "asc"
//       },
//       take: 4 // Phase 3: Show only first 4
//     });

//     return events;
//   } catch (error) {
//     console.error("Error fetching events:", error);
//     return [];
//   }
// }

// async function getPolls(): Promise<PublicPoll[]> {
//   try {
//     const polls = await prisma.poll.findMany({
//       where: {
//         status: 'ACTIVE',
//         OR: [
//           { endDate: { gte: new Date() } },
//           { endDate: null }
//         ]
//       },
//       select: {
//         id: true,
//         title: true,
//         description: true,
//         endDate: true,
//         options: {
//           select: {
//             id: true,
//             text: true,
//             _count: {
//               select: { votes: true }
//             }
//           }
//         },
//         _count: {
//           select: { votes: true }
//         }
//       },
//       orderBy: {
//         createdAt: "desc"
//       },
//       take: 4 // Phase 3: Show only first 4
//     });

//     return polls.map(poll => ({
//       id: poll.id,
//       title: poll.title,
//       description: poll.description || "",
//       endDate: poll.endDate?.toISOString() || 
//                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       options: poll.options.map(option => ({
//         id: option.id,
//         text: option.text,
//         votes: option._count.votes
//       })),
//       totalVotes: poll._count.votes
//     }));
//   } catch (error) {
//     console.error("[POLLS_API] Error:", error);
//     return [];
//   }
// }

// export default async function HomePage() {
//   const [events, polls] = await Promise.all([
//     getEvents(),
//     getPolls()
//   ]);

//   return (
//     <main className="min-h-screen">
//       <HeroSection />
      
//       {/* Featured Events Section */}
//       <section className="section-container py-16">
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
//             <p className="text-gray-600 mt-2">Discover amazing events in Liberia</p>
//           </div>
//           {events.length > 0 && (
//             <Link 
//               href="/events" 
//               className="inline-flex items-center text-brand-primary hover:text-brand-accent font-medium transition-colors"
//             >
//               View All Events
//               <ArrowRight className="ml-2 w-4 h-4" />
//             </Link>
//           )}
//         </div>
        
//         {events.length > 0 ? (
//           <FeaturedEvents events={events} />
//         ) : (
//           <div className="text-center py-12 bg-gray-50 rounded-lg">
//             <p className="text-gray-600">No upcoming events at the moment.</p>
//           </div>
//         )}
//       </section>

//       {/* Live Polls Section */}
//       <section className="section-container py-16 bg-gray-50">
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h2 className="text-3xl font-bold text-gray-900">Live Polls</h2>
//             <p className="text-gray-600 mt-2">Share your opinion on trending topics</p>
//           </div>
//           {polls.length > 0 && (
//             <Link 
//               href="/polls" 
//               className="inline-flex items-center text-brand-primary hover:text-brand-accent font-medium transition-colors"
//             >
//               View All Polls
//               <ArrowRight className="ml-2 w-4 h-4" />
//             </Link>
//           )}
//         </div>
        
//         {polls.length > 0 ? (
//           <LivePolls polls={polls} />
//         ) : (
//           <div className="text-center py-12 bg-white rounded-lg">
//             <p className="text-gray-600">No active polls at the moment.</p>
//           </div>
//         )}
//       </section>
//     </main>
//   );
// }

// app/(public)/page.tsx
import { prisma } from "lib/prisma";
import HeroSection from "app/(public)/components/home/HeroSection";
import EventCard from "app/(public)/components/home/EventCard";
import LivePolls from "app/(public)/components/home/LivePolls";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Types
interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string;
  imageUrl: string | null;
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface PublicPoll {
  id: string;
  title: string;
  description: string;
  endDate: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  totalVotes: number;
}

async function getEvents(): Promise<PublicEvent[]> {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        date: {
          gte: new Date()
        },
        deletedAt: null
      },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        location: true,
        imageUrl: true,
        ticketTypes: {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true
          }
        }
      },
      orderBy: {
        date: "asc"
      },
      take: 4
    });

    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

async function getPolls(): Promise<PublicPoll[]> {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ],
        deletedAt: null
      },

      select: {
        id: true,
        title: true,
        description: true,
        endDate: true,
        options: {
          select: {
            id: true,
            text: true,
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
      take: 4
    });

    return polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description || "",
      endDate: poll.endDate?.toISOString() || 
               new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option._count.votes
      })),
      totalVotes: poll._count.votes
    }));
  } catch (error) {
    console.error("[POLLS_API] Error:", error);
    return [];
  }
}

export default async function HomePage() {
  const [events, polls] = await Promise.all([
    getEvents(),
    getPolls()
  ]);

  return (
    <main className="min-h-screen">
      <HeroSection />
      
      {/* Upcoming Events Section - Simplified to one section */}
      <section className="section-container py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="text-gray-600 mt-2">Discover and book amazing events in Liberia</p>
          </div>
          {events.length > 0 && (
            <Link 
              href="/events" 
              className="inline-flex items-center text-brand-primary hover:text-brand-accent font-medium transition-colors"
            >
              View All Events
              <ArrowRight className="ml-2 w-4 h-4" />
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
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No upcoming events at the moment.</p>
          </div>
        )}
      </section>

      {/* Live Polls Section */}
      <section className="section-container py-16 bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Live Polls</h2>
            <p className="text-gray-600 mt-2">Share your opinion on trending topics</p>
          </div>
          {polls.length > 0 && (
            <Link 
              href="/polls" 
              className="inline-flex items-center text-brand-primary hover:text-brand-accent font-medium transition-colors"
            >
              View All Polls
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          )}
        </div>
        
        {polls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.map((poll) => (
              <Link key={poll.id} href={`/polls/${poll.id}`} className="block group">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-primary">
                    {poll.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{poll.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{poll.totalVotes} votes</span>
                    <span>Ends {new Date(poll.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No active polls at the moment.</p>
          </div>
        )}
      </section>
    </main>
  );
}