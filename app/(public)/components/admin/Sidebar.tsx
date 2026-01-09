// app/(public)/components/admin/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Calendar,
  Vote,
  Users,
  Ticket,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'

interface SidebarProps {
  user: {
    email?: string | null
    name?: string | null
    role?: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  
  const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Polls & Contests', href: '/admin/polls', icon: Vote },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]
  
  const organizerNavItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Polls', href: '/admin/polls', icon: Vote },
    { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]
  
  const navItems = user.role === 'ADMIN' ? adminNavItems : organizerNavItems

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 mr-2"></div>
          <h2 className="text-lg font-bold text-gray-800">Tikky Admin</h2>
        </div>
        
        {/* User info */}
        <div className="px-4 py-4 mt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 truncate">
            {user.name || user.email}
          </p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            {user.role?.toLowerCase() || 'user'}
          </p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Sign out */}
        <div className="border-t border-gray-200 p-4">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 flex-shrink-0" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
