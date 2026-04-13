'use client'

import { useState } from 'react'
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('sent')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-subtle/20 via-white to-white py-12 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <div className="relative w-[120px] h-[40px] mx-auto overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 p-2">
              <Image src="/Tiky-Expanded.png" alt="Tiky" fill className="object-contain" sizes="120px" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Forgot your password?</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {status === 'sent' ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-1">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>,
                we've sent a password reset link.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                The link expires in 60 minutes. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => { setStatus('idle'); setEmail('') }}
                className="text-sm text-brand-primary hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError('')
                      }}
                      onBlur={() => {
                        if (email && !isValidEmail(email))
                          setEmailError('Please enter a valid email address.')
                        else setEmailError('')
                      }}
                      placeholder="you@example.com"
                      disabled={status === 'loading'}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white text-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400 ${
                        emailError ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {emailError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}