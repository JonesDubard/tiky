import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import TicketsClient from "./TicketsClients";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get summary stats
  const stats = await prisma.$transaction([
    prisma.ticketInstance.count(),
    prisma.ticketInstance.count({ where: { status: "PAID" } }),
    prisma.ticketInstance.count({ where: { status: "USED" } }),
    prisma.ticketInstance.count({ where: { status: "CANCELLED" } }),
  ]);

  const [total, paid, used, cancelled] = stats;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
        <p className="text-gray-600 mt-1">View and manage all ticket sales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-green-600">{paid}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Used</div>
          <div className="text-2xl font-bold text-blue-600">{used}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{cancelled}</div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <TicketsClient />
      </div>
    </div>
  );
}