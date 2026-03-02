'use client'

// app/(public)/components/admin/Sidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Calendar, Vote, Users, Ticket, CreditCard,
  BarChart3, Settings, LogOut, Menu, X, ShoppingBag,
  ScanLine, Crown,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface SidebarProps {
  user: {
    email?: string | null
    name?: string | null
    role?: string
  }
}

const ADMIN_NAV = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Polls', href: '/admin/polls', icon: Vote },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Validate', href: '/admin/tickets/validate', icon: ScanLine, sub: true },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const ORGANIZER_NAV = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'My Events', href: '/admin/events', icon: Calendar },
  { name: 'My Polls', href: '/admin/polls', icon: Vote },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Validate', href: '/admin/tickets/validate', icon: ScanLine, sub: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function Sidebar({ user }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = user.role === 'ADMIN'
  const navItems = isAdmin ? ADMIN_NAV : ORGANIZER_NAV

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const isActive = (href: string) => {
    if (href === '/admin/tickets/validate') return pathname === href
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href + '/') || pathname === href
  }

  const NavLinks = () => (
    <nav className="px-2 py-2 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.sub ? 'ml-4' : ''
            } ${
              active
                ? 'bg-brand-subtle text-brand-primary'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${
              active ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-500'
            }`} />
            <span className="truncate">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )

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
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>

          {/* Mobile logo — clickable */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg mr-2" style={{ backgroundColor: 'var(--brand-primary)' }} />
            <h2 className="text-lg font-bold text-gray-800">Tiky</h2>
          </Link>

          <div className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
            {user.name?.split(' ')[0] || user.email?.split('@')[0]}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed z-40 w-56 h-screen bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 top-0 left-0
      `}>
        {/* Logo — clickable, goes to public home */}
        <Link
          href="/"
          className="flex items-center px-4 py-5 hover:bg-gray-50 transition-colors group"
        >
          <div
            className="w-8 h-8 rounded-lg mr-2 flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          />
          <h2 className="text-lg font-bold text-gray-800 truncate">Tiky</h2>
        </Link>

        {/* User info with role badge */}
        <div className="px-4 py-3 border-t border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 truncate">
            {user.name || user.email}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isAdmin && <Crown className="w-3 h-3 text-orange-500" />}
            <p className={`text-xs font-semibold capitalize ${
              isAdmin ? 'text-orange-600' : 'text-blue-600'
            }`}>
              {user.role?.toLowerCase() || 'user'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>

        {/* Sign out */}
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile spacer */}
      <div className="md:hidden h-16" />
    </>
  )
}