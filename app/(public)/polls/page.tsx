// // app/polls/page.tsx - Complete page
// import { prisma } from '@/lib/prisma';
// import PollCard from '@/components/polls/PollCard';
// import { BarChart3, Vote, TrendingUp } from 'lucide-react';

// async function getPolls() {
//   try {
//     const polls = await prisma.poll.findMany({
//       where: {
//         status: "ACTIVE",
//         OR: [
//           { endDate: { gte: new Date() } },
//           { endDate: null }
//         ]
//       },
//       include: {
//         options: {
//           include: {
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
//       }
//     });

//     // Transform data for PollCard component
//     return polls.map(poll => ({
//       id: poll.id,
//       title: poll.title,
//       description: poll.description || "",
//       endDate: poll.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       options: poll.options.map(option => ({
//         id: option.id,
//         text: option.text,
//         votes: option._count.votes
//       })),
//       totalVotes: poll._count.votes
//     }));
//   } catch (error) {
//     console.error('Error fetching polls:', error);
//     return [];
//   }
// }

// export default async function PollsPage() {
//   const polls = await getPolls();

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 to-white">
//       {/* Hero Section */}
//       <div className="bg-gradient-to-r from-brand-accent/10 to-brand-primary/10 py-12 px-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-2 bg-brand-accent/20 rounded-lg">
//               <BarChart3 className="w-6 h-6 text-brand-accent" />
//             </div>
//             <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
//               Live Polls & Contests
//             </h1>
//           </div>
//           <p className="text-slate-600 text-lg max-w-3xl">
//             Vote on current polls and see real-time results. Your opinion matters!
//           </p>
          
//           {/* Stats */}
//           <div className="flex flex-wrap gap-6 mt-8">
//             <div className="flex items-center gap-2">
//               <Vote className="w-4 h-4 text-brand-primary" />
//               <span className="font-medium">{polls.length} Active Polls</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <TrendingUp className="w-4 h-4 text-brand-accent" />
//               <span className="font-medium">
//                 {polls.reduce((sum, poll) => sum + poll.totalVotes, 0)} Total Votes
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Polls Grid */}
//       <div className="max-w-7xl mx-auto px-4 py-12">
//         {polls.length === 0 ? (
//           <div className="text-center py-20">
//             <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-subtle to-brand-accent/20 flex items-center justify-center">
//               <BarChart3 className="w-16 h-16 text-brand-accent/50" />
//             </div>
//             <h3 className="text-2xl font-bold text-slate-900 mb-3">
//               No active polls
//             </h3>
//             <p className="text-slate-600 mb-8">
//               Check back soon for new polls and contests!
//             </p>
//             <a
//               href="/"
//               className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
//             >
//               Return to Home
//             </a>
//           </div>
//         ) : (
//           <>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {polls.map((poll) => (
//                 <PollCard key={poll.id} poll={poll} clickable={true} />
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// app/(public)/polls/page.tsx - Complete polls listing page
import { prisma } from '@/lib/prisma';
import PollCard from '@/components/polls/PollCard';
import { BarChart3, Vote, TrendingUp } from 'lucide-react';

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
      }
    });

    // Transform data for PollCard component
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

    return transformedPolls;
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
}

export default async function PollsPage() {
  const polls = await getPolls();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-subtle/10 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-accent/10 to-brand-primary/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-accent/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-brand-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Live Polls & Contests
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-3xl">
            Vote on current polls and see real-time results. Your opinion matters!
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-brand-primary" />
              <span className="font-medium">{polls.length} Active Polls</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-accent" />
              <span className="font-medium">
                {polls.reduce((sum, poll) => sum + poll.totalVotes, 0)} Total Votes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Polls Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {polls.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-brand-subtle to-brand-accent/20 flex items-center justify-center">
              <BarChart3 className="w-16 h-16 text-brand-accent/50" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              No active polls
            </h3>
            <p className="text-slate-600 mb-8">
              Check back soon for new polls and contests!
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors"
            >
              Return to Home
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} clickable={true} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}