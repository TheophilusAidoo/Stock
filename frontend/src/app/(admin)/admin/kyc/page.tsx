'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";
import { FileText, CheckCircle2, XCircle, Loader2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type KycRequest = {
  id: string;
  name: string;
  email: string;
  documentName: string;
  documentSize: number;
  documentData?: string;
  documentType?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  userId: string;
};

export default function AdminKycPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  useEffect(() => {
    loadKycs();
  }, []);

  async function loadKycs() {
    try {
      setLoading(true);
      const data = await api.admin.kycs();
      setRequests(data as KycRequest[]);
    } catch (error) {
      console.error('Failed to load KYC requests:', error);
      setMessage('Failed to load KYC requests');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, action: "approve" | "reject") {
    try {
      setProcessing(id);
      if (action === "approve") {
        await api.admin.approveKyc(id);
      } else {
        await api.admin.rejectKyc(id);
      }
      setMessage(`KYC ${id} ${action}d successfully`);
      await loadKycs(); // Reload after update
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update KYC");
    } finally {
      setProcessing(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Today ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <AdminShell title="KYC Queue" subtitle="Loading KYC requests...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="KYC Queue" subtitle="Review and approve KYC documents submitted by users.">
      {pendingRequests.length === 0 && otherRequests.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <FileText className="mx-auto size-12 text-white/30" />
          <p className="mt-4 text-white/60">No KYC requests found</p>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Pending Review ({pendingRequests.length})
          </h3>
          {pendingRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-6"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                {/* Left: User Info & Document Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-yellow-500/20 text-yellow-400">
                      <FileText className="size-7" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-white">{request.name}</h4>
                      <p className="text-sm text-white/70 mt-1">{request.email}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
                        <span className="flex items-center gap-2">
                          <FileText className="size-3" />
                          <span className="font-medium text-white/80">{request.documentName}</span>
                        </span>
                        <span>{formatFileSize(request.documentSize)}</span>
                        <span>{formatDate(request.submittedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Preview Thumbnail */}
                  {request.documentData && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60 mb-3">Submitted Document:</p>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          {request.documentType?.startsWith('image/') ? (
                            <img 
                              src={request.documentData} 
                              alt={request.documentName}
                              className="h-32 w-auto rounded-xl border border-white/10 object-cover cursor-pointer hover:opacity-80 transition"
                              onClick={() => setViewingDoc(request.id)}
                            />
                          ) : (
                            <div 
                              className="h-32 w-48 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition"
                              onClick={() => setViewingDoc(request.id)}
                            >
                              <FileText className="size-12 text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-xl">
                            <Eye className="size-6 text-white" />
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingDoc(request.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
                        >
                          <Eye className="size-4" />
                          View Full Document
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col gap-3 lg:min-w-[200px]">
                  <button
                    onClick={() => updateStatus(request.id, "approve")}
                    disabled={processing === request.id}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-500",
                      processing === request.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {processing === request.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-5" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => updateStatus(request.id, "reject")}
                    disabled={processing === request.id}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20",
                      processing === request.id && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {processing === request.id ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="size-5" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {otherRequests.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Processed ({otherRequests.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {otherRequests.map((request) => (
              <article
                key={request.id}
                className={cn(
                  "rounded-3xl border p-5",
                  request.status === 'approved' 
                    ? "border-emerald-500/30 bg-emerald-500/5" 
                    : "border-rose-500/30 bg-rose-500/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    request.status === 'approved' 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-rose-500/20 text-rose-400"
                  )}>
                    {request.status === 'approved' ? (
                      <CheckCircle2 className="size-6" />
                    ) : (
                      <XCircle className="size-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-white truncate">{request.name}</h4>
                    <p className="text-sm text-white/70 truncate">{request.email}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
                      <span className="truncate">{request.documentName}</span>
                      <span>{formatFileSize(request.documentSize)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {request.documentData && (
                        <button
                          onClick={() => setViewingDoc(request.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                        >
                          <Eye className="size-3" />
                          View
                        </button>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                        request.status === 'approved'
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      )}>
                        {request.status === 'approved' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <XCircle className="size-3" />
                        )}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={cn(
          "mt-4 rounded-2xl border p-4 text-sm",
          message.includes("success") 
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        )}>
          {message}
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDoc && (() => {
        const request = requests.find(r => r.id === viewingDoc);
        if (!request || !request.documentData) return null;
        
        const isImage = request.documentType?.startsWith('image/');
        const isPDF = request.documentType === 'application/pdf';
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setViewingDoc(null)}
          >
            <div 
              className="relative max-h-[90vh] max-w-4xl rounded-2xl bg-slate-900 border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{request.name}</h3>
                  <p className="text-sm text-white/60">{request.documentName}</p>
                </div>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20 transition"
                >
                  <XCircle className="size-5" />
                </button>
              </div>
              
              <div className="max-h-[70vh] overflow-auto rounded-lg bg-slate-800/50">
                {isImage ? (
                  <img 
                    src={request.documentData} 
                    alt={request.documentName}
                    className="w-full h-auto"
                  />
                ) : isPDF ? (
                  <iframe
                    src={request.documentData}
                    className="w-full h-[70vh]"
                    title={request.documentName}
                  />
                ) : (
                  <div className="p-8 text-center text-white/60">
                    <FileText className="mx-auto size-16 mb-4 text-white/30" />
                    <p>Preview not available for this file type</p>
                    <a
                      href={request.documentData}
                      download={request.documentName}
                      className="mt-4 inline-block rounded-lg bg-blue-500/20 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/30 transition"
                    >
                      Download Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </AdminShell>
  );
}

