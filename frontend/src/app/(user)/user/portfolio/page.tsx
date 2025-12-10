'use client';

import { useState, useEffect } from "react";
import { UserShell } from "@/components/layout/user-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, PieChart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
};

type RealizedPnl = {
  id: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  pnl: number;
  executedAt: string;
};

type PortfolioSummary = {
  totalInvested: number;
  totalCurrentValue: number;
  unrealizedPnl: number;
  totalRealizedPnl: number;
  totalPnl: number;
  positionsCount: number;
  positions: Position[];
  realizedPnl: RealizedPnl[];
};

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    try {
      setLoading(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      const data = await api.trading.portfolioSummary(userId);
      setSummary(data as PortfolioSummary);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <UserShell title="Portfolio" subtitle="Positions, allocation, and realized P&L">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  if (!summary) {
    return (
      <UserShell title="Portfolio" subtitle="Positions, allocation, and realized P&L">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/60">No portfolio data available</p>
        </div>
      </UserShell>
    );
  }

  const { totalInvested, totalCurrentValue, unrealizedPnl, totalRealizedPnl, totalPnl, positions, realizedPnl } = summary;

  // Calculate allocation percentages
  const positionsWithAllocation = positions.map(pos => ({
    ...pos,
    allocation: totalCurrentValue > 0 ? (pos.currentValue / totalCurrentValue) * 100 : 0,
  }));

  return (
    <UserShell title="Portfolio" subtitle="Positions, allocation, and realized P&L">
      {/* Portfolio Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-white/60">Portfolio Value</p>
          <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalCurrentValue)}</p>
          <p className="text-xs text-white/60 mt-1">Invested: {formatCurrency(totalInvested)}</p>
        </article>
        
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-white/60">Unrealized P&L</p>
          <p className={cn(
            "mt-2 text-3xl font-semibold flex items-center gap-2",
            unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {unrealizedPnl >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
            {unrealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(unrealizedPnl)}
          </p>
          <p className="text-xs text-white/60 mt-1">
            {totalInvested > 0 ? `${((unrealizedPnl / totalInvested) * 100).toFixed(2)}%` : '0%'}
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-white/60">Realized P&L</p>
          <p className={cn(
            "mt-2 text-3xl font-semibold flex items-center gap-2",
            totalRealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {totalRealizedPnl >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
            {totalRealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(totalRealizedPnl)}
          </p>
          <p className="text-xs text-white/60 mt-1">From closed positions</p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-white/60">Total P&L</p>
          <p className={cn(
            "mt-2 text-3xl font-semibold flex items-center gap-2",
            totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            {totalPnl >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
            {totalPnl >= 0 ? "+" : ""}
            {formatCurrency(totalPnl)}
          </p>
          <p className="text-xs text-white/60 mt-1">Unrealized + Realized</p>
        </article>
      </div>

      {/* Positions Table */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Current Positions ({positions.length})</h2>
        </div>
        {positions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-white/60">No open positions</p>
            <p className="text-xs text-white/40 mt-2">Start trading to see your positions here</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <DataTable
              columns={[
                { 
                  header: "Symbol", 
                  accessor: (row) => (
                    <span className="font-semibold text-white">{row.symbol}</span>
                  )
                },
                { 
                  header: "Quantity", 
                  accessor: (row) => formatNumber(row.quantity)
                },
                {
                  header: "Avg Price",
                  accessor: (row) => formatCurrency(row.avgPrice, { maximumFractionDigits: 2 }),
                },
                {
                  header: "LTP",
                  accessor: (row) => formatCurrency(row.ltp, { maximumFractionDigits: 2 }),
                },
                {
                  header: "Invested",
                  accessor: (row) => formatCurrency(row.invested, { maximumFractionDigits: 0 }),
                },
                {
                  header: "Current Value",
                  accessor: (row) => formatCurrency(row.currentValue, { maximumFractionDigits: 0 }),
                },
                {
                  header: "Allocation",
                  accessor: (row) => (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 rounded-full"
                          style={{ width: `${row.allocation}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60 w-12 text-right">
                        {row.allocation.toFixed(1)}%
                      </span>
                    </div>
                  ),
                },
                {
                  header: "P&L",
                  accessor: (row) => (
                    <div>
                      <div className={cn(
                        "font-semibold",
                        row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {row.pnl >= 0 ? "+" : ""}
                        {formatCurrency(row.pnl, { maximumFractionDigits: 0 })}
                      </div>
                      <div className={cn(
                        "text-xs",
                        row.pnl >= 0 ? "text-emerald-400/70" : "text-rose-400/70"
                      )}>
                        {row.pnlPercent >= 0 ? "+" : ""}
                        {row.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  ),
                },
              ]}
              data={positionsWithAllocation}
            />
          </div>
        )}
      </section>

      {/* Realized P&L Table */}
      {realizedPnl.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Realized P&L ({realizedPnl.length})</h2>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <DataTable
              columns={[
                { 
                  header: "Symbol", 
                  accessor: (row) => (
                    <span className="font-semibold text-white">{row.symbol}</span>
                  )
                },
                { 
                  header: "Quantity", 
                  accessor: (row) => formatNumber(row.quantity)
                },
                {
                  header: "Buy Price",
                  accessor: (row) => formatCurrency(row.buyPrice, { maximumFractionDigits: 2 }),
                },
                {
                  header: "Sell Price",
                  accessor: (row) => formatCurrency(row.sellPrice, { maximumFractionDigits: 2 }),
                },
                {
                  header: "P&L",
                  accessor: (row) => (
                    <span className={cn(
                      "font-semibold",
                      row.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {row.pnl >= 0 ? "+" : ""}
                      {formatCurrency(row.pnl, { maximumFractionDigits: 0 })}
                    </span>
                  ),
                },
                {
                  header: "Date",
                  accessor: (row) => (
                    <span className="text-sm text-white/60">
                      {new Date(row.executedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  ),
                },
              ]}
              data={realizedPnl}
            />
          </div>
        </section>
      )}

      {/* Allocation Chart (Visual) */}
      {positions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio Allocation</h2>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="space-y-3">
              {positionsWithAllocation
                .sort((a, b) => b.allocation - a.allocation)
                .map((pos) => (
                  <div key={pos.symbol} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/80">{pos.symbol}</span>
                      <span className="text-white/60">
                        {pos.allocation.toFixed(1)}% • {formatCurrency(pos.currentValue)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          pos.pnl >= 0 ? "bg-emerald-400/60" : "bg-rose-400/60"
                        )}
                        style={{ width: `${pos.allocation}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}
    </UserShell>
  );
}
