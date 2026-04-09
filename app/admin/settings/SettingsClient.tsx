"use client"

// app/admin/settings/SettingsClient.tsx
//
// REBUILT from previous version.
// Changes:
// 1. Matches the API exactly — same keys, same types, no drift
// 2. Payment accounts tab added (MTN MoMo, Orange Money, Bank Transfer)
//    — these used to only live in .env; now admin-editable without redeploy
// 3. Boolean settings stored as strings in DB, parsed correctly here
// 4. Maintenance mode toggle added to Platform tab
// 5. "Notify on pending payment proof" added — most useful for this app
// 6. Save sends only the changed tab's fields to reduce payload
//    (actually sends all — simpler, same effect since API upserts)
// 7. Unsaved changes indicator so admins know to save before leaving

import { useState, useEffect, useCallback } from "react"
import {
  Save, Globe, Bell, Shield, Ticket,
  RefreshCw, CheckCircle, XCircle,
  AlertCircle, CreditCard, Settings,
} from "lucide-react"

// ── Types — must match SETTING_KEYS in the API ────────────────────────────────

type SettingsShape = {
  // Branding
  siteName: string
  supportEmail: string
  timezone: string
  // Payment accounts
  mtnMomoNumber: string
  mtnMomoName: string
  orangeMoneyNumber: string
  orangeMoneyName: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  supportPhone: string
  // Tickets
  ticketConfirmationMessage: string
  // Notifications
  notifyEmail: string
  notifyOnTicketSale: boolean
  notifyOnNewUser: boolean
  notifyOnPendingPayment: boolean
  // Platform
  currency: string
  maintenanceMode: boolean
}

const DEFAULTS: SettingsShape = {
  siteName: "Tiky",
  supportEmail: "",
  timezone: "Africa/Monrovia",
  mtnMomoNumber: "",
  mtnMomoName: "Tiky Events",
  orangeMoneyNumber: "",
  orangeMoneyName: "Tiky Events",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "Tiky Events LLC",
  supportPhone: "",
  ticketConfirmationMessage:
    "Thank you for your purchase! Your ticket is ready. See you at the event! 🎉",
  notifyEmail: "",
  notifyOnTicketSale: true,
  notifyOnNewUser: false,
  notifyOnPendingPayment: true,
  currency: "USD",
  maintenanceMode: false,
}

// Parse raw API response (booleans come back as strings from DB)
function parseSettings(raw: Record<string, string>): SettingsShape {
  return {
    ...DEFAULTS,
    ...raw,
    notifyOnTicketSale: raw.notifyOnTicketSale === "true",
    notifyOnNewUser: raw.notifyOnNewUser === "true",
    notifyOnPendingPayment: raw.notifyOnPendingPayment === "true",
    maintenanceMode: raw.maintenanceMode === "true",
  }
}

