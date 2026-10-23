import React, { useState } from 'react';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Tag, 
  CheckCircle2, 
  ArrowUpRight,
  Filter,
  Trash2 
} from 'lucide-react';

export default function ComplaintsTable({ complaints = [], onUpdateStatus, onDeleteComplaint, onViewAll }) {
  const [filter, setFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (complaintId, newStatus) => {
    if (!onUpdateStatus) return;
    try {
      setUpdatingId(complaintId);
      await onUpdateStatus(complaintId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredComplaints = complaints.filter(comp => {
    if (complaints.length <= 1) return true;
    const st = (comp.status || '').toUpperCase();
    if (filter === 'RESOLVED') return st.includes('RESOLV');
    if (filter === 'INVESTIGATING') return st.includes('INVESTIGAT') || st.includes('PROGRESS');
    if (filter === 'UNDER_REVIEW') return !st.includes('RESOLV') && !st.includes('INVESTIGAT') && !st.includes('PROGRESS');
    return true;
  });

  const getStatusBadgeClass = (status = '') => {
    const st = status.toUpperCase();
    if (st.includes('RESOLV')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (st.includes('INVESTIGAT') || st.includes('PROGRESS')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getStatusDotColor = (status = '') => {
    const st = status.toUpperCase();
    if (st.includes('RESOLV')) return 'bg-emerald-500';
    if (st.includes('INVESTIGAT') || st.includes('PROGRESS')) return 'bg-blue-500';
    return 'bg-amber-500 animate-pulse';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[#0F172A]">Resident Complaints Ticket Log</h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {complaints.length <= 1 ? (complaints.length === 0 ? '0' : 'Recent') : complaints.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            View resident information, service complaints, and update resolution status
          </p>
        </div>

        {/* Filter Pills or View All */}
        {complaints.length > 1 ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'ALL' ? 'bg-white font-bold text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All ({complaints.length})
            </button>
            <button 
              onClick={() => setFilter('UNDER_REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'UNDER_REVIEW' ? 'bg-white font-bold text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Under Review
            </button>
            <button 
              onClick={() => setFilter('INVESTIGATING')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'INVESTIGATING' ? 'bg-white font-bold text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Investigating
            </button>
            <button 
              onClick={() => setFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg transition ${filter === 'RESOLVED' ? 'bg-white font-bold text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Resolved
            </button>
          </div>
        ) : (
          onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition self-start sm:self-auto cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
            No complaints found matching filter criteria.
          </div>
        ) : (
          filteredComplaints.map(comp => {
            const residentName = comp.residentName || comp.residentId?.name || 'Resident';
            const residentAddress = comp.residentAddress || comp.residentId?.address || comp.residentId?.houseLocation?.address || 'Greenfield District';
            const residentEmail = comp.residentEmail || comp.residentId?.email || '';
            const residentPhone = comp.residentPhone || comp.residentId?.phone || '';
            const residentCustomId = comp.residentCustomId || comp.residentId?.customId || '';
            const residentSector = comp.residentSector || comp.residentId?.houseLocation?.sector || '';
            const currentStatus = comp.status || 'Under Review';
            const isUpdating = updatingId === comp._id;

            return (
              <div key={comp._id} className="p-6 hover:bg-slate-50/60 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Complaint & Resident Info */}
                  <div className="space-y-3 flex-1">
                    {/* Header: Ticket ID & Category */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md tracking-wide">
                        Ticket #: {comp.ticketNumber || comp.customId || comp.ticketId || '#CMP-TICKET'}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A]">
                        {comp.title || 'Service Ticket'}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                        {comp.category || comp.type || 'General'}
                      </span>
                      {comp.createdAt && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto lg:ml-0">
                          <Clock className="w-3 h-3" /> {new Date(comp.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Complaint Description */}
                    <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100/80 leading-relaxed">
                      {comp.description}
                    </p>

                    {/* Resident Details Box */}
                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#00B074] flex items-center justify-center font-bold text-[10px] shrink-0">
                          {residentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-none">Resident</span>
                          <strong className="text-slate-800 text-xs truncate block">{residentName}</strong>
                          {residentCustomId && (
                            <span className="text-[10px] text-slate-400 font-mono block leading-none">{residentCustomId}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-none">Address / Sector</span>
                          <span className="text-slate-700 text-xs block truncate font-medium">{residentAddress}</span>
                          {residentSector && (
                            <span className="text-[10px] text-[#00B074] font-medium block leading-none">{residentSector}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-none">Contact</span>
                          <span className="text-slate-700 text-xs block truncate">{residentEmail || 'No email provided'}</span>
                          {residentPhone && (
                            <span className="text-[10px] text-slate-500 block leading-none">{residentPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Admin Status Action Controller */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-1">
                    <div className="space-y-1.5 w-full sm:w-auto">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Admin Resolution Status
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(currentStatus)}`}></span>
                        <select
                          value={currentStatus}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(comp._id, e.target.value)}
                          className={`text-xs font-bold rounded-xl border px-3 py-2 outline-hidden cursor-pointer transition shadow-2xs ${getStatusBadgeClass(currentStatus)} disabled:opacity-50`}
                        >
                          <option value="Under Review" className="bg-white text-slate-800">🟡 Under Review</option>
                          <option value="Investigating" className="bg-white text-slate-800">🔵 Investigating</option>
                          <option value="Resolved" className="bg-white text-slate-800">🟢 Resolved</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons: Status & Delete */}
                    <div className="flex flex-wrap items-center gap-2">
                      {currentStatus !== 'Resolved' ? (
                        <button
                          onClick={() => handleStatusChange(comp._id, 'Resolved')}
                          disabled={isUpdating}
                          className="text-xs bg-[#00B074] hover:bg-[#009663] disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isUpdating ? 'Saving...' : 'Mark Resolved'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(comp._id, 'Under Review')}
                          disabled={isUpdating}
                          className="text-[11px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-semibold px-2.5 py-1 rounded-lg transition"
                        >
                          Re-open Ticket
                        </button>
                      )}

                      {onDeleteComplaint && (
                        <button
                          onClick={() => onDeleteComplaint(comp._id)}
                          disabled={isUpdating}
                          title="Delete / Remove Ticket"
                          className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-rose-200 shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
