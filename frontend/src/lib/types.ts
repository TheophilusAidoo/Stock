export type MarketIndex = {
  name: string;
  value: number;
  change: number;
  changePct: number;
};

export type IpoHighlight = {
  name: string;
  date: string;
  priceBand: string;
  lotSize: number;
  status: "open" | "upcoming" | "closed";
};

export type Feature = {
  title: string;
  description: string;
  badge?: string;
  icon: string;
};

export type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  quote: string;
};

export type PortfolioPosition = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
};

export type WatchlistItem = {
  symbol: string;
  price: number;
  change: number;
  volume: number;
};

export type WalletTransaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "completed" | "failed";
  timestamp: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  channel: "app" | "email" | "sms";
};

export type DashboardStat = {
  label: string;
  value: string;
  trend: number;
  helper: string;
  accent?: "positive" | "negative" | "neutral";
};


