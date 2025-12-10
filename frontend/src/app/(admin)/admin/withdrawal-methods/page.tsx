'use client';

import { FormEvent, useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { Save, Plus, Edit2, Trash2, X, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type WithdrawalMethod = {
  id: string;
  name: string;
  type: string;
  minAmount: number;
  fee: number;
  processingTime: string;
  isActive: boolean;
};

export default function WithdrawalMethodsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'trc20',
    minAmount: 50,
    fee: 0,
    processingTime: '1-2 hours',
  });

  useEffect(() => {
    loadMethods();
  }, []);

  async function loadMethods() {
    try {
      setLoading(true);
      const data = await api.admin.getWithdrawalMethods();
      setMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load methods:', error);
      setMessage('Failed to load withdrawal methods');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(method: WithdrawalMethod) {
    setEditingId(method.id);
    setFormData({
      name: method.name,
      type: method.type,
      minAmount: method.minAmount,
      fee: method.fee,
      processingTime: method.processingTime,
    });
    setShowAddForm(false);
  }

  function startAdd() {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'trc20',
      minAmount: 50,
      fee: 0,
      processingTime: '1-2 hours',
    });
    setShowAddForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      type: 'trc20',
      minAmount: 50,
      fee: 0,
      processingTime: '1-2 hours',
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        await api.admin.updateWithdrawalMethod(editingId, formData);
        setMessage('Withdrawal method updated successfully!');
      } else {
        await api.admin.addWithdrawalMethod(formData);
        setMessage('Withdrawal method added successfully!');
      }
      await loadMethods();
      cancelEdit();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save method');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this withdrawal method?')) {
      return;
    }
    try {
      await api.admin.deleteWithdrawalMethod(id);
      setMessage('Withdrawal method deleted successfully!');
      await loadMethods();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete method');
    }
  }

  if (loading) {
    return (
      <AdminShell title="Withdrawal Methods" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Withdrawal Methods" subtitle="Manage withdrawal methods available to users">
      <div className="space-y-6">
        {!showAddForm && !editingId && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Add New Method
          </button>
        )}

        {(showAddForm || editingId) && (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Withdrawal Method</h3>
                  <p className="text-sm text-white/60">Configure withdrawal method for users</p>
                </div>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg bg-white/5 p-2 text-white/60 hover:bg-white/10 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Method Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="TRC20 USDT"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Method Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                required
              >
                <option value="trc20" className="bg-slate-900">TRC20</option>
                <option value="bank" className="bg-slate-900">Bank Transfer</option>
                <option value="binance" className="bg-slate-900">Binance Pay</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Minimum Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minAmount: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Fee</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Processing Time</label>
              <input
                type="text"
                value={formData.processingTime}
                onChange={(e) => setFormData(prev => ({ ...prev, processingTime: e.target.value }))}
                placeholder="1-2 hours"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl bg-blue-500/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {editingId ? 'Update Method' : 'Add Method'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Withdrawal Methods ({methods.length})</h3>
          {methods.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">No withdrawal methods configured</p>
            </div>
          ) : (
            methods.map((method) => (
              <div
                key={method.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-semibold">{method.name}</h4>
                    <div className="flex gap-4 text-sm text-white/60">
                      <span>Type: {method.type.toUpperCase()}</span>
                      <span>Min: ${method.minAmount}</span>
                      <span>Fee: ${method.fee}</span>
                      <span>Processing: {method.processingTime}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(method)}
                      className="rounded-lg bg-blue-500/20 p-2 text-blue-400 hover:bg-blue-500/30 transition"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="rounded-lg bg-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/30 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {message && (
          <div className={cn(
            "rounded-2xl border p-4 text-sm",
            message.includes("successfully")
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400"
          )}>
            {message}
          </div>
        )}
      </div>
    </AdminShell>
  );
}












