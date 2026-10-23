import React from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';

export default function AssignEmergencyModal({
  isOpen,
  onClose,
  emergency,
  drivers = [],
  selectedDriverId,
  setSelectedDriverId,
  onSubmit
}) {
  if (!isOpen || !emergency) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Dispatch Emergency Driver</h3>
              <p className="text-[11px] text-slate-400">Immediate priority allocation to live vehicle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
          <div className="text-xs font-bold text-slate-800">{emergency.reason}</div>
          <div className="text-[11px] text-slate-500">
            Type: <span className="font-semibold text-slate-700">{emergency.garbageType}</span> • Est: <span className="font-semibold text-slate-700">{emergency.estimatedQuantityKg || 10} KG</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Available Fleet Driver</label>
            <select 
              value={selectedDriverId} 
              onChange={e => setSelectedDriverId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
            >
              <option value="">Choose Driver...</option>
              {drivers.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name} — {d.assignedVehicle || 'Truck'} ({d.isOnDuty ? 'On Duty' : 'Off Shift'})
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={!selectedDriverId}
            className="w-full py-3 bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 transition-all text-white font-bold rounded-xl shadow-sm mt-2 flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" /> Confirm Dispatch
          </button>
        </form>
      </div>
    </div>
  );
}
