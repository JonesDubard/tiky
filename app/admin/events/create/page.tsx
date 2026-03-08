import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import EventForm from "components/admin/EventForm";

export default async function CreateEventPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create a new event. Set Published = ON to show on homepage.
        </p>
      </div>
      
      <EventForm />
    </div>
  );
}