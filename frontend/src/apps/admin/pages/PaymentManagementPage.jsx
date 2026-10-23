import React, { useState, useEffect } from 'react';
import { 
  IndianRupee,
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Check, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Zap,
  Building2,
  ExternalLink,
  Edit3,
  X,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt
} from 'lucide-react';
import RecordPaymentModal from '../components/RecordPaymentModal';
import PaymentReceiptModal from '../components/PaymentReceiptModal';

export default function PaymentManagementPage({
  initialSection = 'dashboard',
  residents = [],
  showToast
}) {
  // 3 Core Sections: 'dashboard' | 'records' | 'plans'
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    mrr: 0,
    pendingRevenue: 0,
    overdueRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalInvoices: 0
  });
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search for Payment Record
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('ALL');

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState(null);

  // Edit Plan Rate Modal
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editPlanForm, setEditPlanForm] = useState({
    price: '',
    name: '',
    billingCycle: 'Monthly',
    coverage: '',
    badge: ''
  });
  const [updatingPlan, setUpdatingPlan] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
        if (data.stats) setStats(data.stats);
        if (data.pricingPlans) setPricingPlans(data.pricingPlans);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (showToast) showToast('Failed to load payments ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setEditPlanForm({
      price: plan.price !== undefined ? plan.price : '',
      name: plan.name || '',
      billingCycle: plan.billingCycle || 'Monthly',
      coverage: plan.coverage || '',
      badge: plan.badge || ''
    });
    setShowEditPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    if (editPlanForm.price === '' || Number(editPlanForm.price) <= 0) {
      if (showToast) showToast('Please enter a valid price in ₹', 'error');
      return;
    }

    try {
      setUpdatingPlan(true);
      const planId = editingPlan.customId || editingPlan._id || editingPlan.id;
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPlanForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update plan rate');

      if (showToast) showToast(data.message || `Plan rate updated to ₹${editPlanForm.price}!`, 'success');
      setShowEditPlanModal(false);
      setEditingPlan(null);
      fetchPayments();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error updating plan rate', 'error');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/update-payment-status/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(`Invoice updated to ${newStatus}`, 'success');
        fetchPayments();
      } else {
        if (showToast) showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error updating payment status', 'error');
    }
  };

  const handleDeletePayment = async (paymentId, customId) => {
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${customId || 'record'}?`)) return;
    try {
      const res = await fetch(`/api/admin/delete-payment/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Invoice deleted', 'success');
        fetchPayments();
      } else {
        if (showToast) showToast(data.message || 'Failed to delete invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error deleting invoice', 'error');
    }
  };

  const handleExportCSV = () => {
    if (payments.length === 0) {
      if (showToast) showToast('No payments to export', 'error');
      return;
    }
    const headers = ['Invoice ID', 'Resident Name', 'Email', 'Address', 'Plan', 'Service Type', 'Amount (INR)', 'Status', 'Payment Method', 'Issue Date', 'Due Date'];
    const rows = payments.map(p => [
      p.customId,
      `"${p.residentName}"`,
      `"${p.residentEmail || ''}"`,
      `"${p.address}"`,
      `"${p.plan}"`,
      `"${p.serviceType}"`,
      p.amount,
      p.status,
      `"${p.paymentMethod}"`,
      p.transactionDate,
      p.dueDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `municipal_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('Payments ledger exported to CSV successfully!', 'success');
  };

  // Filtered Payments for Record Table
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      (p.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.plan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesService = serviceTypeFilter === 'ALL' || p.serviceType === serviceTypeFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  // Calculate percentage ratios for Dashboard Charts
  const totalInvoicedSum = (stats.totalRevenue + stats.pendingRevenue + stats.overdueRevenue) || 1;
  const settledRatio = Math.round((stats.totalRevenue / totalInvoicedSum) * 100);
  const pendingRatio = Math.round((stats.pendingRevenue / totalInvoicedSum) * 100);
  const overdueRatio = Math.max(0, 100 - settledRatio - pendingRatio);

  // Monthly inflow mock data scaled to stats for dynamic visual bar chart
  const monthsData = [
    { month: 'Oct', amount: Math.round(stats.totalRevenue * 0.15) || 4500, height: '40%' },
    { month: 'Nov', amount: Math.round(stats.totalRevenue * 0.22) || 7200, height: '60%' },
    { month: 'Dec', amount: Math.round(stats.totalRevenue * 0.18) || 5800, height: '50%' },
    { month: 'Jan', amount: Math.round(stats.totalRevenue * 0.20) || 6900, height: '55%' },
    { month: 'Feb', amount: Math.round(stats.totalRevenue * 0.25) || 8400, height: '70%' },
    { month: 'Mar (Now)', amount: stats.totalRevenue || 9500, height: '90%', isCurrent: true }
  ];

  return (
    <div className="space-y-6">
      {/* Top Page Header with Section Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Municipal Treasury Control
              </span>
              <span className="text-xs text-slate-400">• Fiscal Year 2026</span>
            </div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Finance Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive municipal financial operations: treasury analytics, payment records ledger, and subscription plans.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={fetchPayments}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
            </button>

            <button
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00B074] hover:bg-[#009e67] text-white font-bold text-xs transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> Record Payment / Invoice
            </button>
          </div>
        </div>

        {/* 3 Core Finance Section Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
              activeSection === 'dashboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Payment Dashboard</span>
          </button>

          <button
            onClick={() => setActiveSection('records')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
              activeSection === 'records'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Payment Record</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/20 ml-1">
              {payments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('plans')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0 ${
              activeSection === 'plans'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Subscription Plan</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/20 ml-1">
              {pricingPlans.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PAYMENT DASHBOARD (KPI Cards + Graphs + Revenue Analytics) */}
      {/* ========================================================================= */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Collected Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Collected</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A] font-mono">
                  ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{stats.paidCount} Settled Invoices</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 bg-emerald-50/50 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Monthly Recurring Revenue (MRR) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Recurring (MRR)</span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A] font-mono">
                  ₹{stats.mrr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600 font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Recurring Household Plans</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 bg-blue-50/50 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Pending Settlement */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlement</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-700 font-mono">
                  ₹{stats.pendingRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-600 font-semibold">
                  <span>{stats.pendingCount} Awaiting Payment</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 bg-amber-50/50 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Overdue Balance */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Balance</span>
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-rose-700 font-mono">
                  ₹{stats.overdueRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-600 font-semibold">
                  <span>{stats.overdueCount} Critical Action Required</span>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-20 h-20 bg-rose-50/50 rounded-full blur-xl pointer-events-none" />
            </div>
          </div>

          {/* Graphical Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Collection Trend Bar Chart (8 Columns) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">TREASURY CASH FLOW</span>
                  <h3 className="text-base font-bold text-[#0F172A]">Monthly Revenue Collection Trajectory</h3>
                  <p className="text-xs text-slate-400">Total sanitation fee receipts deposited across billing cycles</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% Growth
                  </span>
                </div>
              </div>

              {/* Bar Graph Visual */}
              <div className="h-56 pt-6 flex items-end justify-between gap-4 border-b border-slate-100 px-4">
                {monthsData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                      ₹{item.amount.toLocaleString()}
                    </span>
                    <div 
                      style={{ height: item.height }}
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        item.isCurrent 
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-200' 
                          : 'bg-slate-200 hover:bg-emerald-300'
                      }`}
                    />
                    <span className={`text-[11px] font-bold ${item.isCurrent ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Avg. Monthly Collection: <strong>₹{(stats.totalRevenue / 3 || 12000).toFixed(0)}</strong></span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Settled Collection
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 ml-2" /> Past Cycles
                </span>
              </div>
            </div>

            {/* Collection Health Breakdown & Payment Methods (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Settlement Distribution Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Settlement Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Settled Paid
                      </span>
                      <span className="font-mono">{settledRatio}% (₹{stats.totalRevenue.toFixed(0)})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${settledRatio}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending Settlement
                      </span>
                      <span className="font-mono">{pendingRatio}% (₹{stats.pendingRevenue.toFixed(0)})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${pendingRatio}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Overdue Balance
                      </span>
                      <span className="font-mono">{overdueRatio}% (₹{stats.overdueRevenue.toFixed(0)})</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${overdueRatio}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Mix */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Payment Channel Mix</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">UPI (GPAY/PHONEPE)</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">62%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">CARDS (DEBIT/CREDIT)</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">24%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">NET BANKING</span>
                    <span className="font-mono font-bold text-purple-700 text-sm">10%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">CASH COUNTER</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Recent Transactions Preview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Recent Settlement Activity</h3>
                <p className="text-xs text-slate-400">Latest incoming municipal fee settlements and invoices</p>
              </div>
              <button
                onClick={() => setActiveSection('records')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                View Full Ledger Table →
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/60">
                No payment transactions recorded yet. Click "Record Payment / Invoice" to issue invoices.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.slice(0, 5).map(p => (
                  <div key={p._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : p.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.residentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.customId} • {p.plan}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold font-mono text-slate-900">₹{Number(p.amount).toFixed(2)}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : p.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PAYMENT RECORD (Complete Ledger Table + Search + Filters)     */}
      {/* ========================================================================= */}
      {activeSection === 'records' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-150">
          {/* Table Filters & Search */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Resident Name, #INV-XXXX, or Address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-emerald-500 transition"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      statusFilter === st 
                        ? 'bg-white text-[#0F172A] shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st === 'ALL' ? 'All Status' : st}
                  </button>
                ))}
              </div>

              {/* Service Type Filter */}
              <select
                value={serviceTypeFilter}
                onChange={e => setServiceTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50 text-[11px] font-semibold text-slate-700 focus:outline-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Monthly Subscription">Monthly Subscriptions</option>
                <option value="Emergency SOS Pickup">Emergency SOS Clearances</option>
                <option value="Commercial Bulk Waste">Commercial Bulk Waste</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Resident & Service Address</th>
                  <th className="py-3 px-4">Plan / Service Category</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Status & Quick Toggle</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading municipal payment ledger...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <Receipt className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      No invoices match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {p.customId || 'INV-000'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.residentName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.address}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{p.plan}</span>
                        <div className="text-[10px] text-slate-400">{p.serviceType}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₹{Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={p.status}
                          onChange={e => handleUpdateStatus(p._id, e.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                            p.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="PAID">PAID (Settled)</option>
                          <option value="PENDING">PENDING</option>
                          <option value="OVERDUE">OVERDUE</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {p.paymentMethod || 'Online Gateway'}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{p.billingPeriod || 'Current'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPaymentForReceipt(p);
                              setShowReceiptModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="View / Print Tax Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p._id, p.customId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SUBSCRIPTION PLAN (Municipal Sanitation Tiers & Service Rates) */}
      {/* ========================================================================= */}
      {activeSection === 'plans' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                MUNICIPAL PRICING SCHEDULE
              </span>
              <h3 className="text-lg font-bold text-[#0F172A] mt-1">Municipal Subscription Plans & Service Rates</h3>
              <p className="text-xs text-slate-400">Approved city sanitation pricing schedule across residential, commercial, and emergency tiers.</p>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full self-start sm:self-auto">
              {pricingPlans.length} Active Pricing Tiers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingPlans.map(plan => (
              <div 
                key={plan._id || plan.customId || plan.id}
                className="p-5 rounded-3xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition space-y-4 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {plan.badge || 'Active Plan'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{plan.billingCycle}</span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-[#0F172A]">{plan.name}</div>
                    <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                      ₹{Number(plan.price).toFixed(2)} <span className="text-xs font-normal text-slate-400">/ {plan.billingCycle?.toLowerCase() || 'month'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">{plan.coverage}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">{plan.customId || 'Rate Active'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPlan(plan)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs border border-slate-200 hover:border-emerald-300 shadow-2xs transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Edit Price
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        residents={residents}
        onPaymentRecorded={() => {
          fetchPayments();
          if (showToast) showToast('Payment / Invoice recorded successfully!', 'success');
        }}
        showToast={showToast}
      />

      {/* Receipt Modal */}
      <PaymentReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        payment={selectedPaymentForReceipt}
      />

      {/* Edit Plan Rate Modal */}
      {showEditPlanModal && editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Edit Plan Rate</h3>
                <p className="text-[11px] text-slate-400">{editingPlan.name}</p>
              </div>
              <button onClick={() => setShowEditPlanModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  value={editPlanForm.name}
                  onChange={e => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Monthly / Service Fee (₹) *</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="149.00"
                    value={editPlanForm.price}
                    onChange={e => setEditPlanForm({ ...editPlanForm, price: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-sm font-bold focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coverage & Capacity Details</label>
                <input
                  type="text"
                  value={editPlanForm.coverage}
                  onChange={e => setEditPlanForm({ ...editPlanForm, coverage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={editPlanForm.badge}
                  onChange={e => setEditPlanForm({ ...editPlanForm, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPlan}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                >
                  {updatingPlan ? 'Saving...' : 'Save New Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
