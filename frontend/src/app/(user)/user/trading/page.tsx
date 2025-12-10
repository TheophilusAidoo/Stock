'use client';

import { FormEvent, useState, useEffect } from "react";
import { UserShell } from "@/components/layout/user-shell";
import { DataTable } from "@/components/ui/data-table";
import { sampleWatchlist } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, RefreshCw, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/trading/countdown-timer";

type Order = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'Executed' | 'Pending';
};

type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
};

type TimerSetting = {
  id: string;
  duration: number;
  label: string;
  isEnabled: boolean;
};

type TimedTrade = {
  id: string;
  symbol?: string;
  side?: 'BUY' | 'SELL';
  amount: number;
  timerDuration: number;
  timerLabel: string;
  profitRate: number;
  status: 'pending' | 'win' | 'lose' | 'draw';
  profitAmount: number;
  expiresAt: string;
  createdAt: string;
};

export default function TradingPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [product, setProduct] = useState<'CNC' | 'MIS'>('CNC');
  const [validity, setValidity] = useState<'DAY' | 'IOC'>('DAY');
  const [selectedBuyTimer, setSelectedBuyTimer] = useState<number | null>(null);
  const [selectedSellTimer, setSelectedSellTimer] = useState<number | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    side: 'BUY' | 'SELL';
    symbol: string;
    quantity: number;
    price: number;
    orderType: 'MARKET' | 'LIMIT';
    product: 'CNC' | 'MIS';
    validity: 'DAY' | 'IOC';
    timer?: number;
  } | null>(null);
  
  // Timed Trading State
  const [timers, setTimers] = useState<TimerSetting[]>([]);
  const [tradingSettings, setTradingSettings] = useState({ defaultProfitRate: 80 });
  const [timedTrades, setTimedTrades] = useState<TimedTrade[]>([]);

  useEffect(() => {
    loadOrders();
    loadPositions();
    loadTimedTradingData();
    
    // Auto-refresh timed trades every 5 seconds to check for results
    const interval = setInterval(() => {
      loadTimedTradingData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadTimedTradingData() {
    try {
      const [timersData, settingsData, tradesData] = await Promise.all([
        api.trading.getTimerSettings(),
        api.trading.getTradingSettings(),
        (async () => {
          const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
          const userId = userToken ? userToken.replace('token-', '') : undefined;
          if (userId) {
            return await api.trading.getTimedTrades(userId);
          }
          return [];
        })(),
      ]);
      setTimers((timersData as TimerSetting[]).filter(t => t.isEnabled));
      setTradingSettings(settingsData as any);
      setTimedTrades(tradesData as TimedTrade[]);
    } catch (error) {
      console.error('Failed to load timed trading data:', error);
    }
  }


  async function loadOrders() {
    try {
      setLoadingOrders(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      const data = await api.trading.orders(userId);
      setOrders(data as Order[]);
    } catch (error) {
      // Silently handle errors - user might not have orders yet
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadPositions() {
    try {
      setLoadingPositions(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      const data = await api.trading.positions(userId);
      setPositions(data as Position[]);
    } catch (error) {
      // Silently handle errors - user might not have positions yet
      setPositions([]);
    } finally {
      setLoadingPositions(false);
    }
  }

  async function handleOrder(event: FormEvent<HTMLFormElement>, side: "BUY" | "SELL") {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const symbol = formData.get("symbol") as string;
    const amount = Number(formData.get("amount")); // Get amount instead of quantity
    const price = orderType === 'MARKET' ? (selectedStock?.price || 0) : Number(formData.get("price"));
    const timer = Number(formData.get("timer")); // Get timer from form

    // Validate timer
    if (!timer || timer <= 0) {
      alert('Please select a timer');
      return;
    }

    // Validate price
    if (!price || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    // Calculate quantity from amount and price
    const quantity = Math.floor(amount / price);

    if (quantity <= 0) {
      alert('Amount is too low. Please enter a higher amount.');
      return;
    }

    // Store order details and show confirmation dialog
    setPendingOrder({
      side,
      symbol,
      quantity,
      price: price || 0,
      orderType,
      product,
      validity,
      timer // Include timer in pending order
    });
    setShowConfirmDialog(true);
  }

  async function confirmOrder() {
    if (!pendingOrder) return;

    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      const result = await api.trading.placeOrder({ 
        symbol: pendingOrder.symbol, 
        quantity: pendingOrder.quantity, 
        price: pendingOrder.price, 
        side: pendingOrder.side,
        orderType: pendingOrder.orderType,
        userId,
        product: pendingOrder.product,
        validity: pendingOrder.validity,
        timer: pendingOrder.timer // Include timer if selected
      });
      
      // If it's a timed trade, reload timed trades
      if (result && (result as any).type === 'timed_trade') {
        await loadTimedTradingData();
      }
      
      await loadOrders();
      await loadPositions();
      
      // Reset form
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (form.querySelector(`input[name="amount"]`)) {
          form.reset();
        }
      });
      
      setPendingOrder(null);
      setSelectedBuyTimer(null);
      setSelectedSellTimer(null);
      setBuyAmount('');
      setSellAmount('');
      setBuyPrice('');
      setSellPrice('');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  function cancelOrder() {
    setShowConfirmDialog(false);
    setPendingOrder(null);
  }

  const selectedStock = sampleWatchlist.find(s => s.symbol === selectedSymbol) || sampleWatchlist[0];
  const selectedPosition = positions.find(p => p.symbol === selectedSymbol);

  return (
    <UserShell 
      title="Trading" 
      subtitle="Blazing fast execution with smart routing"
      actions={
        <button
          onClick={() => {
            loadOrders();
            loadPositions();
            loadTimedTradingData();
          }}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition"
        >
          <RefreshCw className="size-4" />
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {/* Buy Order Form */}
        <form
          onSubmit={(event) => handleOrder(event, "BUY")}
          className="space-y-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5 h-full flex flex-col"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-emerald-200">Buy Order</h2>
            <TrendingUp className="size-5 text-emerald-400" />
          </div>
          
          <div className="space-y-3 flex-1">
            <div>
              <label className="mb-1 block text-xs text-white/60">Symbol</label>
              <select
                name="symbol"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
                required
              >
                {sampleWatchlist.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol} className="bg-slate-900">
                    {stock.symbol}
                  </option>
                ))}
              </select>
              {selectedStock && (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-white/60">LTP:</span>
                  <span className="font-semibold text-white">{formatCurrency(selectedStock.price)}</span>
                  <span className={selectedStock.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {selectedStock.change >= 0 ? "+" : ""}{selectedStock.change.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Order Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    orderType === 'MARKET'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  MARKET
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    orderType === 'LIMIT'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  LIMIT
                </button>
              </div>
            </div>

            {orderType === 'LIMIT' && (
              <div>
                <label className="mb-1 block text-xs text-white/60">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.05"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder={selectedStock?.price.toFixed(2)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
                  required={orderType === 'LIMIT'}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-white/60">Amount</label>
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="25000"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400"
                required
              />
              {selectedStock && buyAmount && Number(buyAmount) > 0 && (
                <p className="mt-1 text-xs text-white/50">
                  Quantity: ~{Math.floor(Number(buyAmount) / (orderType === 'LIMIT' && buyPrice ? Number(buyPrice) : selectedStock.price)) || 0} shares @ {formatCurrency(orderType === 'LIMIT' && buyPrice ? Number(buyPrice) : selectedStock.price)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Product</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProduct('CNC')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    product === 'CNC'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  CNC
                </button>
                <button
                  type="button"
                  onClick={() => setProduct('MIS')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    product === 'MIS'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  MIS
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Validity</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValidity('DAY')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    validity === 'DAY'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  DAY
                </button>
                <button
                  type="button"
                  onClick={() => setValidity('IOC')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    validity === 'IOC'
                      ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  IOC
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Timer <span className="text-rose-400">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {timers.filter(t => t.isEnabled).map((timer) => (
                  <button
                    key={timer.id}
                    type="button"
                    onClick={() => {
                      setSelectedBuyTimer(selectedBuyTimer === timer.duration ? null : timer.duration);
                    }}
                    className={cn(
                      "rounded-xl px-2 py-2 text-xs font-medium transition",
                      selectedBuyTimer === timer.duration
                        ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:border-emerald-400/30"
                    )}
                  >
                    {timer.label}
                  </button>
                ))}
              </div>
              {!selectedBuyTimer && (
                <p className="mt-1 text-xs text-rose-400">Please select a timer</p>
              )}
              <input type="hidden" name="timer" value={selectedBuyTimer || ''} required />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !selectedBuyTimer}
            className={cn(
              "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 transition",
              loading || !selectedBuyTimer
                ? "bg-emerald-400/50 cursor-not-allowed"
                : "bg-emerald-400/90 hover:bg-emerald-400"
            )}
          >
            {loading ? "Placing Order..." : "Execute Buy"}
          </button>
        </form>

        {/* Sell Order Form */}
        <form
          onSubmit={(event) => handleOrder(event, "SELL")}
          className="space-y-4 rounded-3xl border border-rose-500/30 bg-rose-500/5 p-5 h-full flex flex-col"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-rose-200">Sell Order</h2>
            <TrendingDown className="size-5 text-rose-400" />
          </div>
          
          <div className="space-y-3 flex-1">
            <div>
              <label className="mb-1 block text-xs text-white/60">Symbol</label>
              <select
                name="symbol"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-400"
                required
              >
                {sampleWatchlist.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol} className="bg-slate-900">
                    {stock.symbol}
                  </option>
                ))}
              </select>
              {selectedStock && (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-white/60">LTP:</span>
                  <span className="font-semibold text-white">{formatCurrency(selectedStock.price)}</span>
                  <span className={selectedStock.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {selectedStock.change >= 0 ? "+" : ""}{selectedStock.change.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Order Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    orderType === 'MARKET'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  MARKET
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    orderType === 'LIMIT'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  LIMIT
                </button>
              </div>
            </div>

            {orderType === 'LIMIT' && (
              <div>
                <label className="mb-1 block text-xs text-white/60">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.05"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder={selectedStock?.price.toFixed(2)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-400"
                  required={orderType === 'LIMIT'}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-white/60">Amount</label>
              <input
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="25000"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-rose-400"
                required
              />
              {selectedStock && sellAmount && Number(sellAmount) > 0 && (
                <p className="mt-1 text-xs text-white/50">
                  Quantity: ~{Math.floor(Number(sellAmount) / (orderType === 'LIMIT' && sellPrice ? Number(sellPrice) : selectedStock.price)) || 0} shares @ {formatCurrency(orderType === 'LIMIT' && sellPrice ? Number(sellPrice) : selectedStock.price)}
                </p>
              )}
              {selectedPosition && (
                <p className="mt-1 text-xs text-white/50">
                  Available: {selectedPosition.quantity} qty
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Product</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProduct('CNC')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    product === 'CNC'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  CNC
                </button>
                <button
                  type="button"
                  onClick={() => setProduct('MIS')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    product === 'MIS'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  MIS
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Validity</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValidity('DAY')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    validity === 'DAY'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  DAY
                </button>
                <button
                  type="button"
                  onClick={() => setValidity('IOC')}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-medium transition",
                    validity === 'IOC'
                      ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/5 text-white/60 border border-white/10"
                  )}
                >
                  IOC
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">Timer <span className="text-rose-400">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {timers.filter(t => t.isEnabled).map((timer) => (
                  <button
                    key={timer.id}
                    type="button"
                    onClick={() => {
                      setSelectedSellTimer(selectedSellTimer === timer.duration ? null : timer.duration);
                    }}
                    className={cn(
                      "rounded-xl px-2 py-2 text-xs font-medium transition",
                      selectedSellTimer === timer.duration
                        ? "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:border-rose-400/30"
                    )}
                  >
                    {timer.label}
                  </button>
                ))}
              </div>
              {!selectedSellTimer && (
                <p className="mt-1 text-xs text-rose-400">Please select a timer</p>
              )}
              <input type="hidden" name="timer" value={selectedSellTimer || ''} required />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !selectedSellTimer}
            className={cn(
              "w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 transition",
              loading || !selectedSellTimer
                ? "bg-rose-400/50 cursor-not-allowed"
                : "bg-rose-400/90 hover:bg-rose-400"
            )}
          >
            {loading ? "Placing Order..." : "Execute Sell"}
          </button>
        </form>

        {/* Order Flow & Positions */}
        <div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-2" style={{ scrollbarWidth: 'thin' }}>
              {(() => {
                // Combine regular orders and timed trades
                const allTrades: Array<{
                  id: string;
                  type: 'order' | 'timed_trade';
                  symbol?: string;
                  side?: 'BUY' | 'SELL';
                  quantity?: number;
                  price?: number;
                  status: string;
                  amount?: number;
                  timerLabel?: string;
                  profitRate?: number;
                  profitAmount?: number;
                  expiresAt?: string;
                  createdAt: string;
                }> = [
                  ...orders.map(order => ({
                    id: order.id,
                    type: 'order' as const,
                    symbol: order.symbol,
                    side: order.side,
                    quantity: order.quantity,
                    price: order.price,
                    status: order.status,
                    createdAt: new Date().toISOString(),
                  })),
                  ...timedTrades.map(trade => ({
                    id: trade.id,
                    type: 'timed_trade' as const,
                    symbol: trade.symbol || 'N/A',
                    side: trade.side || 'BUY',
                    amount: trade.amount,
                    timerLabel: trade.timerLabel,
                    profitRate: trade.profitRate,
                    profitAmount: trade.profitAmount,
                    status: trade.status,
                    expiresAt: trade.expiresAt,
                    createdAt: trade.createdAt,
                  })),
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                if (allTrades.length === 0) {
                  return <p className="text-sm text-white/50 text-center py-4">No orders yet</p>;
                }

                return allTrades.map((trade) => {
                  if (trade.type === 'order') {
                    return (
                      <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex-shrink-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm whitespace-nowrap">{trade.symbol}</p>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                                trade.side === "BUY" 
                                  ? "bg-emerald-500/20 text-emerald-400" 
                                  : "bg-rose-500/20 text-rose-400"
                              )}>
                                {trade.side}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 mt-1 break-words">
                              {formatNumber(trade.quantity || 0)} qty @ {formatCurrency(trade.price || 0)}
                            </p>
                            <p className="text-xs text-white/50 mt-1">{trade.status}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {trade.status === 'Executed' ? (
                              <CheckCircle2 className="size-4 text-emerald-400" />
                            ) : (
                              <Clock className="size-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Timed trade
                    const isExpired = trade.expiresAt ? new Date(trade.expiresAt) < new Date() : false;
                    
                    // Only show result if timer has expired, otherwise always show PENDING
                    const displayStatus = isExpired ? trade.status : 'pending';
                    const displayStatusColor = () => {
                      switch (displayStatus) {
                        case 'win': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                        case 'lose': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
                        case 'draw': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                        default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                      }
                    };
                    
                    return (
                      <div key={trade.id} className={cn("rounded-2xl border px-4 py-3 flex-shrink-0", displayStatusColor())}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-sm text-white whitespace-nowrap">{trade.symbol || 'N/A'}</p>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap",
                                trade.side === "BUY" 
                                  ? "bg-emerald-500/20 text-emerald-400" 
                                  : "bg-rose-500/20 text-rose-400"
                              )}>
                                {trade.side || 'BUY'}
                              </span>
                              <span className="text-xs text-white/60 whitespace-nowrap">{trade.timerLabel}</span>
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", displayStatusColor())}>
                                {displayStatus.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 break-words">
                              Amount: {formatCurrency(trade.amount || 0)} | Profit Rate: {trade.profitRate}%
                            </p>
                            
                            {/* Show countdown timer if not expired */}
                            {!isExpired && trade.expiresAt && (
                              <div className="mt-2">
                                <CountdownTimer 
                                  expiresAt={trade.expiresAt}
                                  onExpire={() => {
                                    setTimeout(() => loadTimedTradingData(), 1000);
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Show result only if timer expired */}
                            {isExpired && displayStatus === 'win' && (
                              <p className="text-xs text-emerald-400 mt-1">
                                Profit: +{formatCurrency(trade.profitAmount || 0)}
                              </p>
                            )}
                            {isExpired && displayStatus === 'pending' && (
                              <p className="text-xs text-yellow-400 mt-1">⏰ Timer expired - waiting for result</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {displayStatus === 'pending' ? (
                              <Clock className="size-4 text-blue-400 animate-pulse" />
                            ) : displayStatus === 'win' ? (
                              <CheckCircle2 className="size-4 text-emerald-400" />
                            ) : displayStatus === 'lose' ? (
                              <XCircle className="size-4 text-rose-400" />
                            ) : (
                              <Clock className="size-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                });
              })()}
            </div>
          </div>
        </div>
      </div>


      {/* Watchlist */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Watchlist</h2>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <DataTable
              columns={[
                { header: "Symbol", accessor: (row) => row.symbol },
                { header: "LTP", accessor: (row) => formatCurrency(row.price) },
                {
                  header: "Change",
                  accessor: (row) => (
                    <span className={row.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {row.change >= 0 ? "+" : ""}
                      {row.change.toFixed(2)}%
                    </span>
                  ),
                },
                { header: "Volume (Cr)", accessor: (row) => formatNumber(row.volume) },
              ]}
              data={sampleWatchlist}
            />
          </div>
        </div>

      {/* Order Confirmation Dialog */}
      {showConfirmDialog && pendingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={cancelOrder}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                pendingOrder.side === 'BUY' 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/20 text-rose-400"
              )}>
                {pendingOrder.side === 'BUY' ? (
                  <TrendingUp className="size-6" />
                ) : (
                  <TrendingDown className="size-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Confirm {pendingOrder.side} Order
                </h3>
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Symbol:</span>
                    <span className="text-sm font-semibold text-white">{pendingOrder.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Side:</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      pendingOrder.side === 'BUY' ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {pendingOrder.side}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Quantity:</span>
                    <span className="text-sm font-semibold text-white">{formatNumber(pendingOrder.quantity)}</span>
                  </div>
                  {pendingOrder.orderType === 'LIMIT' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-white/60">Price:</span>
                      <span className="text-sm font-semibold text-white">{formatCurrency(pendingOrder.price)}</span>
                    </div>
                  )}
                  {pendingOrder.orderType === 'MARKET' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-white/60">Price:</span>
                      <span className="text-sm font-semibold text-white">Market Price</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Product:</span>
                    <span className="text-sm font-semibold text-white">{pendingOrder.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Validity:</span>
                    <span className="text-sm font-semibold text-white">{pendingOrder.validity}</span>
                  </div>
                  {pendingOrder.timer && (
                    <div className="flex justify-between">
                      <span className="text-sm text-white/60">Timer:</span>
                      <span className="text-sm font-semibold text-blue-400">
                        {timers.find(t => t.duration === pendingOrder.timer)?.label || `${pendingOrder.timer}min`}
                      </span>
                    </div>
                  )}
                  {pendingOrder.orderType === 'LIMIT' && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-white/60">Total Amount:</span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(pendingOrder.price * pendingOrder.quantity)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={cancelOrder}
                    className="flex-1 rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmOrder}
                    disabled={loading}
                    className={cn(
                      "flex-1 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-900 transition",
                      pendingOrder.side === 'BUY'
                        ? "bg-emerald-400 hover:bg-emerald-300"
                        : "bg-rose-400 hover:bg-rose-300",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {loading ? "Placing..." : `Confirm ${pendingOrder.side}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}

