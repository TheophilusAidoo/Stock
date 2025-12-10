import {
  DashboardStat,
  Feature,
  IpoHighlight,
  MarketIndex,
  NotificationItem,
  PortfolioPosition,
  Testimonial,
  WalletTransaction,
  WatchlistItem,
} from "./types";

export const liveMarket: MarketIndex[] = [
  { name: "NIFTY 50", value: 23124.6, change: 142.4, changePct: 0.64 },
  { name: "SENSEX", value: 76588.9, change: -32.5, changePct: -0.04 },
  { name: "BANK NIFTY", value: 49855.3, change: 312.8, changePct: 0.63 },
  { name: "FINNIFTY", value: 21545.8, change: 88.1, changePct: 0.41 },
];

export const ipoHighlights: IpoHighlight[] = [
  {
    name: "Nova Mobility",
    date: "Opens 15 Dec",
    priceBand: "₹142 - ₹152",
    lotSize: 96,
    status: "upcoming",
  },
  {
    name: "Zenith Renewables",
    date: "Closes 05 Dec",
    priceBand: "₹325 - ₹341",
    lotSize: 42,
    status: "open",
  },
  {
    name: "Nimbus Fintech",
    date: "Listed 21 Nov",
    priceBand: "₹540 - ₹555",
    lotSize: 27,
    status: "closed",
  },
];

export const homepageFeatures: Feature[] = [
  {
    title: "Unified Trading Stack",
    description: "Trade equities, F&O, forex, ETFs, commodities, and mutual funds from a single blotter with pro-grade depth.",
    badge: "Pro",
    icon: "layers",
  },
  {
    title: "Instant Payments & Wallet",
    description: "2-factor protected wallet with instant UPI, netbanking, or mandate-based funding and payouts.",
    icon: "wallet",
  },
  {
    title: "IPO Concierge",
    description: "Prioritized allotment insights, curated research, and one-click ASBA applications.",
    icon: "sparkles",
  },
  {
    title: "AI Co-pilot",
    description: "Portfolio health checks, risk nudges, and actionable insights powered by StockMart AI.",
    icon: "bot",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Aditi Sharma",
    role: "StockMart Prime Investor",
    avatar: "AS",
    quote:
      "StockMart is the first platform that genuinely feels institutional yet intuitive. The IPO desk and wallet ops team shave hours off my week.",
  },
  {
    name: "Karan Bedi",
    role: "Founder, QuantEdge",
    avatar: "KB",
    quote:
      "Real-time risk, snappy market data, and crisp APIs. We plugged our quant stack into StockMart within a weekend.",
  },
  {
    name: "Rhea Talreja",
    role: "Wealth Manager",
    avatar: "RT",
    quote:
      "Client onboarding with eKYC plus admin analytics means I focus on strategy while StockMart automates everything else.",
  },
];

export const samplePortfolio: PortfolioPosition[] = [
  { symbol: "TCS", quantity: 25, avgPrice: 3521, ltp: 3695, pnl: 4350 },
  { symbol: "RELIANCE", quantity: 18, avgPrice: 2540, ltp: 2489, pnl: -918 },
  { symbol: "INFY", quantity: 40, avgPrice: 1499, ltp: 1558, pnl: 2360 },
  { symbol: "ADANIGREEN", quantity: 30, avgPrice: 930, ltp: 1012, pnl: 2460 },
];

export const sampleWatchlist: WatchlistItem[] = [
  { symbol: "RELIANCE", price: 2489.5, change: 0.85, volume: 12.4 },
  { symbol: "TCS", price: 3695.2, change: 1.24, volume: 8.7 },
  { symbol: "HDFCBANK", price: 1653.5, change: 0.52, volume: 15.2 },
  { symbol: "INFY", price: 1558.8, change: -0.34, volume: 9.3 },
  { symbol: "ICICIBANK", price: 1089.4, change: 0.67, volume: 11.6 },
  { symbol: "HINDUNILVR", price: 2545.6, change: -0.12, volume: 3.8 },
  { symbol: "SBIN", price: 612.3, change: 0.91, volume: 18.5 },
  { symbol: "BHARTIARTL", price: 1189.7, change: 1.45, volume: 7.2 },
  { symbol: "ITC", price: 455.4, change: -0.88, volume: 5.4 },
  { symbol: "KOTAKBANK", price: 1789.2, change: 0.23, volume: 4.6 },
  { symbol: "LT", price: 3456.8, change: 0.56, volume: 2.9 },
  { symbol: "AXISBANK", price: 1123.4, change: -0.45, volume: 13.7 },
  { symbol: "ASIANPAINT", price: 2890.5, change: 0.78, volume: 1.5 },
  { symbol: "MARUTI", price: 10234.6, change: -0.23, volume: 2.3 },
  { symbol: "TITAN", price: 3456.7, change: 1.12, volume: 1.8 },
  { symbol: "ULTRACEMCO", price: 9876.5, change: 0.34, volume: 0.9 },
  { symbol: "NESTLEIND", price: 24567.8, change: -0.56, volume: 0.4 },
  { symbol: "WIPRO", price: 456.3, change: 0.67, volume: 6.2 },
  { symbol: "ONGC", price: 234.5, change: 1.23, volume: 14.8 },
  { symbol: "POWERGRID", price: 278.9, change: 0.45, volume: 8.1 },
];

export const walletFeed: WalletTransaction[] = [
  { id: "TXN2041", type: "deposit", amount: 250000, status: "completed", timestamp: "Today • 09:15 AM" },
  { id: "TXN2032", type: "withdrawal", amount: 80000, status: "pending", timestamp: "Yesterday • 07:45 PM" },
  { id: "TXN1999", type: "deposit", amount: 125000, status: "completed", timestamp: "22 Nov • 02:10 PM" },
];

export const notificationFeed: NotificationItem[] = [
  {
    id: "NTF01",
    title: "KYC Verified",
    message: "Your full CKYC has been verified. Derivatives access unlocked.",
    timestamp: "2h ago",
    read: false,
    channel: "app",
  },
  {
    id: "NTF02",
    title: "IPO Update",
    message: "Zenith Renewables: Retail book subscribed 3.4x. Allotment tomorrow.",
    timestamp: "6h ago",
    read: false,
    channel: "app",
  },
  {
    id: "NTF03",
    title: "Funds Settled",
    message: "₹80,000 payout settled to HDFC ****9214.",
    timestamp: "1d ago",
    read: true,
    channel: "sms",
  },
];

export const dashboardStats: DashboardStat[] = [
  { label: "Net Worth", value: "₹42.6L", trend: 4.8, helper: "vs last week", accent: "positive" },
  { label: "Day P&L", value: "+₹38,250", trend: 2.1, helper: "Across 12 positions", accent: "positive" },
  { label: "Margin Utilized", value: "58%", trend: -3.1, helper: "Room for 5 more lots", accent: "neutral" },
  { label: "Cash Available", value: "₹11.2L", trend: 1.6, helper: "Includes unsettled funds", accent: "neutral" },
];


