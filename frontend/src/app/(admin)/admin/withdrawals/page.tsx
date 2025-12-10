'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";

type Withdrawal = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  channel: string;
  methodId?: string;
  withdrawalAccount?: string;
  withdrawalDetails?: Record<string, string>;
  fee?: number;
  finalAmount?: number;
  rejectionReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filterUserId, setFilterUserId] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [filterUserId]);

  async function loadUsers() {
    try {
      const data = await api.admin.users();
      setUsers(data as any[]);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function loadWithdrawals() {
    try {
      setLoading(true);
      const data = await api.admin.getAllWithdrawals(filterUserId || undefined);
      setWithdrawals(data as Withdrawal[]);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
      setMessage('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setProcessing(id);
      await api.admin.approveWithdrawal(id);
      setMessage('Withdrawal approved successfully');
      await loadWithdrawals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to approve withdrawal');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      setMessage('Please enter a rejection reason');
      return;
    }
    try {
      setProcessing(id);
      await api.admin.rejectWithdrawal(id, rejectReason);
      setMessage('Withdrawal rejected');
      setRejectingId(null);
      setRejectReason('');
      await loadWithdrawals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to reject withdrawal');
    } finally {
      setProcessing(null);
    }
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

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pending');

  if (loading) {
    return (
      <AdminShell title="Withdrawal Approvals" subtitle="Loading withdrawals...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Withdrawal Management" subtitle="View and manage all user withdrawals">
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
      {pendingWithdrawals.length === 0 && processedWithdrawals.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/60">No withdrawals found</p>
        </div>
      )}

      {pendingWithdrawals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Pending Approval ({pendingWithdrawals.length})
          </h3>
          {pendingWithdrawals.map((withdrawal) => (
            <article
              key={withdrawal.id}
              className="rounded-3xl border border-yellow-500/20 bg-white/[0.02] p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-white/60">User</p>
                    <p className="text-lg font-semibold">{withdrawal.userName || 'Unknown'}</p>
                    <p className="text-sm text-white/60">{withdrawal.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Withdrawal Method</p>
                    <p className="text-lg font-semibold">{withdrawal.channel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Withdrawal Account</p>
                    <p className="text-sm text-white/80 font-mono">{withdrawal.withdrawalAccount || 'N/A'}</p>
                    {withdrawal.withdrawalDetails && Object.keys(withdrawal.withdrawalDetails).length > 0 && (
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                        {Object.entries(withdrawal.withdrawalDetails).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-white/60">{key}:</span>
                            <span className="text-white/80">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Amount</p>
                    <p className="text-2xl font-semibold text-rose-400">
                      {formatCurrency(withdrawal.amount)}
                    </p>
                    {withdrawal.fee && withdrawal.fee > 0 && (
                      <div className="mt-1 text-sm text-white/60">
                        <span>Fee: {formatCurrency(withdrawal.fee)}</span>
                        {withdrawal.finalAmount && (
                          <span className="ml-2">Final: {formatCurrency(withdrawal.finalAmount)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-sm text-white/80">{formatDate(withdrawal.timestamp)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rejectingId === withdrawal.id ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <label className="block text-sm font-medium text-white/70">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Enter reason for rejection..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-rose-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(withdrawal.id)}
                          disabled={processing === withdrawal.id}
                          className={cn(
                            "flex-1 rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500",
                            processing === withdrawal.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {processing === withdrawal.id ? (
                            <Loader2 className="size-4 animate-spin mx-auto" />
                          ) : (
                            "Confirm Reject"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleApprove(withdrawal.id)}
                        disabled={processing === withdrawal.id}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/80 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-500",
                          processing === withdrawal.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {processing === withdrawal.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="size-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setRejectingId(withdrawal.id)}
                        disabled={processing === withdrawal.id}
                        className={cn(
                          "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
                          processing === withdrawal.id && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <XCircle className="size-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {processedWithdrawals.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Transaction History ({processedWithdrawals.length})
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
                  <div>
                    <span className="font-semibold text-rose-400">
                      {formatCurrency(row.amount)}
                    </span>
                    {row.fee && row.fee > 0 && (
                      <p className="text-xs text-white/60 mt-1">
                        Fee: {formatCurrency(row.fee)}
                        {row.finalAmount && ` • Final: ${formatCurrency(row.finalAmount)}`}
                      </p>
                    )}
                  </div>
                )},
                { header: "Method", accessor: (row) => (
                  <div>
                    <span className="text-white/80">{row.channel || 'N/A'}</span>
                    {row.withdrawalAccount && (
                      <p className="text-xs text-white/60 mt-1 font-mono">{row.withdrawalAccount}</p>
                    )}
                  </div>
                )},
                { header: "Status", accessor: (row) => (
                  <div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      row.status === 'approved'
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    )}>
                      {row.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    {row.rejectionReason && (
                      <p className="text-xs text-rose-400 mt-1">Reason: {row.rejectionReason}</p>
                    )}
                  </div>
                )},
                { header: "Timestamp", accessor: (row) => formatDate(row.timestamp) },
              ]}
              data={processedWithdrawals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
            />
          </div>
        </div>
      )}

      {message && (
        <div className={cn(
          "mt-4 rounded-2xl border p-4 text-sm",
          message.includes("successfully") || message.includes("approved")
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        )}>
          {message}
        </div>
      )}
    </AdminShell>
  );
}

