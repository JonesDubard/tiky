// app/(public)/(marketing)/contact/page.tsx
'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react'

const socials = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/tiky',
    letter: 'F',
    color: 'hover:bg-blue-600',
  },
  {
    label: 'X',
    href: 'https://twitter.com/tiky',
    letter: 'X',
    color: 'hover:bg-slate-800',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/tiky',
    letter: 'IG',
    color: 'hover:bg-pink-600',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/tiky',
    letter: 'in',
    color: 'hover:bg-blue-700',
  },
]

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    primary: 'tikysupport@gmail.com',
    href: 'mailto:tikysupport@gmail.com',
    secondary: null,
  },
  {
    icon: Phone,
    label: 'Phone',
    primary: '+231 77 796 5641',
    href: 'tel:+231777965641',
    secondary: 'Mon–Fri, 9am–6pm',
  },
  {
    icon: MapPin,
    label: 'Office',
    primary: 'Brewerville, Liberia',
    href: null,
    secondary: 'By appointment only',
  },
  {
    icon: Clock,
    label: 'Hours',
    primary: 'Mon–Fri: 9am – 6pm',
    href: null,
    secondary: 'Sat: 10am – 4pm · Sun: Closed',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send message')
      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error.message)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-primary via-brand-primary to-brand-accent py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Mail className="w-3.5 h-3.5" />
            We typically reply within 24 hours
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
            Get in Touch
          </h1>
          <p className="text-base sm:text-lg opacity-85 max-w-xl mx-auto">
            Have questions or want to create an event? Fill out the form and we'll get back to you.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">

          {/* Left: Contact info — 2 cols on lg */}
          <div className="lg:col-span-2 space-y-4">

            {/* Info cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, primary, href, secondary }) => (
                  <div key={label} className="flex items-start gap-3.5">
                    <div className="w-9 h-9 bg-brand-subtle/60 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                      {href ? (
                        <a href={href} className="text-sm font-medium text-gray-900 hover:text-brand-primary transition-colors break-all">
                          {primary}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">{primary}</p>
                      )}
                      {secondary && <p className="text-xs text-gray-500 mt-0.5">{secondary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Socials */}
            {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Follow Us</h2>
              <div className="grid grid-cols-2 gap-3">
                {socials.map(({ label, href, letter, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:text-white ${color} hover:border-transparent transition-all duration-200 group`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-gray-200 group-hover:bg-white/20 flex items-center justify-center text-xs font-bold transition-colors shrink-0">
                      {letter}
                    </span>
                    {label}
                  </a>
                ))}
              </div>
            </div> */}
          </div>

          {/* Right: Form — 3 cols on lg */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Send a Message</h2>
            <p className="text-sm text-gray-500 mb-6">We'd love to hear from you. Fill in the details below.</p>

            {/* Status banners */}
            {status === 'success' && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <span>Thank you! Your message has been sent. We'll get back to you soon.</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage || 'Something went wrong. Please try again.'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Email side by side on sm+ */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Name <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address <span className="text-brand-primary">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject <span className="text-brand-primary">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-brand-primary">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your event or inquiry..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold text-sm rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </section>
    </main>
  )
}