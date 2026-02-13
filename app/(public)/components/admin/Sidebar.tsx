// app/(public)/components/admin/Sidebar.tsx
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
    { name: 'Polls', href: '/admin/polls', icon: Vote },
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
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
          
          <div className="flex items-center">
            <div 
              className="w-8 h-8 rounded-lg mr-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            ></div>
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

      {/* Sidebar - REDUCED WIDTH from 64 to 56 */}
      <div className={`
        fixed z-40 w-56 h-screen bg-white border-r border-gray-200 overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        top-0 left-0
      `}>
        {/* Logo */}
        <div className="flex items-center px-4 py-5">
          <div 
            className="w-8 h-8 rounded-lg mr-2 flex-shrink-0"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          ></div>
          <h2 className="text-lg font-bold text-gray-800 truncate">Tikky</h2>
        </div>
        
        {/* User info - condensed */}
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 truncate">
            {user.name || user.email}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {user.role?.toLowerCase() || 'user'}
          </p>
        </div>
        
        {/* Navigation - compact */}
        <nav className="px-2 py-2 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-subtle text-brand-primary'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-4 w-4 flex-shrink-0 ${
                    isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Sign out */}
        <div className="border-t border-gray-200 p-3 mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile Spacer */}
      <div className="md:hidden h-16"></div>
    </>
  )
}