'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, Minus, Clock } from "lucide-react";

type TimedTrade = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  timerDuration: number;
  timerLabel: string;
  profitRate: number;
  status: 'pending' | 'win' | 'lose' | 'draw';
  profitAmount: number;
  expiresAt: string;
  createdAt: string;
  resultSetAt?: string;
};

export default function TimedTradesPage() {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TimedTrade[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'win' | 'lose' | 'draw' | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadTrades();
  }, [filterStatus]);

  async function loadTrades() {
    try {
      setLoading(true);
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const data = await api.admin.getAllTimedTrades(status);
      setTrades(data as TimedTrade[]);
    } catch (error) {
      console.error('Failed to load trades:', error);
    } finally {
      setLoading(false);
    }
  }

  async function setResult(tradeId: string, result: 'win' | 'lose' | 'draw') {
    if (!confirm(`Are you sure you want to set this trade as ${result.toUpperCase()}?`)) {
      return;
    }

    try {
      setProcessingId(tradeId);
      await api.admin.setTradeResult(tradeId, result);
      await loadTrades();
    } catch (error) {
      console.error('Failed to set trade result:', error);
      alert(error instanceof Error ? error.message : 'Failed to set trade result');
    } finally {
      setProcessingId(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'win':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="size-3" />
            WIN
          </span>
        );
      case 'lose':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400">
            <XCircle className="size-3" />
            LOSE
          </span>
        );
      case 'draw':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            <Minus className="size-3" />
            DRAW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            <Clock className="size-3" />
            PENDING
          </span>
        );
    }
  };

  const pendingTrades = trades.filter(t => t.status === 'pending');
  const processedTrades = trades.filter(t => t.status !== 'pending');

  if (loading) {
    return (
      <AdminShell title="Timed Trades" subtitle="Manage and set results for timed trades">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Timed Trades" subtitle="Manage and set results for timed trades">
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              filterStatus === 'all'
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            All ({trades.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              filterStatus === 'pending'
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Pending ({pendingTrades.length})
          </button>
          <button
            onClick={() => setFilterStatus('win')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              filterStatus === 'win'
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Win
          </button>
          <button
            onClick={() => setFilterStatus('lose')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              filterStatus === 'lose'
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Lose
          </button>
          <button
            onClick={() => setFilterStatus('draw')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              filterStatus === 'draw'
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-white/60 hover:text-white"
            )}
          >
            Draw
          </button>
        </div>

        {/* Pending Trades */}
        {filterStatus === 'all' || filterStatus === 'pending' ? (
          pendingTrades.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Trades</h2>
              <div className="space-y-3">
                {pendingTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-white">{trade.userName}</p>
                          <span className="text-xs text-white/50">{trade.userEmail}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-white/60">Amount</p>
                            <p className="font-semibold text-white">{formatCurrency(trade.amount)}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Timer</p>
                            <p className="font-semibold text-white">{trade.timerLabel}</p>
                          </div>
                          <div>
                            <p className="text-white/60">Profit Rate</p>
                            <p className="font-semibold text-white">{trade.profitRate}%</p>
                          </div>
                          <div>
                            <p className="text-white/60">Expires At</p>
                            <p className="font-semibold text-white">{formatDate(trade.expiresAt)}</p>
                          </div>
                        </div>
                        {trade.status === 'pending' && new Date(trade.expiresAt) < new Date() && (
                          <p className="mt-2 text-xs text-yellow-400">⚠️ Timer expired - waiting for admin result</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {getStatusBadge(trade.status)}
                        {trade.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setResult(trade.id, 'win')}
                              disabled={processingId === trade.id}
                              className="rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium transition hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              {processingId === trade.id ? "Processing..." : "Set WIN"}
                            </button>
                            <button
                              onClick={() => setResult(trade.id, 'lose')}
                              disabled={processingId === trade.id}
                              className="rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 text-xs font-medium transition hover:bg-rose-500/30 disabled:opacity-50"
                            >
                              {processingId === trade.id ? "Processing..." : "Set LOSE"}
                            </button>
                            <button
                              onClick={() => setResult(trade.id, 'draw')}
                              disabled={processingId === trade.id}
                              className="rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 text-xs font-medium transition hover:bg-yellow-500/30 disabled:opacity-50"
                            >
                              {processingId === trade.id ? "Processing..." : "Set DRAW"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : null}

        {/* Processed Trades Table */}
        {processedTrades.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 px-6 pt-6">Trade History</h2>
            <DataTable
              columns={[
                { header: "User", accessor: (row) => (
                  <div>
                    <p className="font-semibold text-sm">{row.userName}</p>
                    <p className="text-xs text-white/50">{row.userEmail}</p>
                  </div>
                )},
                { header: "Amount", accessor: (row) => formatCurrency(row.amount) },
                { header: "Timer", accessor: (row) => row.timerLabel },
                { header: "Profit Rate", accessor: (row) => `${row.profitRate}%` },
                { header: "Status", accessor: (row) => getStatusBadge(row.status) },
                { header: "Profit", accessor: (row) => (
                  <span className={cn(
                    "font-semibold",
                    row.status === 'win' ? "text-emerald-400" : "text-white/60"
                  )}>
                    {row.status === 'win' ? `+${formatCurrency(row.profitAmount)}` : '-'}
                  </span>
                )},
                { header: "Created", accessor: (row) => formatDate(row.createdAt) },
                { header: "Result Set", accessor: (row) => row.resultSetAt ? formatDate(row.resultSetAt) : '-' },
              ]}
              data={processedTrades}
            />
          </div>
        )}

        {trades.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-white/60">No timed trades found</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}












