import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "lib/prisma";
import Sidebar from "app/(public)/components/admin/Sidebar";
import { authOptions } from "lib/auth";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const userEmail = session.user.email;
if (!userEmail) {
  redirect("/admin/login");
}

const user = await prisma.user.findUnique({
  where: { email: userEmail }, // Now it's definitely a string
  select: { 
    role: true,
    name: true,
    email: true 
  }
});

  if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar user={user} />
      
      {/* Main Content - adjusted padding for new sidebar width (w-56 = 14rem/224px) */}
      <div className="md:pl-56 min-h-screen">
        <div className="p-4 md:p-6 pt-20 md:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

