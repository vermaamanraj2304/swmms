import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  IndianRupee, 
  Sparkles, 
  Calendar, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  ChevronRight, 
  X, 
  Zap, 
  Sliders,
  Check,
  Search,
  History,
  Receipt,
  Download
} from 'lucide-react';
import PaymentReceiptModal from '../../admin/components/PaymentReceiptModal';

export default function SubscriptionBillingPage({ 
  activeSubTab = 'subscription', 
  onNavigateSubTab,
  showToast 
}) {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'subscription'); // 'subscription' | 'billing' | 'history'
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pay Bill Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card (•••• 4242)');
  const [paying, setPaying] = useState(false);

  // Switch Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState(null);
  const [switchingPlan, setSwitchingPlan] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (t) => {
    setCurrentTab(t);
    setSearchTerm('');
    if (onNavigateSubTab) {
      onNavigateSubTab(t);
    }
  };

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resident/billing');
      const data = await res.json();
      if (res.ok) {
        setBillingData(data);
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load billing details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const openPayModal = (inv) => {
    setSelectedInvoiceToPay(inv);
    // 2 points = ₹1 (1 point = ₹0.50)
    const availablePoints = billingData?.garbagePoints || 0;
    const maxPointsForBill = Math.ceil(inv.amount / 0.5);
    const initialPoints = Math.min(availablePoints, maxPointsForBill);
    setPointsToRedeem(initialPoints);
    setShowPayModal(true);
  };

  const handlePayBill = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceToPay) return;

    try {
      setPaying(true);
      const res = await fetch('/api/resident/pay-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceToPay._id,
          pointsToRedeem: Number(pointsToRedeem) || 0,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment failed');

      if (showToast) showToast(data.message || 'Invoice paid successfully!', 'success');
      setShowPayModal(false);
      fetchBilling();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Payment processing error', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleSwitchPlan = async (plan) => {
    try {
      setSwitchingPlan(true);
      const res = await fetch('/api/resident/switch-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Plan update failed');

      if (showToast) showToast(`Switched plan to ${plan.name}!`, 'success');
      setShowPlanModal(false);
      fetchBilling();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error updating plan', 'error');
    } finally {
      setSwitchingPlan(false);
    }
  };

  const currentSub = billingData?.currentSubscription;
  const garbagePoints = billingData?.garbagePoints || 0;
  const pointsRupeeValue = (garbagePoints * 0.5).toFixed(2);
  const invoices = billingData?.invoices || [];
  const availablePlans = billingData?.availablePlans || [];

  // Categorize invoices into pending/due vs paid history
  const { pendingInvoices, paidInvoices, totalPendingDue, totalPaidAmount } = useMemo(() => {
    const pending = [];
    const paid = [];
    let dueSum = 0;
    let paidSum = 0;

    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        paid.push(inv);
        paidSum += Number(inv.amount || inv.originalAmount || 0);
      } else {
        pending.push(inv);
        dueSum += Number(inv.amount || inv.originalAmount || 0);
      }
    });

    return {
      pendingInvoices: pending,
      paidInvoices: paid,
      totalPendingDue: dueSum.toFixed(2),
      totalPaidAmount: paidSum.toFixed(2)
    };
  }, [invoices]);

  // Search filtered paid invoices
  const filteredPaidInvoices = useMemo(() => {
    if (!searchTerm) return paidInvoices;
    const q = searchTerm.toLowerCase();
    return paidInvoices.filter(inv =>
      (inv.customId && inv.customId.toLowerCase().includes(q)) ||
      (inv.plan && inv.plan.toLowerCase().includes(q)) ||
      (inv.billingPeriod && inv.billingPeriod.toLowerCase().includes(q))
    );
  }, [paidInvoices, searchTerm]);

  // Search filtered pending invoices
  const filteredPendingInvoices = useMemo(() => {
    if (!searchTerm) return pendingInvoices;
    const q = searchTerm.toLowerCase();
    return pendingInvoices.filter(inv =>
      (inv.customId && inv.customId.toLowerCase().includes(q)) ||
      (inv.plan && inv.plan.toLowerCase().includes(q)) ||
      (inv.billingPeriod && inv.billingPeriod.toLowerCase().includes(q))
    );
  }, [pendingInvoices, searchTerm]);

  // Live calculations for pay modal (2 PTS = ₹1)
  const invAmount = selectedInvoiceToPay?.amount || 0;
  const calculatedDiscount = Math.min(invAmount, Math.round((pointsToRedeem * 0.5) * 100) / 100);
  const netDue = Math.max(0, Math.round((invAmount - calculatedDiscount) * 100) / 100);

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & KPI METRICS CARDS                     */}
      {/* ==================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Municipal Sanitation Billing
            </span>
            <span className="text-xs text-slate-400">• Account: {billingData?.resident?.customId || 'Resident'}</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Subscription & Billing Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your household garbage service tier, view monthly statements, pay dues with garbage points rebate, and download official receipts.
          </p>
        </div>

        <button
          onClick={fetchBilling}
          className="p-2.5 self-start md:self-auto rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Subscription Details */}
        <div 
          onClick={() => handleTabChange('subscription')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'subscription'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription Tier</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 truncate">
              {(currentSub?.plan || 'Standard').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
              Active
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fee: <strong className="text-slate-800">₹{Number(currentSub?.price || 149).toFixed(2)}/Mo</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              Details <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Billing (Due) */}
        <div 
          onClick={() => handleTabChange('billing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'billing'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Due</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">₹{totalPendingDue}</span>
            <span className="text-[11px] font-semibold text-slate-400">Payable</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pending statements: <strong className="text-amber-700">{pendingInvoices.length}</strong></span>
            <span className="text-amber-700 font-bold flex items-center gap-0.5">
              Pay <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: History (Paid) */}
        <div 
          onClick={() => handleTabChange('history')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment History</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{paidInvoices.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Paid Receipts</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Settled total: <strong className="text-slate-800">₹{totalPaidAmount}</strong></span>
            <span className="text-slate-700 font-bold flex items-center gap-0.5">
              Receipts <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Points Rebate Balance */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garbage Points Wallet</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">{garbagePoints}</span>
            <span className="text-[11px] font-semibold text-slate-400">PTS</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rebate Value: <strong className="text-emerald-700">₹{pointsRupeeValue}</strong></span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">2 PTS = ₹1</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. SUB-SECTION TAB NAVIGATION BAR                    */}
      {/* ==================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('subscription')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'subscription'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Subscription Details</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'billing'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Billing</span>
          {pendingInvoices.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'billing' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingInvoices.length} Due
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            currentTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {paidInvoices.length} Paid
          </span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 3. SECTION 1: SUBSCRIPTION DETAILS                   */}
      {/* ==================================================== */}
      {currentTab === 'subscription' && (
        <div className="space-y-6">
          {/* Active Plan & Points Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Plan Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-md flex flex-col justify-between">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active Subscription
                  </span>
                  <span className="text-xs text-slate-400">Next Renewal: {currentSub?.nextRenewal || 'Next Month'}</span>
                </div>

                <div>
                  <div className="text-xs text-slate-400 uppercase font-mono">Current Municipal Plan</div>
                  <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">
                    {(currentSub?.plan || 'Standard Municipal').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                    {currentSub?.coverage || 'Includes weekly door-to-door curbside collection, segregated wet & dry clearance, and civic support.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Monthly Fee</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">₹{Number(currentSub?.price || 149).toFixed(2)}/Mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Payment Method</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {currentSub?.paymentMethod || 'Credit Card (•••• 4242)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6">
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-2 cursor-pointer"
                >
                  Change Plan / Upgrade Tier <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Decorative background circle */}
              <div className="absolute right-0 top-0 w-80 h-80 bg-[#00B074]/15 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Garbage Points Wallet Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Eco-Rewards Wallet
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>

                <div>
                  <div className="text-xs text-slate-500 font-medium">Available Garbage Points</div>
                  <div className="text-3xl font-black text-emerald-700 font-mono flex items-baseline gap-1 mt-0.5">
                    {garbagePoints} <span className="text-xs text-emerald-600 font-bold">PTS</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    Value: <span className="font-bold text-emerald-800 font-mono">₹{pointsRupeeValue}</span> Bill Rebate
                  </div>
                </div>

                <div className="bg-white/80 border border-emerald-100 rounded-2xl p-3 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Points-to-Rupee Formula:</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed">
                    Every <strong className="text-slate-800">2 Points = ₹1.00</strong> discount subtracted directly from your upcoming bills.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-100 text-[11px] text-slate-500">
                Earn more points daily by correctly segregating wet & dry waste and scheduling on-time pickups.
              </div>
            </div>
          </div>

          {/* Available Subscription Tiers Comparison Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Approved Municipal Residential Tiers</h3>
                <p className="text-xs text-slate-400">Upgrade or adjust your household waste collection schedule</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {availablePlans.length} Plans Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const isCurrent = (currentSub?.plan || '').includes(plan.name);
                return (
                  <div
                    key={plan._id || plan.customId || plan.id || plan.name}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                      isCurrent 
                        ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {plan.badge || 'Residential'}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Current
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">{plan.name}</h4>
                        <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                          ₹{Number(plan.price).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                        </div>
                      </div>

                      <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                        {plan.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-emerald-600 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent || switchingPlan}
                      onClick={() => handleSwitchPlan(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#00B074] hover:bg-[#009e67] text-white shadow-xs'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Select This Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. SECTION 2: BILLING (Pending & Due Invoices)       */}
      {/* ==================================================== */}
      {currentTab === 'billing' && (
        <div className="space-y-4">
          {/* Outstanding Due Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-6 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                Payable Invoices
              </span>
              <h3 className="text-lg font-black text-slate-900">Outstanding Municipal Sanitation Charges</h3>
              <p className="text-xs text-slate-500">
                You can apply your earned garbage points to reduce or completely cover these statement fees.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                <span className="text-2xl font-black font-mono text-amber-800">₹{totalPendingDue}</span>
              </div>
              {pendingInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => openPayModal(pendingInvoices[0])}
                  className="px-5 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Pay Now with Points
                </button>
              )}
            </div>
          </div>

          {/* Pending Invoices Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Unpaid Municipal Invoices</h3>
                <p className="text-xs text-slate-400">Statements awaiting settlement</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                {pendingInvoices.length} Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Service Description</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Amount Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPendingInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                        <span className="font-bold text-slate-700 block text-sm">All Caught Up!</span>
                        <span className="text-xs text-slate-400">You have no unpaid municipal statements at this time.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingInvoices.map((inv) => {
                      const isOverdue = inv.status === 'OVERDUE';
                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              {inv.customId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0F172A]">{(inv.plan || 'Standard Municipal').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{inv.serviceType || 'Curbside Pickup'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{inv.billingPeriod || 'Current Month'}</div>
                            <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                            ₹{Number(inv.amount || inv.originalAmount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openPayModal(inv)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] text-white font-bold text-xs transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <IndianRupee className="w-3.5 h-3.5" /> Pay with Points
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SECTION 3: HISTORY (Paid Receipts Archive)        */}
      {/* ==================================================== */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search paid statements by invoice #, plan, period..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {filteredPaidInvoices.length} Receipts Archived
            </span>
          </div>

          {/* Paid Statements Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Historical Billing Receipts & Vouchers</h3>
                <p className="text-xs text-slate-400">View and print official municipal payment verification receipts</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Plan / Service</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Points Subtracted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPaidInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <span className="font-bold text-slate-700 block text-sm">No Payment Receipts Found</span>
                        <span className="text-xs text-slate-400">Paid billing receipts will appear here once settled.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredPaidInvoices.map((inv) => {
                      const hasDiscount = inv.pointsDiscount > 0 || inv.pointsRedeemed > 0;
                      return (
                        <tr key={inv._id} className="hover:bg-slate-50/60 transition group">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                              {inv.customId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0F172A]">{(inv.plan || 'Standard Municipal').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{inv.serviceType || 'Curbside Pickup'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{inv.billingPeriod || 'Current Month'}</div>
                            <div className="text-[10px] text-slate-400">Paid: {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : 'Settled'}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                            ₹{Number(inv.amount || inv.originalAmount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            {hasDiscount ? (
                              <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>-{inv.pointsRedeemed} PTS (-₹{Number(inv.pointsDiscount).toFixed(2)})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedInvoiceForReceipt(inv);
                                setShowReceiptModal(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" /> View Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PAY BILL WITH POINTS SLIDER                   */}
      {/* ==================================================== */}
      {showPayModal && selectedInvoiceToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Pay Municipal Invoice</h3>
                  <p className="text-xs text-slate-400">Statement {selectedInvoiceToPay.customId} • {(selectedInvoiceToPay.plan || '').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill & Points Interactive Calculation */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Statement Original Due:</span>
                <span className="text-base font-bold font-mono text-[#0F172A]">₹{invAmount.toFixed(2)}</span>
              </div>

              {/* Garbage Points Slider & Quick Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Subtract Garbage Points Discount:
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {pointsToRedeem} PTS (-₹{calculatedDiscount.toFixed(2)})
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={Math.min(garbagePoints, Math.ceil(invAmount / 0.5))}
                  step="10"
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>0 PTS (₹0.00)</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPointsToRedeem(0)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-[10px]"
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsToRedeem(Math.min(garbagePoints, Math.ceil(invAmount / 0.5)))}
                      className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px]"
                    >
                      Max Allowed
                    </button>
                  </div>
                  <span>Max: {Math.min(garbagePoints, Math.ceil(invAmount / 0.5))} PTS</span>
                </div>

                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80">
                  You have <strong className="text-emerald-700">{garbagePoints} PTS</strong> in your wallet. 
                  Redeeming {pointsToRedeem} PTS will leave you with <strong className="text-slate-800">{Math.max(0, garbagePoints - pointsToRedeem)} PTS</strong>.
                </div>
              </div>

              {/* Net Total to Pay */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Final Amount Charged</span>
                  <span className="text-[10px] text-slate-400">After applying garbage points rebate</span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{netDue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">Select Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
              >
                <option value="Credit Card (•••• 4242)">Credit Card (•••• 4242)</option>
                <option value="UPI / NetBanking">UPI / NetBanking</option>
                <option value="Direct Debit">Municipal Direct Debit</option>
                <option value="Cash on Collection">Cash to Collection Driver</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePayBill}
                disabled={paying}
                className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {paying ? (
                  <>Processing Settle...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Settle (₹{netDue.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SWITCH PLAN                                   */}
      {/* ==================================================== */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">Choose Municipal Subscription Tier</h3>
                <p className="text-xs text-slate-400">Select an approved residential waste collection tier for your household.</p>
              </div>
              <button 
                onClick={() => setShowPlanModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const isCurrent = (currentSub?.plan || '').includes(plan.name);
                return (
                  <div
                    key={plan._id || plan.customId || plan.id || plan.name}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                      isCurrent 
                        ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {plan.badge || 'Tier'}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Current
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">{plan.name}</h4>
                        <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                          ₹{Number(plan.price).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                        </div>
                      </div>

                      <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                        {plan.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-emerald-600 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent || switchingPlan}
                      onClick={() => handleSwitchPlan(plan)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-[#00B074] hover:bg-[#009e67] text-white shadow-xs'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Select This Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      <PaymentReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedInvoiceForReceipt(null);
        }}
        payment={selectedInvoiceForReceipt}
      />
    </div>
  );
}
