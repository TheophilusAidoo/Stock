'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Eye, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";

type Deposit = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  channel: string;
  transactionHash?: string;
  screenshotData?: string;
  screenshotType?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
};

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUserId, setFilterUserId] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadDeposits();
  }, [filterUserId]);

  async function loadUsers() {
    try {
      const data = await api.admin.users();
      setUsers(data as any[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function loadDeposits() {
    try {
      setLoading(true);
      const data = await api.admin.getAllDeposits(filterUserId || undefined);
      setDeposits(data as Deposit[]);
    } catch (error) {
      console.error('Failed to load deposits:', error);
      setMessage('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setProcessing(id);
      await api.admin.approveDeposit(id);
      setMessage('Deposit approved successfully');
      await loadDeposits();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to approve deposit');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessing(id);
      await api.admin.rejectDeposit(id);
      setMessage('Deposit rejected');
      await loadDeposits();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to reject deposit');
    } finally {
      setProcessing(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(null), 2000);
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const processedDeposits = deposits.filter(d => d.status !== 'pending');

  if (loading) {
    return (
      <AdminShell title="Deposit Approvals" subtitle="Loading deposits...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Deposit Management" subtitle="View and manage all user deposits">
      {/* User Filter */}
      <div className="mb-6">
        <label className="mb-2 block text-sm text-white/60">Filter by User</label>
        <select
          value={filterUserId}
          onChange={(e) => setFilterUserId(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
        >
          <option value="" className="bg-slate-900">All Users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="bg-slate-900">
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>
      {pendingDeposits.length === 0 && processedDeposits.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/60">No deposits found</p>
        </div>
      )}

      {pendingDeposits.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Pending Approval ({pendingDeposits.length})
          </h3>
          {pendingDeposits.map((deposit) => (
            <article
              key={deposit.id}
              className="rounded-3xl border border-yellow-500/20 bg-white/[0.02] p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-white/60">User</p>
                    <p className="text-lg font-semibold">{deposit.userName || 'Unknown'}</p>
                    <p className="text-sm text-white/60">{deposit.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Amount</p>
                    <p className="text-2xl font-semibold text-emerald-400">
                      {formatCurrency(deposit.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Transaction Hash</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 font-mono">
                        {deposit.transactionHash || 'Not provided'}
                      </code>
                      {deposit.transactionHash && (
                        <button
                          onClick={() => copyToClipboard(deposit.transactionHash!)}
                          className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10 transition"
                        >
                          <Copy className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-sm text-white/80">{formatDate(deposit.timestamp)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {deposit.screenshotData && (
                    <div>
                      <p className="text-sm text-white/60 mb-2">Transaction Screenshot</p>
                      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3">
                        <img
                          src={deposit.screenshotData}
                          alt="Transaction screenshot"
                          className="w-full h-48 object-contain rounded-lg cursor-pointer"
                          onClick={() => setViewingScreenshot(deposit.id)}
                        />
                        <button
                          onClick={() => setViewingScreenshot(deposit.id)}
                          className="absolute top-4 right-4 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 transition"
                        >
                          <Eye className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApprove(deposit.id)}
                      disabled={processing === deposit.id}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-500",
                        processing === deposit.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processing === deposit.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(deposit.id)}
                      disabled={processing === deposit.id}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
                        processing === deposit.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processing === deposit.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {processedDeposits.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Transaction History ({processedDeposits.length})
          </h3>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <DataTable
              columns={[
                { header: "Txn ID", accessor: (row) => row.id },
                { header: "User", accessor: (row) => (
                  <div>
                    <p className="font-semibold text-white">{row.userName || 'Unknown'}</p>
                    <p className="text-xs text-white/60">{row.userEmail}</p>
                  </div>
                )},
                { header: "Amount", accessor: (row) => (
                  <span className="font-semibold text-emerald-400">
                    {formatCurrency(row.amount)}
                  </span>
                )},
                { header: "Channel", accessor: (row) => (
                  <span className="text-white/80">{row.channel || 'N/A'}</span>
                )},
                { header: "Status", accessor: (row) => (
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    row.status === 'approved'
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  )}>
                    {row.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                )},
                { header: "Timestamp", accessor: (row) => formatDate(row.timestamp) },
              ]}
              data={processedDeposits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
            />
          </div>
        </div>
      )}

      {message && (
        <div className={cn(
          "mt-4 rounded-2xl border p-4 text-sm",
          message.includes("successfully") || message.includes("Copied")
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        )}>
          {message}
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {viewingScreenshot && (() => {
        const deposit = deposits.find(d => d.id === viewingScreenshot);
        if (!deposit || !deposit.screenshotData) return null;
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setViewingScreenshot(null)}
          >
            <div 
              className="relative max-w-2xl rounded-2xl bg-slate-900 border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transaction Screenshot</h3>
                <button
                  onClick={() => setViewingScreenshot(null)}
                  className="rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20 transition"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
              <img 
                src={deposit.screenshotData} 
                alt="Transaction screenshot"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        );
      })()}
    </AdminShell>
  );
}

