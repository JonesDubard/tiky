import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your application settings</p>
      </div>

      {/* Settings Client Component */}
      <SettingsClient />
    </div>
  );
}