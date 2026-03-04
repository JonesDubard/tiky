// app/(public)/(marketing)/cookies/page.tsx
import Link from 'next/link'

const LAST_UPDATED = 'January 1, 2025'

const cookieTypes = [
  {
    name: 'Strictly Necessary',
    badge: 'Always Active',
    badgeColor: 'bg-green-100 text-green-700',
    desc: 'These cookies are essential for the platform to function. They enable core features such as security, session management, and account authentication. You cannot opt out of these cookies.',
    examples: 'Session tokens, CSRF protection cookies, authentication cookies.',
  },
  {
    name: 'Functional',
    badge: 'Optional',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'These cookies allow us to remember your preferences and personalise your experience, such as your language or region settings.',
    examples: 'Language preference, timezone, display settings.',
  },
  {
    name: 'Analytics',
    badge: 'Optional',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    desc: 'We use analytics cookies to understand how visitors interact with the platform so we can improve it. All data is aggregated and anonymous.',
    examples: 'Page views, session duration, referral source.',
  },
  {
    name: 'Marketing',
    badge: 'Optional',
    badgeColor: 'bg-pink-100 text-pink-700',
    desc: 'These cookies may be used to deliver advertisements relevant to you and your interests. We do not currently run advertising campaigns but may do so in the future.',
    examples: 'Ad targeting, retargeting pixels.',
  },
]

const sections = [
  {
    title: 'What Are Cookies?',
    content: `Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site.

Tiky uses cookies and similar technologies such as local storage and session storage to provide, improve, and secure our platform.`,
  },
  {
    title: 'How We Use Cookies',
    content: `We use cookies for the following purposes:

• To keep you logged in to your Tiky account
• To remember your preferences across sessions
• To protect your account and prevent fraud
• To analyse how our platform is used so we can improve it
• To deliver relevant content and promotions

`,
  },
  {
    title: 'Third-Party Cookies',
    content: `Some cookies are set by third-party services that appear on our platform. These include:

• Payment processors (e.g. MTN MoMo integration)
• Analytics providers
• Embedded content providers

These third parties have their own privacy policies and we encourage you to review them.

`,
  },
  {
    title: 'Managing Your Cookie Preferences',
    content: `You can control cookies through your browser settings. Most browsers allow you to:

• View what cookies are stored
• Delete cookies individually or all at once
• Block cookies from specific or all websites

Please note that disabling certain cookies may affect the functionality of Tiky.

`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Cookie Policy from time to time. We will notify you of any significant changes by posting a notice on our platform. Your continued use of Tiky after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: 'Contact Us',
    content: `If you have questions about our use of cookies, please contact us at:

Tiky 
Brewerville, Liberia
tikysupport@gmail.com
+231 77 796 5641`,
  },
]

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-white/75 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40L1440 40L1440 0C1200 25 960 40 720 32C480 25 240 8 0 20Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      <section className="section-container py-10 sm:py-14">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Intro */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <p className="text-gray-600 text-sm leading-relaxed">
              This Cookie Policy explains how Tiky uses cookies and similar technologies when you
              visit our platform. It describes what these technologies are, why we use them, and
              your rights to control their use.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Policy →</Link>
              <Link href="/terms" className="text-brand-primary hover:underline">Terms of Service →</Link>
            </div>
          </div>

          {/* Cookie types table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-base font-bold text-gray-900 mb-5">Types of Cookies We Use</h2>
            <div className="space-y-5">
              {cookieTypes.map((c) => (
                <div key={c.name} className="pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold text-gray-800">{c.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badgeColor}`}>
                      {c.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-1">{c.desc}</p>
                  <p className="text-xs text-gray-400 italic">Examples: {c.examples}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sections */}
          {sections.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-bold text-gray-900 mb-3">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}

          {/* Back */}
          <div className="mt-2 text-center">
            <Link href="/" className="text-sm text-brand-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}