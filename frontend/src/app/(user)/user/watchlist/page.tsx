'use client';

import { FormEvent, useState } from "react";
import { UserShell } from "@/components/layout/user-shell";
import { DataTable } from "@/components/ui/data-table";
import { sampleWatchlist } from "@/lib/mock-data";

type WatchItem = (typeof sampleWatchlist)[number];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>(sampleWatchlist);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const symbol = String(formData.get("symbol") || "").toUpperCase();
    const price = Number(formData.get("price"));
    if (!symbol || !price) return;
    setItems([{ symbol, price, change: 0, volume: 0 }, ...items]);
    event.currentTarget.reset();
  }

  return (
    <UserShell title="Watchlist" subtitle="Monitor symbols, sentiment, and liquidity">
      <form onSubmit={handleAdd} className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-4">
        <Field label="Symbol" name="symbol" placeholder="ITC" />
        <Field label="Price" name="price" type="number" placeholder="455" />
        <Field label="Notes" name="notes" placeholder="Optional" className="md:col-span-2" />
        <button className="md:col-span-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
          Add to watchlist
        </button>
      </form>
      <div>
        <DataTable
          columns={[
            { header: "Symbol", accessor: (row) => row.symbol },
            { header: "LTP", accessor: (row) => row.price.toFixed(2) },
            {
              header: "Change",
              accessor: (row) => (
                <span className={row.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                  {row.change >= 0 ? "+" : ""}
                  {row.change.toFixed(2)}%
                </span>
              ),
            },
            { header: "Volume (Cr)", accessor: (row) => row.volume.toFixed(1) },
          ]}
          data={items}
        />
      </div>
    </UserShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <label className="text-white/60">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-white"
      />
    </div>
  );
}

