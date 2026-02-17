// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import { notFound } from "next/navigation";
// import PollForm from "components/admin/PollForm";

// export default async function EditPollPage({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const session = await getServerSession();
  
//   if (!session?.user?.email) {
//     redirect("/admin/login");
//   }

//   const poll = await prisma.poll.findUnique({
//     where: { id: params.id },
//     include: {
//       options: {
//         select: {
//           id: true,
//           text: true,
//         },
//         orderBy: {
//           createdAt: 'asc',
//         },
//       },
//     },
//   });

//   if (!poll) {
//     notFound();
//   }

//   // Check permissions
//   const user = await prisma.user.findUnique({
//     where: { email: session.user.email },
//     select: { id: true, role: true },
//   });

//   if (
//     !user ||
//     (user.role !== "ADMIN" && poll.creatorId !== user.id)
//   ) {
//     redirect("/admin/polls");
//   }

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold text-gray-900">Edit Poll</h1>
//         <p className="text-sm text-gray-600 mt-1">
//           Update your poll details and options
//         </p>
//       </div>
      
//       <PollForm initialData={poll} />
//     </div>
//   );
// }

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import PollForm from "components/admin/PollForm";

export default async function EditPollPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: {
      options: {
        select: {
          id: true,
          text: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!poll) {
    notFound();
  }

  // Check permissions
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (
    !user ||
    (user.role !== "ADMIN" && poll.creatorId !== user.id)
  ) {
    redirect("/admin/polls");
  }

  // Transform the poll data to match PollForm expected structure
  const pollFormData = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    pollType: poll.pollType || 'FREE', // Add this line
    status: poll.status,
    endDate: poll.endDate,
    isFeatured: poll.isFeatured,
    options: poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
    })),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Poll</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update your poll details and options
        </p>
      </div>
      
      <PollForm initialData={pollFormData} />
    </div>
  );
}