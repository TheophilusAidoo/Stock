'use client';

import { FormEvent, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { UserShell } from "@/components/layout/user-shell";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentGateway = {
  id: string;
  name: string;
  trc20Address: string;
  trc20QrCode: string;
  minDeposit: number;
  confirmationTime: string;
  instructions: string;
};

type WithdrawalMethod = {
  id: string;
  name: string;
  type: string;
  minAmount: number;
  fee: number;
  processingTime: string;
};

export default function WalletPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<WithdrawalMethod[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [showDepositInstructions, setShowDepositInstructions] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawalAccount, setWithdrawalAccount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
    loadPaymentGateways();
    loadWithdrawalMethods();
  }, []);

  async function loadPaymentGateways() {
    try {
      const data = await api.wallet.getPaymentGateway();
      const gateways = Array.isArray(data) ? data : [data];
      setPaymentGateways(gateways as PaymentGateway[]);
      if (gateways.length > 0) {
        setSelectedGatewayId(gateways[0].id);
      }
    } catch (error) {
      console.error('Failed to load payment gateways:', error);
    }
  }

  async function loadWithdrawalMethods() {
    try {
      const data = await api.wallet.getWithdrawalMethods();
      setWithdrawalMethods(Array.isArray(data) ? data : []);
      if (data && Array.isArray(data) && data.length > 0) {
        setSelectedMethodId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load withdrawal methods:', error);
    }
  }

  async function loadHistory() {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      const data = await api.wallet.history(userId);
      setWalletHistory(data as any[]);
    } catch (error) {
      console.error('Failed to load wallet history:', error);
    }
  }

  const selectedGateway = paymentGateways.find(gw => gw.id === selectedGatewayId);
  const selectedMethod = withdrawalMethods.find(m => m.id === selectedMethodId);

  function copyAddress() {
    if (selectedGateway?.trc20Address) {
      navigator.clipboard.writeText(selectedGateway.trc20Address);
      setStatus('Address copied to clipboard!');
      setTimeout(() => setStatus(null), 2000);
    }
  }

  function handleScreenshotChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleDepositSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading('deposit');
    setStatus(null);

    if (!selectedGatewayId) {
      setStatus('Please select a payment gateway');
      setLoading(null);
      return;
    }

    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      let screenshotData: string | undefined;
      let screenshotType: string | undefined;

      if (screenshotFile) {
        const reader = new FileReader();
        screenshotData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(screenshotFile);
        });
        screenshotType = screenshotFile.type;
      }

      await api.wallet.deposit({
        amount: Number(depositAmount),
        channel: selectedGateway?.name || 'TRC20',
        userId,
        gatewayId: selectedGatewayId,
        screenshotData,
        screenshotType,
      });

      setStatus(`Deposit request submitted! Amount: ${formatCurrency(Number(depositAmount))}. Status: Pending Admin Approval.`);
      setShowDepositInstructions(false);
      setDepositAmount('');
      setScreenshotFile(null);
      setScreenshotPreview(null);
      await loadHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Deposit submission failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading('withdraw');
    setStatus(null);

    if (!selectedMethodId) {
      setStatus('Please select a withdrawal method');
      setLoading(null);
      return;
    }

    if (!selectedMethod) {
      setStatus('Invalid withdrawal method');
      setLoading(null);
      return;
    }

    if (Number(withdrawAmount) < selectedMethod.minAmount) {
      setStatus(`Minimum withdrawal amount is ${formatCurrency(selectedMethod.minAmount)}`);
      setLoading(null);
      return;
    }

    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      let accountDetails: string = '';
      let withdrawalDetails: Record<string, string> = {};

      if (selectedMethod.type === 'trc20') {
        accountDetails = withdrawalAccount;
      } else if (selectedMethod.type === 'bank') {
        accountDetails = `${bankName} - ${accountNumber}`;
        withdrawalDetails = { bankName, accountNumber };
      } else if (selectedMethod.type === 'binance') {
        accountDetails = withdrawalAccount;
        withdrawalDetails = { email: withdrawalAccount };
      }

      await api.wallet.withdraw({
        amount: Number(withdrawAmount),
        methodId: selectedMethodId,
        userId,
        withdrawalAccount: accountDetails,
        withdrawalDetails,
      });

      setStatus(`Withdrawal request submitted! Amount: ${formatCurrency(Number(withdrawAmount))}. Status: Pending Admin Approval.`);
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setWithdrawalAccount('');
      setBankName('');
      setAccountNumber('');
      await loadHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Withdrawal failed");
    } finally {
      setLoading(null);
    }
  }

  const finalAmount = selectedMethod && withdrawAmount 
    ? Number(withdrawAmount) - (selectedMethod.fee || 0)
    : 0;

  return (
    <UserShell title="Wallet" subtitle="Fund, invest, and withdraw instantly">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deposit Section */}
        <div className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ArrowDownCircle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-emerald-200">USDT Deposit</h2>
              <p className="text-xs text-white/60">Select payment gateway and deposit USDT</p>
            </div>
          </div>

          {!showDepositInstructions ? (
            <div className="space-y-4">
              {paymentGateways.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-white/60">
                  <p>No payment gateways available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Select Payment Gateway</label>
                    <select
                      value={selectedGatewayId}
                      onChange={(e) => setSelectedGatewayId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    >
                      {paymentGateways.map((gw) => (
                        <option key={gw.id} value={gw.id} className="bg-slate-900 text-white">
                          {gw.name} (Min: ${gw.minDeposit})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedGateway && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white/80 mb-2">Minimum deposit: ${selectedGateway.minDeposit}</p>
                      <p className="text-xs text-white/60 mb-4">{selectedGateway.instructions}</p>
                      <button
                        onClick={() => setShowDepositInstructions(true)}
                        className="w-full rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
                      >
                        Start Deposit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              {selectedGateway && (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">Payment Gateway</label>
                    <p className="text-sm font-semibold text-emerald-200">{selectedGateway.name}</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/70">TRC20 Wallet Address</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 font-mono break-all">
                        {selectedGateway.trc20Address}
                      </code>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="rounded-lg bg-white/10 p-2 text-white/70 hover:bg-white/20 transition"
                      >
                        <Copy className="size-4" />
                      </button>
                    </div>
                  </div>

                  {selectedGateway.trc20QrCode && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-white/70">QR Code</label>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex justify-center">
                        <img 
                          src={selectedGateway.trc20QrCode} 
                          alt="TRC20 QR Code" 
                          className="size-48 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-white/60">
                      <strong>Steps:</strong><br />
                      1. Send USDT (TRC20) to the address above<br />
                      2. Enter the amount below<br />
                      3. Upload transaction screenshot (optional)<br />
                      4. Click "I Have Paid" to submit for approval
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Amount (USDT)</label>
                <input
                  type="number"
                  min={selectedGateway?.minDeposit || 100}
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Min: ${selectedGateway?.minDeposit || 100}`}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Transaction Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
                />
                {screenshotPreview && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2">
                    <img src={screenshotPreview} alt="Screenshot preview" className="max-h-32 w-auto rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositInstructions(false);
                    setDepositAmount('');
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading === 'deposit'}
                  className={cn(
                    "flex-1 rounded-2xl bg-emerald-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400",
                    loading === 'deposit' && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading === 'deposit' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "I Have Paid"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Withdrawal Section */}
        <div className="space-y-4 rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
              <ArrowUpCircle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-rose-200">Withdraw Funds</h2>
              <p className="text-xs text-white/60">Select withdrawal method and enter details</p>
            </div>
          </div>

          {!showWithdrawForm ? (
            <div className="space-y-4">
              {withdrawalMethods.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-white/60">
                  <p>No withdrawal methods available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Select Withdrawal Method</label>
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-rose-400"
                    >
                      {withdrawalMethods.map((method) => (
                        <option key={method.id} value={method.id} className="bg-slate-900 text-white">
                          {method.name} (Min: ${method.minAmount}, Fee: ${method.fee})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMethod && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white/80 mb-1">Minimum: ${selectedMethod.minAmount}</p>
                      <p className="text-sm text-white/80 mb-1">Fee: ${selectedMethod.fee}</p>
                      <p className="text-xs text-white/60 mb-4">Processing: {selectedMethod.processingTime}</p>
                      <button
                        onClick={() => setShowWithdrawForm(true)}
                        className="w-full rounded-2xl bg-rose-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-rose-400"
                      >
                        Continue Withdrawal
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              {selectedMethod && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
                  <p className="text-sm font-semibold text-rose-200 mb-2">{selectedMethod.name}</p>
                  <p className="text-xs text-white/60">Processing: {selectedMethod.processingTime}</p>
                </div>
              )}

              {selectedMethod?.type === 'trc20' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">TRC20 Wallet Address</label>
                  <input
                    type="text"
                    value={withdrawalAccount}
                    onChange={(e) => setWithdrawalAccount(e.target.value)}
                    placeholder="Enter your TRC20 wallet address"
                    className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-rose-400 font-mono text-sm"
                    required
                  />
                </div>
              )}

              {selectedMethod?.type === 'bank' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-rose-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-rose-400"
                      required
                    />
                  </div>
                </>
              )}

              {selectedMethod?.type === 'binance' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Email / Pay ID</label>
                  <input
                    type="text"
                    value={withdrawalAccount}
                    onChange={(e) => setWithdrawalAccount(e.target.value)}
                    placeholder="Enter Binance Pay email or Pay ID"
                    className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-rose-400"
                    required
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Withdrawal Amount</label>
                <input
                  type="number"
                  min={selectedMethod?.minAmount || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Min: ${selectedMethod?.minAmount || 0}`}
                  className="w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white outline-none focus:border-rose-400"
                  required
                />
                {selectedMethod && withdrawAmount && Number(withdrawAmount) >= selectedMethod.minAmount && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70">Amount:</span>
                      <span className="text-white">{formatCurrency(Number(withdrawAmount))}</span>
                    </div>
                    {selectedMethod.fee > 0 && (
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/70">Fee:</span>
                        <span className="text-rose-400">-{formatCurrency(selectedMethod.fee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/10">
                      <span className="text-white">You will receive:</span>
                      <span className="text-emerald-400">{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawForm(false);
                    setWithdrawAmount('');
                    setWithdrawalAccount('');
                    setBankName('');
                    setAccountNumber('');
                  }}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading === 'withdraw'}
                  className={cn(
                    "flex-1 rounded-2xl bg-rose-400/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-rose-400",
                    loading === 'withdraw' && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading === 'withdraw' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Withdrawal"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {status && (
        <div className={cn(
          "rounded-2xl border p-4 text-sm",
          status.includes("successfully") || status.includes("submitted") || status.includes("copied")
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        )}>
          {status}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-emerald-500/20 border border-emerald-400"></div>
              <span className="text-white/60">Deposits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-rose-500/20 border border-rose-400"></div>
              <span className="text-white/60">Withdrawals</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
          {walletHistory.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              <p>No transactions yet</p>
              <p className="text-xs mt-2">Your deposit and withdrawal history will appear here</p>
            </div>
          ) : (
            <DataTable
              columns={[
                { header: "Txn ID", accessor: (row) => <span className="font-mono text-xs">{row.id}</span> },
                { 
                  header: "Type", 
                  accessor: (row) => (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                      row.type === "deposit"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    )}>
                      {row.type === "deposit" ? (
                        <>
                          <ArrowDownCircle className="size-3" />
                          Deposit
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="size-3" />
                          Withdrawal
                        </>
                      )}
                    </span>
                  )
                },
                {
                  header: "Amount",
                  accessor: (row) => (
                    <span className={cn(
                      "font-semibold",
                      row.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {row.type === "deposit" ? "+" : "-"}
                      {formatCurrency(row.amount, { maximumFractionDigits: 0 })}
                    </span>
                  )
                },
                { 
                  header: "Method/Channel", 
                  accessor: (row) => (
                    <span className="text-sm text-white/80">{row.channel || "N/A"}</span>
                  )
                },
                { 
                  header: "Account Details", 
                  accessor: (row) => {
                    if (row.type === "withdrawal" && row.withdrawalAccount) {
                      return <span className="text-xs font-mono text-white/70">{row.withdrawalAccount}</span>;
                    }
                    if (row.type === "deposit" && row.gatewayId) {
                      return <span className="text-xs text-white/70">Gateway Payment</span>;
                    }
                    return <span className="text-white/40">-</span>;
                  }
                },
                { 
                  header: "Status", 
                  accessor: (row) => {
                    const statusMap: Record<string, { label: string; className: string }> = {
                      'pending': { label: 'Pending Approval', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
                      'approved': { label: 'Approved', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
                      'rejected': { label: 'Rejected', className: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
                      'completed': { label: 'Completed', className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
                    };
                    const statusInfo = statusMap[row.status] || statusMap['pending'];
                    return (
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", statusInfo.className)}>
                        {statusInfo.label}
                      </span>
                    );
                  }
                },
                { 
                  header: "Fee", 
                  accessor: (row) => {
                    if (row.fee && row.fee > 0) {
                      return <span className="text-xs text-white/60">-{formatCurrency(row.fee)}</span>;
                    }
                    return <span className="text-white/40">-</span>;
                  }
                },
                { 
                  header: "Final Amount", 
                  accessor: (row) => {
                    if (row.finalAmount !== undefined && row.finalAmount !== null) {
                      return (
                        <span className={cn(
                          "text-sm font-semibold",
                          row.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {formatCurrency(row.finalAmount)}
                        </span>
                      );
                    }
                    return <span className="text-white/40">-</span>;
                  }
                },
                { 
                  header: "Rejection Reason", 
                  accessor: (row) => {
                    if (row.rejectionReason) {
                      return <span className="text-xs text-rose-400">{row.rejectionReason}</span>;
                    }
                    return <span className="text-white/40">-</span>;
                  }
                },
                { 
                  header: "Date & Time", 
                  accessor: (row) => (
                    <span className="text-xs text-white/60">
                      {new Date(row.timestamp || Date.now()).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )
                },
              ]}
              data={walletHistory}
            />
          )}
        </div>
      </div>
    </UserShell>
  );
}
