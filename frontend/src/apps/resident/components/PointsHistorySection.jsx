import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Sparkles, 
  CreditCard, 
  Gift, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Calendar, 
  Receipt,
  Copy,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { socket } from '../../../services/socket';
import { fetchPointsHistory } from '../services/residentApi';

export default function PointsHistorySection({ 
  currentPoints = 0, 
  onNavigateToRewards, 
  onNavigateToBilling,
  showToast 
}) {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({
    currentBalance: currentPoints,
    rebateValueInr: (currentPoints * 0.5).toFixed(2),
    totalEarned: 0,
    totalRefunded: 0,
    totalRedeemed: 0,
    totalTransactions: 0,
    transactions: []
  });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const loadHistory = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchPointsHistory();
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching points history:', err);
      if (!silent && showToast) {
        showToast('Failed to load points history ledger', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => {
      loadHistory(true);
    };

    socket.on('points-credited', handleUpdate);
    socket.on('order-refunded', handleUpdate);
    socket.on('resident-points-updated', handleUpdate);
    socket.on('reward-redeemed', handleUpdate);
    socket.on('payment-updated', handleUpdate);

    return () => {
      socket.off('points-credited', handleUpdate);
      socket.off('order-refunded', handleUpdate);
      socket.off('resident-points-updated', handleUpdate);
      socket.off('reward-redeemed', handleUpdate);
      socket.off('payment-updated', handleUpdate);
    };
  }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    if (showToast) showToast(`Copied reference ID: ${text}`, 'info');
  };

  const filteredTransactions = useMemo(() => {
    const txns = historyData?.transactions || [];
    return txns.filter(t => {
      // Type filtering
      if (activeFilter === 'EARNED' && t.type !== 'EARNED') return false;
      if (activeFilter === 'REFUNDED' && t.type !== 'REFUNDED') return false;
      if (activeFilter === 'REDEEMED' && t.type !== 'REDEEMED') return false;
      if (activeFilter === 'BILL_REBATE' && t.type !== 'BILL_REBATE') return false;

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const customId = (t.customId || '').toLowerCase();
        const refId = (t.referenceId || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        return customId.includes(q) || refId.includes(q) || title.includes(q) || desc.includes(q) || cat.includes(q);
      }

      return true;
    });
  }, [historyData?.transactions, activeFilter, searchQuery]);

  const effectiveBalance = historyData?.currentBalance !== undefined 
    ? historyData.currentBalance 
    : currentPoints;

  const effectiveRebate = (effectiveBalance * 0.5).toFixed(2);

  const getBadgeVisual = (type) => {
    switch (type) {
      case 'EARNED':
        return {
          label: 'Waste Pickup',
          icon: ArrowDownLeft,
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          pointsColor: 'text-emerald-600',
          sign: '+'
        };
      case 'REFUNDED':
        return {
          label: 'Order Refund',
          icon: RotateCcw,
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold',
          pointsColor: 'text-amber-700 font-black',
          sign: '+'
        };
      case 'REDEEMED':
        return {
          label: 'Reward Gift',
          icon: ArrowUpRight,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          pointsColor: 'text-rose-600',
          sign: '-'
        };
      case 'BILL_REBATE':
        return {
          label: 'Bill Discount',
          icon: CreditCard,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          pointsColor: 'text-blue-600',
          sign: '-'
        };
      default:
        return {
          label: 'Transaction',
          icon: Coins,
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          pointsColor: 'text-slate-700',
          sign: ''
        };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-[#0B2E24] text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Receipt className="w-3 h-3 text-emerald-400" /> Official Eco-Points Ledger
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                Live Real-Time Sync
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Points Transaction History
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Transparent, immutable record of all garbage points earned from doorstep waste collections, order refunds issued by Municipal Admin, and debits used for reward gift redemptions or bill rebates.
            </p>
          </div>

          {/* Current Balance Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 shrink-0 self-start lg:self-auto">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 block tracking-wider">
                Current Wallet Balance
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5 mt-0.5">
                {effectiveBalance} <span className="text-sm font-bold text-emerald-300">PTS</span>
              </div>
              <div className="text-[11px] text-emerald-200/90 font-semibold mt-1 flex items-center gap-1">
                <span>≈ ₹{effectiveRebate}</span>
                <span className="text-[10px] text-emerald-300/70 font-normal">(1 PTS = ₹0.50 Bill Rebate)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-l border-white/15 pl-4">
              {onNavigateToRewards && (
                <button
                  onClick={onNavigateToRewards}
                  className="px-3 py-1.5 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" /> Redeem
                </button>
              )}
              {onNavigateToBilling && (
                <button
                  onClick={onNavigateToBilling}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 flex items-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Bill
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. 4-KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Earned */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Earned
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              +{historyData?.totalEarned || 0} <span className="text-xs text-emerald-600 font-sans font-bold">PTS</span>
            </div>
            <span className="text-[10px] text-slate-400">Waste collections</span>
          </div>
        </div>

        {/* Card 2: Total Refunded */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-amber-50/30 to-white">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-800 block uppercase tracking-wider">
              Total Refunded
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              +{historyData?.totalRefunded || 0} <span className="text-xs text-amber-700 font-sans font-bold">PTS</span>
            </div>
            <span className="text-[10px] text-amber-700/80 font-medium">Order issues credited back</span>
          </div>
        </div>

        {/* Card 3: Total Redeemed */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Redeemed
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              -{historyData?.totalRedeemed || 0} <span className="text-xs text-rose-600 font-sans font-bold">PTS</span>
            </div>
            <span className="text-[10px] text-slate-400">Gifts & bill discounts</span>
          </div>
        </div>

        {/* Card 4: Total Records */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Transactions
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {historyData?.transactions?.length || 0}
            </div>
            <span className="text-[10px] text-slate-400">Lifetime ledger events</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills, Search Bar, and Action Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Activities' },
            { id: 'REFUNDED', label: '💰 Order Refunds', highlight: 'text-amber-800' },
            { id: 'EARNED', label: '✅ Waste Pickups' },
            { id: 'REDEEMED', label: '🎁 Gift Claims' },
            { id: 'BILL_REBATE', label: '💳 Bill Rebates' }
          ].map(f => {
            const isSelected = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search input & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference # or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => loadHistory(false)}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-[#00B074] hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 shrink-0"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00B074]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Transactions List / Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && historyData?.transactions?.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#00B074]" />
            <p className="text-xs font-semibold">Loading points transaction ledger...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Coins className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Transactions Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || activeFilter !== 'ALL'
                ? 'No points transactions match your current search or category filter.'
                : 'You have not completed any waste collections or reward redemptions yet.'}
            </p>
            {(searchQuery || activeFilter !== 'ALL') && (
              <button
                onClick={() => { setActiveFilter('ALL'); setSearchQuery(''); }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 px-6 py-3.5 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-3">Date & Time</div>
              <div className="col-span-2">Type / Category</div>
              <div className="col-span-4">Transaction Details & Reference</div>
              <div className="col-span-3 text-right">Points Impact</div>
            </div>

            {/* Transaction Rows */}
            {filteredTransactions.map((txn, index) => {
              const visual = getBadgeVisual(txn.type);
              const Icon = visual.icon;
              const isPositive = txn.type === 'EARNED' || txn.type === 'REFUNDED' || Number(txn.points) > 0;
              const absPoints = Math.abs(Number(txn.points || 0));

              return (
                <div
                  key={txn._id || txn.customId || index}
                  className={`px-5 py-4 transition hover:bg-slate-50/80 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-0 items-start md:items-center ${
                    txn.type === 'REFUNDED' ? 'bg-amber-50/20' : ''
                  }`}
                >
                  {/* Col 1: Date & Time */}
                  <div className="col-span-3 space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800 block">
                      {formatDate(txn.createdAt || txn.date)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {txn.customId || `#TXN-${String(index + 1).padStart(4, '0')}`}
                    </span>
                  </div>

                  {/* Col 2: Type Badge */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${visual.badgeBg}`}>
                      <Icon className="w-3 h-3" />
                      <span>{visual.label}</span>
                    </span>
                  </div>

                  {/* Col 3: Details & Reference */}
                  <div className="col-span-4 space-y-1">
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      {txn.title}
                    </h5>
                    {txn.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {txn.description}
                      </p>
                    )}
                    {txn.referenceId && (
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Ref:</span>
                        <button
                          onClick={() => copyToClipboard(txn.referenceId, txn._id || txn.customId)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold transition cursor-pointer"
                          title="Click to copy reference ID"
                        >
                          <span>{txn.referenceId}</span>
                          {copiedId === (txn._id || txn.customId) ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Col 4: Points Impact & Balance */}
                  <div className="col-span-3 md:text-right flex md:flex-col items-center md:items-end justify-between w-full md:w-auto">
                    <div className={`text-base font-black font-mono flex items-center gap-1 ${visual.pointsColor}`}>
                      <span>{isPositive ? '+' : '-'}{absPoints}</span>
                      <span className="text-[11px] font-sans font-bold">PTS</span>
                    </div>

                    {txn.balanceAfter !== undefined && txn.balanceAfter !== null ? (
                      <span className="text-[10px] text-slate-400 font-mono font-medium block">
                        Bal: {txn.balanceAfter} PTS
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {isPositive ? 'Wallet Credited' : 'Wallet Debited'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Policy & Information Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-800 block">About Garbage Points & Refund Regulations</strong>
          <p className="leading-relaxed text-[11px]">
            Points are automatically credited when collection drivers scan and record segregated organic, recyclable, and hazardous waste. For defective or missing eco-gifts, municipal administrators process refunds back to your wallet. You can redeem accumulated points anytime for biodegradable garbage bags, dual caddies, home composters, or apply them as a credit toward your municipal waste utility invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
