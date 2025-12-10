import Link from "next/link";
import { siteConfig } from "@/lib/constants";

const footerLinks = [
  {
    label: "Platform",
    items: [
      { label: "User App", href: "/user/dashboard" },
      { label: "Market Data", href: "/user/market" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Market Data", href: "/user/market" },
      { label: "IPO Desk", href: "/user/ipo" },
      { label: "Support", href: "#support" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#030b1e]">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.5fr_1fr] lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="text-lg font-semibold text-white">{siteConfig.name}</p>
          <p className="mt-4 max-w-sm text-sm text-white/70">{siteConfig.description}</p>
          <p className="mt-6 text-sm text-white/50">{siteConfig.contactEmail}</p>
        </div>
        {footerLinks.map((group) => (
          <div key={group.label}>
            <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
              {group.label}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {group.items.map((item, itemIndex) => (
                <li key={`${group.label}-${itemIndex}-${item.href}-${item.label}`}>
                  <Link href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © 2024 StockMart. SEBI Regn. No. INZ00016134.
      </div>
    </footer>
  );
}


