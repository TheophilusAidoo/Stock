'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";
import { Loader2, AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis } from "recharts";

type OverviewData = {
  stats: {
    activeUsers: { count: number; change: number; helper: string };
    pendingKycs: { count: number; change: number; helper: string };
    payoutsToday: { amount: number; count: number; change: number; helper: string };
    ipoApplications: { count: number; change: number; helper: string };
  };
  riskAlerts: Array<{ account: string; detail: string; severity: 'High' | 'Medium' | 'Low' }>;
  ipoPipeline: Array<{ id: string; companyName: string; openDate?: string; closeDate?: string; status: 'upcoming' | 'open' | 'closed' }>;
  recentTransactions: Array<{ id: string; type: string; amount: number; status: string; timestamp: string; userName?: string }>;
  analytics?: {
    dailyInflows: Array<{ name: string; value: number }>;
    revenueSplit: Array<{ label: string; value: number }>;
    userGrowth: Array<{ name: string; value: number }>;
    transactionVolume: Array<{ name: string; value: number }>;
  };
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  function playBellSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Bell-like sound: two tones
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play bell sound:', error);
    }
  }

  async function loadNotifications() {
    try {
      const data = await api.admin.getNotifications();
      const newNotifications = Array.isArray(data) ? data : [];
      
      // Check for new notifications
      if (newNotifications.length > lastNotificationCount) {
        const unreadCount = newNotifications.filter(n => !n.read).length;
        const previousUnreadCount = notifications.filter(n => !n.read).length;
        
        if (unreadCount > previousUnreadCount) {
          playBellSound();
        }
      }
      
      setNotifications(newNotifications);
      setLastNotificationCount(newNotifications.length);
    } catch (error) {
      console.error('Failed to load admin notifications:', error);
    }
  }

  useEffect(() => {
    loadOverview();
    loadNotifications();
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - backend is taking too long to respond')), 30000)
      );
      
      const dataPromise = api.admin.getOverview();
      const data = await Promise.race([dataPromise, timeoutPromise]) as OverviewData;
      setOverview(data);
    } catch (error) {
      console.error('Failed to load overview:', error);
      setOverview(null); // Set to null to show error message
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="Admin Overview" subtitle="Ops heartbeat across compliance, funds, and risk.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  if (!overview) {
    return (
      <AdminShell title="Admin Overview" subtitle="Ops heartbeat across compliance, funds, and risk.">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/60">
          <p>Failed to load overview data</p>
        </div>
      </AdminShell>
    );
  }

  const { stats, riskAlerts, ipoPipeline, recentTransactions, analytics } = overview;

  // Format stats for display
  const formatActiveUsers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatPayouts = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return formatCurrency(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Today • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 24) {
      return `Today • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const adminStats = [
    {
      label: "Active Users",
      value: formatActiveUsers(stats.activeUsers.count),
      trend: stats.activeUsers.change,
      helper: stats.activeUsers.helper,
      accent: "positive" as const,
    },
    {
      label: "Pending KYCs",
      value: stats.pendingKycs.count.toString(),
      trend: stats.pendingKycs.change,
      helper: stats.pendingKycs.helper,
      accent: stats.pendingKycs.change < 0 ? "positive" as const : "negative" as const,
    },
    {
      label: "Payouts Today",
      value: formatPayouts(stats.payoutsToday.amount),
      trend: stats.payoutsToday.change,
      helper: stats.payoutsToday.helper,
      accent: "neutral" as const,
    },
    {
      label: "IPO Applications",
      value: formatNumber(stats.ipoApplications.count),
      trend: stats.ipoApplications.change,
      helper: stats.ipoApplications.helper,
      accent: "positive" as const,
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return <AlertTriangle className="size-4 text-rose-400" />;
      case 'Medium':
        return <AlertCircle className="size-4 text-yellow-400" />;
      case 'Low':
        return <Info className="size-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'border-rose-500/20 bg-rose-500/10';
      case 'Medium':
        return 'border-yellow-500/20 bg-yellow-500/10';
      case 'Low':
        return 'border-blue-500/20 bg-blue-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-rose-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'Low':
        return 'text-blue-400';
      default:
        return 'text-white/60';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <AdminShell 
      title="Admin Overview" 
      subtitle="Ops heartbeat across compliance, funds, and risk."
      actions={
        unreadNotifications > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-500/30 px-4 py-2">
            <Bell className="size-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">
              {unreadNotifications} New Notification{unreadNotifications !== 1 ? 's' : ''}
            </span>
          </div>
        )
      }
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Risk Alerts & IPO Pipeline */}
      <section className="grid gap-6 lg:grid-cols-2 mt-6">
        <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-4">Risk Alerts</h2>
          <div className="space-y-3">
            {riskAlerts.length === 0 ? (
              <p className="text-sm text-white/60">No risk alerts</p>
            ) : (
              riskAlerts.map((alert) => (
                <div
                  key={alert.account}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    getSeverityColor(alert.severity)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{alert.account}</p>
                      <p className="text-sm text-white/70 mt-1">{alert.detail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <span className={cn("text-xs font-medium", getSeverityTextColor(alert.severity))}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-4">IPO Pipeline</h2>
          <div className="space-y-3">
            {ipoPipeline.length === 0 ? (
              <p className="text-sm text-white/60">No IPOs in pipeline</p>
            ) : (
              ipoPipeline.map((ipo) => (
                <div key={ipo.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{ipo.companyName}</p>
                      <p className="text-sm text-white/70 mt-1">
                        {ipo.status === 'upcoming' && ipo.openDate && `Opens ${formatDate(ipo.openDate)}`}
                        {ipo.status === 'open' && ipo.closeDate && `Closes ${formatDate(ipo.closeDate)}`}
                        {ipo.status === 'closed' && ipo.closeDate && `Listed ${formatDate(ipo.closeDate)}`}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full",
                      ipo.status === 'upcoming' && "bg-blue-500/20 text-blue-400",
                      ipo.status === 'open' && "bg-emerald-500/20 text-emerald-400",
                      ipo.status === 'closed' && "bg-white/10 text-white/60"
                    )}>
                      {ipo.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Analytics Section */}
      {analytics && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Analytics</h2>
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Daily Inflows Chart */}
            <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-semibold mb-4">Daily Inflows (₹Cr)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyInflows}>
                    <defs>
                      <linearGradient id="inflowGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="10%" stopColor="#1459FF" stopOpacity={0.6} />
                        <stop offset="90%" stopColor="#1459FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                      }}
                      formatter={(value: number) => `₹${value.toFixed(2)}Cr`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#1459FF"
                      strokeWidth={3}
                      fill="url(#inflowGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Revenue Split */}
            <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-semibold mb-4">Revenue Split</h3>
              <div className="space-y-3">
                {analytics.revenueSplit.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/80">{item.label}</span>
                    <span className="text-sm font-semibold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* User Growth & Transaction Volume */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            {/* User Growth Chart */}
            <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-semibold mb-4">User Growth (Last 7 Days)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.userGrowth}>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                      }}
                    />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#1459FF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* Transaction Volume Chart */}
            <article className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-base font-semibold mb-4">Transaction Volume (Last 7 Days)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.transactionVolume}>
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                      }}
                    />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* Recent Wallet Operations */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Wallet Operations</h2>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <p>No recent transactions</p>
            </div>
          ) : (
            <DataTable
              columns={[
                { header: "Txn ID", accessor: (row) => row.id },
                { header: "Type", accessor: (row) => (
                  <span className={cn(
                    "font-medium",
                    row.type === 'deposit' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {row.type}
                  </span>
                )},
                { header: "Amount", accessor: (row) => (
                  <span className={cn(
                    "font-semibold",
                    row.type === 'deposit' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {row.type === 'deposit' ? '+' : '-'}{formatCurrency(row.amount)}
                  </span>
                )},
                { header: "Status", accessor: (row) => (
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    row.status === 'completed' || row.status === 'approved' 
                      ? "bg-emerald-500/20 text-emerald-400"
                      : row.status === 'pending'
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-rose-500/20 text-rose-400"
                  )}>
                    {row.status}
                  </span>
                )},
                { header: "Timestamp", accessor: (row) => formatTimestamp(row.timestamp) },
              ]}
              data={recentTransactions}
            />
          )}
        </div>
      </section>
    </AdminShell>
  );
}
