import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { redirect, notFound } from "next/navigation";
import PollForm from "components/admin/PollForm";

export default async function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/admin/login");
  }

  const [poll, user] = await Promise.all([
    prisma.poll.findUnique({
      where: { id, deletedAt: null },
      include: {
        options: {
          select: { id: true, text: true, imageUrl: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    }),
  ]);

  if (!poll) notFound();

  if (!user || (user.role !== "ADMIN" && poll.createdById !== user.id)) {
    redirect("/admin/polls");
  }

  const pollFormData = {
    id: poll.id,
    title: poll.title,
    description: poll.description ?? undefined,
    status: poll.status,
    endDate: poll.endDate ? poll.endDate.toISOString() : null,
    eventId: poll.eventId ?? null,
    isFeatured: poll.isFeatured ?? false,
    votePrice: poll.votePrice ?? null,
    options: poll.options.map((opt) => ({ id: opt.id, text: opt.text, imageUrl: opt.imageUrl ?? null, })),
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Poll</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update your poll details and options
        </p>
      </div>
      <PollForm initialData={pollFormData} mode="edit" />
    </div>
  );
}