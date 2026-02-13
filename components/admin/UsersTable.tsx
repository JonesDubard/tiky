'use client';

import { useState } from 'react';
import { MoreVertical, Shield, UserCog, Trash2, Edit, Users } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    events: number;
    orders?: number;
    tickets?: number;
    payments?: number;
  };
}

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">User</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Role</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Joined</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Events</th>
            <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800'
                    : user.role === 'ORGANIZER'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-4 px-6 text-sm text-gray-600">
                {user._count?.events || 0}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-500">There are no users in the system yet.</p>
        </div>
      )}
    </div>
  );
}