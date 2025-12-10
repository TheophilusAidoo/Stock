'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, Building2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type IpoApplication = {
  id: string;
  ipoId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  lots: number;
  amount: number;
  status: 'Pending Allotment' | 'Allotted' | 'Not Allotted';
  appliedAt: string;
  allottedAt?: string;
  rejectedAt?: string;
  ipo?: {
    companyName: string;
    companyLogo?: string;
  };
};

type Ipo = {
  id: string;
  companyName: string;
  companyLogo?: string;
};

export default function AllIpoApplicationsPage() {
  const [applications, setApplications] = useState<IpoApplication[]>([]);
  const [ipos, setIpos] = useState<Ipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIpoId, setFilterIpoId] = useState<string>('all');
  const [filterUserId, setFilterUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [apps, allIpos] = await Promise.all([
        api.admin.getIpoApplications(), // Get all applications
        api.admin.ipos(),
      ]);
      
      // Enrich applications with IPO details
      const enrichedApps = (apps as IpoApplication[]).map(app => {
        const ipo = (allIpos as Ipo[]).find(i => i.id === app.ipoId);
        return {
          ...app,
          ipo: ipo ? { companyName: ipo.companyName, companyLogo: ipo.companyLogo } : undefined,
        };
      });
      
      setApplications(enrichedApps);
      setIpos(allIpos as Ipo[]);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    if (!confirm('Approve this IPO application? Amount will be deducted from user balance.')) return;
    try {
      setProcessing(id);
      await api.admin.approveIpoApplication(id);
      await loadData();
    } catch (error) {
      console.error('Failed to approve application:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve application');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this IPO application? Blocked amount will be refunded to user.')) return;
    try {
      setProcessing(id);
      await api.admin.rejectIpoApplication(id);
      await loadData();
    } catch (error) {
      console.error('Failed to reject application:', error);
      alert(error instanceof Error ? error.message : 'Failed to reject application');
    } finally {
      setProcessing(null);
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterIpoId !== 'all' && app.ipoId !== filterIpoId) return false;
    if (filterUserId && !app.userId.toLowerCase().includes(filterUserId.toLowerCase()) && 
        !app.userName?.toLowerCase().includes(filterUserId.toLowerCase()) &&
        !app.userEmail?.toLowerCase().includes(filterUserId.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <AdminShell title="All IPO Applications" subtitle="View and manage all IPO applications from users">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="All IPO Applications" subtitle="View and manage all IPO applications from users">
      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="size-5 text-white/60" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm text-white/60 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              >
                <option value="all">All Status</option>
                <option value="Pending Allotment">Pending Allotment</option>
                <option value="Allotted">Allotted</option>
                <option value="Not Allotted">Not Allotted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">IPO</label>
              <select
                value={filterIpoId}
                onChange={(e) => setFilterIpoId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              >
                <option value="all">All IPOs</option>
                {ipos.map(ipo => (
                  <option key={ipo.id} value={ipo.id}>{ipo.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Search User</label>
              <input
                type="text"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="User name, email, or ID"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-white/60 mb-1">Total Applications</p>
            <p className="text-2xl font-semibold text-white">{applications.length}</p>
          </div>
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-400/80 mb-1">Pending</p>
            <p className="text-2xl font-semibold text-yellow-400">
              {applications.filter(a => a.status === 'Pending Allotment').length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-400/80 mb-1">Allotted</p>
            <p className="text-2xl font-semibold text-emerald-400">
              {applications.filter(a => a.status === 'Allotted').length}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-400/80 mb-1">Not Allotted</p>
            <p className="text-2xl font-semibold text-rose-400">
              {applications.filter(a => a.status === 'Not Allotted').length}
            </p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <p>No applications found</p>
            </div>
          ) : (
            <DataTable
              columns={[
                { header: "IPO", accessor: (row) => (
                  <div className="flex items-center gap-2">
                    {row.ipo?.companyLogo && (
                      <img src={row.ipo.companyLogo} alt={row.ipo.companyName} className="size-8 rounded-lg object-cover" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{row.ipo?.companyName || 'Unknown IPO'}</div>
                      <Link 
                        href={`/admin/ipos/${row.ipoId}/applications`}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View IPO Details →
                      </Link>
                    </div>
                  </div>
                )},
                { header: "User", accessor: (row) => (
                  <div>
                    <div className="font-semibold text-white">{row.userName || 'Unknown'}</div>
                    <div className="text-xs text-white/60">{row.userEmail || row.userId}</div>
                  </div>
                )},
                { header: "Lots", accessor: (row) => row.lots },
                { header: "Amount", accessor: (row) => formatCurrency(row.amount) },
                { header: "Applied At", accessor: (row) => new Date(row.appliedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) },
                { header: "Status", accessor: (row) => {
                  const statusMap: Record<string, { label: string; className: string; icon: any }> = {
                    'Pending Allotment': { label: 'Pending Allotment', className: 'bg-yellow-500/20 text-yellow-400', icon: Loader2 },
                    'Allotted': { label: 'Allotted', className: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle2 },
                    'Not Allotted': { label: 'Not Allotted', className: 'bg-rose-500/20 text-rose-400', icon: XCircle },
                  };
                  const statusInfo = statusMap[row.status] || statusMap['Pending Allotment'];
                  const Icon = statusInfo.icon;
                  return (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", statusInfo.className)}>
                      <Icon className="size-3" />
                      {statusInfo.label}
                    </span>
                  );
                }},
                { header: "Actions",
                  accessor: (row) => (
                    <div className="flex items-center gap-2">
                      {row.status === 'Pending Allotment' && (
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
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filteredApplications}
            />
          )}
        </div>
      </div>
    </AdminShell>
  );
}












