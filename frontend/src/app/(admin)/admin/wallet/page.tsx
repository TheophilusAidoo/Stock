import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { walletFeed } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

const reconciliations = [
  { bank: "HDFC Pool", balance: "₹12.4Cr", variance: "+₹12L" },
  { bank: "ICICI Pool", balance: "₹8.2Cr", variance: "-₹2L" },
];

export default function AdminWalletPage() {
  return (
    <AdminShell title="Wallet Ops" subtitle="Manage deposits, payouts, and bank reconciliations.">
      <section className="grid gap-4 md:grid-cols-2">
        {reconciliations.map((row) => (
          <article key={row.bank} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/60">{row.bank}</p>
            <p className="text-2xl font-semibold">{row.balance}</p>
            <p className={row.variance.startsWith("+") ? "text-emerald-400" : "text-rose-400"}>
              {row.variance}
            </p>
          </article>
        ))}
      </section>
      <section>
        <h2 className="text-lg font-semibold">Wallet Queue</h2>
        <div className="mt-4">
          <DataTable
            columns={[
              { header: "Txn ID", accessor: (row) => row.id },
              { header: "Type", accessor: (row) => row.type },
              { header: "Amount", accessor: (row) => `₹${formatNumber(row.amount)}` },
              { header: "Status", accessor: (row) => row.status },
              { header: "Timestamp", accessor: (row) => row.timestamp },
            ]}
            data={walletFeed}
          />
        </div>
      </section>
    </AdminShell>
  );
}


