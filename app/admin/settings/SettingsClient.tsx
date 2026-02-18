"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Globe,
  Mail,
  Smartphone,
  Shield,
  Bell,
  Palette,
  CreditCard,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Settings {
  siteName: string;
  supportEmail: string;
  momoEnvironment: "sandbox" | "live";
  maintenanceMode: boolean;
  currency: string;
  timezone: string;
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) return null;

  const tabs = [
    { id: "general", name: "General", icon: Globe },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "appearance", name: "Appearance", icon: Palette },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter site name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="support@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Africa/Monrovia">Africa/Monrovia (GMT+0)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST+4)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LRD">LRD - Liberian Dollar</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Maintenance Mode</p>
                  <p className="text-xs text-yellow-600">Users will see a maintenance page</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === "payment" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile Money Configuration</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Momo API Environment</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="sandbox"
                        checked={settings.momoEnvironment === "sandbox"}
                        onChange={(e) => setSettings({ ...settings, momoEnvironment: e.target.value as "sandbox" | "live" })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Sandbox</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="live"
                        checked={settings.momoEnvironment === "live"}
                        onChange={(e) => setSettings({ ...settings, momoEnvironment: e.target.value as "sandbox" | "live" })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Live</span>
                    </label>
                  </div>
                </div>
                
                {settings.momoEnvironment === "sandbox" ? (
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700">
                        Sandbox mode: Use test credentials and mock payments. No real money will be transferred.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-3 flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700 font-medium">Live Mode Active</p>
                      <p className="text-xs text-yellow-600">
                        Real transactions will be processed. Ensure your API credentials are correct.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Enter API secret"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          {saveSuccess && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Settings saved successfully!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}