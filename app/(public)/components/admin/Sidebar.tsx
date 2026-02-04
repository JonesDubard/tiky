// app/(public)/components/admin/Sidebar.tsx - FIXED MOBILE VERSION
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Menu,
  X,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  user: {
    email?: string | null
    name?: string | null
    role?: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
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
  
  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 mr-2"></div>
            <h2 className="text-lg font-bold text-gray-800">Tikky Admin</h2>
          </div>
          
          <div className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
            {user.name?.split(' ')[0] || user.email?.split('@')[0]}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
  ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0 transform transition-transform duration-300 ease-in-out
  fixed md:fixed z-40
  w-64 h-screen
  bg-white border-r border-gray-200
  flex-shrink-0 overflow-y-auto
`}>
        {/* Desktop Logo */}
        <div className="hidden md:flex items-center flex-shrink-0 px-4 pt-5 mb-8">
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 mr-2"></div>
            <h2 className="text-lg font-bold text-gray-800">Tikky Admin</h2>
          </Link>
        </div>
        
        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-200 mt-8 md:mt-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {user.name || user.email}
          </p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            {user.role?.toLowerCase() || 'user'}
          </p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 pb-4 space-y-1 mt-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
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
          <button
            onClick={() => {
              handleSignOut()
              setMobileMenuOpen(false)
            }}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile Spacer */}
      <div className="md:hidden h-16"></div>
    </>
  )
}