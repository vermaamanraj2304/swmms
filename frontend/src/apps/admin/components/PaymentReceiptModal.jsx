import React from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle, Clock, Building2, ShieldCheck } from 'lucide-react';

export default function PaymentReceiptModal({
  isOpen,
  onClose,
  payment
}) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PAID & SETTLED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING SETTLEMENT
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> OVERDUE NOTICE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
        {/* Header Actions */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>SWM&MS Municipal Division • Treasury Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Invoice / Receipt Body */}
        <div className="border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6 bg-slate-50/40">
          {/* Top Brand Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00B074] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  TMT
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0F172A] tracking-tight">SWM&MS Municipal HQ</h2>
                  <p className="text-[10px] text-slate-400">Department of Sanitation & Waste Management Treasury</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                100 Civic Center Plaza, Municipal Zone 1<br />
                treasury@swmms.gov • 1800-11-2026 (Toll Free)
              </p>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-slate-400 uppercase font-mono">Invoice Number</div>
              <div className="text-lg font-black text-[#0F172A] font-mono">{payment.customId}</div>
              <div className="mt-2">{getStatusBadge(payment.status)}</div>
            </div>
          </div>

          {/* Dates & Billed Resident */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Billed To (Resident / Entity)</div>
              <div className="font-bold text-sm text-[#0F172A]">{payment.residentName}</div>
              <div className="text-slate-600">{payment.address}</div>
              {payment.residentEmail && <div className="text-slate-500">{payment.residentEmail}</div>}
              {payment.residentPhone && <div className="text-slate-500">{payment.residentPhone}</div>}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Statement Details</div>
              <div className="text-slate-600">
                <span className="text-slate-400">Billing Period:</span> <strong className="text-slate-800">{payment.billingPeriod || 'Current Month'}</strong>
              </div>
              <div className="text-slate-600">
                <span className="text-slate-400">Issue Date:</span> <strong className="text-slate-800">{payment.transactionDate}</strong>
              </div>
              <div className="text-slate-600">
                <span className="text-slate-400">Due Date:</span> <strong className="text-slate-800">{payment.dueDate}</strong>
              </div>
              <div className="text-slate-600">
                <span className="text-slate-400">Method:</span> <strong className="text-slate-800">{payment.paymentMethod}</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Service Description</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5 text-right">Qty / Term</th>
                  <th className="py-2.5 px-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-800">{(payment.plan || 'Standard Municipal').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '')}</div>
                    {payment.notes && <div className="text-[10px] text-slate-400">{payment.notes}</div>}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600">{payment.serviceType}</td>
                  <td className="py-3 px-3.5 text-right text-slate-600">1 Cycle</td>
                  <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">
                    ₹{Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary / Total */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Certified municipal clearance record. Fully authenticated.</span>
            </div>

            <div className="w-full sm:w-60 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">₹{Number(payment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Municipal Tax (0%):</span>
                <span className="font-mono font-medium">₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#0F172A] border-t border-slate-200 pt-1.5">
                <span>Total Due / Paid:</span>
                <span className="text-emerald-700 font-mono">₹{Number(payment.amount).toFixed(2)} {payment.currency || 'INR'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
