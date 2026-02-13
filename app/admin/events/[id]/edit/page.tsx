import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import EventForm from "components/admin/EventForm";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/admin/login");
  }
  
  // Fetch event data
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      ticketTypes: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          description: true,
          maxPerOrder: true,
          salesStart: true,
          salesEnd: true,
        },
      },
    },
  });

  if (!event) {
    redirect("/admin/events");
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update your event details and ticket information
        </p>
      </div>
      
      {/* Pass the event data as initialData prop */}
      <EventForm initialData={event} />
    </div>
  );
}