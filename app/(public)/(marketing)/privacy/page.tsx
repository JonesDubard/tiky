// app/(public)/(marketing)/privacy/page.tsx
import Link from 'next/link'

const LAST_UPDATED = 'March 4, 2026'

const sections = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly to us, such as when you create an account, purchase tickets, or contact us for support.

This may include:
• Name and email address
• Phone number
• Payment information (processed securely via third-party providers)
• Event preferences and ticket purchase history
• Device and usage information when you access our platform

[Client to provide full details on data collection practices]`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use the information we collect to:

• Process ticket purchases and send confirmations
• Send event reminders and updates you have requested
• Provide customer support
• Improve and personalise your experience on Tiky
• Comply with legal obligations
• Send promotional communications (you may opt out at any time)

[Client to provide full details on data usage]`,
  },
  {
    title: '3. Sharing of Information',
    content: `We do not sell your personal information. We may share your information with:

• Event organizers, solely for the purpose of managing your attendance
• Payment processors to complete transactions
• Service providers who assist in operating our platform
• Law enforcement or government agencies when required by law

[Client to provide full details on data sharing]`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide our services. You may request deletion of your data at any time by contacting us.

[Client to provide specific retention periods and deletion policies]`,
  },
  {
    title: '5. Security',
    content: `We take reasonable measures to protect your personal information from unauthorized access, loss, or misuse. All payment data is handled by PCI-compliant third-party processors.

[Client to provide specific security certifications or practices]`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate data
• Request deletion of your data
• Opt out of marketing communications
• Lodge a complaint with a data protection authority

To exercise any of these rights, please contact us at tikysupport@gmail.com.`,
  },
  {
    title: '7. Cookies',
    content: `We use cookies and similar tracking technologies to improve your experience. For full details, please see our Cookie Policy.`,
  },
  {
    title: '8. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our platform. Your continued use of Tiky after changes take effect constitutes your acceptance of the updated policy.`,
  },
  {
    title: '9. Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us at:

Tiky 
Brewerville, Liberia
tikysupport@gmail.com
+231 77 796 5641`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-white/75 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40L1440 40L1440 0C1200 25 960 40 720 32C480 25 240 8 0 20Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      <section className="section-container py-10 sm:py-14">
        <div className="max-w-3xl mx-auto">
          {/* Intro */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">
              At Tiky, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, and protect your personal information when you use our platform. Please read this
              policy carefully. By using Tiky, you agree to the practices described below.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link href="/terms" className="text-brand-primary hover:underline">Terms of Service →</Link>
              <Link href="/cookies" className="text-brand-primary hover:underline">Cookie Policy →</Link>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-base font-bold text-gray-900 mb-3">{s.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>

          {/* Back */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-brand-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </section>
    </main>
  )
}