'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserShell } from "@/components/layout/user-shell";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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

export default function IpoApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const ipoId = params.id as string;
  
  const [ipo, setIpo] = useState<Ipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lots, setLots] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadIpo();
  }, [ipoId]);

  async function loadIpo() {
    try {
      setLoading(true);
      const allIpos = await api.ipo.getIpos();
      const found = (allIpos as Ipo[]).find(i => i.id === ipoId);
      if (!found) {
        setError('IPO not found');
      } else {
        setIpo(found);
      }
    } catch (error) {
      console.error('Failed to load IPO:', error);
      setError('Failed to load IPO details');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ipo) return;

    setSubmitting(true);
    setError(null);

    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (!userId) {
        setError('Please login to apply');
        return;
      }

      const lotsNum = Number(lots);
      if (lotsNum < 1) {
        setError('Please enter a valid number of lots');
        return;
      }

      // Use finalPrice if discount is available, otherwise use priceMin
      const pricePerShare = (ipo.showDiscount && ipo.finalPrice) ? ipo.finalPrice : ipo.priceMin;
      const amount = lotsNum * pricePerShare * ipo.lotSize;
      if (amount < ipo.minInvestment) {
        setError(`Minimum investment is ${formatCurrency(ipo.minInvestment)}`);
        return;
      }

      await api.ipo.apply({
        ipoId: ipo.id,
        userId,
        lots: lotsNum,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/user/ipo');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <UserShell title="IPO Application" subtitle="Apply for IPO">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  if (!ipo || error) {
    return (
      <UserShell title="IPO Application" subtitle="Apply for IPO">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="mx-auto size-12 text-rose-400 mb-4" />
          <p className="text-rose-400">{error || 'IPO not found'}</p>
          <Link
            href="/user/ipo"
            className="mt-4 inline-block rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Back to IPO Desk
          </Link>
        </div>
      </UserShell>
    );
  }

  // Use finalPrice if discount is available, otherwise use priceMin
  const pricePerShare = (ipo.showDiscount && ipo.finalPrice) ? ipo.finalPrice : ipo.priceMin;
  const totalAmount = Number(lots) > 0 ? Number(lots) * pricePerShare * ipo.lotSize : 0;

  return (
    <UserShell title="IPO Application" subtitle="Apply for IPO">
      <Link
        href="/user/ipo"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
      >
        <ArrowLeft className="size-4" />
        Back to IPO Desk
      </Link>

      {success ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <CheckCircle2 className="mx-auto size-16 text-emerald-400 mb-4" />
          <h2 className="text-2xl font-semibold text-emerald-400 mb-2">Application Submitted!</h2>
          <p className="text-white/70 mb-4">Your IPO application has been submitted successfully.</p>
          <p className="text-sm text-white/60">Status: Pending Allotment</p>
          <p className="text-sm text-white/60 mt-2">Redirecting to IPO Desk...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* IPO Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start gap-4 mb-6">
                {ipo.companyLogo && (
                  <img
                    src={ipo.companyLogo}
                    alt={ipo.companyName}
                    className="size-20 rounded-xl object-cover"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">{ipo.companyName}</h2>
                  <p className="text-white/60">{ipo.ipoType} IPO</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div>
                  <p className="text-xs text-white/60 mb-1">Price</p>
                  {ipo.showDiscount && ipo.finalPrice && ipo.ipoPrice ? (
                    <div>
                      <p className="text-lg font-semibold text-white">
                        <span className="line-through text-white/40 mr-2">₹{ipo.ipoPrice}</span>
                        <span className="text-emerald-400">₹{ipo.finalPrice.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-emerald-400 mt-1">
                        {ipo.discountType === 'Percentage' 
                          ? `${ipo.discountValue}% OFF` 
                          : `₹${ipo.discountValue} OFF`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-white">₹{ipo.priceMin} - ₹{ipo.priceMax}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Lot Size</p>
                  <p className="text-lg font-semibold text-white">{ipo.lotSize} shares</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Minimum Investment</p>
                  <p className="text-lg font-semibold text-white">{formatCurrency(ipo.minInvestment)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Open - Close Date</p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(ipo.openDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} -{' '}
                    {new Date(ipo.closeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/60 mb-2">About the Company</p>
                <p className="text-sm text-white/80">{ipo.description}</p>
              </div>
            </div>

            {/* Risk Notes */}
            <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Risk Notes</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• IPO investments are subject to market risks</li>
                <li>• Allotment is not guaranteed</li>
                <li>• Amount will be blocked until allotment is processed</li>
                <li>• If not allotted, amount will be refunded</li>
              </ul>
            </div>

            {/* FAQs */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold mb-4">Application FAQs</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-white mb-1">How is the amount calculated?</p>
                  <p className="text-white/70">Amount = Number of Lots × Minimum Price × Lot Size</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">When will the amount be deducted?</p>
                  <p className="text-white/70">Amount is blocked immediately. It will be deducted only if you are allotted shares.</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">What if I'm not allotted?</p>
                  <p className="text-white/70">The blocked amount will be refunded to your wallet.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-blue-200 mb-6">Apply for IPO</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Number of Lots
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lots}
                    onChange={(e) => setLots(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Enter lots"
                    required
                  />
                  <p className="mt-1 text-xs text-white/50">
                    Lot size: {ipo.lotSize} shares per lot
                  </p>
                </div>

                {Number(lots) > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Lots:</span>
                      <span className="text-white">{lots}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Price per share:</span>
                      <span className="text-white">
                        {ipo.showDiscount && ipo.finalPrice ? (
                          <>
                            <span className="line-through text-white/40 mr-2">₹{ipo.ipoPrice}</span>
                            <span className="text-emerald-400">₹{ipo.finalPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          `₹${ipo.priceMin}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Shares:</span>
                      <span className="text-white">{Number(lots) * ipo.lotSize}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between">
                      <span className="font-semibold text-white">Total Amount:</span>
                      <span className="font-semibold text-blue-400">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !lots || Number(lots) < 1 || totalAmount < ipo.minInvestment}
                  className={cn(
                    "w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700",
                    (submitting || !lots || Number(lots) < 1 || totalAmount < ipo.minInvestment) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Application'
                  )}
                </button>

                <p className="text-xs text-white/50 text-center">
                  By submitting, you agree to block ₹{totalAmount > 0 ? formatCurrency(totalAmount) : formatCurrency(ipo.minInvestment)} until allotment
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserShell>
  );
}

