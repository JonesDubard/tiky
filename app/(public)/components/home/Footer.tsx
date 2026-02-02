// app/(public)/components/Footer.tsx - UPDATED with Logo
import Link from 'next/link'
import { Ticket, Vote, Calendar, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-20 bg-gradient-to-b from-white to-brand-subtle/20 border-t border-brand-subtle/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand with Logo */}
          <div>
            <div className="flex items-center gap-3 mb-6 group">
              {/* Logo Container */}
              <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
                <div className="relative w-[110px] h-[36px] overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 shadow-sm border border-slate-100 p-2.5 transition-all duration-300 hover:shadow-md hover:border-slate-200 hover:scale-[1.02]">
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
              {/* Optional text beside logo */}
              <span className="text-xl font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block">
                Tiky
              </span>
            </div>
            
            <p className="text-slate-600 text-sm mb-6">
              Discover events. Vote in polls. Secure tickets.
            </p>
            
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-brand-subtle/30 text-slate-600 hover:text-brand-primary hover:bg-brand-subtle/50 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-brand-subtle/30 text-slate-600 hover:text-brand-primary hover:bg-brand-subtle/50 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-brand-subtle/30 text-slate-600 hover:text-brand-primary hover:bg-brand-subtle/50 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/events" className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors group">
                  <Ticket className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Events
                </Link>
              </li>
              <li>
                <Link href="/polls" className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors group">
                  <Vote className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Polls
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors group">
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/locations" className="flex items-center gap-2 text-slate-600 hover:text-brand-primary transition-colors group">
                  <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Partners</h3>
            <div className="grid grid-cols-2 gap-3">
              {["TechCorp", "EventPro", "SparkEvents", "VenueMaster"].map((partner) => (
                <div 
                  key={partner}
                  className="p-3 bg-white rounded-lg border border-brand-subtle/30 text-center text-sm font-medium text-slate-700 hover:border-brand-primary/30 hover:shadow-sm transition-all duration-200 cursor-default"
                  title={partner}
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-slate-600 hover:text-brand-primary transition-colors hover:pl-2 duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-600 hover:text-brand-primary transition-colors hover:pl-2 duration-200">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-slate-600 hover:text-brand-primary transition-colors hover:pl-2 duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-slate-600 hover:text-brand-primary transition-colors hover:pl-2 duration-200">
                  Careers
                </Link>
              </li>
            </ul>
            
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-brand-subtle/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Small logo in copyright */}
              <div className="relative w-[60px] h-[20px] overflow-hidden rounded-lg bg-white p-1.5 border border-slate-100">
                <Image 
                  src="/Logo.jpg" 
                  alt="Tiky Logo"
                  fill
                  className="object-contain" 
                  sizes="(max-width: 60px) 100vw, 60px"
                />
              </div>
              <div className="text-slate-600 text-sm">
                © {currentYear} Tiky. All rights reserved.
              </div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-slate-600 hover:text-brand-primary transition-colors hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-600 hover:text-brand-primary transition-colors hover:underline">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-slate-600 hover:text-brand-primary transition-colors hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}