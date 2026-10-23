import React from 'react';

export default function ComplaintForm({
  category,
  setCategory,
  title,
  setTitle,
  desc,
  setDesc,
  submitting = false,
  onSubmit
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 shadow-xs">
      <div>
        <h3 className="font-bold text-base text-[#0F172A]">File a Service Complaint</h3>
        <p className="text-xs text-slate-400 mt-0.5">Submit municipal service issues, missed pickups, damaged equipment, or staff grievances.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Issue Category</label>
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)} 
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:border-[#00B074] focus:bg-white transition"
          >
            <option>Missed Scheduled Pickup</option>
            <option>Spilled Waste on Property</option>
            <option>Damaged Municipal Bin</option>
            <option>Driver Behavior Issue</option>
            <option>Hazardous Waste Overflow</option>
            <option>Other Service Inquiry</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Subject</label>
          <input 
            type="text" 
            placeholder="e.g. Bin not collected on Wednesday morning..." 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:border-[#00B074] focus:bg-white transition" 
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Details</label>
          <textarea 
            rows={3} 
            placeholder="Please provide specific details including time, house number, or vehicle..." 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:border-[#00B074] focus:bg-white transition" 
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full bg-[#00B074] hover:bg-[#009663] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Submitting Ticket...</span>
            </>
          ) : (
            'Submit Complaint Ticket'
          )}
        </button>
      </form>
    </div>
  );
}
