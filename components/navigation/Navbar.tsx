// components/navigation/Navbar.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Ticket, User, Menu, X, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const navLinks = isAdmin
    ? [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Events', href: '/admin/events', icon: Ticket },
        { name: 'Polls', href: '/admin/polls', icon: Bell },
      ]
    : [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'Events', href: '/events', icon: Ticket },
        { name: 'Polls', href: '/polls', icon: Bell },
      ];

  const userEmail = session?.user?.email || '';
  const userDisplayName = session?.user?.name || userEmail.split('@')[0] || 'Account';

  // Sliding pill indicator for desktop nav
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeEl) {
      setActiveIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    }
  }, [pathname]);

  const DesktopNav = () => (
    <nav className={`hidden lg:flex fixed top-0 inset-x-0 z-50 h-20 items-center justify-between px-6 lg:px-8 transition-all duration-500 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200/30'
        : 'bg-gradient-to-b from-white to-white/80'
    }`}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
        <div className="relative w-[110px] h-[36px] overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-sm border border-slate-100 p-2.5 transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.03]">
          <Image src="/Logo.jpg" alt="Tiky Logo" fill priority className="object-contain drop-shadow-sm" sizes="110px" />
        </div>
      </Link>

      {/* Nav Links with sliding pill */}
      <div className="flex-1 flex items-center justify-center mx-8">
        <div ref={navRef} className="relative flex items-center gap-1 bg-slate-100/70 rounded-2xl p-1.5 backdrop-blur-sm">
          {/* Sliding background pill */}
          <span
            className="absolute top-1.5 h-[calc(100%-12px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out pointer-events-none"
            style={{ left: activeIndicator.left, width: activeIndicator.width }}
          />
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                data-active={isActive}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-brand-primary'
                    : 'text-slate-600 hover:text-brand-primary'
                }`}
              >
                <link.icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="whitespace-nowrap">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {session ? (
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-sm"
              >
                Admin
              </Link>
            )}
            <Link
              href={isAdmin ? "/admin" : "/profile"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{isAdmin ? "Dashboard" : userDisplayName}</span>
              <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Login</span>
            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
        )}
      </div>
    </nav>
  );

  const MobileTopBar = () => (
    <>
      <div className={`lg:hidden fixed top-0 inset-x-0 z-40 h-16 px-4 flex items-center justify-between transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-md border-b border-slate-200/30' : 'bg-white border-b border-slate-100'
      }`}>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 active:scale-90 transition-all duration-150"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <Link href="/" className="flex items-center justify-center">
          <div className="relative w-[90px] h-[30px] overflow-hidden rounded-lg bg-white p-1.5 shadow-sm border border-slate-100">
            <Image src="/Logo.jpg" alt="Tiky Logo" fill className="object-contain" sizes="90px" />
          </div>
        </Link>

        {isAdmin ? (
          <Link href="/admin" className="text-xs font-semibold px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg active:scale-95 transition-transform">
            Admin
          </Link>
        ) : session ? (
          <Link href="/profile" className="p-2 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent active:scale-90 transition-transform">
            <User className="w-4 h-4 text-white" />
          </Link>
        ) : (
          <Link href="/login" className="text-xs font-semibold px-3 py-1.5 bg-brand-primary text-white rounded-lg active:scale-95 transition-transform">
            Login
          </Link>
        )}
      </div>

      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 w-[300px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-[90px] h-[30px] overflow-hidden rounded-lg bg-white p-1.5 border border-slate-200">
              <Image src="/Logo.jpg" alt="Tiky Logo" fill className="object-contain" sizes="90px" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {session && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-sm shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{userDisplayName}</div>
                  <div className="text-xs text-slate-500 truncate">{userEmail}</div>
                  {isAdmin && (
                    <span className="inline-block mt-0.5 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 active:scale-[0.98] transition-all mb-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-semibold text-purple-700">Admin Dashboard</span>
              <ChevronRight className="w-4 h-4 text-purple-400 ml-auto" />
            </Link>
          )}

          {navLinks.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-brand-primary/8 border border-brand-primary/20'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-brand-primary/15 text-brand-primary' : 'bg-slate-100 text-slate-500'
                }`}>
                  <link.icon className="w-4 h-4" />
                </div>
                <span className={`font-medium text-sm ${isActive ? 'text-brand-primary' : 'text-slate-700'}`}>
                  {link.name}
                </span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />}
                {!isActive && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />}
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100">
          {session ? (
            <Link
              href="/api/auth/signout"
              className="flex items-center justify-between w-full p-3.5 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="font-medium text-sm text-red-500">Sign Out</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-400 transition-colors" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold text-sm active:scale-[0.98] transition-transform"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-4 h-4" />
              Login to your account
            </Link>
          )}
        </div>
      </div>
    </>
  );

  const MobileBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/50 shadow-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200 active:scale-90"
            >
              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-brand-primary" />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-brand-primary to-brand-accent shadow-md shadow-brand-primary/30 scale-110'
                  : 'text-slate-400'
              }`}>
                <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-primary' : 'text-slate-400'
              }`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-safe-area-inset-bottom bg-white/95" />
    </nav>
  );

  return (
    <>
      <DesktopNav />
      <MobileTopBar />
      <MobileBottomNav />
      <div className="lg:hidden h-16" />
      <div className="hidden lg:block h-20" />
      <div className="lg:hidden h-16" />
    </>
  );
}