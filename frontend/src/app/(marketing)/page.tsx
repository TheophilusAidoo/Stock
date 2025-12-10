'use client';

import { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Download, Play, Shield, Sparkles, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  homepageFeatures,
  ipoHighlights,
  liveMarket,
} from "@/lib/mock-data";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { ScrollAnimate } from "@/components/animations/scroll-animate";
import { api } from "@/lib/api";

export default function HomePage() {
  return (
    <div className="space-y-24 pb-24">
      <HeroSection />
      <LiveMarketSection />
      <IpoHighlightsSection />
      <AppShowcaseSection />
      <FeaturesSection />
      <FinalCta />
    </div>
  );
}

function HeroSection() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      
      if (!userToken) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      const userId = userToken.replace('token-', '');
      
      try {
        const profile = await api.user.getProfile(userId);
        setIsLoggedIn(true);
        setUserName((profile as any)?.name || null);
        setUserEmail((profile as any)?.email || null);
      } catch (error) {
        // If profile fetch fails, still check if token exists
        setIsLoggedIn(!!userToken);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_refreshToken');
    localStorage.removeItem('user_role');
    setIsLoggedIn(false);
    setUserName(null);
    setUserEmail(null);
    router.push('/');
  }

  return (
    <section className="relative overflow-hidden">
      {/* Hero Banner Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHptMTAtMTBjMCAyLjIwOS0xLjc5MSA0LTQgNHMtNC0xLjc5MS00LTQgMS43OTEtNCA0LTQgNCAxLjc5MSA0IDR6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        {/* Trading chart pattern overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
      </div>
      
      <div className="container relative grid gap-12 pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Trusted by 19M+ StockMart investors
          </div>
          <div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              StockMart – A full-stack trading & investment cloud for bold investors.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              One login to glide through KYC, wallet, pro trading, IPOs, and analytics across
              Mobile, Web, and Admin command center. Institutional-grade reliability with retail soul.
            </p>
          </div>
          {loading ? (
            <div className="flex flex-wrap gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-white/60">
                Loading...
              </div>
            </div>
          ) : isLoggedIn ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-white">
                <User className="size-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{userName || 'User'}</span>
                  {userEmail && <span className="text-xs text-white/60">{userEmail}</span>}
                </div>
              </div>
              <Link
                href="/user/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-slate-900"
              >
                Go to Dashboard
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-white/80 hover:bg-white/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-slate-900"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="#live-market"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-white/80"
              >
                Watch Platform Tour
                <Play className="size-4" />
              </Link>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm text-white/60">Activation SLA</p>
              <p className="text-3xl font-semibold">~6 mins</p>
              <p className="text-xs text-white/60">eKYC + segment approvals</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5">
              <p className="text-sm text-white/60">Payout Speed</p>
              <p className="text-3xl font-semibold">T+0.5</p>
              <p className="text-xs text-white/60">Instant wallet &gt; bank</p>
            </div>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/30 via-slate-900 to-slate-900 p-6 text-white shadow-card">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>Unified Wallet</span>
            <Sparkles className="size-4" />
          </div>
          <p className="mt-4 text-4xl font-semibold">₹11,24,890</p>
          <p className="text-xs text-white/60">₹2.4L unsettled • 4 mandates live</p>
          <div className="mt-6 space-y-3">
            {["Equity", "Derivatives", "IPO"].map((label, idx) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{label} Limit</span>
                  <span>{[62, 78, 35][idx]}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${[62, 78, 35][idx]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/60">Quick Stats</p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Active Positions</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Today&apos;s P&L</span>
              <span className="font-semibold text-emerald-400">+₹38,250</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Watchlist Items</span>
              <span className="font-semibold">8</span>
            </div>
          </div>
          <Link
            href="/user/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-3 text-sm text-white/90 transition hover:bg-white/10"
          >
            View Dashboard
            <ArrowRight className="size-4" />
          </Link>
          </div>
        </div>
      </div>
      
      {/* Trading Banner Image Section */}
      <div className="container mt-12 pb-8">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-900/80 via-blue-900/40 to-slate-900/80 p-8 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%),linear-gradient(-45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20"></div>
          
          {/* Trading Dashboard Visual */}
          <div className="relative grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs text-white/60">NIFTY 50</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-400">23,124</p>
                  <p className="text-xs text-emerald-400">+142.40 (+0.64%)</p>
                </div>
                <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-emerald-500/30 to-emerald-500/10">
                  <svg viewBox="0 0 100 50" className="h-full w-full">
                    <polyline points="0,40 20,35 40,30 60,25 80,20 100,15" fill="none" stroke="rgb(16, 185, 129)" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs text-white/60">SENSEX</p>
                  <p className="mt-1 text-xl font-semibold">76,588</p>
                  <p className="text-xs text-rose-400">-32.50 (-0.04%)</p>
                </div>
                <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-rose-500/30 to-rose-500/10">
                  <svg viewBox="0 0 100 50" className="h-full w-full">
                    <polyline points="0,20 20,25 40,30 60,28 80,30 100,32" fill="none" stroke="rgb(244, 63, 94)" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-3">Portfolio Value</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Equity</span>
                    <span className="text-sm font-semibold text-emerald-400">₹42.6L</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">F&O</span>
                    <span className="text-sm font-semibold">₹8.2L</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-1/2 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-3">Active Orders</p>
                <div className="space-y-2">
                  {[
                    { symbol: "RELIANCE", type: "BUY", qty: 25, status: "executed" },
                    { symbol: "TCS", type: "SELL", qty: 10, status: "pending" },
                  ].map((order, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2">
                      <div>
                        <p className="text-xs font-medium">{order.symbol}</p>
                        <p className="text-[10px] text-white/50">{order.type} • {order.qty} qty</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        order.status === 'executed' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveMarketSection() {
  return (
    <section id="live-market" className="container space-y-6">
      <ScrollAnimate direction="up" delay={0}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/50">
              Live Market Overview
            </p>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400">LIVE</span>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold">Pulse across major indices</h2>
            <Link href="/user/market" className="text-sm text-white/70 hover:text-white">
              Dive into market desk →
            </Link>
          </div>
        </div>
      </ScrollAnimate>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {liveMarket.map((index, idx) => (
          <ScrollAnimate key={index.name} direction="up" delay={idx * 100}>
            <article className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-white/60">{index.name}</p>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{formatNumber(index.value)}</p>
            <p
              className={`text-sm ${index.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {index.change >= 0 ? "+" : ""}
              {index.change.toFixed(2)} ({formatPercent(index.changePct)})
            </p>
              <div className="mt-4 h-24 rounded-2xl bg-gradient-to-br from-white/10 to-transparent"></div>
            </article>
          </ScrollAnimate>
        ))}
      </div>
    </section>
  );
}

function IpoHighlightsSection() {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'open':
      case 'live':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'closed':
        return 'bg-white/10 text-white/60 border-white/20';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'Upcoming';
      case 'open':
      case 'live':
        return 'Open';
      case 'closed':
        return 'Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <section className="container space-y-6">
      <ScrollAnimate direction="up" delay={0}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/50">IPO Highlights</p>
            <h2 className="mt-2 text-3xl font-semibold">Prime-booked & curated allocations</h2>
          </div>
          <Link
            href="/user/ipo"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            Manage IPO Pipeline
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </ScrollAnimate>
      <div className="grid gap-6 lg:grid-cols-3">
        {ipoHighlights.map((ipo, idx) => (
          <ScrollAnimate key={ipo.name} direction="up" delay={idx * 150}>
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 hover:bg-white/[0.06] transition">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-white/60 font-medium">{ipo.date}</span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${getStatusColor(ipo.status)}`}>
                  {getStatusLabel(ipo.status)}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{ipo.name}</h3>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-white/70">
                  <span className="text-white/50">Price Band:</span> <span className="font-medium text-white">{ipo.priceBand}</span>
                </p>
                <p className="text-sm text-white/70">
                  <span className="text-white/50">Lot size:</span> <span className="font-medium text-white">{ipo.lotSize} shares</span>
                </p>
              </div>
              <Link
                href="/user/ipo"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/30 hover:text-white transition"
              >
                Apply via ASBA
                <Shield className="size-4" />
              </Link>
            </article>
          </ScrollAnimate>
        ))}
      </div>
    </section>
  );
}

function AppShowcaseSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    setIsLoggedIn(!!userToken);
  }, []);

  return (
    <section id="download" className="relative overflow-hidden">
      {/* Background Banner Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-slate-900/30 to-transparent"></div>
      </div>
      
      <div className="container relative">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          {/* Left Column - Main Content */}
          <ScrollAnimate direction="right" delay={0}>
            <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-brand/20 via-slate-900 to-slate-950 p-8 shadow-card">
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">App Screens</p>
              <h2 className="mt-3 text-3xl font-semibold">Glide through trading & investment</h2>
              <p className="mt-4 text-white/70">
                Experience the StockMart super-app on Web, iOS, and Android. Built on
                a modern design system with biometric auth, 2FA wallets, multi-window trading, and live analytics.
              </p>
              <div className="mt-6 space-y-3 text-sm text-white/70">
                {[
                  "Biometric login + OTP fallback",
                  "Segment-based dashboards with smart nudges",
                  "Deep analytics with live settlement feeds",
                  "Dark mode optimized for long trading sessions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                {isLoggedIn ? (
                  <Link
                    href="/user/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-slate-900 hover:bg-slate-100 transition"
                  >
                    Go to Dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-slate-900 hover:bg-slate-100 transition"
                  >
                    Try in Browser
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            </div>
          </ScrollAnimate>

          {/* Right Column - App Screens */}
          <div className="space-y-6">
            <ScrollAnimate direction="left" delay={200}>
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-brand/10">
                <p className="text-sm text-white/60 mb-4">User App Screen</p>
                <div className="rounded-2xl bg-slate-900 p-5">
                  <p className="text-lg font-semibold mb-4">Trading Blotter</p>
                  <div className="space-y-3">
                    {["NIFTY 50 Futures", "RELIANCE", "BANKNIFTY"].map((symbol, idx) => (
                      <div key={symbol} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{symbol}</p>
                          <p className="text-xs text-white/50 mt-0.5">Qty {idx * 50 + 50} | Avg ₹{3450 + idx * 120}</p>
                        </div>
                        <p className={`text-sm font-semibold ml-4 ${idx % 2 === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {idx % 2 === 0 ? "+₹12,450" : "-₹4,120"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollAnimate>
            
            <ScrollAnimate direction="left" delay={400}>
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-brand/10">
                <p className="text-sm text-white/60 mb-4">Portfolio Overview</p>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-200">₹38,250 profit today</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm text-white/70">Total portfolio value: <span className="font-semibold text-white">{formatCurrency(11_24_890)}</span></p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm text-white/70">Active positions: <span className="font-semibold text-white">12 stocks</span> across Equity & F&O</p>
                  </div>
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </div>
      
      {/* Trading Platform Banner */}
      <div className="container mt-12">
        <ScrollAnimate direction="up" delay={0}>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-slate-800/60 via-blue-900/30 to-slate-900/60 p-12 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,89,255,0.1),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)]"></div>
          
          <div className="relative grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Professional Trading Platform</h3>
                <p className="text-white/70">Advanced charting, real-time data, and institutional-grade execution</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/60 mb-1">Active Trades</p>
                  <p className="text-2xl font-semibold text-emerald-400">1,247</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-white/60 mb-1">Volume Today</p>
                  <p className="text-2xl font-semibold">₹2.4Cr</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">Market Depth</p>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    </span>
                    LIVE
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { price: 3652, qty: 130, side: "Ask" },
                    { price: 3650, qty: 150, side: "Bid" },
                    { price: 3648, qty: 120, side: "Bid" },
                  ].map((level, idx) => (
                    <div key={idx} className={`flex items-center justify-between rounded-lg p-2 ${
                      level.side === 'Ask' ? 'bg-rose-500/10' : 'bg-emerald-500/10'
                    }`}>
                      <span className="text-xs text-white/70">{level.side}</span>
                      <span className="text-sm font-medium">{level.price}</span>
                      <span className="text-xs text-white/50">{level.qty} qty</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="container space-y-6">
      <ScrollAnimate direction="up" delay={0}>
        <div className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.35em] text-white/50">Why StockMart</p>
          <h2 className="text-3xl font-semibold">A StockMart platform stitched for modern teams</h2>
          <p className="max-w-3xl text-white/70">
            Clean architecture, battle-tested APIs, and rich analytics. Bundle the user app, admin
            controls, and data platform in a single deployment.
          </p>
        </div>
      </ScrollAnimate>
      <div className="grid gap-4 md:grid-cols-2">
        {homepageFeatures.map((feature, idx) => (
          <ScrollAnimate key={feature.title} direction="up" delay={idx * 100}>
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs uppercase tracking-widest">
                {feature.badge ?? "StockMart"}
              </span>
              <span>{feature.icon}</span>
            </div>
              <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-white/70">{feature.description}</p>
            </article>
          </ScrollAnimate>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    setIsLoggedIn(!!userToken);
    setLoading(false);
  }, []);

  return (
    <section className="container">
      <ScrollAnimate direction="fade" delay={0}>
        <div className="rounded-[32px] border border-brand/20 bg-gradient-to-br from-brand/30 via-brand/10 to-slate-900 p-10 text-center text-white shadow-card">
        <p className="text-sm uppercase tracking-[0.35em] text-white/80">StockMart Ready?</p>
        <h2 className="mt-4 text-3xl font-semibold">Launch your StockMart-grade stack in days.</h2>
        <p className="mt-3 text-white/80">
          User app, APIs, data pipelines, and compliance guardrails bundled together.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {loading ? (
            <div className="rounded-full bg-white/10 px-6 py-3 text-white/60">Loading...</div>
          ) : isLoggedIn ? (
            <Link
              href="/user/dashboard"
              className="rounded-full bg-white px-6 py-3 text-slate-900"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/register" className="rounded-full bg-white px-6 py-3 text-slate-900">
                Create Account
              </Link>
              <Link
                href="/user/dashboard"
                className="rounded-full border border-white/30 px-6 py-3 text-white/90"
              >
                Explore Platform
              </Link>
            </>
          )}
        </div>
        </div>
      </ScrollAnimate>
    </section>
  );
}

