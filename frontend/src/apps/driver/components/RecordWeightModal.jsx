import React from 'react';
import { X, Check } from 'lucide-react';

const WASTE_POINT_RATES = {
  'Recyclable': 15,
  'Organic': 10,
  'E-Waste': 50,
  'Hazardous': 30,
  'General Waste': 5
};

export default function RecordWeightModal({
  selectedStop,
  onClose,
  wasteType,
  setWasteType,
  weightKg,
  setWeightKg,
  onSubmit
}) {
  if (!selectedStop) return null;

  const currentRate = WASTE_POINT_RATES[wasteType] || 10;
  const numWeight = parseFloat(weightKg);
  const calculatedPoints = !isNaN(numWeight) && numWeight > 0 ? Math.round(numWeight * currentRate) : 0;
  const residentName = selectedStop.residentName || 'Household Resident';
  const displayLocation = selectedStop.location || selectedStop.address || 'Curbside Collection Point';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B074]">
              CERTIFIED SCALE WEIGH-IN & POINTS CREDIT
            </span>
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              <span>{residentName}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{displayLocation}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waste Stream Category</label>
            <select 
              value={wasteType} 
              onChange={e => setWasteType(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="Organic">Organic Waste (10 pts/kg)</option>
              <option value="Recyclable">Recyclable Dry Waste (15 pts/kg)</option>
              <option value="E-Waste">E-Waste / Hazardous (50 pts/kg)</option>
              <option value="Hazardous">Hazardous / Medical (30 pts/kg)</option>
              <option value="General Waste">General Mixed Waste (5 pts/kg)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Certified Scale Weight (KG)</label>
            <input 
              type="number" 
              step="0.1" 
              placeholder="e.g. 14.5"
              value={weightKg} 
              onChange={e => setWeightKg(e.target.value)} 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-sm focus:bg-white focus:ring-2 focus:ring-[#00B074]/30"
            />
          </div>

          {/* Real-time Calculated Points Credit Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                CREDITED TO RESIDENT PROFILE
              </span>
              <span className="text-xs font-semibold text-emerald-900">
                Rate: {currentRate} points / kg
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-700">+{calculatedPoints}</span>
              <span className="text-[10px] font-bold text-emerald-600 block">Garbage Points</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save & Credit Points
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
