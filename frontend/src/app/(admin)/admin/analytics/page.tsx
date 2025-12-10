'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { AdminShell } from "@/components/layout/admin-shell";

const inflowSeries = [
  { name: "Mon", value: 3.2 },
  { name: "Tue", value: 4.1 },
  { name: "Wed", value: 5.4 },
  { name: "Thu", value: 4.8 },
  { name: "Fri", value: 6.2 },
];

const revenueSplit = [
  { label: "Brokerage", value: "42%" },
  { label: "Interest", value: "34%" },
  { label: "IPO/AMC", value: "18%" },
  { label: "Add-ons", value: "6%" },
];

export default function AdminAnalyticsPage() {
  return (
    <AdminShell title="Analytics" subtitle="Revenue, inflows, and engagement KPIs.">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">Daily Inflows (₹Cr)</h2>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inflowSeries}>
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="10%" stopColor="#1459FF" stopOpacity={0.6} />
                    <stop offset="90%" stopColor="#1459FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1459FF"
                  strokeWidth={3}
                  fill="url(#gradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold">Revenue Split</h2>
          <div className="mt-4 space-y-3 text-sm">
            {revenueSplit.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <span>{item.label}</span>
                <span className="text-white/60">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </AdminShell>
  );
}

