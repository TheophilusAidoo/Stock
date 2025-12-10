import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { sampleWatchlist } from "@/lib/mock-data";

export default function AdminStocksPage() {
  return (
    <AdminShell title="Stock Master" subtitle="Manage listing metadata, circuit limits, and availability.">
      <DataTable
        columns={[
          { header: "Symbol", accessor: (row) => row.symbol },
          { header: "Price", accessor: (row) => row.price.toFixed(2) },
          { header: "Change", accessor: (row) => row.change.toFixed(2) },
          { header: "Volume", accessor: (row) => row.volume.toFixed(1) },
        ]}
        data={sampleWatchlist}
      />
      <p className="mt-4 text-sm text-white/60">
        Update listing level details via Admin APIs or CSV ingest.
      </p>
    </AdminShell>
  );
}


