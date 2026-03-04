'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface StrengthResult {
  score: number       // 0–4
  label: string
  color: string
  checks: { label: string; passed: boolean }[]
}

function getStrength(password: string): StrengthResult {
  const checks = [
    { label: 'At least 8 characters', passed: password.length >= 8 },
    { label: 'Uppercase letter (A–Z)', passed: /[A-Z]/.test(password) },
    { label: 'Lowercase letter (a–z)', passed: /[a-z]/.test(password) },
    { label: 'Number (0–9)', passed: /[0-9]/.test(password) },
    { label: 'Special character (!@#$…)', passed: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.passed).length
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']
  return { score, label: labels[score] ?? 'Very Weak', color: colors[score] ?? 'bg-red-500', checks }
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'invalid'>('idle')
  const [error, setError] = useState('')
  const strength = getStrength(form.password)

  useEffect(() => {
    if (!token) setStatus('invalid')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (strength.score < 4) {
      setError('Please choose a stronger password before continuing.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setStatus('idle')
    }
  }

  if (status === 'invalid') {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid reset link</h2>
        <p className="text-sm text-gray-500 mb-5">
          This link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-accent transition-colors"
        >
          Request new link
        </Link>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Password updated!</h2>
        <p className="text-sm text-gray-500">
          Your password has been reset. Redirecting you to login…
        </p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Create a strong password"
              disabled={status === 'loading'}
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-white text-gray-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength meter */}
          {form.password.length > 0 && (
            <div className="mt-2.5 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.score ? strength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                strength.score <= 1 ? 'text-red-500' :
                strength.score === 2 ? 'text-yellow-500' :
                strength.score === 3 ? 'text-blue-500' : 'text-green-500'
              }`}>
                {strength.label}
              </p>
              <ul className="space-y-1">
                {strength.checks.map(c => (
                  <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.passed ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3 h-3 ${c.passed ? 'text-green-500' : 'text-gray-300'}`} />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Repeat your password"
              disabled={status === 'loading'}
              className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white text-gray-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-gray-400 ${
                form.confirm && form.confirm !== form.password
                  ? 'border-red-400'
                  : 'border-slate-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.confirm && form.confirm !== form.password && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Passwords do not match.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || strength.score < 4 || form.password !== form.confirm}
          className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating…
            </span>
          ) : 'Reset Password'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-subtle/20 via-white to-white py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <div className="relative w-[120px] h-[40px] mx-auto overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 p-2">
              <Image src="/Logo.jpg" alt="Tiky" fill className="object-contain" sizes="120px" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Set a new password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a strong password to secure your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-brand-primary transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}