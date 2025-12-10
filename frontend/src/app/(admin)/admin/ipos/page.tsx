'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Plus, Edit, Trash2, Eye, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Ipo = {
  id: string;
  companyName: string;
  companyLogo?: string;
  ipoType: 'Mainline' | 'SME';
  priceMin: number;
  priceMax: number;
  lotSize: number;
  minInvestment: number;
  openDate: string;
  closeDate: string;
  description: string;
  status: 'Upcoming' | 'Live' | 'Closed';
  isActive: boolean;
  createdAt: string;
  // Discount fields
  ipoPrice?: number;
  discountType?: 'Percentage' | 'Fixed';
  discountValue?: number;
  finalPrice?: number;
  showDiscount?: boolean;
};

export default function AdminIpoPage() {
  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIpo, setEditingIpo] = useState<Ipo | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    ipoType: 'Mainline' as 'Mainline' | 'SME',
    priceMin: '',
    priceMax: '',
    lotSize: '',
    minInvestment: '',
    openDate: '',
    closeDate: '',
    description: '',
    status: 'Upcoming' as 'Upcoming' | 'Live' | 'Closed',
    ipoPrice: '',
    discountType: '' as 'Percentage' | 'Fixed' | '',
    discountValue: '',
    showDiscount: false,
  });

  useEffect(() => {
    loadIpos();
  }, []);

  async function loadIpos() {
    try {
      setLoading(true);
      const data = await api.admin.ipos();
      setIpos(data as Ipo[]);
    } catch (error) {
      console.error('Failed to load IPOs:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingIpo(null);
    setFormData({
      companyName: '',
      companyLogo: '',
      ipoType: 'Mainline',
      priceMin: '',
      priceMax: '',
      lotSize: '',
      minInvestment: '',
      openDate: '',
      closeDate: '',
      description: '',
      status: 'Upcoming',
      ipoPrice: '',
      discountType: '',
      discountValue: '',
      showDiscount: false,
    });
    setShowForm(true);
  }

  function openEditForm(ipo: Ipo) {
    setEditingIpo(ipo);
    setFormData({
      companyName: ipo.companyName,
      companyLogo: ipo.companyLogo || '',
      ipoType: ipo.ipoType,
      priceMin: ipo.priceMin.toString(),
      priceMax: ipo.priceMax.toString(),
      lotSize: ipo.lotSize.toString(),
      minInvestment: ipo.minInvestment.toString(),
      openDate: ipo.openDate,
      closeDate: ipo.closeDate,
      description: ipo.description,
      status: ipo.status,
      ipoPrice: ipo.ipoPrice?.toString() || '',
      discountType: ipo.discountType || '',
      discountValue: ipo.discountValue?.toString() || '',
      showDiscount: ipo.showDiscount || false,
    });
    setShowForm(true);
  }

  // Calculate final price based on discount
  function calculateFinalPrice() {
    if (!formData.ipoPrice || !formData.discountType || !formData.discountValue) {
      return null;
    }
    const ipoPrice = Number(formData.ipoPrice);
    const discountValue = Number(formData.discountValue);
    
    if (formData.discountType === 'Percentage') {
      return ipoPrice - (ipoPrice * discountValue / 100);
    } else {
      return ipoPrice - discountValue;
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = {
        companyName: formData.companyName,
        companyLogo: formData.companyLogo || undefined,
        ipoType: formData.ipoType,
        priceMin: Number(formData.priceMin),
        priceMax: Number(formData.priceMax),
        lotSize: Number(formData.lotSize),
        minInvestment: Number(formData.minInvestment),
        openDate: formData.openDate,
        closeDate: formData.closeDate,
        description: formData.description,
        status: formData.status,
      };

      if (editingIpo) {
        await api.admin.updateIpo(editingIpo.id, payload);
      } else {
        await api.admin.addIpo(payload);
      }

      setShowForm(false);
      await loadIpos();
    } catch (error) {
      console.error('Failed to save IPO:', error);
      alert(error instanceof Error ? error.message : 'Failed to save IPO');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this IPO?')) return;
    try {
      await api.admin.deleteIpo(id);
      await loadIpos();
    } catch (error) {
      console.error('Failed to delete IPO:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete IPO');
    }
  }

  if (loading) {
    return (
      <AdminShell title="IPO Management" subtitle="Control listings, allocations, and research.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="IPO Management" subtitle="Control listings, allocations, and research.">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">All IPOs ({ipos.length})</h2>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="size-4" />
          Add New IPO
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>

            <h3 className="text-xl font-semibold mb-4">
              {editingIpo ? 'Edit IPO' : 'Add New IPO'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-white/60">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">IPO Type *</label>
                  <select
                    value={formData.ipoType}
                    onChange={(e) => setFormData({ ...formData, ipoType: e.target.value as 'Mainline' | 'SME' })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  >
                    <option value="Mainline" className="bg-slate-900">Mainline</option>
                    <option value="SME" className="bg-slate-900">SME</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Min Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceMin}
                    onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Max Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceMax}
                    onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Lot Size *</label>
                  <input
                    type="number"
                    value={formData.lotSize}
                    onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Min Investment (₹) *</label>
                  <input
                    type="number"
                    value={formData.minInvestment}
                    onChange={(e) => setFormData({ ...formData, minInvestment: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Open Date *</label>
                  <input
                    type="date"
                    value={formData.openDate}
                    onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Close Date *</label>
                  <input
                    type="date"
                    value={formData.closeDate}
                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-white/60">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Upcoming' | 'Live' | 'Closed' })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  >
                    <option value="Upcoming" className="bg-slate-900">Upcoming</option>
                    <option value="Live" className="bg-slate-900">Live</option>
                    <option value="Closed" className="bg-slate-900">Closed</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-white/60">Company Logo URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.companyLogo}
                    onChange={(e) => setFormData({ ...formData, companyLogo: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-white/60">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Discount Section */}
              <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                <h4 className="text-sm font-semibold text-white mb-4">Discount Settings (Optional)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">IPO Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ipoPrice}
                      onChange={(e) => setFormData({ ...formData, ipoPrice: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                      placeholder="e.g., 120"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'Percentage' | 'Fixed' | '' })}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    >
                      <option value="" className="bg-slate-900">Select Type</option>
                      <option value="Percentage" className="bg-slate-900">Percentage (%)</option>
                      <option value="Fixed" className="bg-slate-900">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      Discount Value {formData.discountType === 'Percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                      placeholder={formData.discountType === 'Percentage' ? 'e.g., 20' : 'e.g., 50'}
                      disabled={!formData.discountType}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Final Price (Auto-Calculated)</label>
                    <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                      {calculateFinalPrice() !== null ? (
                        <span className="text-lg font-semibold text-emerald-400">
                          ₹{calculateFinalPrice()!.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-white/40">Enter price and discount to calculate</span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showDiscount}
                        onChange={(e) => setFormData({ ...formData, showDiscount: e.target.checked })}
                        className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-white/70">Show Discount to Users</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {editingIpo ? 'Update IPO' : 'Add IPO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
        <DataTable
          columns={[
            { header: "Company", accessor: (row) => (
              <div className="flex items-center gap-3">
                {row.companyLogo && (
                  <img src={row.companyLogo} alt={row.companyName} className="size-10 rounded-lg object-cover" />
                )}
                <div>
                  <div className="font-semibold text-white">{row.companyName}</div>
                  <div className="text-xs text-white/60">{row.ipoType}</div>
                </div>
              </div>
            )},
            { header: "Price Range", accessor: (row) => `₹${row.priceMin} - ₹${row.priceMax}` },
            { header: "Lot Size", accessor: (row) => row.lotSize },
            { header: "Min Investment", accessor: (row) => formatCurrency(row.minInvestment) },
            { header: "Open Date", accessor: (row) => new Date(row.openDate).toLocaleDateString('en-IN') },
            { header: "Close Date", accessor: (row) => new Date(row.closeDate).toLocaleDateString('en-IN') },
            { header: "Status", accessor: (row) => (
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                row.status === 'Live' ? "bg-emerald-500/20 text-emerald-400" :
                row.status === 'Upcoming' ? "bg-blue-500/20 text-blue-400" :
                "bg-gray-500/20 text-gray-400"
              )}>
                {row.status}
              </span>
            )},
            { header: "Actions", accessor: (row) => (
              <div className="flex items-center gap-2">
                <a
                  href={`/admin/ipos/${row.id}/applications`}
                  className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                  title="View Applications"
                >
                  <Eye className="size-4" />
                </a>
                <button
                  onClick={() => openEditForm(row)}
                  className="rounded-lg bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
                  title="Edit"
                >
                  <Edit className="size-4" />
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="rounded-lg bg-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/30 transition"
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )},
          ]}
          data={ipos}
        />
      </div>
    </AdminShell>
  );
}
