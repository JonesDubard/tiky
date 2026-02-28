import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import ArchivedPollsClient from "./ArchivedPollsClient";

export default async function ArchivedPollsPage() {
  const session = await getServerSession();

  if (!session?.user?.email) return <div>Unauthorized</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) return <div>Unauthorized</div>;

  const archivedPolls = await prisma.poll.findMany({
    where: {
      deletedAt: { not: null },
      ...(user.role !== "ADMIN" && { createdById: user.id }),
    },
    orderBy: { deletedAt: "desc" },
    select: { id: true, title: true, deletedAt: true }, // only pass needed fields
  });

  // Pass data to client component
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Archived Polls</h1>
      <ArchivedPollsClient initialPolls={archivedPolls} />
    </div>
  );
}
