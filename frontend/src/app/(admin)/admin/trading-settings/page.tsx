'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Plus, Trash2, X, DollarSign } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

type TimerSetting = {
  id: string;
  duration: number;
  label: string;
  isEnabled: boolean;
};

const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', locale: 'en-GB', name: 'Euro' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
  { code: 'CNY', symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan' },
];

export default function TradingSettingsPage() {
  const { refreshCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timers, setTimers] = useState<TimerSetting[]>([]);
  const [profitRate, setProfitRate] = useState(80);
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [locale, setLocale] = useState('en-IN');
  const [message, setMessage] = useState<string | null>(null);
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [newTimer, setNewTimer] = useState({ duration: '', label: '', isEnabled: true });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const [timersData, settingsData] = await Promise.all([
        api.admin.getTimerSettings(),
        api.admin.getTradingSettings(),
      ]);
      setTimers(timersData as TimerSetting[]);
      const settings = settingsData as any;
      setProfitRate(settings.defaultProfitRate || 80);
      setCurrencyCode(settings.currencyCode || 'INR');
      setCurrencySymbol(settings.currencySymbol || '₹');
      setLocale(settings.locale || 'en-IN');
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTimer(timerId: string, isEnabled: boolean) {
    try {
      setSaving(true);
      await api.admin.updateTimerSettings(timerId, isEnabled);
      setTimers(prev => prev.map(t => t.id === timerId ? { ...t, isEnabled } : t));
      setMessage('Timer settings updated');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update timer:', error);
      alert('Failed to update timer settings');
    } finally {
      setSaving(false);
    }
  }

  async function saveProfitRate() {
    try {
      setSaving(true);
      await api.admin.updateTradingSettings({ defaultProfitRate: profitRate });
      setMessage('Profit rate updated successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update profit rate:', error);
      alert('Failed to update profit rate');
    } finally {
      setSaving(false);
    }
  }

  function handleCurrencyChange(code: string) {
    const currency = CURRENCIES.find(c => c.code === code);
    if (currency) {
      setCurrencyCode(currency.code);
      setCurrencySymbol(currency.symbol);
      setLocale(currency.locale);
    }
  }

  async function saveCurrency() {
    try {
      setSaving(true);
      await api.admin.updateTradingSettings({
        currencyCode,
        currencySymbol,
        locale,
      });
      // Refresh currency context to update all currency displays
      await refreshCurrency();
      setMessage('Currency updated successfully. All currency displays will update immediately.');
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Failed to update currency:', error);
      alert('Failed to update currency');
    } finally {
      setSaving(false);
    }
  }

  async function addTimer() {
    if (!newTimer.duration || !newTimer.label) {
      alert('Please enter duration and label');
      return;
    }

    const duration = Number(newTimer.duration);
    if (duration <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    try {
      setSaving(true);
      const addedTimer = await api.admin.addTimerSettings({
        duration,
        label: newTimer.label,
        isEnabled: newTimer.isEnabled,
      });
      setTimers(prev => [...prev, addedTimer as TimerSetting].sort((a, b) => a.duration - b.duration));
      setNewTimer({ duration: '', label: '', isEnabled: true });
      setShowAddTimer(false);
      setMessage('Timer added successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to add timer:', error);
      alert(error instanceof Error ? error.message : 'Failed to add timer');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTimer(timerId: string) {
    if (!confirm('Are you sure you want to delete this timer? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await api.admin.deleteTimerSettings(timerId);
      setTimers(prev => prev.filter(t => t.id !== timerId));
      setMessage('Timer deleted successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to delete timer:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete timer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Trading Settings" subtitle="Manage timer settings and profit rates">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Trading Settings" subtitle="Manage timer settings and profit rates">
      <div className="space-y-6">
        {/* Currency Settings */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
              <DollarSign className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Currency Settings</h2>
              <p className="text-sm text-white/60">Change the currency used throughout the platform</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Select Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name} ({curr.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  maxLength={3}
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Locale</label>
                <input
                  type="text"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
              <p className="text-xs text-white/60 mb-1">Preview:</p>
              <p className="text-lg font-semibold text-blue-300">
                {new Intl.NumberFormat(locale, {
                  style: 'currency',
                  currency: currencyCode,
                }).format(1234567.89)}
              </p>
            </div>
            <button
              onClick={saveCurrency}
              disabled={saving}
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Currency Settings"}
            </button>
            <p className="text-xs text-white/50">
              ⚠️ Changing currency will affect all monetary displays across the platform (dashboard, wallet, trading, IPOs, etc.)
            </p>
          </div>
        </div>

        {/* Profit Rate Settings */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-4">Default Profit Rate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Profit Rate (%)
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={profitRate}
                  onChange={(e) => setProfitRate(Number(e.target.value))}
                  className="w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
                <button
                  onClick={saveProfitRate}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              <p className="mt-2 text-xs text-white/50">
                Default profit rate applied to all timed trades. Example: 80% means if user invests ₹100 and wins, they get ₹180 (₹100 + ₹80 profit).
              </p>
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Timer Settings</h2>
              <p className="text-sm text-white/60 mt-1">
                Add, enable or disable timer options. Only enabled timers will appear on the user trading page.
              </p>
            </div>
            <button
              onClick={() => setShowAddTimer(!showAddTimer)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="size-4" />
              Add Timer
            </button>
          </div>

          {/* Add Timer Form */}
          {showAddTimer && (
            <div className="mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-white/60 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={newTimer.duration}
                    onChange={(e) => setNewTimer({ ...newTimer, duration: e.target.value })}
                    placeholder="e.g., 30"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-white/60 mb-1">Label</label>
                  <input
                    type="text"
                    value={newTimer.label}
                    onChange={(e) => setNewTimer({ ...newTimer, label: e.target.value })}
                    placeholder="e.g., 30min"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTimer.isEnabled}
                    onChange={(e) => setNewTimer({ ...newTimer, isEnabled: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  <label className="text-xs text-white/60">Enabled</label>
                </div>
                <button
                  onClick={addTimer}
                  disabled={saving || !newTimer.duration || !newTimer.label}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddTimer(false);
                    setNewTimer({ duration: '', label: '', isEnabled: true });
                  }}
                  className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {timers.map((timer) => (
              <div
                key={timer.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-white">{timer.label}</p>
                  <p className="text-xs text-white/50 mt-1">
                    Duration: {timer.duration} {timer.duration === 1 ? 'minute' : timer.duration === 60 ? 'hour' : timer.duration < 60 ? 'minutes' : `${Math.floor(timer.duration / 60)} hour${Math.floor(timer.duration / 60) > 1 ? 's' : ''} ${timer.duration % 60 > 0 ? `${timer.duration % 60} min` : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTimer(timer.id, !timer.isEnabled)}
                    disabled={saving}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                      timer.isEnabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    )}
                  >
                    {timer.isEnabled ? (
                      <>
                        <CheckCircle2 className="size-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="size-4" />
                        Disabled
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteTimer(timer.id)}
                    disabled={saving}
                    className="rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 transition hover:bg-rose-500/30 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

