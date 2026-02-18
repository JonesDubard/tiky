// 
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import PaymentsClient from "./PaymentsClient";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Get summary stats
  const stats = await prisma.$transaction([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" }
    }),
    prisma.payment.count({ where: { status: "COMPLETED" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
  ]);

  const [totalRevenue, completed, pending, failed] = stats;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-1">View and manage all transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalRevenue._sum.amount?.toFixed(2) || "0.00"}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">{completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">{failed}</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <PaymentsClient />
      </div>
    </div>
  );
}