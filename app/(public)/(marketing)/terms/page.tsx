// app/(public)/(marketing)/terms/page.tsx
import Link from 'next/link'

const LAST_UPDATED = 'March 28, 2026'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Tiky, you agree to comply with these Terms of Service. 
If you do not agree with these terms, you should not use the platform.`,
  },
  {
    title: '2. Platform Description and Use',
    content: `Tiky provides a platform where:

• Event organizers can create and promote events
• Users can discover events and purchase tickets
• Tiky acts as a technology platform and intermediary between event organizers and attendees.`,
  },
  {
    title: '3. User Accounts ',
    content: `Users must:

• Provide accurate information
• Maintain the confidentiality of their login credentials
• Be responsible for all activity under their account

Tiky reserves the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Ticket Purchases',
    content: `When purchasing tickets: 

• You agree to pay the listed price and applicable service fees
• Tickets may be digital or QR-code based
• Tickets may not be duplicated or resold unless permitted`,
  },
  {
    title: '5. Event Organizers',
    content: `Event organizers are responsible for:

• Accurate event descriptions
• Honoring valid tickets
• Managing event logistics
• Handling refunds where applicable 

Tiky is not responsible for event cancellations, venue issues, or organizer misconduct.

`,
  },
  {
    title: '6. Payments',
    content: `Payments on Tiky are processed by third-party payment providers. By making a purchase, you agree to their terms of service as well. Tiky does not store your full payment details.

`,
  },
  {
    title: '7. Intellectual Property',
    content: `All content on the Tiky platform, including logos, text, graphics, and software, is owned by or licensed to Tiky and is protected by applicable intellectual property laws. You may not reproduce or distribute any content without our written permission.`,
  },
  {
    title: '8. Limitation of Liability',
    content: ` Tiky is not liable for: 
    
  • Event cancellations
  • Changes to event schedules
  • Venue conditions
  • Organizer disputes

  Responsibility for events remains with the event organizer.`,
  },
  {
    title: '9. Termination',
    content: `We may suspend or terminate accounts that violate these terms or harm the platform.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the new Terms. We will notify users of material changes via email or a notice on the platform.`,
  },
  {
    title: '11. Governing Law',
    content: `These terms are governed by the laws of Liberia.`,
  },
  {
    title: '12. Contact Us',
    content: `If you have questions about these Terms, please contact us at:

Tiky Support
tikyliberia@gmail.com`,
  },
]

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="section-container relative text-center text-white">
          <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
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
              These Terms of Service govern your use of the Tiky platform. Please read them carefully
              before using our services. These terms apply to all users including event attendees,
              organizers, and administrators.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <Link href="/privacy" className="text-brand-primary hover:underline">Privacy Policy →</Link>
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