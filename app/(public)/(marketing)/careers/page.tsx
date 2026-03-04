// app/(public)/(marketing)/careers/page.tsx
import Link from 'next/link'
import { Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Users, Globe } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// OPEN ROLES
// When there are no openings, comment out the array below and
// uncomment the empty array on the next line instead.
// ─────────────────────────────────────────────────────────────

// const openRoles: typeof openRoles = [] // ← uncomment when no openings

const openRoles = [
//   {
//     title: 'Frontend Developer',
//     type: 'Full-time',
//     location: 'Monrovia, Liberia',
//     department: 'Engineering',
//   },
//   {
//     title: 'Community & Marketing Lead',
//     type: 'Full-time',
//     location: 'Monrovia, Liberia / Remote',
//     department: 'Marketing',
//   },
  // ── Unsolicited Application — always keep this one ──
  {
    title: 'Open Application',
    type: 'Any',
    location: 'Monrovia, Liberia / Remote',
    department: 'General',
  },
]

const perks = [
  { icon: Heart, title: 'Mission-Driven Work', desc: 'Help shape how Liberians experience events.' },
  { icon: Zap, title: 'Fast-Paced & Innovative', desc: 'Work on real problems with real impact from day one.' },
  { icon: Users, title: 'Collaborative Team', desc: 'A small, tight-knit team that values every voice.' },
  { icon: Globe, title: 'Flexible & Remote-Friendly', desc: 'Some roles offer hybrid or fully remote options.' },
]

const departmentColors: Record<string, string> = {
  Engineering: 'bg-blue-50 text-blue-700',
  Operations: 'bg-orange-50 text-orange-700',
  Marketing: 'bg-pink-50 text-pink-700',
  Support: 'bg-green-50 text-green-700',
  General: 'bg-purple-50 text-purple-700',
}

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-16 sm:py-24 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
            We're Hiring
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Build the Future of Events <br className="hidden sm:block" /> in Liberia
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-xl mx-auto mb-8">
            Join a passionate team on a mission to make events more accessible,
            exciting, and connected across Liberia.
          </p>
          <a
            href="#open-roles"
            className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold px-6 py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
          >
            See Open Roles <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 50C480 40 240 10 0 30Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* Why Tiky */}
      <section className="section-container py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Why Work at <span className="text-gradient">Tiky?</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            We're more than a ticketing platform — we're building community infrastructure for Liberia.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-brand-subtle/50 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-primary" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles */}
      <section id="open-roles" className="section-container py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Open <span className="text-gradient">Positions</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Don't see the right fit? Send us an open application at{' '}
            <a href="mailto:tikysupport@gmail.com" className="text-brand-primary hover:underline">
              tikysupport@gmail.com
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-3xl mx-auto">
          {openRoles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No open positions right now</p>
              <p className="text-sm text-gray-400">
                Check back soon or send an open application to{' '}
                <a href="mailto:tikysupport@gmail.com" className="text-brand-primary hover:underline">
                  tikysupport@gmail.com
                </a>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {openRoles.map((role) => (
                <div
                  key={role.title}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-brand-subtle/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-subtle/40 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{role.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${departmentColors[role.department]}`}>
                          {role.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {role.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {role.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/contact?subject=Application: ${encodeURIComponent(role.title)}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-accent active:scale-[0.98] transition-all shrink-0"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-container pb-14 sm:pb-20">
        <div className="bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl sm:rounded-3xl px-6 py-12 sm:px-12 sm:py-14 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Don't see your role listed?
            </h2>
            <p className="text-white/85 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              We're always looking for talented, passionate people. Reach out and tell us how you'd contribute to Tiky.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-primary font-bold px-7 py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all text-sm"
            >
              Get in Touch <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}