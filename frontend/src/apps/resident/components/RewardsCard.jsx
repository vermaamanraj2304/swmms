import React, { useState } from 'react';
import { 
  Gift, 
  Sparkles, 
  ShoppingBag, 
  Trash2, 
  Shield, 
  CreditCard, 
  Package, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  X, 
  ChevronRight, 
  Truck,
  ArrowRight,
  Receipt,
  RotateCcw,
  Coins
} from 'lucide-react';
import PointsHistorySection from './PointsHistorySection';

export default function RewardsCard({
  points = 0,
  rewards = [],
  redemptions = [],
  residentAddress = '',
  onRedeem,
  onNavigateToBilling,
  onNavigateToOrders,
  initialSubTab = 'catalog'
}) {
  const [subTab, setSubTab] = useState(initialSubTab);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGiftToClaim, setSelectedGiftToClaim] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(residentAddress || '');
  const [claimNotes, setClaimNotes] = useState('');
  const [claiming, setClaimning] = useState(false);

  const categories = [
    { id: 'ALL', label: 'All Rewards & Gifts' },
    { id: 'Garbage Bags', label: 'Garbage Bags (Diff Sizes)', icon: ShoppingBag },
    { id: 'Trash Bins', label: 'Trash Bins (Diff Sizes)', icon: Trash2 },
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
      setClaimning(true);
      await onRedeem(selectedGiftToClaim._id || selectedGiftToClaim.customId, deliveryAddress, claimNotes);
      setSelectedGiftToClaim(null);
      setClaimNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setClaimning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Switcher: Eco-Gift Store vs Points History */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs inline-flex items-center gap-1">
        <button
          onClick={() => setSubTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'catalog'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>🎁 Eco-Gift Catalog</span>
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'history'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>📜 Points Transaction History</span>
        </button>
      </div>

      {subTab === 'history' ? (
        <PointsHistorySection 
          currentPoints={points}
          onNavigateToRewards={() => setSubTab('catalog')}
          onNavigateToBilling={onNavigateToBilling}
        />
      ) : (
        <>
          {/* Top Points Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/25">
              Eco-Rewards Program
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Garbage Points Store & Gift Catalog</h2>
          <p className="text-xs text-emerald-100 max-w-lg leading-relaxed">
            Redeem points earned through waste segregation for municipal garbage bags in multiple sizes, segregation bins, composters, or apply them as a discount on your bill!
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 self-start md:self-auto">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Current Balance</span>
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
              {points} <span className="text-sm font-bold text-emerald-200">PTS</span>
            </div>
            <span className="text-[11px] text-emerald-100 font-semibold">
              ≈ ₹{(points * 0.5).toFixed(2)} Bill Rebate Value
            </span>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Bill Discount Shortcut Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-emerald-950 font-bold">Want to subtract points from your monthly trash bill instead?</strong>
            <span className="text-emerald-700 text-[11px]">You can apply points directly to your invoice in Subscription & Billing.</span>
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
        {categories.map((c) => {
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
          const canAfford = points >= gift.pointsRequired;
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
                      ? 'bg-[#00B074] hover:bg-[#009e67] text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  {isOutOfStock ? 'Out of Stock' : canAfford ? 'Redeem Gift' : `Need ${gift.pointsRequired - points} more`}
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
                <strong className="text-emerald-700 font-mono font-bold">-{selectedGiftToClaim.pointsRequired} PTS</strong>
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claiming}
                  className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {claiming ? 'Processing Claim...' : 'Confirm & Deduct Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redemptions & Delivery Tracking History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-[#0F172A]">My Claimed Gifts & Vouchers</h3>
            <p className="text-xs text-slate-400">Track delivery of your garbage bags, bins, and municipal vouchers.</p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToOrders && (
              <button
                onClick={onNavigateToOrders}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition shadow-2xs"
              >
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
            <div className="py-8 text-center text-slate-400 text-xs">
              No gifts claimed yet. Earn points and redeem above!
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
                    <div className="flex items-center gap-2">
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
                        <span>Points: <strong className="text-emerald-700 font-mono">-{red.pointsRedeemed} PTS</strong></span>
                      )}
                      <span>•</span>
                      <span>Date: {red.createdAt ? new Date(red.createdAt).toLocaleDateString() : 'Recent'}</span>
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
        </>
      )}
    </div>
  );
}
