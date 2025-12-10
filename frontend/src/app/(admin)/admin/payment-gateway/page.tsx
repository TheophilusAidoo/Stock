'use client';

import { FormEvent, useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { Save, Wallet, Plus, Edit2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type PaymentGateway = {
  id: string;
  name: string;
  trc20Address: string;
  trc20QrCode: string;
  minDeposit: number;
  confirmationTime: string;
  instructions: string;
  isActive: boolean;
};

export default function PaymentGatewayPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: 'USDT (TRC20)',
    trc20Address: '',
    trc20QrCode: '',
    minDeposit: 100,
    confirmationTime: '15-30 minutes',
    instructions: 'Send USDT (TRC20) to the address below. Minimum deposit: $100. Confirmation time: 15-30 minutes.',
  });
  const [qrFile, setQrFile] = useState<File | null>(null);

  useEffect(() => {
    loadGateways();
  }, []);

  async function loadGateways() {
    try {
      setLoading(true);
      const data = await api.admin.getPaymentGateways();
      setGateways(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load gateways:', error);
      setMessage('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  }

  async function handleQrUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFormData(prev => ({ ...prev, trc20QrCode: base64 }));
      };
      reader.readAsDataURL(file);
      setQrFile(file);
    }
  }

  function startEdit(gateway: PaymentGateway) {
    setEditingId(gateway.id);
    setFormData({
      name: gateway.name,
      trc20Address: gateway.trc20Address,
      trc20QrCode: gateway.trc20QrCode,
      minDeposit: gateway.minDeposit,
      confirmationTime: gateway.confirmationTime,
      instructions: gateway.instructions,
    });
    setShowAddForm(false);
  }

  function startAdd() {
    setEditingId(null);
    setFormData({
      name: 'USDT (TRC20)',
      trc20Address: '',
      trc20QrCode: '',
      minDeposit: 100,
      confirmationTime: '15-30 minutes',
      instructions: 'Send USDT (TRC20) to the address below. Minimum deposit: $100. Confirmation time: 15-30 minutes.',
    });
    setQrFile(null);
    setShowAddForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: 'USDT (TRC20)',
      trc20Address: '',
      trc20QrCode: '',
      minDeposit: 100,
      confirmationTime: '15-30 minutes',
      instructions: 'Send USDT (TRC20) to the address below. Minimum deposit: $100. Confirmation time: 15-30 minutes.',
    });
    setQrFile(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingId) {
        await api.admin.updatePaymentGateway(editingId, formData);
        setMessage('Payment gateway updated successfully!');
      } else {
        await api.admin.addPaymentGateway(formData);
        setMessage('Payment gateway added successfully!');
      }
      await loadGateways();
      cancelEdit();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save gateway');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this payment gateway?')) {
      return;
    }
    try {
      await api.admin.deletePaymentGateway(id);
      setMessage('Payment gateway deleted successfully!');
      await loadGateways();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete gateway');
    }
  }

  if (loading) {
    return (
      <AdminShell title="Payment Gateways" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Payment Gateways" subtitle="Manage multiple payment gateways for user deposits">
      <div className="space-y-6">
        {/* Add New Gateway Button */}
        {!showAddForm && !editingId && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="size-4" />
            Add New Gateway
          </button>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{editingId ? 'Edit' : 'Add'} Payment Gateway</h3>
                  <p className="text-sm text-white/60">Configure TRC20 wallet for user deposits</p>
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
              <label className="mb-2 block text-sm font-medium text-white/70">Gateway Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="USDT (TRC20)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Wallet Address</label>
              <input
                type="text"
                value={formData.trc20Address}
                onChange={(e) => setFormData(prev => ({ ...prev, trc20Address: e.target.value }))}
                placeholder="TXYZabcdefghijklmnopqrstuvwxyz123456"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">QR Code Image</label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                  />
                </div>
                {formData.trc20QrCode && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <img 
                      src={formData.trc20QrCode} 
                      alt="QR Code" 
                      className="size-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Minimum Deposit (USDT)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.minDeposit}
                  onChange={(e) => setFormData(prev => ({ ...prev, minDeposit: Number(e.target.value) }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Confirmation Time</label>
                <input
                  type="text"
                  value={formData.confirmationTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmationTime: e.target.value }))}
                  placeholder="15-30 minutes"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={4}
                placeholder="Enter deposit instructions for users..."
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
                    {editingId ? 'Update Gateway' : 'Add Gateway'}
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

        {/* Gateways List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Gateways ({gateways.length})</h3>
          {gateways.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">No payment gateways configured</p>
            </div>
          ) : (
            gateways.map((gateway) => (
              <div
                key={gateway.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold">{gateway.name}</h4>
                      <p className="text-sm text-white/60 mt-1">Min Deposit: ${gateway.minDeposit} | Confirmation: {gateway.confirmationTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1">Wallet Address:</p>
                      <code className="block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 font-mono break-all">
                        {gateway.trc20Address}
                      </code>
                    </div>
                    {gateway.instructions && (
                      <p className="text-sm text-white/70">{gateway.instructions}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(gateway)}
                      className="rounded-lg bg-blue-500/20 p-2 text-blue-400 hover:bg-blue-500/30 transition"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(gateway.id)}
                      className="rounded-lg bg-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/30 transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {gateway.trc20QrCode && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 inline-block">
                    <img 
                      src={gateway.trc20QrCode} 
                      alt="QR Code" 
                      className="size-32 object-contain"
                    />
                  </div>
                )}
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
