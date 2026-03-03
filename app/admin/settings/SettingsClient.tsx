"use client"

import { useState, useEffect } from "react"
import {
  Save, Globe, Bell, Shield, Ticket,
  RefreshCw, CheckCircle, XCircle, AlertCircle
} from "lucide-react"

interface Settings {
  siteName: string
  supportEmail: string
  timezone: string
  requireEventApproval: boolean
  ticketConfirmationMessage: string
  notifyOnTicketSale: boolean
  notifyOnNewUser: boolean
  notifyEmail: string
}

const defaultSettings: Settings = {
  siteName: "Tiky",
  supportEmail: "",
  timezone: "Africa/Monrovia",
  requireEventApproval: false,
  ticketConfirmationMessage: "Thank you for your purchase! Your ticket is attached. See you at the event! 🎉",
  notifyOnTicketSale: true,
  notifyOnNewUser: false,
  notifyEmail: "",
}

const tabs = [
  { id: "branding", label: "Branding", icon: Globe },
  { id: "events", label: "Events", icon: Shield },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "notifications", label: "Notifications", icon: Bell },
]

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
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${
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

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("branding")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  useEffect(() => { fetchSettings() }, [])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        showToast("Settings saved successfully", "success")
      } else {
        throw new Error()
      }
    } catch {
      showToast("Failed to save settings", "error")
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof Settings, value: any) =>
    setSettings(s => ({ ...s, [key]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl w-full mx-auto bg-white rounded-2xl overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="flex gap-6 flex-col lg:flex-row p-4 sm:p-6">
        {/* Tabs — horizontal scroll on mobile, vertical sidebar on desktop */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {tabs.map(tab => {
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
        </div>

        {/* Content panel */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">

          {/* Branding */}
          {activeTab === "branding" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 text-base">Site Branding</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={e => set("siteName", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tiky"
                />
                <p className="text-xs text-gray-400 mt-1">Shown in the browser tab and emails</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => set("supportEmail", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="support@tiky.com"
                />
                <p className="text-xs text-gray-400 mt-1">Shown to users when they need help</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={e => set("timezone", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Africa/Monrovia">Africa/Monrovia (GMT+0)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                </select>
              </div>
            </div>
          )}

          {/* Events */}
          {activeTab === "events" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 text-base">Event Settings</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800">
                  When event approval is enabled, only ADMIN can publish events. Organizers must submit for review first.
                </p>
              </div>
              <Toggle
                checked={settings.requireEventApproval}
                onChange={v => set("requireEventApproval", v)}
                label="Require Admin Approval for Events"
                description="New events from Organizers will be set to PENDING until an Admin approves them"
              />
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  Current status:{" "}
                  <span className={`font-semibold ${settings.requireEventApproval ? "text-orange-600" : "text-green-600"}`}>
                    {settings.requireEventApproval ? "Approval required" : "Auto-publish enabled"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Tickets */}
          {activeTab === "tickets" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 text-base">Ticket Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Purchase Confirmation Message
                </label>
                <textarea
                  value={settings.ticketConfirmationMessage}
                  onChange={e => set("ticketConfirmationMessage", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Thank you for your purchase..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  This message is shown on the success page and included in ticket emails
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Preview</p>
                <p className="text-sm text-gray-700 italic">"{settings.ticketConfirmationMessage}"</p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-900 text-base">Notification Preferences</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin Notification Email
                </label>
                <input
                  type="email"
                  value={settings.notifyEmail}
                  onChange={e => set("notifyEmail", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="admin@tiky.com"
                />
                <p className="text-xs text-gray-400 mt-1">Receive admin alerts at this address</p>
              </div>
              <div className="border border-gray-100 rounded-xl px-4">
                <Toggle
                  checked={settings.notifyOnTicketSale}
                  onChange={v => set("notifyOnTicketSale", v)}
                  label="Notify on Ticket Sale"
                  description="Get an email whenever a ticket is purchased"
                />
                <Toggle
                  checked={settings.notifyOnNewUser}
                  onChange={v => set("notifyOnNewUser", v)}
                  label="Notify on New User Registration"
                  description="Get an email when a new user signs up"
                />
              </div>
            </div>
          )}

          {/* Save */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {saving
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}