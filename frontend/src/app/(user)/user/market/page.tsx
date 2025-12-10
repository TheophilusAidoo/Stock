import { liveMarket, sampleWatchlist } from "@/lib/mock-data";
import { UserShell } from "@/components/layout/user-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatNumber } from "@/lib/utils";

export default function MarketPage() {
  return (
    <UserShell title="Market Data" subtitle="Realtime indices, depth, and sentiment">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {liveMarket.map((index) => (
          <article
            key={index.name}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-xs text-white/60">{index.name}</p>
            <p className="mt-2 text-2xl font-semibold">{formatNumber(index.value)}</p>
            <p className={index.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {index.change >= 0 ? "+" : ""}
              {index.change.toFixed(2)} ({index.changePct.toFixed(2)}%)
            </p>
            <div className="mt-4 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
          </article>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold">Depth Snapshot</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <DepthCard side="Bids" data={[{ price: 3650, qty: 150 }, { price: 3648, qty: 120 }]} />
          <DepthCard side="Asks" data={[{ price: 3652, qty: 130 }, { price: 3655, qty: 140 }]} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Top Movers</h2>
        <div className="mt-4">
          <DataTable
            columns={[
              { header: "Symbol", accessor: (row) => row.symbol },
              { header: "Price", accessor: (row) => row.price.toFixed(2) },
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
            data={sampleWatchlist}
          />
        </div>
      </section>
    </UserShell>
  );
}

function DepthCard({
  side,
  data,
}: {
  side: string;
  data: Array<{ price: number; qty: number }>;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm">
      <h3 className="text-white/70">{side}</h3>
      <div className="mt-3 space-y-3">
        {data.map((row) => (
          <div key={row.price} className="flex items-center justify-between">
            <p>{row.price.toFixed(2)}</p>
            <p className="text-white/60">{row.qty} qty</p>
          </div>
        ))}
      </div>
    </article>
  );
}


