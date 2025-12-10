'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
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

export default function IpoApplicationsPage() {
  const params = useParams();
  const ipoId = params.id as string;
  
  const [applications, setApplications] = useState<IpoApplication[]>([]);
  const [ipo, setIpo] = useState<Ipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [ipoId]);

  async function loadData() {
    try {
      setLoading(true);
      const [apps, allIpos] = await Promise.all([
        api.admin.getIpoApplications(ipoId),
        api.admin.ipos(),
      ]);
      setApplications(apps as IpoApplication[]);
      const found = (allIpos as Ipo[]).find(i => i.id === ipoId);
      if (found) {
        setIpo(found);
      }
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

  if (loading) {
    return (
      <AdminShell title="IPO Applications" subtitle="Manage IPO applications">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="IPO Applications" subtitle="Manage IPO applications">
      <Link
        href="/admin/ipos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
      >
        <ArrowLeft className="size-4" />
        Back to IPOs
      </Link>

      {ipo && (
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-4">
            {ipo.companyLogo && (
              <img
                src={ipo.companyLogo}
                alt={ipo.companyName}
                className="size-16 rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-white">{ipo.companyName}</h2>
              <p className="text-sm text-white/60">Total Applications: {applications.length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            <p>No applications for this IPO</p>
          </div>
        ) : (
          <DataTable
            columns={[
              { header: "User", accessor: (row) => (
                <div>
                  <div className="font-semibold text-white">{row.userName || 'Unknown'}</div>
                  <div className="text-xs text-white/60">{row.userEmail || row.userId}</div>
                </div>
              )},
              { header: "Lots", accessor: (row) => row.lots },
              { header: "Amount", accessor: (row) => formatCurrency(row.amount) },
              { header: "Applied At", accessor: (row) => new Date(row.appliedAt).toLocaleString('en-IN') },
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
              { header: "Actions", accessor: (row) => (
                row.status === 'Pending Allotment' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(row.id)}
                      disabled={processing === row.id}
                      className={cn(
                        "rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/30",
                        processing === row.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {processing === row.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(row.id)}
                      disabled={processing === row.id}
                      className={cn(
                        "rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/30",
                        processing === row.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-white/40">Processed</span>
                )
              )},
            ]}
            data={applications}
          />
        )}
      </div>
    </AdminShell>
  );
}












