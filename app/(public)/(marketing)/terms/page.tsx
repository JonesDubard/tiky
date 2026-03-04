// app/(public)/(marketing)/terms/page.tsx
import Link from 'next/link'

const LAST_UPDATED = 'January 1, 2025'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Tiky, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our platform.

[Client to review and confirm acceptance conditions]`,
  },
  {
    title: '2. Use of the Platform',
    content: `You may use Tiky solely for lawful purposes and in accordance with these Terms. You agree not to:

• Use the platform in any way that violates applicable laws or regulations
• Attempt to gain unauthorized access to any part of the platform
• Submit false or misleading information
• Use automated tools to scrape or extract data from the platform
• Resell or transfer your account to another person

[Client to add any additional use restrictions]`,
  },
  {
    title: '3. Account Registration',
    content: `To purchase tickets or create events, you must register for an account. You are responsible for:

• Maintaining the confidentiality of your login credentials
• All activity that occurs under your account
• Ensuring that your account information is accurate and up to date

Tiky reserves the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Ticket Purchases',
    content: `All ticket sales are final unless the event is cancelled or significantly changed by the organizer. By purchasing a ticket, you agree to:

• Pay the full amount listed at checkout, including any applicable fees
• Comply with the event organizer's rules and policies
• Not resell tickets for profit without explicit permission from the organizer

[Client to confirm refund and cancellation policies]`,
  },
  {
    title: '5. Event Organizers',
    content: `Organizers who list events on Tiky agree to:

• Provide accurate event information
• Honor all tickets sold through the platform
• Comply with all applicable laws and regulations
• Notify Tiky and ticket holders promptly of any event changes or cancellations

Tiky is not responsible for the actions or omissions of event organizers.

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
    content: `To the fullest extent permitted by law, Tiky shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform or attendance at any event.

`,
  },
  {
    title: '9. Termination',
    content: `We reserve the right to suspend or terminate your access to Tiky at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, third parties, or the interests of Tiky.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We may update these Terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the new Terms. We will notify users of material changes via email or a notice on the platform.`,
  },
  {
    title: '11. Governing Law',
    content: `These Terms are governed by the laws of the Republic of Liberia. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Liberia.

[Client to confirm governing jurisdiction with legal counsel]`,
  },
  {
    title: '12. Contact Us',
    content: `If you have questions about these Terms, please contact us at:

Tiky 
Brewerville, Liberia
tikysupport@gmail.com
+231 77 796 5641`,
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