'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { BellRing, WalletCards, TrendingUp, TrendingDown, CheckCircle, AlertCircle, TrendingUp as TrendingUpIcon, Wallet, Home } from "lucide-react";
import { UserShell } from "@/components/layout/user-shell";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type PortfolioSummary = {
  totalInvested: number;
  totalCurrentValue: number;
  unrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  positionsCount: number;
};

type WalletTxn = {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  timestamp: string;
  channel?: string;
};

type MarketData = {
  name: string;
  value: number;
  change: number;
  changePct: number;
};

type Notification = {
  id: string;
  category: 'IPO Alerts' | 'Deposit & Withdrawal updates' | 'Approval notifications' | 'System alerts';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletHistory, setWalletHistory] = useState<WalletTxn[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [ipoApplications, setIpoApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadDashboardData();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      if (userId) {
        api.user.getNotifications(userId)
          .then((notifs) => {
            setNotifications((notifs as Notification[]).slice(0, 5));
          })
          .catch(() => {});
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (!userId) {
        setLoading(false);
        return;
      }

      const [portfolioData, balance, history, market, ipoApps, notifs] = await Promise.all([
        api.trading.portfolioSummary(userId).catch(() => null),
        api.wallet.balance(userId).catch(() => ({ balance: 0 })),
        api.wallet.history(userId).catch(() => []),
        api.market.quotes().catch(() => []),
        api.ipo.getApplications(userId).catch(() => []),
        api.user.getNotifications(userId).catch(() => []),
      ]);

      setPortfolio(portfolioData as PortfolioSummary | null);
      setWalletBalance((balance as any)?.balance || 0);
      setWalletHistory((history as WalletTxn[]).slice(0, 3));
      setMarketData(market as MarketData[]);
      setIpoApplications(ipoApps as any[]);
      setNotifications((notifs as Notification[]).slice(0, 5)); // Show latest 5 notifications

      // Get KYC status from user data
      try {
        const users = await api.admin.users();
        const currentUser = (users as any[]).find((u: any) => u.id === userId);
        if (currentUser) {
          setKycStatus(currentUser.kycStatus || 'pending');
        }
      } catch {
        // Ignore KYC status error
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <UserShell 
        title="Command Center" 
        subtitle="Live P&L, funds, and regulatory status"
        actions={
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
            title="Back to Home"
          >
            <Home className="size-5" />
          </Link>
        }
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  // Calculate dashboard stats
  const netWorth = portfolio ? portfolio.totalCurrentValue + walletBalance : walletBalance;
  const dayPnl = portfolio?.unrealizedPnl || 0;
  const dayPnlPercent = portfolio && portfolio.totalInvested > 0 
    ? (dayPnl / portfolio.totalInvested) * 100 
    : 0;
  const marginUtilized = portfolio && portfolio.totalInvested > 0
    ? Math.min(100, (portfolio.totalInvested / (portfolio.totalInvested + walletBalance)) * 100)
    : 0;
  const cashAvailable = walletBalance;

  // Generate P&L chart data (simplified - in real app, fetch historical data)
  const pnlSeries = portfolio ? [
    { name: "09:15", value: Math.max(0, dayPnl * 0.1) },
    { name: "10:00", value: Math.max(0, dayPnl * 0.3) },
    { name: "11:45", value: Math.max(0, dayPnl * 0.5) },
    { name: "13:15", value: Math.max(0, dayPnl * 0.7) },
    { name: "14:45", value: Math.max(0, dayPnl * 0.85) },
    { name: "15:30", value: dayPnl },
  ] : [
    { name: "09:15", value: 0 },
    { name: "10:00", value: 0 },
    { name: "11:45", value: 0 },
    { name: "13:15", value: 0 },
    { name: "14:45", value: 0 },
    { name: "15:30", value: 0 },
  ];

  // Smart alerts
  const alerts = [];
  if (kycStatus === 'approved') {
    alerts.push({
      id: 'kyc-verified',
      title: 'KYC Verified',
      message: 'Your full CKYC has been verified. Derivatives access unlocked.',
    });
  }
  
  // Check for pending IPO allotments
  const pendingIpo = ipoApplications.find((app: any) => app.status === 'Pending Allotment');
  if (pendingIpo) {
    alerts.push({
      id: 'ipo-pending',
      title: 'IPO Update',
      message: `${pendingIpo.ipo?.companyName || 'IPO'}: Application pending allotment.`,
    });
  }

  // Check for recent completed transactions
  const recentCompleted = walletHistory.find((txn: WalletTxn) => 
    txn.status === 'completed' || txn.status === 'approved'
  );
  if (recentCompleted) {
    alerts.push({
      id: 'funds-settled',
      title: 'Funds Settled',
      message: `${formatCurrency(recentCompleted.amount)} ${recentCompleted.type === 'deposit' ? 'deposit' : 'withdrawal'} settled.`,
    });
  }

  const dashboardStats = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorth),
      change: portfolio ? `▲ ${((portfolio.totalPnl / (portfolio.totalInvested || 1)) * 100).toFixed(1)}%` : "▲ 0%",
      changeLabel: "vs last week",
    },
    {
      label: "Day P&L",
      value: formatCurrency(dayPnl),
      change: `▲ ${dayPnlPercent.toFixed(1)}%`,
      changeLabel: `Across ${portfolio?.positionsCount || 0} positions`,
    },
    {
      label: "Margin Utilized",
      value: `${marginUtilized.toFixed(0)}%`,
      change: "▼ 3.1%",
      changeLabel: `Room for ${Math.floor((walletBalance / 100000) || 0)} more lots`,
    },
    {
      label: "Cash Available",
      value: formatCurrency(cashAvailable),
      change: "▲ 1.6%",
      changeLabel: "Includes unsettled funds",
    },
  ];

  // Format timestamp for display
  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  // Format notification timestamp
  function formatNotificationTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // Get notification icon
  function getNotificationIcon(category: string) {
    const iconMap: Record<string, any> = {
      'IPO Alerts': TrendingUpIcon,
      'Deposit & Withdrawal updates': Wallet,
      'Approval notifications': CheckCircle,
      'System alerts': AlertCircle,
    };
    return iconMap[category] || BellRing;
  }

  // Get notification color
  function getNotificationColor(category: string) {
    const colorMap: Record<string, string> = {
      'IPO Alerts': 'text-blue-400 bg-blue-500/20',
      'Deposit & Withdrawal updates': 'text-emerald-400 bg-emerald-500/20',
      'Approval notifications': 'text-purple-400 bg-purple-500/20',
      'System alerts': 'text-amber-400 bg-amber-500/20',
    };
    return colorMap[category] || 'text-white/60 bg-white/10';
  }

  return (
    <UserShell 
      title="Command Center" 
      subtitle="Live P&L, funds, and regulatory status"
      actions={
        <Link
          href="/"
          className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
          title="Back to Home"
        >
          <Home className="size-5" />
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-xl hover:shadow-emerald-500/5">
          {/* Animated background gradient */}
          <div className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            dayPnl >= 0 
              ? "bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" 
              : "bg-gradient-to-br from-rose-500/5 via-transparent to-transparent"
          )} />
          
          <header className="relative z-10 flex items-start justify-between mb-6">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-white/50">Intraday P&L</p>
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  dayPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {dayPnl >= 0 ? "+" : ""}
                  {formatCurrency(dayPnl)}
                </p>
                {dayPnlPercent !== 0 && (
                  <span className={cn(
                    "text-sm font-semibold",
                    dayPnl >= 0 ? "text-emerald-400/80" : "text-rose-400/80"
                  )}>
                    ({dayPnl >= 0 ? "+" : ""}{dayPnlPercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
              <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70">Live</span>
            </div>
          </header>
          
          <div className="relative z-10 mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlSeries} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#19C37D" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#19C37D" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#19C37D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(255,255,255,0.03)" 
                  vertical={false}
                  strokeWidth={1}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
                    if (value <= -1000) return `-₹${Math.abs(value / 1000).toFixed(1)}k`;
                    return `₹${value.toFixed(0)}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.98)",
                    border: `1px solid ${dayPnl >= 0 ? 'rgba(25, 195, 125, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: "12px",
                    padding: "10px 14px",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  }}
                  labelStyle={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: '11px', 
                    marginBottom: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  itemStyle={{ 
                    color: dayPnl >= 0 ? '#19C37D' : '#ef4444', 
                    fontSize: '15px', 
                    fontWeight: '700',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: number) => [
                    `${dayPnl >= 0 ? '+' : ''}${formatCurrency(value)}`,
                    'P&L'
                  ]}
                  cursor={{ 
                    stroke: dayPnl >= 0 ? '#19C37D' : '#ef4444', 
                    strokeWidth: 2, 
                    strokeDasharray: '4 4',
                    strokeOpacity: 0.6
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={dayPnl >= 0 ? "#19C37D" : "#ef4444"}
                  strokeWidth={3}
                  fill={dayPnl >= 0 ? "url(#colorProfit)" : "url(#colorLoss)"}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: dayPnl >= 0 ? "#19C37D" : "#ef4444", 
                    strokeWidth: 3, 
                    stroke: '#fff',
                    filter: 'url(#glow)',
                    style: { boxShadow: `0 0 12px ${dayPnl >= 0 ? '#19C37D' : '#ef4444'}` }
                  }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Bottom stats bar */}
          <div className="relative z-10 mt-6 flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", dayPnl >= 0 ? "bg-emerald-400" : "bg-rose-400")} />
                <span className="text-white/60">Today's Performance</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-white/40">
                {pnlSeries.length} data points
              </span>
            </div>
            <div className="text-xs font-medium text-white/50">
              Market Hours: 9:15 AM - 3:30 PM
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Wallet Snapshot</span>
              <WalletCards className="size-4" />
            </div>
            <p className="mt-3 text-3xl font-semibold">{formatCurrency(walletBalance)}</p>
            <p className="text-xs text-white/50">
              {walletHistory.filter(t => t.status === 'pending').length > 0 
                ? `${walletHistory.filter(t => t.status === 'pending').length} pending transaction(s) · ` 
                : ''}
              {formatCurrency(walletBalance)} (withdrawable)
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {walletHistory.length === 0 ? (
                <p className="text-center text-white/50 py-4">No recent transactions</p>
              ) : (
                walletHistory.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{txn.id}</p>
                      <p className="text-xs text-white/50">{formatTimestamp(txn.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className={txn.type === "deposit" ? "text-emerald-400" : "text-rose-400"}>
                        {txn.type === "deposit" ? "+" : "-"}
                        {formatCurrency(txn.amount, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-white/50">{txn.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <BellRing className="size-4" />
              Smart Alerts
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {alerts.length === 0 ? (
                <li className="rounded-2xl border border-white/10 px-4 py-3 text-center text-white/50">
                  No alerts
                </li>
              ) : (
                alerts.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-white/70"
                  >
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/50">{item.message}</p>
                  </li>
                ))
              )}
            </ul>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <BellRing className="size-4" />
                Recent Notifications
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 px-4 py-6 text-center text-white/50">
                  <BellRing className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = getNotificationIcon(notif.category);
                  const iconColor = getNotificationColor(notif.category);
                  return (
                    <div
                      key={notif.id}
                      onClick={async () => {
                        // Mark as read if not already read
                        if (!notif.read) {
                          try {
                            const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
                            const userId = userToken ? userToken.replace('token-', '') : undefined;
                            
                            if (userId) {
                              await api.user.markNotificationAsRead(userId, notif.id);
                              // Update local state optimistically
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === notif.id ? { ...item, read: true } : item
                                )
                              );
                            }
                          } catch (error) {
                            console.error('Failed to mark notification as read:', error);
                            // Still navigate even if marking as read fails
                          }
                        }

                        // Navigate to link if available
                        if (notif.link) {
                          router.push(notif.link);
                        }
                      }}
                      className={cn(
                        "rounded-2xl border px-4 py-3 cursor-pointer transition hover:bg-white/5",
                        notif.read ? "opacity-60 border-white/5" : "border-white/10 bg-white/[0.02]",
                        notif.link && "hover:border-white/20"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn("flex size-8 items-center justify-center rounded-lg flex-shrink-0", iconColor)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-semibold text-xs", notif.read ? "text-white/70" : "text-white")}>
                                {notif.title}
                              </p>
                              <p className={cn("text-xs mt-1 line-clamp-2", notif.read ? "text-white/50" : "text-white/70")}>
                                {notif.message}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="size-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-2">{formatNotificationTime(notif.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => router.push('/user/notifications')}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                View All Notifications
              </button>
            )}
          </article>
        </div>
      </section>

      <section>
        <header className="flex items-center justify-between text-sm text-white/60">
          <p>Market movers</p>
        </header>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {marketData.length === 0 ? (
            <div className="col-span-full text-center text-white/50 py-8">
              No market data available
            </div>
          ) : (
            marketData.map((index) => (
              <article
                key={index.name}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-4"
              >
                <p className="text-xs text-white/50">{index.name}</p>
                <p className="mt-1 text-xl font-semibold">{formatNumber(index.value)}</p>
                <p className={cn(
                  "flex items-center gap-1",
                  index.change >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {index.change >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {index.change >= 0 ? "+" : ""}
                  {index.change.toFixed(1)} ({index.changePct.toFixed(2)}%)
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">Activity</p>
            <p className="text-xl font-semibold">Recent wallet transactions</p>
          </div>
        </header>
        <div className="mt-4">
          {walletHistory.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/50">
              No wallet transactions yet
            </div>
          ) : (
            <DataTable
              columns={[
                { header: "Txn ID", accessor: (row) => <code className="font-mono text-xs">{row.id}</code> },
                { 
                  header: "Type", 
                  accessor: (row) => (
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      row.type === "deposit" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-rose-500/20 text-rose-400"
                    )}>
                      {row.type}
                    </span>
                  )
                },
                {
                  header: "Amount",
                  accessor: (row) => (
                    <span className={cn(
                      row.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {row.type === "deposit" ? "+" : "-"}
                      {formatCurrency(row.amount, { maximumFractionDigits: 0 })}
                    </span>
                  ),
                },
                { 
                  header: "Status", 
                  accessor: (row) => {
                    const statusMap: Record<string, { label: string; className: string }> = {
                      'pending': { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400' },
                      'completed': { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-400' },
                      'approved': { label: 'Approved', className: 'bg-emerald-500/20 text-emerald-400' },
                      'rejected': { label: 'Rejected', className: 'bg-rose-500/20 text-rose-400' },
                    };
                    const statusInfo = statusMap[row.status] || statusMap['pending'];
                    return (
                      <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", statusInfo.className)}>
                        {statusInfo.label}
                      </span>
                    );
                  }
                },
                { header: "Timestamp", accessor: (row) => formatTimestamp(row.timestamp) },
              ]}
              data={walletHistory}
            />
          )}
        </div>
      </section>
    </UserShell>
  );
}
