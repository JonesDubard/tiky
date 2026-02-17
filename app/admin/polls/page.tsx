// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import Link from "next/link";
// import { Plus, Edit, Eye, Trash2 } from "lucide-react";

// export default async function AdminPollsPage() {
//   const session = await getServerSession();
  
//   if (!session?.user?.email) {
//     redirect("/admin/login");
//   }

//   const user = await prisma.user.findUnique({
//     where: { email: session.user.email },
//     select: { id: true, role: true }
//   });

//   if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
//     redirect("/unauthorized");
//   }

//   const polls = await prisma.poll.findMany({
//     where: user.role === 'ADMIN' ? {} : { creatorId: user.id },
//     include: {
//       _count: {
//         select: {
//           options: true,
//           votes: true,
//         },
//       },
//       creator: {
//         select: {
//           name: true,
//           email: true,
//         },
//       },
//     },
//     orderBy: {
//       createdAt: 'desc',
//     },
//   });

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
//           <p className="text-sm text-gray-600 mt-1">
//             {user.role === 'ADMIN' ? 'All polls' : 'Your polls'}
//           </p>
//         </div>
//         <Link
//           href="/admin/polls/create"
//           className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
//         >
//           <Plus className="w-4 h-4" />
//           Create Poll
//         </Link>
//       </div>

//       {polls.length === 0 ? (
//         <div className="text-center py-12 bg-white rounded-lg">
//           <p className="text-gray-600">No polls found.</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poll</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {polls.map((poll) => (
//                 <tr key={poll.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4">
//                     <div className="text-sm font-medium text-gray-900">{poll.title}</div>
//                     <div className="text-sm text-gray-500">
//                       By {poll.creator.name || poll.creator.email}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-900">
//                     {poll._count.options}
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-900">
//                     {poll._count.votes}
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className={`px-2 py-1 text-xs rounded-full ${
//                       poll.status === 'ACTIVE' 
//                         ? 'bg-green-100 text-green-800' 
//                         : 'bg-gray-100 text-gray-800'
//                     }`}>
//                       {poll.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4">
//                     <span className={`px-2 py-1 text-xs rounded-full ${
//                       poll.pollType === 'PAID' 
//                         ? 'bg-yellow-100 text-yellow-800' 
//                         : 'bg-blue-100 text-blue-800'
//                     }`}>
//                       {poll.pollType || 'FREE'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-right space-x-2">
//                     <Link
//                       href={`/admin/polls/${poll.id}`}
//                       className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
//                       title="View"
//                     >
//                       <Eye className="w-4 h-4" />
//                     </Link>
//                     <Link
//                       href={`/admin/polls/${poll.id}/edit`}
//                       className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg"
//                       title="Edit"
//                     >
//                       <Edit className="w-4 h-4" />
//                     </Link>
//                     <DeleteButton 
//                       id={poll.id} 
//                       type="poll" 
//                       title={poll.title} 
//                     />
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2 } from "lucide-react";
import DeleteButton from "app/admin/polls/components/DeleteButton";


export default async function AdminPollsPage() {
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

  const polls = await prisma.poll.findMany({
    where: user.role === 'ADMIN' ? {} : { creatorId: user.id },
    include: {
      _count: {
        select: {
          options: true,
          votes: true,
        },
      },
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
          <p className="text-sm text-gray-600 mt-1">
            {user.role === 'ADMIN' ? 'All polls' : 'Your polls'}
          </p>
        </div>
        <Link
          href="/admin/polls/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No polls found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poll</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {polls.map((poll) => (
                <tr key={poll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{poll.title}</div>
                    <div className="text-sm text-gray-500">
                      By {poll.creator.name || poll.creator.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {poll._count.options}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {poll._count.votes}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      poll.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {poll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      poll.pollType === 'PAID' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {poll.pollType || 'FREE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/polls/${poll.id}`}
                      className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/polls/${poll.id}/edit`}
                      className="inline-flex items-center p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <DeleteButton 
                      id={poll.id} 
                      type="poll" 
                      title={poll.title} 
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