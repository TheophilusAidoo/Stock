export const siteConfig = {
  name: "StockMart",
  tagline: "Unified investing for the next billion",
  description:
    "StockMart merges pro-grade trading tools with a concierge investing experience for retail and HNI investors alike.",
  contactEmail: "support@stockmart.com",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/company/stockmart" },
    { label: "Twitter", href: "https://x.com/stockmart" },
    { label: "YouTube", href: "https://youtube.com/@stockmart" },
  ],
};

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Markets", href: "/user/market" },
  { label: "IPO Desk", href: "/user/ipo" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "#support" },
];

export const userNav = [
  { label: "Dashboard", href: "/user/dashboard" },
  { label: "Wallet", href: "/user/wallet" },
  { label: "Trading", href: "/user/trading" },
  { label: "Portfolio", href: "/user/portfolio" },
  { label: "Watchlist", href: "/user/watchlist" },
  { label: "IPO Apply", href: "/user/ipo" },
  { label: "Notifications", href: "/user/notifications" },
  { label: "Support Tickets", href: "/user/settings?tab=help" },
  { label: "Settings", href: "/user/settings" },
];

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "KYC Desk", href: "/admin/kyc" },
  { label: "Deposits", href: "/admin/deposits" },
  { label: "Withdrawals", href: "/admin/withdrawals" },
  { label: "Payment Gateway", href: "/admin/payment-gateway" },
  { label: "Withdrawal Methods", href: "/admin/withdrawal-methods" },
  { label: "Wallet Ops", href: "/admin/wallet" },
  {
    label: "IPO Desk",
    href: "/admin/ipos",
    children: [
      { label: "IPO Desk", href: "/admin/ipos" },
      { label: "IPO Applications", href: "/admin/ipos/applications" },
    ],
  },
  {
    label: "Trading",
    href: "/admin/trading-settings",
    children: [
      { label: "Trading Settings", href: "/admin/trading-settings" },
      { label: "Timed Trades", href: "/admin/timed-trades" },
    ],
  },
  { label: "Stocks", href: "/admin/stocks" },
  { label: "Support Tickets", href: "/admin/support-tickets" },
];


