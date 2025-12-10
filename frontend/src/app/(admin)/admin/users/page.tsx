'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2, Trash2, Plus, Minus, Wallet, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  segment: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  balance?: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adjustingBalance, setAdjustingBalance] = useState<string | null>(null);
  const [showBalanceModal, setShowBalanceModal] = useState<{ userId: string; userName: string; currentBalance: number } | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'add' | 'deduct'>('add');
  const [balanceReason, setBalanceReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.admin.users();
      // Fetch balances for each user
      const usersWithBalance = await Promise.all(
        (data as User[]).map(async (user) => {
          try {
            const balance = await api.wallet.balance(user.id);
            return { ...user, balance: balance.balance || 0 };
          } catch {
            return { ...user, balance: 0 };
          }
        })
      );
      setUsers(usersWithBalance);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string) {
    try {
      setProcessing(userId);
      await api.admin.approveUser(userId);
      await loadUsers(); // Reload users after approval
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(userId: string) {
    try {
      setProcessing(userId);
      await api.admin.rejectUser(userId);
      await loadUsers(); // Reload users after rejection
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user');
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone and will delete all associated data.`)) {
      return;
    }

    try {
      setProcessing(userId);
      await api.admin.deleteUser(userId);
      await loadUsers(); // Reload users after deletion
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setProcessing(null);
    }
  }

  function openBalanceModal(user: User) {
    setShowBalanceModal({
      userId: user.id,
      userName: user.name,
      currentBalance: user.balance || 0,
    });
    setBalanceAmount('');
    setBalanceType('add');
    setBalanceReason('');
  }

  function closeBalanceModal() {
    setShowBalanceModal(null);
    setBalanceAmount('');
    setBalanceType('add');
    setBalanceReason('');
  }

  async function handleAdjustBalance() {
    if (!showBalanceModal) return;
    
    const amount = Number(balanceAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (balanceType === 'deduct' && amount > showBalanceModal.currentBalance) {
      alert(`Insufficient balance. Current balance: ${formatCurrency(showBalanceModal.currentBalance)}`);
      return;
    }

    if (!confirm(
      `Are you sure you want to ${balanceType === 'add' ? 'add' : 'deduct'} ${formatCurrency(amount)} ${balanceType === 'add' ? 'to' : 'from'} ${showBalanceModal.userName}'s account?`
    )) {
      return;
    }

    try {
      setAdjustingBalance(showBalanceModal.userId);
      await api.admin.adjustUserBalance(showBalanceModal.userId, {
        amount,
        type: balanceType,
        reason: balanceReason || undefined,
      });
      await loadUsers();
      closeBalanceModal();
      alert(`Balance ${balanceType === 'add' ? 'added' : 'deducted'} successfully!`);
    } catch (error) {
      console.error('Failed to adjust balance:', error);
      alert(error instanceof Error ? error.message : 'Failed to adjust balance');
    } finally {
      setAdjustingBalance(null);
    }
  }

  const filtered = users.filter((user) => {
    if (filter === "All") return true;
    const status = user.status.charAt(0).toUpperCase() + user.status.slice(1);
    return status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <AdminShell title="Users" subtitle="Loading users...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Users"
      subtitle="Approve users, manage segments, and enforce policies."
      actions={
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-2xl border border-white/20 bg-transparent px-4 py-2 text-sm"
        >
          {["All", "Approved", "Pending", "Rejected"].map((item) => (
            <option key={item} value={item} className="bg-slate-900 text-white">
              {item}
            </option>
          ))}
        </select>
      }
    >
      <DataTable
        columns={[
          { header: "Name", accessor: (row) => row.name },
          { header: "Email", accessor: (row) => row.email },
          { 
            header: "Balance", 
            accessor: (row) => (
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-white/60" />
                <span className="font-semibold text-white">{formatCurrency(row.balance || 0)}</span>
              </div>
            )
          },
          {
            header: "Status",
            accessor: (row) => (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  row.status === "approved"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : row.status === "rejected"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-yellow-500/20 text-yellow-400"
                )}
              >
                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
              </span>
            ),
          },
          {
            header: "KYC Status",
            accessor: (row) => (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                  row.kycStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : row.kycStatus === "rejected"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-yellow-500/20 text-yellow-400"
                )}
              >
                {row.kycStatus.charAt(0).toUpperCase() + row.kycStatus.slice(1)}
              </span>
            ),
          },
          { header: "Segment", accessor: (row) => row.segment || "Equity" },
          { header: "Created", accessor: (row) => formatDate(row.createdAt) },
          {
            header: "Actions",
            accessor: (row) => (
              <div className="flex items-center gap-2">
                {row.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(row.id)}
                      disabled={processing === row.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/30",
                        processing === row.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processing === row.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(row.id)}
                      disabled={processing === row.id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/30",
                        processing === row.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processing === row.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <XCircle className="size-3" />
                      )}
                      Decline
                    </button>
                  </>
                )}
                {row.status !== "pending" && (
                  <span className="text-xs text-white/50">
                    {row.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                )}
                <button
                  onClick={() => openBalanceModal(row)}
                  disabled={processing === row.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/30",
                    processing === row.id && "opacity-50 cursor-not-allowed"
                  )}
                  title="Adjust balance"
                >
                  <Wallet className="size-3" />
                  Balance
                </button>
                <button
                  onClick={() => handleDelete(row.id, row.name)}
                  disabled={processing === row.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/30",
                    processing === row.id && "opacity-50 cursor-not-allowed"
                  )}
                  title="Delete user"
                >
                  {processing === row.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
      />

      {/* Balance Adjustment Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={closeBalanceModal}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                <Wallet className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Adjust Balance</h3>
                <p className="text-sm text-white/60">{showBalanceModal.userName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/60 mb-1">Current Balance</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(showBalanceModal.currentBalance)}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Action <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceType('add')}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-3 text-sm font-medium transition",
                      balanceType === 'add'
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Plus className="size-4 mx-auto mb-1" />
                    Add Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceType('deduct')}
                    className={cn(
                      "flex-1 rounded-xl px-4 py-3 text-sm font-medium transition",
                      balanceType === 'deduct'
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Minus className="size-4 mx-auto mb-1" />
                    Deduct Money
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Amount <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
                {balanceAmount && Number(balanceAmount) > 0 && (
                  <p className="mt-2 text-xs text-white/60">
                    {balanceType === 'add' ? 'New balance' : 'Remaining balance'}: {formatCurrency(
                      balanceType === 'add' 
                        ? showBalanceModal.currentBalance + Number(balanceAmount)
                        : showBalanceModal.currentBalance - Number(balanceAmount)
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="e.g., Manual adjustment, Refund, etc."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeBalanceModal}
                  disabled={adjustingBalance === showBalanceModal.userId}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustBalance}
                  disabled={adjustingBalance === showBalanceModal.userId || !balanceAmount || Number(balanceAmount) <= 0}
                  className={cn(
                    "flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50",
                    balanceType === 'add'
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-rose-500 hover:bg-rose-600"
                  )}
                >
                  {adjustingBalance === showBalanceModal.userId ? (
                    <Loader2 className="size-4 animate-spin mx-auto" />
                  ) : (
                    `${balanceType === 'add' ? 'Add' : 'Deduct'} ${formatCurrency(Number(balanceAmount) || 0)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

