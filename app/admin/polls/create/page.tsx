import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PollForm from "components/admin/PollForm";

export default async function CreatePollPage() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Poll</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create a poll to engage your audience
        </p>
      </div>
      
      <PollForm />
    </div>
  );
}