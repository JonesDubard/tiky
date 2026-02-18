import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import AnalyticsClient from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your platform's performance and growth</p>
      </div>

      {/* Analytics Client Component */}
      <AnalyticsClient />
    </div>
  );
}