'use client';

import { useState, useEffect } from "react";
import { UserShell } from "@/components/layout/user-shell";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Loader2, Calendar, TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  // Discount fields
  ipoPrice?: number;
  discountType?: 'Percentage' | 'Fixed';
  discountValue?: number;
  finalPrice?: number;
  showDiscount?: boolean;
};

type IpoApplication = {
  id: string;
  ipoId: string;
  lots: number;
  amount: number;
  status: 'Pending Allotment' | 'Allotted' | 'Not Allotted';
  appliedAt: string;
  ipo?: {
    companyName: string;
    companyLogo?: string;
    priceMin: number;
    priceMax: number;
  };
};

export default function IpoPage() {
  const [upcomingIpos, setUpcomingIpos] = useState<Ipo[]>([]);
  const [liveIpos, setLiveIpos] = useState<Ipo[]>([]);
  const [closedIpos, setClosedIpos] = useState<Ipo[]>([]);
  const [applications, setApplications] = useState<IpoApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'closed' | 'history'>('live');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [upcoming, live, closed, apps] = await Promise.all([
        api.ipo.getIpos('Upcoming'),
        api.ipo.getIpos('Live'),
        api.ipo.getIpos('Closed'),
        (async () => {
          const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
          const userId = userToken ? userToken.replace('token-', '') : undefined;
          if (userId) {
            return await api.ipo.getApplications(userId);
          }
          return [];
        })(),
      ]);
      setUpcomingIpos(upcoming as Ipo[]);
      setLiveIpos(live as Ipo[]);
      setClosedIpos(closed as Ipo[]);
      setApplications(apps as IpoApplication[]);
    } catch (error) {
      console.error('Failed to load IPO data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <UserShell title="IPO Desk" subtitle="Curated pipeline, ASBA apply, allotments">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell title="IPO Desk" subtitle="Curated pipeline, ASBA apply, allotments">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('live')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition",
            activeTab === 'live'
              ? "border-b-2 border-blue-400 text-blue-400"
              : "text-white/60 hover:text-white"
          )}
        >
          Live ({liveIpos.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition",
            activeTab === 'upcoming'
              ? "border-b-2 border-blue-400 text-blue-400"
              : "text-white/60 hover:text-white"
          )}
        >
          Upcoming ({upcomingIpos.length})
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition",
            activeTab === 'closed'
              ? "border-b-2 border-blue-400 text-blue-400"
              : "text-white/60 hover:text-white"
          )}
        >
          Closed ({closedIpos.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-4 py-2 text-sm font-medium transition",
            activeTab === 'history'
              ? "border-b-2 border-blue-400 text-blue-400"
              : "text-white/60 hover:text-white"
          )}
        >
          My Applications ({applications.length})
        </button>
      </div>

      {/* Live IPOs */}
      {activeTab === 'live' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveIpos.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">No live IPOs at the moment</p>
            </div>
          ) : (
            liveIpos.map((ipo) => (
              <IpoCard key={ipo.id} ipo={ipo} showApplyButton={true} />
            ))
          )}
        </div>
      )}

      {/* Upcoming IPOs */}
      {activeTab === 'upcoming' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingIpos.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">No upcoming IPOs</p>
            </div>
          ) : (
            upcomingIpos.map((ipo) => (
              <IpoCard key={ipo.id} ipo={ipo} showApplyButton={false} />
            ))
          )}
        </div>
      )}

      {/* Closed IPOs */}
      {activeTab === 'closed' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {closedIpos.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">No closed IPOs</p>
            </div>
          ) : (
            closedIpos.map((ipo) => (
              <IpoCard key={ipo.id} ipo={ipo} showApplyButton={false} />
            ))
          )}
        </div>
      )}

      {/* My Applications */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-white/60">You haven't applied for any IPOs yet</p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {app.ipo?.companyLogo && (
                      <img
                        src={app.ipo.companyLogo}
                        alt={app.ipo.companyName}
                        className="size-16 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {app.ipo?.companyName || 'Unknown Company'}
                      </h3>
                      <p className="text-sm text-white/60 mt-1">
                        Price: ₹{app.ipo?.priceMin || 0} - ₹{app.ipo?.priceMax || 0}
                      </p>
                      <p className="text-sm text-white/60">
                        Lots: {app.lots} • Amount: {formatCurrency(app.amount)}
                      </p>
                      <p className="text-xs text-white/40 mt-2">
                        Applied: {new Date(app.appliedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === 'Pending Allotment' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
                        <Clock className="size-3" />
                        Pending Allotment
                      </span>
                    )}
                    {app.status === 'Allotted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Allotted
                      </span>
                    )}
                    {app.status === 'Not Allotted' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-400">
                        <XCircle className="size-3" />
                        Not Allotted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* IPO Timeline Info */}
      {activeTab !== 'history' && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold mb-4">IPO Timeline</h2>
          <ol className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">1</span>
              <span>Submit application with required amount</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">3</span>
              <span>our team reviews and processes allotment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">4</span>
              <span>If allotted: Amount deducted. If not allotted: Amount refunded</span>
            </li>
          </ol>
        </section>
      )}
    </UserShell>
  );
}

function IpoCard({ ipo, showApplyButton }: { ipo: Ipo; showApplyButton: boolean }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className={cn(
          "text-xs uppercase tracking-widest px-2 py-1 rounded-full",
          ipo.status === 'Live' ? "bg-emerald-500/20 text-emerald-400" :
          ipo.status === 'Upcoming' ? "bg-blue-500/20 text-blue-400" :
          "bg-gray-500/20 text-gray-400"
        )}>
          {ipo.status}
        </span>
        <span className="text-xs text-white/50">{ipo.ipoType}</span>
      </div>

      {ipo.companyLogo && (
        <img
          src={ipo.companyLogo}
          alt={ipo.companyName}
          className="mb-3 h-20 w-full rounded-xl object-cover"
        />
      )}

      <h3 className="text-xl font-semibold text-white mb-2">{ipo.companyName}</h3>
      <div className="mb-3">
        {ipo.showDiscount && ipo.finalPrice && ipo.ipoPrice ? (
          <div>
            <p className="text-white/70 mb-1">
              Price: <span className="line-through text-white/40">₹{ipo.ipoPrice}</span>{' '}
              <span className="text-emerald-400 font-semibold">₹{ipo.finalPrice.toFixed(2)}</span>
            </p>
            <p className="text-xs text-emerald-400">
              {ipo.discountType === 'Percentage' 
                ? `${ipo.discountValue}% OFF` 
                : `₹${ipo.discountValue} OFF`}
            </p>
          </div>
        ) : (
          <p className="text-white/70 mb-3">Price band: ₹{ipo.priceMin} - ₹{ipo.priceMax}</p>
        )}
      </div>
      <p className="text-white/60 mb-1">Lot size: {ipo.lotSize}</p>
      <p className="text-white/60 mb-3">Min investment: {formatCurrency(ipo.minInvestment)}</p>

      <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
        <Calendar className="size-3" />
        <span>
          {new Date(ipo.openDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} -{' '}
          {new Date(ipo.closeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {showApplyButton && (
        <Link
          href={`/user/ipo/${ipo.id}`}
          className="block w-full rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Apply Now
        </Link>
      )}
    </article>
  );
}
