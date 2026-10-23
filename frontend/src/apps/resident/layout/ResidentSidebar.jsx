import React, { useState } from 'react';
import { 
  Home, 
  Navigation, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Bot, 
  User, 
  CreditCard, 
  Gift, 
  MessageSquare,
  Package,
  Receipt,
  ChevronDown,
  Coins,
  Truck,
  CheckCircle2,
  RotateCcw,
  Clock,
  ShieldCheck,
  IndianRupee,
  FileText
} from 'lucide-react';

export default function ResidentSidebar({ activeTab, setActiveTab, data, onCloseMobile, isMobileDrawer = false }) {
  const [pointsExpanded, setPointsExpanded] = useState(
    ['points-rewards', 'rewards', 'points-history', 'points_ledger', 'rewards_store', 'claimed_rewards'].includes(activeTab) || true
  );

  const [ordersExpanded, setOrdersExpanded] = useState(
    ['orders', 'orders_all', 'orders_status', 'orders_history', 'orders_refund'].includes(activeTab) || true
  );

  const [billingExpanded, setBillingExpanded] = useState(
    ['billing', 'subscription_details', 'billing_invoices', 'billing_history'].includes(activeTab) || true
  );

  const activeComplaintCount = data?.complaints?.filter(c => {
    const isResolved = (c.status || '').toUpperCase().includes('RESOLV');
    return !isResolved;
  })?.length || 0;

  const pendingOrdersCount = data?.redemptions?.filter(r => 
    r.deliveryStatus !== 'DELIVERED' && r.deliveryStatus !== 'COMPLETED' && !r.isRefunded && r.deliveryStatus !== 'REFUNDED'
  )?.length || 0;

  const historyOrdersCount = data?.redemptions?.filter(r => 
    (r.deliveryStatus === 'DELIVERED' || r.deliveryStatus === 'COMPLETED') && !r.isRefunded
  )?.length || 0;

  const refundOrdersCount = data?.redemptions?.filter(r => 
    r.isRefunded || r.deliveryStatus === 'REFUNDED' || r.status === 'REFUNDED' || r.complaintStatus?.toLowerCase().includes('refund')
  )?.length || 0;

  const pointsCount = data?.garbagePoints !== undefined ? data.garbagePoints : 0;
  const giftsCount = data?.availableRewards?.length || 10;
  const claimedCount = data?.redemptions?.length || 0;

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tracking', label: 'Live Tracking', icon: Navigation },
    { id: 'emergency', label: 'Emergency Pickup', icon: AlertTriangle, badge: 'SOS', badgeColor: 'bg-rose-100 text-rose-600' },
    { id: 'complaints', label: 'Complaint Center', icon: MessageSquare, badge: activeComplaintCount > 0 ? `${activeComplaintCount}` : null, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'ai-vision', label: 'AI Waste Vision', icon: Camera, badge: 'AI', badgeColor: 'bg-purple-100 text-purple-700' },
    { id: 'ai-spot', label: 'AI Spot Dump Report', icon: MapPin, badge: 'AI', badgeColor: 'bg-emerald-100 text-emerald-700' },
    { id: 'ai-chat', label: 'AI Chat Assistant', icon: Bot, badge: 'BOT', badgeColor: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <nav className={`space-y-1 ${isMobileDrawer ? '' : 'bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs'}`}>
      {/* 1. Main City Services Navigation */}
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isActive ? 'bg-[#E6F7F2] text-[#00B074] font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 text-left min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* 2. Account Section */}
      <div className="pt-3 border-t border-slate-200 mt-2 space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 block mb-1">
          Account & Rewards
        </span>

        {/* Profile */}
        <button
          onClick={() => handleNavClick('profile')}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'profile' ? 'bg-[#E6F7F2] text-[#00B074] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>My Profile</span>
        </button>

        {/* ==================================================== */}
        {/* SUBSCRIPTION & BILLING (Collapsible Group)           */}
        {/* ==================================================== */}
        <div className="pt-1.5">
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <button
              onClick={() => handleNavClick('subscription_details')}
              className="flex items-center gap-2.5 text-xs font-bold text-slate-800 hover:text-emerald-600 transition text-left cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Subscription & Billing</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Plan
              </span>
              <button
                type="button"
                onClick={() => setBillingExpanded(!billingExpanded)}
                className="p-1 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${billingExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {billingExpanded && (
            <div className="mt-1 pl-2.5 space-y-0.5 border-l-2 border-emerald-200 ml-3 py-1">
              {/* 1. Subscription Details */}
              <button
                onClick={() => handleNavClick('subscription_details')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'subscription_details' || activeTab === 'billing'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Subscription Details</span>
                </div>
              </button>

              {/* 2. Billing */}
              <button
                onClick={() => handleNavClick('billing_invoices')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'billing_invoices'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                  <span>Billing</span>
                </div>
              </button>

              {/* 3. History */}
              <button
                onClick={() => handleNavClick('billing_history')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'billing_history'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>History</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* POINTS AND REWARD (Collapsible Group with 3 sections) */}
        {/* ==================================================== */}
        <div className="pt-1.5">
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <button
              onClick={() => handleNavClick('points_ledger')}
              className="flex items-center gap-2.5 text-xs font-bold text-slate-800 hover:text-emerald-600 transition text-left cursor-pointer"
            >
              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Points and reward</span>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                {pointsCount} PTS
              </span>
              <button
                type="button"
                onClick={() => setPointsExpanded(!pointsExpanded)}
                className="p-1 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${pointsExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {pointsExpanded && (
            <div className="mt-1 pl-2.5 space-y-1 border-l-2 border-emerald-200 ml-3 py-1">
              {/* 1. Points Ledger & History */}
              <button
                onClick={() => handleNavClick('points_ledger')}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                  activeTab === 'points_ledger' || activeTab === 'points-history' || activeTab === 'points-rewards'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">🪙 Points Ledger & History</div>
                  <div className={`text-[10px] truncate ${
                    activeTab === 'points_ledger' || activeTab === 'points-history' || activeTab === 'points-rewards'
                      ? 'text-emerald-100 font-medium'
                      : 'text-slate-400'
                  }`}>
                    Earning • Deduction • Refund
                  </div>
                </div>
              </button>

              {/* 2. Eco-Rewards Store */}
              <button
                onClick={() => handleNavClick('rewards_store')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeTab === 'rewards_store' || activeTab === 'rewards'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-bold">🎁 Eco-Rewards Store</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === 'rewards_store' || activeTab === 'rewards'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {giftsCount} Gifts
                </span>
              </button>

              {/* 3. Claimed Rewards & Deliveries */}
              <button
                onClick={() => handleNavClick('claimed_rewards')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  activeTab === 'claimed_rewards'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-bold">📦 Claimed Rewards & Deliveries</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  activeTab === 'claimed_rewards'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {claimedCount} Claimed
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* MY ORDERS & DELIVERIES (Collapsible Group with 4)    */}
        {/* ==================================================== */}
        <div className="pt-1.5">
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <button
              onClick={() => handleNavClick('orders_all')}
              className="flex items-center gap-2.5 text-xs font-bold text-slate-800 hover:text-emerald-600 transition text-left cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>My Orders & Deliveries</span>
            </button>
            <div className="flex items-center gap-1.5">
              {pendingOrdersCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 animate-pulse">
                  {pendingOrdersCount} Active
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {ordersExpanded ? 'Orders' : 'Open'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOrdersExpanded(!ordersExpanded)}
                className="p-1 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${ordersExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {ordersExpanded && (
            <div className="mt-1 pl-2.5 space-y-0.5 border-l-2 border-emerald-200 ml-3 py-1">
              {/* 1. Orders */}
              <button
                onClick={() => handleNavClick('orders_all')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'orders_all' || activeTab === 'orders'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>Orders</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'orders_all' || activeTab === 'orders'
                      ? 'bg-white text-emerald-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              {/* 2. Order Status */}
              <button
                onClick={() => handleNavClick('orders_status')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'orders_status'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>Order Status</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === 'orders_status' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Live
                  </span>
                )}
              </button>

              {/* 3. History */}
              <button
                onClick={() => handleNavClick('orders_history')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'orders_history'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>History</span>
                </div>
                {historyOrdersCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'orders_history'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {historyOrdersCount}
                  </span>
                )}
              </button>

              {/* 4. Refund with Refund History */}
              <button
                onClick={() => handleNavClick('orders_refund')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'orders_refund'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Refund with Refund History</span>
                </div>
                {refundOrdersCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'orders_refund'
                      ? 'bg-white text-amber-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {refundOrdersCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
