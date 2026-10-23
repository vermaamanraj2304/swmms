import React, { useState } from 'react';
import { X, Plus, IndianRupee, User, Calendar, CreditCard, FileText } from 'lucide-react';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  residents = [],
  onPaymentRecorded,
  showToast
}) {
  const [form, setForm] = useState({
    residentId: '',
    residentName: '',
    residentEmail: '',
    residentPhone: '',
    address: '',
    plan: 'Standard Municipal (₹149/Mo)',
    serviceType: 'Monthly Subscription',
    amount: 149.00,
    currency: 'INR',
    status: 'PAID',
    paymentMethod: 'Credit Card (•••• 4242)',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    billingPeriod: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleResidentSelect = (e) => {
    const rId = e.target.value;
    if (!rId) {
      setForm(prev => ({
        ...prev,
        residentId: '',
        residentName: '',
        residentEmail: '',
        residentPhone: '',
        address: ''
      }));
      return;
    }

    const res = residents.find(r => r._id === rId);
    if (res) {
      setForm(prev => ({
        ...prev,
        residentId: res._id,
        residentName: res.name || '',
        residentEmail: res.email || '',
        residentPhone: res.phone || '',
        address: res.address || res.houseLocation?.address || ''
      }));
    }
  };

  const handleServiceTypeChange = (e) => {
    const sType = e.target.value;
    let autoAmount = 149.00;
    let autoPlan = 'Standard Municipal (₹149/Mo)';

    if (sType === 'Monthly Subscription') {
      autoAmount = 149.00;
      autoPlan = 'Standard Municipal (₹149/Mo)';
    } else if (sType === 'Emergency SOS Pickup') {
      autoAmount = 99.00;
      autoPlan = 'Emergency SOS Clearance (₹99/Pickup)';
    } else if (sType === 'Commercial Bulk Waste') {
      autoAmount = 899.00;
      autoPlan = 'Commercial Bulk Waste Tier (₹899/Mo)';
    } else if (sType === 'Special Clearance Surcharge') {
      autoAmount = 199.00;
      autoPlan = 'Hazardous / Construction Surcharge (₹199)';
    }

    setForm(prev => ({
      ...prev,
      serviceType: sType,
      amount: autoAmount,
      plan: autoPlan
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.residentName.trim()) {
      if (showToast) showToast('Resident name is required', 'error');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      if (showToast) showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record payment');

      if (showToast) showToast(data.message || 'Invoice & payment recorded successfully!', 'success');
      if (onPaymentRecorded) onPaymentRecorded(data.payment);
      onClose();
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message || 'Error recording payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Record Payment / Issue Invoice</h3>
              <p className="text-xs text-slate-400">Add a municipal billing transaction or resident subscription invoice</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Select Resident */}
          {residents.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Link to Registered Resident (Optional)
              </label>
              <select
                value={form.residentId}
                onChange={handleResidentSelect}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium text-slate-700"
              >
                <option value="">-- Or enter resident manually below --</option>
                {residents.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.customId || 'Resident'}) • {r.address || 'Delhi'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Resident Full Name *</label>
              <input
                type="text"
                required
                value={form.residentName}
                onChange={e => setForm({ ...form, residentName: e.target.value })}
                placeholder="e.g. Nirmala Devi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Resident Email</label>
              <input
                type="email"
                value={form.residentEmail}
                onChange={e => setForm({ ...form, residentEmail: e.target.value })}
                placeholder="nirmala@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.residentPhone}
                onChange={e => setForm({ ...form, residentPhone: e.target.value })}
                placeholder="+91 98101 23456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Service Address / Ward</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Sector 4, Rohini, Delhi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Service Category</label>
              <select
                value={form.serviceType}
                onChange={handleServiceTypeChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium"
              >
                <option value="Monthly Subscription">Monthly Subscription</option>
                <option value="Emergency SOS Pickup">Emergency SOS Pickup</option>
                <option value="Commercial Bulk Waste">Commercial Bulk Waste</option>
                <option value="Special Clearance Surcharge">Special Clearance Surcharge</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Plan / Description</label>
              <input
                type="text"
                value={form.plan}
                onChange={e => setForm({ ...form, plan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹ INR) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1.00"
                  required
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-bold text-slate-700"
              >
                <option value="PAID">PAID (Settled)</option>
                <option value="PENDING">PENDING (Awaiting)</option>
                <option value="OVERDUE">OVERDUE (Past Due)</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 text-xs"
              >
                <option value="Credit Card (•••• 4242)">Credit Card (•••• 4242)</option>
                <option value="UPI / NetBanking">UPI / NetBanking</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Cash on Collection">Cash on Collection</option>
                <option value="Bank Wire">Bank Wire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Billing Period</label>
              <input
                type="text"
                value={form.billingPeriod}
                onChange={e => setForm({ ...form, billingPeriod: e.target.value })}
                placeholder="e.g. October 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Notes / Treasury Remarks</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Cleared via municipal direct gateway"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-2"
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4" /> Issue Invoice / Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
