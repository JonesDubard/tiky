// app/(public)/components/Footer.tsx
import Link from 'next/link'
import { Ticket, Vote } from 'lucide-react'
import Image from 'next/image'

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="p-2 rounded-lg bg-brand-subtle/30 text-slate-500 hover:text-brand-primary hover:bg-brand-subtle/60 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {children}
      </svg>
    </a>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-white to-brand-subtle/20 border-t border-brand-subtle/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">

          {/* Brand — full width on smallest screens */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block mb-3">
              <div className="relative w-[90px] h-[30px] overflow-hidden rounded-lg bg-white border border-slate-100 shadow-sm p-2">
                <Image
                  src="/Logo.jpg"
                  alt="Tiky Logo"
                  fill
                  priority
                  className="object-contain"
                  sizes="90px"
                />
              </div>
            </Link>
            <p className="text-slate-500 text-xs mb-4 max-w-[180px]">
              Discover events. Vote in polls. Secure tickets.
            </p>
            <div className="flex gap-3">
              <SocialLink href="https://facebook.com" label="Facebook">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </SocialLink>
              <SocialLink href="https://twitter.com" label="X">
                <path d="M4 4l16 16M20 4 4 20" strokeLinecap="round" />
              </SocialLink>
              <SocialLink href="https://instagram.com" label="Instagram">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </SocialLink>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Explore</h3>
            <ul className="space-y-2">
              {[
                { href: '/events', label: 'Events', icon: Ticket },
                { href: '/polls', label: 'Polls', icon: Vote },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-primary transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Company</h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
                { href: '/blog', label: 'Blog' },
                { href: '/careers', label: 'Careers' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 hover:text-brand-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Legal</h3>
            <ul className="space-y-2">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/cookies', label: 'Cookie and Refund Policy' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 hover:text-brand-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-brand-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>© {currentYear} Tiky. All rights reserved.</span>
          <span className="hidden sm:block">Made with ♥ in Liberia</span>
        </div>

      </div>

      {/* Spacer so footer clears the mobile bottom nav (h-20) */}
      <div className="lg:hidden h-20" />
    </footer>
  )
}