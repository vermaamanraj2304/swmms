import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Sparkles, 
  CreditCard, 
  Gift, 
  Package, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Receipt,
  Copy,
  Check,
  ChevronRight,
  Info,
  ShoppingBag,
  Trash2,
  Shield,
  Clock,
  Truck,
  ArrowRight,
  X,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { socket } from '../../../services/socket';
import { fetchPointsHistory } from '../services/residentApi';

export default function PointsAndRewardPage({
  points = 0,
  rewards = [],
  redemptions = [],
  residentAddress = '',
  onRedeem,
  onNavigateToBilling,
  onNavigateToOrders,
  showToast,
  initialSubTab = 'history',
  onNavigateSubTab
}) {
  const [subTab, setSubTab] = useState(initialSubTab); // 'history' | 'catalog' | 'orders'

  const handleSubTabChange = (t) => {
    setSubTab(t);
    if (onNavigateSubTab) {
      onNavigateSubTab(t);
    }
  };
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({
    currentBalance: points,
    rebateValueInr: (points * 0.5).toFixed(2),
    totalEarned: 0,
    totalRefunded: 0,
    totalRedeemed: 0,
    totalTransactions: 0,
    transactions: []
  });
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'EARNED' | 'DEDUCTION' | 'REFUNDED'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Rewards catalog state
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGiftToClaim, setSelectedGiftToClaim] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(residentAddress || '');
  const [claimNotes, setClaimNotes] = useState('');
  const [claiming, setClaiming] = useState(false);

  // Sync initialSubTab when parent changes tab
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

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

  const effectiveBalance = historyData?.currentBalance !== undefined 
    ? historyData.currentBalance 
    : points;

  const effectiveRebate = (effectiveBalance * 0.5).toFixed(2);

  // Filtered transactions for the ledger
  const filteredTransactions = useMemo(() => {
    const txns = historyData?.transactions || [];
    return txns.filter(t => {
      // Direction / Type Filtering
      if (activeFilter === 'EARNED' && t.type !== 'EARNED' && t.type !== 'BONUS') return false;
      if (activeFilter === 'DEDUCTION' && t.type !== 'REDEEMED' && t.type !== 'BILL_REBATE') return false;
      if (activeFilter === 'REFUNDED' && t.type !== 'REFUNDED') return false;

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

  // Counts for each filter
  const filterCounts = useMemo(() => {
    const txns = historyData?.transactions || [];
    return {
      all: txns.length,
      earned: txns.filter(t => t.type === 'EARNED' || t.type === 'BONUS').length,
      deduction: txns.filter(t => t.type === 'REDEEMED' || t.type === 'BILL_REBATE').length,
      refunded: txns.filter(t => t.type === 'REFUNDED').length,
    };
  }, [historyData?.transactions]);

  const getBadgeVisual = (type) => {
    switch (type) {
      case 'EARNED':
      case 'BONUS':
        return {
          label: 'Point Earning',
          categoryLabel: type === 'BONUS' ? 'Eco Bonus' : 'Waste Pickup',
          icon: ArrowDownLeft,
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
          pointsColor: 'text-emerald-600',
          sign: '+',
          isCredit: true
        };
      case 'REFUNDED':
        return {
          label: 'Point Refund',
          categoryLabel: 'Order Refund',
          icon: RotateCcw,
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-300 font-black',
          pointsColor: 'text-amber-700 font-black',
          sign: '+',
          isCredit: true
        };
      case 'REDEEMED':
        return {
          label: 'Point Deduction',
          categoryLabel: 'Gift Redeemed',
          icon: ArrowUpRight,
          badgeBg: 'bg-purple-50 text-purple-800 border-purple-200 font-bold',
          pointsColor: 'text-rose-600',
          sign: '-',
          isCredit: false
        };
      case 'BILL_REBATE':
        return {
          label: 'Point Deduction',
          categoryLabel: 'Bill Rebate',
          icon: CreditCard,
          badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
          pointsColor: 'text-blue-600',
          sign: '-',
          isCredit: false
        };
      default:
        return {
          label: 'Points Activity',
          categoryLabel: 'Transaction',
          icon: Coins,
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          pointsColor: 'text-slate-700',
          sign: '',
          isCredit: true
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

  const giftCategories = [
    { id: 'ALL', label: 'All Rewards & Gifts' },
    { id: 'Garbage Bags', label: 'Garbage Bags (Diff Sizes)', icon: ShoppingBag },
    { id: 'Trash Bins', label: 'Trash Bins & Caddies', icon: Trash2 },
    { id: 'Eco Tools & Accessories', label: 'Eco Tools', icon: Shield },
    { id: 'Bill Discount & Vouchers', label: 'Bill Discounts', icon: CreditCard }
  ];

  const filteredGifts = rewards.filter(g => {
    if (selectedCategory === 'ALL') return true;
    return g.category === selectedCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Garbage Bags':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'Trash Bins':
        return <Trash2 className="w-5 h-5 text-teal-600" />;
      case 'Eco Tools & Accessories':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-purple-600" />;
    }
  };

  const handleConfirmClaim = async (e) => {
    e.preventDefault();
    if (!selectedGiftToClaim) return;

    try {
      setClaiming(true);
      await onRedeem(selectedGiftToClaim._id || selectedGiftToClaim.customId, deliveryAddress, claimNotes);
      setSelectedGiftToClaim(null);
      setClaimNotes('');
      if (showToast) {
        showToast(`🎉 Claimed "${selectedGiftToClaim.title}"! Delivery order registered.`, 'success');
      }
      loadHistory(true);
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'Failed to claim reward gift', 'error');
      }
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Navigation Hub for "Points and Reward" */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-[#0B2E24] text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Points and Reward
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                Live Real-Time Sync
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Points and Reward
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Track your garbage point earning, deduction, and refund history, redeem points for compostable bags and bins, and manage delivery orders.
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
              <button
                onClick={() => handleSubTabChange('catalog')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer ${
                  subTab === 'catalog'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-[#00B074] hover:bg-[#009663] text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> Redeem
              </button>
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

      {/* 2. Primary Sub-Section Switcher Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleSubTabChange('history')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'history'
              ? 'bg-[#0F172A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-400" />
          <span>🪙 Points Ledger & History</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            subTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            Earning • Deduction • Refund
          </span>
        </button>

        <button
          onClick={() => handleSubTabChange('catalog')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'catalog'
              ? 'bg-[#0F172A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Gift className="w-4 h-4 text-purple-400" />
          <span>🎁 Eco-Rewards Store</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            subTab === 'catalog' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {rewards.length} Gifts
          </span>
        </button>

        <button
          onClick={() => handleSubTabChange('orders')}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'orders'
              ? 'bg-[#0F172A] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4 text-blue-400" />
          <span>📦 Claimed Rewards & Deliveries</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            subTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {redemptions.length} Claimed
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: POINTS LEDGER (EARNING, DEDUCTION & REFUND HISTORY) */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="space-y-6">
          {/* 4-KPI Metric Cards Showcase */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Points Earned */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-emerald-50/40 to-white">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                  Points Earning
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                  +{historyData?.totalEarned || 0} <span className="text-xs text-emerald-700 font-sans font-bold">PTS</span>
                </div>
                <span className="text-[10px] text-emerald-700/80">Waste collections & bonuses</span>
              </div>
            </div>

            {/* Card 2: Total Points Deducted */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-rose-50/30 to-white">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-800 block uppercase tracking-wider">
                  Points Deduction
                </span>
                <div className="text-xl sm:text-2xl font-black text-rose-900 font-mono">
                  -{historyData?.totalRedeemed || 0} <span className="text-xs text-rose-700 font-sans font-bold">PTS</span>
                </div>
                <span className="text-[10px] text-rose-700/80">Claimed gifts & bill rebates</span>
              </div>
            </div>

            {/* Card 3: Total Points Refunded */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-xs flex items-center gap-3.5 bg-gradient-to-br from-amber-50/40 to-white">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900 block uppercase tracking-wider">
                  Points Refund
                </span>
                <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
                  +{historyData?.totalRefunded || 0} <span className="text-xs text-amber-800 font-sans font-bold">PTS</span>
                </div>
                <span className="text-[10px] text-amber-800/80 font-medium">Order returns credited back</span>
              </div>
            </div>

            {/* Card 4: Current Net Balance */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Net Balance
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {effectiveBalance} <span className="text-xs text-slate-600 font-sans font-bold">PTS</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">₹{effectiveRebate} bill discount value</span>
              </div>
            </div>
          </div>

          {/* Filter Bar with Explicit Earning, Deduction, and Refund Tabs */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeFilter === 'ALL'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All History</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {filterCounts.all}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('EARNED')}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeFilter === 'EARNED'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>🟢 Point Earning</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'EARNED' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {filterCounts.earned}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('DEDUCTION')}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeFilter === 'DEDUCTION'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>🔴 Point Deduction</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'DEDUCTION' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'
                }`}>
                  {filterCounts.deduction}
                </span>
              </button>

              <button
                onClick={() => setActiveFilter('REFUNDED')}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs flex items-center gap-1.5 ${
                  activeFilter === 'REFUNDED'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 font-extrabold'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>🟡 Point Refund History</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'REFUNDED' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {filterCounts.refunded}
                </span>
              </button>
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

          {/* Transactions List / Ledger Table */}
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
                    : 'No points activity recorded yet.'}
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
                  <div className="col-span-3">Type & Category</div>
                  <div className="col-span-4">Transaction Details & Reference</div>
                  <div className="col-span-2 text-right">Points Impact</div>
                </div>

                {/* Transaction Rows */}
                {filteredTransactions.map((txn, index) => {
                  const visual = getBadgeVisual(txn.type);
                  const Icon = visual.icon;
                  const isPositive = visual.isCredit;
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

                      {/* Col 2: Type Badges */}
                      <div className="col-span-3 space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] border ${visual.badgeBg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{visual.label}</span>
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium pl-0.5">
                          Category: <strong>{txn.category || visual.categoryLabel}</strong>
                        </div>
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
                      <div className="col-span-2 md:text-right flex md:flex-col items-center md:items-end justify-between w-full md:w-auto">
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

          {/* Policy & Information Note */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-800 block">Garbage Points Earning, Deduction, and Refund Regulations</strong>
              <p className="leading-relaxed text-[11px]">
                • <strong>Point Earning:</strong> Earned whenever municipal drivers scan and collect segregated waste (Recyclable: 15 pts/kg, Organic: 10 pts/kg, E-Waste: 50 pts/kg, General: 5 pts/kg).<br />
                • <strong>Point Deduction:</strong> Deducted upon claiming eco-gift merchandise (garbage bags, trash bins, gloves) or applied directly to discount your municipal waste subscription bill.<br />
                • <strong>Point Refund:</strong> If a claimed gift arrives damaged or cannot be delivered, Municipal Admin immediately credits 100% of points back to your wallet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: REWARDS STORE / GIFT CATALOG */}
      {/* ========================================================================= */}
      {subTab === 'catalog' && (
        <div className="space-y-6">
          {/* Bill Discount Shortcut Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <strong className="block text-emerald-950 font-bold">Apply points to subtract from your monthly municipal bill?</strong>
                <span className="text-emerald-700 text-[11px]">1 Point = ₹0.50 rebate credit on your monthly invoice in Subscription & Billing.</span>
              </div>
            </div>
            {onNavigateToBilling && (
              <button
                onClick={onNavigateToBilling}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                Go to Billing <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {giftCategories.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.icon && <c.icon className="w-3.5 h-3.5" />}
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGifts.map((gift) => {
              const canAfford = effectiveBalance >= gift.pointsRequired;
              const isOutOfStock = gift.stock === 0;

              return (
                <div
                  key={gift._id || gift.customId}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition group"
                >
                  <div className="space-y-3">
                    {/* Top Badge & Category */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {getCategoryIcon(gift.category)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {gift.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {gift.badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100">
                          {gift.category}
                        </span>
                      </div>
                    </div>

                    {/* Title & Size */}
                    <div>
                      <h4 className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-700 transition line-clamp-1">
                        {gift.title}
                      </h4>
                      {gift.size && (
                        <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                          Size: {gift.size}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {gift.description}
                    </p>
                  </div>

                  {/* Bottom Price & Claim Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Cost</span>
                      <div className="text-lg font-black text-emerald-700 font-mono">
                        {gift.pointsRequired} <span className="text-[11px] font-bold text-slate-500">PTS</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedGiftToClaim(gift)}
                      disabled={!canAfford || isOutOfStock}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : canAfford
                          ? 'bg-[#00B074] hover:bg-[#009e67] text-white cursor-pointer'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {isOutOfStock ? 'Out of Stock' : canAfford ? 'Redeem Gift' : `Need ${gift.pointsRequired - effectiveBalance} more`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Claim Modal with Delivery Confirmation */}
          {selectedGiftToClaim && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0F172A]">Claim Eco Gift</h3>
                      <p className="text-xs text-slate-400">{selectedGiftToClaim.title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGiftToClaim(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Item:</span>
                    <strong className="text-slate-800">{selectedGiftToClaim.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specification / Size:</span>
                    <strong className="text-slate-800 font-mono">{selectedGiftToClaim.size}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">Points to Deduct:</span>
                    <strong className="text-rose-600 font-mono font-bold">-{selectedGiftToClaim.pointsRequired} PTS</strong>
                  </div>
                </div>

                <form onSubmit={handleConfirmClaim} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Delivery Address / Household Pickup Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. House #42, Greenfield Sector 4"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Delivery Notes / Gate Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={claimNotes}
                      onChange={(e) => setClaimNotes(e.target.value)}
                      placeholder="e.g. Leave with gate security or front porch"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedGiftToClaim(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={claiming}
                      className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {claiming ? 'Processing Claim...' : 'Confirm & Deduct Points'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: CLAIMED REWARDS & ORDER DELIVERIES */}
      {/* ========================================================================= */}
      {subTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">My Claimed Gifts & Vouchers</h3>
              <p className="text-xs text-slate-400">Track delivery status of your garbage bags, bins, and municipal vouchers.</p>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToOrders && (
                <button
                  onClick={onNavigateToOrders}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>My Orders & Handover QR</span>
                  <span className="font-mono">➔</span>
                </button>
              )}
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                {redemptions.length} Claimed
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {redemptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Gift className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No gifts claimed yet</h4>
                <p className="text-xs text-slate-400">Earn points through daily waste segregation and redeem items in the store!</p>
                <button
                  onClick={() => setSubTab('catalog')}
                  className="px-4 py-2 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Gift className="w-3.5 h-3.5" /> Browse Rewards Store
                </button>
              </div>
            ) : (
              redemptions.map((red) => {
                const isRefunded = red.isRefunded || red.deliveryStatus === 'REFUNDED' || red.status === 'REFUNDED';
                const isDelivered = !isRefunded && (red.deliveryStatus === 'DELIVERED' || red.deliveryStatus === 'COMPLETED');
                const isDispatched = !isRefunded && (red.deliveryStatus === 'DISPATCHED' || red.deliveryStatus === 'OUT FOR DELIVERY');
                const refundPoints = red.refundedPoints || red.pointsRedeemed || 0;
                const refundInr = red.refundedAmountInr != null 
                  ? Number(red.refundedAmountInr).toFixed(2) 
                  : (refundPoints * 0.5).toFixed(2);

                return (
                  <div key={red._id || red.customId} className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                    isRefunded ? 'bg-amber-50/50 -mx-4 px-4 rounded-2xl border border-amber-200/60 my-1' : ''
                  }`}>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {red.redemptionCode || red.customId}
                        </span>
                        <strong className="text-slate-800">{red.rewardTitle}</strong>
                        {red.size && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {red.size}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                        {isRefunded ? (
                          <>
                            <span className="line-through text-slate-400 font-mono">-{red.pointsRedeemed} PTS</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              +{refundPoints} PTS Refunded (₹{refundInr} Credited)
                            </span>
                          </>
                        ) : (
                          <span>Points: <strong className="text-rose-600 font-mono">-{red.pointsRedeemed} PTS</strong></span>
                        )}
                        <span>•</span>
                        <span>Date: {red.createdAt ? new Date(red.createdAt).toLocaleDateString() : 'Recent'}</span>
                        {red.assignedDriverName && (
                          <>
                            <span>•</span>
                            <span>Driver: <strong>{red.assignedDriverName}</strong> ({red.assignedVehicle || 'Truck'})</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                        isRefunded
                          ? 'bg-amber-100 text-amber-950 border border-amber-300 font-black'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDispatched
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isRefunded && <RotateCcw className="w-3.5 h-3.5 text-amber-700" />}
                        {!isRefunded && isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {!isRefunded && isDispatched && <Truck className="w-3.5 h-3.5 text-blue-600" />}
                        {!isRefunded && !isDelivered && !isDispatched && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {isRefunded ? 'REFUNDED TO WALLET' : (red.deliveryStatus || 'PROCESSING')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
