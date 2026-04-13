'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, User, AlertCircle, ArrowRight,
  Eye, EyeOff, CheckCircle, XCircle
} from 'lucide-react';
import Image from 'next/image';

// ── Email validation ──────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

// ── Password strength ─────────────────────────────────────────
interface PasswordRule {
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',         test: p => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',     test: p => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',     test: p => /[a-z]/.test(p) },
  { label: 'One number (0–9)',               test: p => /[0-9]/.test(p) },
  { label: 'One special character (!@#$…)',  test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string): { score: number; label: string; color: string } {
  const score = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (score <= 1) return { score, label: 'Very Weak',  color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Weak',       color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Fair',       color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Strong',     color: 'bg-blue-500' };
  return              { score, label: 'Very Strong', color: 'bg-green-500' };
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const strength = getStrength(formData.password);
  const emailValid = isValidEmail(formData.email);
  const emailError = emailTouched && formData.email.length > 0 && !emailValid;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const confirmError = formData.confirmPassword.length > 0 && !passwordsMatch;

  // Clear global error when user starts typing
  useEffect(() => { setError(''); }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side guards
    if (!emailValid) {
      setError('Please enter a valid email address.');
      setEmailTouched(true);
      return;
    }
    if (strength.score < 3) {
      setError('Please choose a stronger password.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      router.push('/login?message=Account created! Please sign in.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-white py-12 px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="relative w-[110px] h-[36px] overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 p-2.5 mx-auto">
              <Image src="/Tiky-Expanded.png" alt="Tiky" fill className="object-contain" sizes="110px" priority />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Join Tiky and start exploring events</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">

          {/* Global error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-slate-400"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm border bg-white text-gray-900 rounded-xl focus:ring-2 transition-all placeholder:text-slate-400 ${
                    emailError
                      ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                      : emailTouched && emailValid
                      ? 'border-green-400 focus:ring-green-200 focus:border-green-400'
                      : 'border-slate-300 focus:ring-brand-primary/30 focus:border-brand-primary'
                  }`}
                  disabled={loading}
                />
                {/* Inline validation icon */}
                {emailTouched && formData.email.length > 0 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {emailValid
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                )}
              </div>
              {emailError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Please enter a valid email address.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setPasswordFocused(true)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-slate-400"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}

              {/* Rules checklist — shown when focused or has content */}
              {(passwordFocused || formData.password.length > 0) && (
                <ul className="mt-3 space-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  {PASSWORD_RULES.map(rule => {
                    const passed = rule.test(formData.password);
                    return (
                      <li key={rule.label} className="flex items-center gap-2 text-xs">
                        {passed
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        <span className={passed ? 'text-green-700' : 'text-slate-500'}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm border bg-white text-gray-900 rounded-xl focus:ring-2 transition-all placeholder:text-slate-400 ${
                    confirmError
                      ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                      : formData.confirmPassword.length > 0 && passwordsMatch
                      ? 'border-green-400 focus:ring-green-200 focus:border-green-400'
                      : 'border-slate-300 focus:ring-brand-primary/30 focus:border-brand-primary'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match.
                </p>
              )}
              {formData.confirmPassword.length > 0 && passwordsMatch && (
                <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Passwords match.
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-brand-primary hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center mt-6 text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-accent transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}