// import { getServerSession } from "next-auth"
// import { redirect } from "next/navigation"
// import { authOptions } from "lib/auth"
// import { prisma } from "lib/prisma"
// import UsersTable from "components/admin/UsersTable"
// import { Users as UsersIcon, Plus } from "lucide-react"
// import Link from "next/link"

// export default async function UsersPage() {
//   const session = await getServerSession(authOptions)
  
//   // Only ADMIN can access users management
//   if (!session || session.user.role !== "ADMIN") {
//     redirect("/login")
//   }

//   const users = await prisma.user.findMany({
//     select: {
//       id: true,
//       email: true,
//       name: true,
//       // ❌ REMOVED: password: true (NEVER select passwords!)
//       role: true,
//       // ❌ REMOVED: emailVerified: true (doesn't exist in schema)
//       image: true,
//       createdAt: true,
//       updatedAt: true,
//       _count: {
//         select: {
//           // ✅ FIXED: Use 'events' not 'orders' (orders doesn't exist)
//           events: true,
//           // ❌ REMOVED: tickets: true (no direct relation in schema)
//           // ❌ REMOVED: payments: true (no direct relation in schema)
//         }
//       }
//     },
//     orderBy: {
//       createdAt: "desc"
//     }
//   })

//   // Transform the data to match what UsersTable expects
//   const formattedUsers = users.map(user => ({
//     ...user,
//     // Add default values for fields that might be expected by UsersTable
//     _count: {
//       orders: 0, // Mock value since we don't have orders
//       tickets: 0, // Mock value since we don't have direct ticket relation
//       payments: 0 // Mock value since we don't have direct payment relation
//     }
//   }))

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
//             <UsersIcon className="w-6 h-6" />
//             Users Management
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Manage all users in the system
//           </p>
//         </div>
//         <Link 
//           href="/admin/users/create"
//           className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md transition-shadow"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Add User
//         </Link>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-white p-4 rounded-xl border border-gray-200">
//           <div className="text-sm text-gray-600">Total Users</div>
//           <div className="text-2xl font-bold text-gray-900">{users.length}</div>
//         </div>
//         <div className="bg-white p-4 rounded-xl border border-gray-200">
//           <div className="text-sm text-gray-600">Admins</div>
//           <div className="text-2xl font-bold text-purple-600">
//             {users.filter(u => u.role === "ADMIN").length}
//           </div>
//         </div>
//         <div className="bg-white p-4 rounded-xl border border-gray-200">
//           <div className="text-sm text-gray-600">Organizers</div>
//           <div className="text-2xl font-bold text-blue-600">
//             {users.filter(u => u.role === "ORGANIZER").length}
//           </div>
//         </div>
//         <div className="bg-white p-4 rounded-xl border border-gray-200">
//           <div className="text-sm text-gray-600">Regular Users</div>
//           <div className="text-2xl font-bold text-emerald-600">
//             {users.filter(u => u.role === "USER").length}
//           </div>
//         </div>
//       </div>

//       {/* Users Table */}
//       <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//         <UsersTable users={formattedUsers} />
//       </div>

//       {/* Note */}
//       <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
//         <p className="text-sm text-yellow-800">
//           💡 <span className="font-medium">Note:</span> As admin, you can promote users to admin/organizer roles or demote them.
//         </p>
//       </div>
//     </div>
//   )
// }

"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Search, Shield, UserX, UserCheck, Users } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
  status: "active" | "suspended";
  createdAt: string;
  eventsCount?: number;
   image?: string | null; 
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole as User["role"] } : user
        ));
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus as User["status"] } : user
        ));
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800";
      case "ORGANIZER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage users and their permissions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="USER">User</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Events Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center">
    <div className="h-10 w-10 flex-shrink-0">
      {user.image ? (
        <img
          src={user.image}
          alt={user.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-medium">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
    <div className="ml-4">
      <div className="text-sm font-medium text-gray-900">{user.name}</div>
      <div className="text-sm text-gray-500">{user.email}</div>
    </div>
  </div>
</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`text-sm rounded-full px-3 py-1 font-medium ${getRoleBadgeColor(user.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="USER">User</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.eventsCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`text-${
                      user.status === "active" ? "red" : "green"
                    }-600 hover:text-${
                      user.status === "active" ? "red" : "green"
                    }-900 mr-3`}
                    title={user.status === "active" ? "Suspend User" : "Activate User"}
                  >
                    {user.status === "active" ? (
                      <UserX className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}