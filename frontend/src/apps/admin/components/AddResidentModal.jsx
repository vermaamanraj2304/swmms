import React from 'react';
import { X, UserPlus } from 'lucide-react';

export default function AddResidentModal({ 
  isOpen, 
  onClose, 
  residentForm, 
  setResidentForm, 
  onSubmit 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Onboard Resident</h3>
              <p className="text-[11px] text-slate-400">Add household to municipal smart waste registry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe" 
              required 
              value={residentForm.name} 
              onChange={e => setResidentForm({ ...residentForm, name: e.target.value })} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              required 
              value={residentForm.email} 
              onChange={e => setResidentForm({ ...residentForm, email: e.target.value })} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              value={residentForm.phone} 
              onChange={e => setResidentForm({ ...residentForm, phone: e.target.value })} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address</label>
            <input 
              type="text" 
              placeholder="House 12, Green Avenue, Delhi" 
              required 
              value={residentForm.address} 
              onChange={e => setResidentForm({ ...residentForm, address: e.target.value })} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#00B074] hover:bg-[#009e67] transition-all text-white font-bold rounded-xl shadow-sm mt-2"
          >
            Register Resident
          </button>
        </form>
      </div>
    </div>
  );
}