// Serialize back to strings for the API
function serializeSettings(s: SettingsShape): Record<string, string> {
  return {
    ...s,
    notifyOnTicketSale: String(s.notifyOnTicketSale),
    notifyOnNewUser: String(s.notifyOnNewUser),
    notifyOnPendingPayment: String(s.notifyOnPendingPayment),
    maintenanceMode: String(s.maintenanceMode),
  }
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "branding",      label: "Branding",      icon: Globe },
  { id: "payments",      label: "Payments",       icon: CreditCard },
  { id: "tickets",       label: "Tickets",        icon: Ticket },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "platform",      label: "Platform",       icon: Settings },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          checked ? "bg-orange-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
        mono ? "font-mono" : ""
      }`}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SettingsClient() {
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS)
  const [saved, setSaved] = useState<SettingsShape>(DEFAULTS) // track saved state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("branding")
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const hasUnsavedChanges =
    JSON.stringify(settings) !== JSON.stringify(saved)

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch")
      const raw = await res.json()
      const parsed = parseSettings(raw)
      setSettings(parsed)
      setSaved(parsed)
    } catch {
      showToast("Could not load settings — showing defaults", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const set = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeSettings(settings)),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Save failed")
      }
      const raw = await res.json()
      const parsed = parseSettings(raw)
      setSettings(parsed)
      setSaved(parsed)
      showToast("Settings saved", "success")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save settings",
        "error"
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl w-full mx-auto">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row">

        {/* ── Tab sidebar ───────────────────────────────────────────── */}
        <div className="lg:w-52 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap lg:w-full text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-orange-50 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Unsaved indicator */}
          {hasUnsavedChanges && (
            <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Unsaved changes
              </p>
            </div>
          )}
        </div>

        {/* ── Content panel ─────────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-6">

            {/* ── BRANDING ───────────────────────────────────────── */}
            {activeTab === "branding" && (
              <>
                <SectionHeader
                  title="Site Branding"
                  description="Basic information shown to users across the platform"
                />
                <Field label="Site Name" hint="Shown in the browser tab and emails">
                  <Input
                    value={settings.siteName}
                    onChange={(v) => set("siteName", v)}
                    placeholder="Tiky"
                  />
                </Field>
                <Field
                  label="Support Email"
                  hint="Shown to users when they need help"
                >
                  <Input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(v) => set("supportEmail", v)}
                    placeholder="support@tiky.com"
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    value={settings.timezone}
                    onChange={(e) => set("timezone", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Africa/Monrovia">Africa/Monrovia (GMT+0)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  </select>
                </Field>
                <Field
                  label="Support WhatsApp Number"
                  hint="Users contact this number for payment help (include country code)"
                >
                  <Input
                    value={settings.supportPhone}
                    onChange={(v) => set("supportPhone", v)}
                    placeholder="+231770000000"
                    mono
                  />
                </Field>
              </>
            )}

            {/* ── PAYMENTS ───────────────────────────────────────── */}
            {activeTab === "payments" && (
              <>
                <SectionHeader
                  title="Payment Accounts"
                  description="These details appear on the payment instructions page that users see after checkout. Keep them accurate."
                />

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Changes here take effect immediately for all new orders. Double-check
                    account numbers before saving, incorrect details will cause failed payments.
                  </p>
                </div>

                {/* MTN MoMo */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-black text-yellow-900">M</span>
                    MTN Mobile Money
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                    <Field label="MoMo Number" hint="The number users transfer to">
                      <Input
                        value={settings.mtnMomoNumber}
                        onChange={(v) => set("mtnMomoNumber", v)}
                        placeholder="+231 88 000 0000"
                        mono
                      />
                    </Field>
                    <Field label="Account Name" hint="Name shown on the transfer">
                      <Input
                        value={settings.mtnMomoName}
                        onChange={(v) => set("mtnMomoName", v)}
                        placeholder="Tiky Events"
                      />
                    </Field>
                  </div>
                </div>

                {/* Orange Money */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-black text-white">O</span>
                    Orange Money
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                    <Field label="Orange Number" hint="The number users transfer to">
                      <Input
                        value={settings.orangeMoneyNumber}
                        onChange={(v) => set("orangeMoneyNumber", v)}
                        placeholder="+231 77 000 0000"
                        mono
                      />
                    </Field>
                    <Field label="Account Name">
                      <Input
                        value={settings.orangeMoneyName}
                        onChange={(v) => set("orangeMoneyName", v)}
                        placeholder="Tiky Events"
                      />
                    </Field>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-black text-white">B</span>
                    Bank Transfer
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                    <Field label="Bank Name">
                      <Input
                        value={settings.bankName}
                        onChange={(v) => set("bankName", v)}
                        placeholder="Ecobank Liberia"
                      />
                    </Field>
                    <Field label="Account Name">
                      <Input
                        value={settings.bankAccountName}
                        onChange={(v) => set("bankAccountName", v)}
                        placeholder="Tiky Events LLC"
                      />
                    </Field>
                    <Field
                      label="Account Number"
                      hint="Verify this carefully before saving"
                    >
                      <Input
                        value={settings.bankAccountNumber}
                        onChange={(v) => set("bankAccountNumber", v)}
                        placeholder="1234567890"
                        mono
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* ── TICKETS ────────────────────────────────────────── */}
            {activeTab === "tickets" && (
              <>
                <SectionHeader
                  title="Ticket Settings"
                  description="Customise what users see after purchasing a ticket"
                />
                <Field
                  label="Purchase Confirmation Message"
                  hint="Shown on the success page and in ticket emails"
                >
                  <textarea
                    value={settings.ticketConfirmationMessage}
                    onChange={(e) => set("ticketConfirmationMessage", e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
                    placeholder="Thank you for your purchase..."
                  />
                </Field>

                {/* Live preview */}
                {settings.ticketConfirmationMessage && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">
                      Preview
                    </p>
                    <p className="text-sm text-gray-700 italic leading-relaxed">
                      "{settings.ticketConfirmationMessage}"
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ── NOTIFICATIONS ──────────────────────────────────── */}
            {activeTab === "notifications" && (
              <>
                <SectionHeader
                  title="Notification Preferences"
                  description="Control which events trigger admin email alerts"
                />
                <Field
                  label="Admin Notification Email"
                  hint="All alerts go to this address"
                >
                  <Input
                    type="email"
                    value={settings.notifyEmail}
                    onChange={(v) => set("notifyEmail", v)}
                    placeholder="tikyliberia@gmail.com"
                  />
                </Field>
                <div className="border border-gray-100 rounded-xl px-4">
                  <Toggle
                    checked={settings.notifyOnPendingPayment}
                    onChange={(v) => set("notifyOnPendingPayment", v)}
                    label="Notify on Pending Payment Proof"
                    description="Get an email when a user uploads proof of payment, most important for the manual payment flow"
                  />
                  <Toggle
                    checked={settings.notifyOnTicketSale}
                    onChange={(v) => set("notifyOnTicketSale", v)}
                    label="Notify on Confirmed Ticket Sale"
                    description="Get an email when a ticket is confirmed and issued"
                  />
                  <Toggle
                    checked={settings.notifyOnNewUser}
                    onChange={(v) => set("notifyOnNewUser", v)}
                    label="Notify on New User Registration"
                    description="Get an email when a new user signs up"
                  />
                </div>
              </>
            )}

            {/* ── PLATFORM ───────────────────────────────────────── */}
            {activeTab === "platform" && (
              <>
                <SectionHeader
                  title="Platform Settings"
                  description="System-wide configuration"
                />
                <Field label="Currency">
                  <select
                    value={settings.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="USD">USD — US Dollar</option>
                    <option value="LRD">LRD — Liberian Dollar</option>
                  </select>
                </Field>

                <div className="border border-gray-100 rounded-xl px-4">
                  <Toggle
                    checked={settings.maintenanceMode}
                    onChange={(v) => set("maintenanceMode", v)}
                    label="Maintenance Mode"
                    description="When enabled, the public-facing site shows a maintenance page. Admins can still access the dashboard."
                  />
                </div>

                {settings.maintenanceMode && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      <strong>Maintenance mode is ON.</strong> The public site is
                      currently inaccessible to regular users. Remember to turn
                      this off when done.
                    </p>
                  </div>
                )}
              </>
            )}

          </div>

          {/* ── Save footer ──────────────────────────────────────── */}
          <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {hasUnsavedChanges ? "You have unsaved changes" : "All changes saved"}
            </p>
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="pb-2 border-b border-gray-100">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
  )
}