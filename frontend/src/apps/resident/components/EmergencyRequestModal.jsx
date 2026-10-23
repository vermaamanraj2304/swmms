import React from 'react';

export default function EmergencyRequestModal({
  reason,
  setReason,
  garbageType,
  setGarbageType,
  quantity,
  setQuantity,
  onSubmit
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Reason for Emergency Pickup</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <option>Excessive household waste (Post-event)</option>
            <option>Hazardous Waste Disposal</option>
            <option>Bio-Medical / Sanitation Emergency</option>
            <option>Large Electronics / E-Waste Appliance</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Primary Waste Category</label>
          <select value={garbageType} onChange={e => setGarbageType(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50">
            <option>General Organic</option>
            <option>Dry Recyclable</option>
            <option>E-Waste</option>
            <option>Hazardous / Chemical</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Estimated Quantity (KG)</label>
          <input 
            type="number" 
            placeholder="e.g. 15" 
            value={quantity} 
            onChange={e => setQuantity(e.target.value)} 
            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50" 
          />
        </div>

        <button type="submit" className="w-full bg-[#00B074] hover:bg-[#009663] text-white py-3 rounded-xl font-bold transition">
          Submit Emergency Pickup Request
        </button>
      </form>
    </div>
  );
}
