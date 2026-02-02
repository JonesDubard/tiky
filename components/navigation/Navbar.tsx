// components/navigation/Navbar.tsx - UPDATED with brand accent colors
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Ticket, User, Menu, X, ChevronRight } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = isAdmin
    ? [{ name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }]
    : [
        { name: 'Events', href: '/events', icon: Ticket },
        { name: 'Polls', href: '/polls', icon: Bell },
      ];

  const userEmail = session?.user?.email || '';
  const userDisplayName = session?.user?.name || userEmail.split('@')[0] || 'Account';

  // Desktop Navigation
  const DesktopNav = () => (
    <nav className={`hidden lg:flex fixed top-0 inset-x-0 z-50 h-20 items-center justify-between px-6 lg:px-8 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200/30' 
        : 'bg-gradient-to-b from-white to-white/80'
    }`}>
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
        <div className="relative w-[110px] h-[36px] overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-sm border border-slate-100 p-2.5 transition-all duration-300 hover:shadow-md hover:border-slate-200 hover:scale-[1.02] active:scale-[0.98]">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 to-brand-accent/0 group-hover:from-brand-primary/5 group-hover:to-brand-accent/5 transition-all duration-500 rounded-xl" />
          <Image 
            src="/Logo.jpg" 
            alt="Tiky Logo"
            fill
            priority    
            className="object-contain drop-shadow-sm" 
            sizes="(max-width: 110px) 100vw, 110px"
          />
        </div>
      </Link>

      {/* Navigation Links Container */}
      <div className="flex-1 flex items-center justify-center mx-8">
        <div className="flex items-center gap-1 bg-slate-100/50 rounded-2xl p-1.5 backdrop-blur-sm">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-white text-brand-primary shadow-md scale-105'
                  : 'text-slate-600 hover:text-brand-primary hover:bg-white/50'
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* User Actions - Right side */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {!isAdmin && (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-lg transition-all duration-200 hover:gap-3 group"
          >
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              {session ? userDisplayName : 'Login'}
            </span>
            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </Link>
        )}
      </div>
    </nav>
  );

  // Mobile Top Bar with brand accent colors
  const MobileTopBar = () => (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-16 bg-gradient-to-b from-white to-white/95 backdrop-blur-lg border-b border-slate-200/30 px-4 flex items-center justify-between">
        {/* Hamburger Menu - Using text-brand-accent */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-slate-100/50 hover:bg-slate-200/50 active:scale-95 transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-brand-accent" />
        </button>
        
        {/* Mobile Logo */}
        <Link href="/" className="flex items-center justify-center">
          <div className="relative w-[100px] h-[32px] overflow-hidden rounded-lg bg-white p-2 shadow-sm">
            <Image 
              src="/Logo.jpg" 
              alt="Tiky Logo"
              fill
              className="object-contain" 
              sizes="(max-width: 100px) 100vw, 100px"
            />
          </div>
        </Link>
        
        {/* Profile Icon/Card - Using brand accent colors */}
        {!isAdmin && (
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center transition-transform hover:scale-110 shadow-sm hover:shadow-md"
            aria-label="Profile"
          >
            <User className="w-4 h-4 text-white" />
          </Link>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 w-80 h-full bg-white shadow-2xl transform transition-all duration-500 ease-out ${
        mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}>
        <div className="p-6 border-b border-slate-200/30">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="relative w-[100px] h-[32px] overflow-hidden rounded-lg bg-white p-2 border border-slate-200">
                <Image 
                  src="/Logo.jpg" 
                  alt="Tiky Logo"
                  fill
                  className="object-contain" 
                  sizes="(max-width: 100px) 100vw, 100px"
                />
              </div>
            </div>
            {/* Close button with brand accent */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100/50 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-brand-accent" />
            </button>
          </div>
          
          {/* User Info with brand colors */}
          {session && (
            <div className="mb-4 p-3 bg-slate-100/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-slate-900">{userDisplayName}</div>
                  <div className="text-sm text-slate-500">{userEmail}</div>
                  {isAdmin && (
                    <div className="inline-block mt-1 text-xs bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full">
                      Admin
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile Search */}
          {/* <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="search"
              placeholder="Search events..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100/50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 transition-all"
              onChange={(e) => {
                router.push(`/home?search=${encodeURIComponent(e.target.value)}`);
              }}
            />
          </div> */}
        </div>

        <div className="p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-100/50 transition-all duration-200 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${
                  pathname === link.href ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-accent/10'
                }`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className={`font-medium transition-colors ${
                  pathname === link.href ? 'text-brand-primary' : 'text-slate-700 group-hover:text-brand-accent'
                }`}>
                  {link.name}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-accent transition-colors" />
            </Link>
          ))}
          
          {/* Login/Logout - Using brand colors */}
          <div className="pt-4 border-t border-slate-200/30">
            {session ? (
              <Link
                href="/api/auth/signout"
                className="flex items-center justify-between p-4 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <span className="text-sm font-medium">Sign Out</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-100/50 transition-all duration-200 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 text-brand-accent group-hover:from-brand-primary/20 group-hover:to-brand-accent/20">
                    <span className="font-medium">Login</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-accent transition-colors" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Mobile Bottom Navigation - Updated with brand colors
  const MobileBottomNav = () => (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-20 bg-gradient-to-t from-white to-white/95 backdrop-blur-lg border-t border-slate-200/30 shadow-2xl">
      <div className="flex justify-around items-center h-full px-6">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              pathname === link.href
                ? 'bg-gradient-to-r from-brand-primary to-brand-accent text-white shadow-lg'
                : 'text-slate-500 hover:text-brand-accent active:bg-slate-100/50'
            }`}
          >
            <link.icon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">{link.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <DesktopNav />
      <MobileTopBar />
      <MobileBottomNav />
      {/* Spacers for fixed navs */}
      <div className="lg:hidden h-16" />
      <div className="hidden lg:block h-20" />
      <div className="lg:hidden h-20" />
    </>
  );
}
