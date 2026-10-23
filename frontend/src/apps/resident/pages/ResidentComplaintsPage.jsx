import React, { useState } from 'react';
import { 
  MessageSquare, 
  Trash2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Navigation, 
  FileText, 
  User, 
  Truck, 
  Filter, 
  Search, 
  Plus, 
  LocateFixed, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import LocationPickerMap from '../../../components/LocationPickerMap';
import LocationPreviewModal from '../../../components/LocationPreviewModal';

export default function ResidentComplaintsPage({
  complaints = [],
  resident,
  onSubmitComplaint,
  onDeleteComplaint,
  onRefresh,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'roadside' | 'history'

  // General Grievance Form State
  const [generalCategory, setGeneralCategory] = useState('Missed Scheduled Pickup');
  const [generalTitle, setGeneralTitle] = useState('');
  const [generalDesc, setGeneralDesc] = useState('');
  const [generalPriority, setGeneralPriority] = useState('Medium');
  const [submittingGeneral, setSubmittingGeneral] = useState(false);

  // Roadside Dump Form State
  const [roadsideTitle, setRoadsideTitle] = useState('');
  const [roadsideLandmark, setRoadsideLandmark] = useState('');
  const [roadsideDesc, setRoadsideDesc] = useState('');
  const [roadsidePriority, setRoadsidePriority] = useState('High');
  const [roadsideLat, setRoadsideLat] = useState(resident?.houseLocation?.lat || 28.6139);
  const [roadsideLng, setRoadsideLng] = useState(resident?.houseLocation?.lng || 77.2090);
  const [submittingRoadside, setSubmittingRoadside] = useState(false);
  const [previewComplaint, setPreviewComplaint] = useState(null);

  // History Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');

  // Helpers
  const isRoadside = (comp) => {
    return (
      comp.complaintType === 'Roadside Garbage' ||
      (comp.category || '').toLowerCase().includes('roadside') ||
      (comp.title || '').toLowerCase().includes('roadside') ||
      (comp.type || '').toLowerCase().includes('roadside') ||
      (comp.customId || '').startsWith('#SPOT') ||
      (comp.ticketNumber || '').startsWith('#SPOT') ||
      (comp.category || '').toLowerCase().includes('spot') ||
      (comp.title || '').toLowerCase().includes('spot') ||
      (comp.type || '').toLowerCase().includes('spot')
    );
  };

  const isOrderComplaint = (comp) => {
    return (
      comp.complaintType === 'Order Complain' ||
      Boolean(comp.orderId) ||
      (comp.category || '').toLowerCase().includes('order') ||
      (comp.title || '').toLowerCase().includes('order issue')
    );
  };

  const isResolved = (comp) => {
    const st = (comp.status || '').toUpperCase();
    return st.includes('RESOLV');
  };

  const generalComplaints = complaints.filter(c => !isRoadside(c) && !isOrderComplaint(c));
  const roadsideComplaints = complaints.filter(c => isRoadside(c) && !isOrderComplaint(c));

  // Geolocation detector
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRoadsideLat(Number(pos.coords.latitude.toFixed(6)));
          setRoadsideLng(Number(pos.coords.longitude.toFixed(6)));
          if (showToast) showToast('📍 Current device GPS coordinates captured!', 'success');
        },
        () => {
          const lat = resident?.houseLocation?.lat || 28.6145;
          const lng = resident?.houseLocation?.lng || 77.2095;
          setRoadsideLat(lat);
          setRoadsideLng(lng);
          if (showToast) showToast('📍 Set to your registered household coordinates.', 'info');
        }
      );
    } else {
      setRoadsideLat(28.6139);
      setRoadsideLng(77.2090);
    }
  };

  // Submit General Grievance
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (!generalDesc.trim() || (!generalTitle.trim() && !generalCategory)) return;
    try {
      setSubmittingGeneral(true);
      await onSubmitComplaint({
        complaintType: 'Resident',
        category: generalCategory,
        type: generalCategory,
        title: generalTitle.trim() || generalCategory,
        description: generalDesc.trim(),
        priority: generalPriority
      });
      setGeneralTitle('');
      setGeneralDesc('');
      if (showToast) showToast('🎉 Household grievance registered successfully!', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setSubmittingGeneral(false);
    }
  };

  // Submit Roadside Dump Report
  const handleRoadsideSubmit = async (e) => {
    e.preventDefault();
    if (!roadsideDesc.trim() || !roadsideLandmark.trim()) return;
    try {
      setSubmittingRoadside(true);
      await onSubmitComplaint({
        complaintType: 'Roadside Garbage',
        category: 'Roadside Garbage',
        type: 'Roadside Garbage',
        title: roadsideTitle.trim() || 'Roadside Waste Dump',
        landmark: roadsideLandmark.trim(),
        residentAddress: roadsideLandmark.trim(),
        description: roadsideDesc.trim(),
        priority: roadsidePriority,
        lat: Number(roadsideLat) || 28.6139,
        lng: Number(roadsideLng) || 77.2090
      });
      setRoadsideTitle('');
      setRoadsideLandmark('');
      setRoadsideDesc('');
      if (showToast) showToast('🚨 Roadside garbage report filed! Dispatch team notified.', 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to submit roadside dump report', 'error');
    } finally {
      setSubmittingRoadside(false);
    }
  };

  // Status visual badge
  const renderStatusBadge = (status = '') => {
    const st = status.toUpperCase();
    if (st.includes('RESOLV')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
        </span>
      );
    }
    if (st.includes('WAY')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 w-fit animate-pulse">
          <Truck className="w-3.5 h-3.5 text-amber-600 animate-bounce" /> Truck En Route
        </span>
      );
    }
    if (st.includes('INVESTIGAT') || st.includes('PROGRESS')) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 w-fit">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" /> In Progress
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Under Review
      </span>
    );
  };

  // Master History Filter
  const filteredHistory = complaints.filter(c => {
    if (isOrderComplaint(c)) return false;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.customId || '').toLowerCase().includes(term) ||
      (c.ticketNumber || '').toLowerCase().includes(term) ||
      (c.title || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term) ||
      (c.landmark || '').toLowerCase().includes(term);

    const matchesStatus = historyStatusFilter === 'ALL' || (
      historyStatusFilter === 'RESOLVED' ? isResolved(c) : !isResolved(c)
    );

    const matchesType = historyTypeFilter === 'ALL' || (
      historyTypeFilter === 'ROADSIDE' ? isRoadside(c) : !isRoadside(c)
    );

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> MUNICIPAL GRIEVANCE & COMPLAINT PORTAL
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Complaint Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            File household grievances, report public roadside waste heaps, track live clearance status, and review ticket history.
          </p>
        </div>

        {/* Modular Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'general'
                ? 'bg-[#00B074] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            General Complain ({generalComplaints.filter(c => !isResolved(c)).length})
          </button>

          <button
            onClick={() => setActiveTab('roadside')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'roadside'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Roadside Complain ({roadsideComplaints.filter(c => !isResolved(c)).length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Complain History ({complaints.length})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GENERAL COMPLAINT */}
      {/* ========================================================= */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                File Household Grievance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit missed curbside collections, damaged bins, or staff conduct issues.
              </p>
            </div>

            <form onSubmit={handleGeneralSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={generalCategory}
                  onChange={e => setGeneralCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-emerald-500"
                >
                  <option value="Missed Scheduled Pickup">Missed Scheduled Pickup</option>
                  <option value="Damaged Municipal Bin">Damaged Municipal Bin</option>
                  <option value="Spilled Waste on Property">Spilled Waste on Property</option>
                  <option value="Driver Behavior Issue">Driver Behavior Issue</option>
                  <option value="Delayed Collection Run">Delayed Collection Run</option>
                  <option value="Hazardous Waste Overflow">Hazardous Waste Overflow</option>
                  <option value="Segregation Inquiry">Segregation Inquiry / Overcharging</option>
                  <option value="General Service Grievance">General Service Grievance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Morning garbage compactor missed House #42"
                  value={generalTitle}
                  onChange={e => setGeneralTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={generalPriority}
                  onChange={e => setGeneralPriority(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-emerald-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority (Standard)</option>
                  <option value="High">High Priority (Urgent)</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Details & Specifics *</label>
                <textarea
                  rows={3}
                  placeholder="Specify exact timing, bin type, or operational details..."
                  value={generalDesc}
                  onChange={e => setGeneralDesc(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingGeneral}
                className="w-full bg-[#00B074] hover:bg-[#009663] disabled:opacity-60 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                {submittingGeneral ? 'Submitting Grievance...' : 'Submit Household Ticket'}
              </button>
            </form>
          </div>

          {/* Active Grievances List Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">My Active Household Complaints</h3>
                <p className="text-xs text-slate-400">Live inspection & resolution status of your residential tickets</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {generalComplaints.filter(c => !isResolved(c)).length} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {generalComplaints.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
                  <p className="font-bold text-slate-800 text-sm">No Active Household Complaints</p>
                  <p className="text-[11px] text-slate-400">You have no pending service grievances.</p>
                </div>
              ) : (
                generalComplaints.map(comp => {
                  const statusStr = (comp.status || '').toUpperCase();
                  const isResolvedItem = isResolved(comp);
                  const isInvestigating = statusStr.includes('INVESTIGAT') || statusStr.includes('PROGRESS');
                  const isUnderReview = !isResolvedItem && !isInvestigating;

                  return (
                    <div key={comp._id || comp.customId} className="py-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {comp.ticketNumber || comp.customId || '#CMP-TICKET'}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              {comp.title || 'Service Ticket'}
                            </span>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {comp.category || comp.type || 'General'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{comp.description}</p>
                          <span className="text-[10px] text-slate-400 block">
                            Logged: {comp.date || (comp.createdAt ? new Date(comp.createdAt).toLocaleDateString() : 'Today')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {renderStatusBadge(comp.status)}
                          {onDeleteComplaint && (
                            <button
                              onClick={() => onDeleteComplaint(comp._id, comp.ticketNumber || comp.customId)}
                              title="Withdraw complaint"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3-Step Live Progress Tracker */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                          <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                            isUnderReview 
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' 
                              : 'bg-white border-emerald-200 text-emerald-700 font-medium'
                          }`}>
                            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">1</span>
                            <span className="font-bold">Under Review</span>
                            <span className="text-[9px] text-slate-400">Logged</span>
                          </div>

                          <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                            isInvestigating 
                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold animate-pulse' 
                              : isResolvedItem 
                              ? 'bg-white border-emerald-200 text-emerald-700 font-medium' 
                              : 'bg-white/50 border-slate-200 text-slate-400'
                          }`}>
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold">2</span>
                            <span className="font-bold">Investigating</span>
                            <span className="text-[9px] text-slate-400">Dispatch Crew</span>
                          </div>

                          <div className={`p-2 rounded-lg border flex flex-col items-center gap-1 ${
                            isResolvedItem 
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                              : 'bg-white/50 border-slate-200 text-slate-400'
                          }`}>
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">3</span>
                            <span className="font-bold">Resolved</span>
                            <span className="text-[9px] text-slate-400">Action Taken</span>
                          </div>
                        </div>
                      </div>

                      {comp.resolutionNotes && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[10px] uppercase text-emerald-700">Official Resolution Notes:</strong>
                            <span>{comp.resolutionNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ROADSIDE COMPLAIN (TRACK STATUS & REPORT) */}
      {/* ========================================================= */}
      {activeTab === 'roadside' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Report Roadside Spot Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-600" />
                Report Roadside Garbage Spot
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Report street trash heaps, illegal dump sites, or overflowing public bins with GPS coordinates for automated compactor truck dispatch.
              </p>
            </div>

            <form onSubmit={handleRoadsideSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Incident Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Large construction debris dump along Outer Ring Road"
                  value={roadsideTitle}
                  onChange={e => setRoadsideTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Landmark / Exact Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Pillar 128, Service Lane"
                  value={roadsideLandmark}
                  onChange={e => setRoadsideLandmark(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-amber-500"
                />
              </div>

              {/* Interactive Leaflet Garbage Location Picker */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Tap or Drag Pin to Garbage Spot on Leaflet Map *
                </label>
                <LocationPickerMap
                  lat={Number(roadsideLat) || 28.6139}
                  lng={Number(roadsideLng) || 77.2090}
                  onChange={({ lat, lng }) => {
                    setRoadsideLat(lat);
                    setRoadsideLng(lng);
                  }}
                  height="210px"
                  label={roadsideLandmark || 'Roadside Garbage Dump'}
                  pinType="garbage"
                  priority={roadsidePriority}
                  showGpsButton={true}
                />
              </div>

              {/* GPS Coordinates Section */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    Garbage Location GPS Coordinates *
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-[11px] font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded-lg transition flex items-center gap-1"
                  >
                    <LocateFixed className="w-3 h-3" /> Auto-Detect GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roadsideLat}
                      onChange={e => setRoadsideLat(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roadsideLng}
                      onChange={e => setRoadsideLng(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-700">
                  Tap anywhere on the Leaflet map to adjust the exact trash dump location.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgency Priority</label>
                <select
                  value={roadsidePriority}
                  onChange={e => setRoadsidePriority(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:outline-amber-500"
                >
                  <option value="Low">Low Priority (Minor Litter)</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority (Curbside Overflow)</option>
                  <option value="Critical">Critical (Road Blocker / Toxic Pile)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dump Description & Volume *</label>
                <textarea
                  rows={3}
                  placeholder="Describe dump size (approx kg or tons), mixed plastic, wet garbage..."
                  value={roadsideDesc}
                  onChange={e => setRoadsideDesc(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRoadside}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                {submittingRoadside ? 'Filing Report...' : 'File Roadside Report'}
              </button>
            </form>
          </div>

          {/* Track Roadside Complaints List */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Track Roadside Garbage Clearance</h3>
                <p className="text-xs text-slate-400">Live fleet vehicle dispatch and pickup progress for public waste spots</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                {roadsideComplaints.length} Reported Spots
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {roadsideComplaints.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
                  <p className="font-bold text-slate-800 text-sm">No Roadside Dumps Reported</p>
                  <p className="text-[11px] text-slate-400">Report any street garbage or illegal dump spots on the left.</p>
                </div>
              ) : (
                roadsideComplaints.map(comp => {
                  const compLat = comp.lat || comp.location?.lat || 28.6139;
                  const compLng = comp.lng || comp.location?.lng || 77.2090;
                  const isEnRoute = comp.status === 'On the Way';
                  const isResolvedItem = isResolved(comp);

                  return (
                    <div key={comp._id || comp.customId} className="py-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {comp.ticketNumber || comp.customId || '#CMP-ROADSIDE'}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {comp.title || 'Roadside Waste Incident'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              (comp.priority || '').toLowerCase() === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {comp.priority || 'Medium'} Priority
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {comp.description}
                          </p>

                          {/* Location & GPS Map */}
                          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                              {comp.landmark || comp.residentAddress || 'Public Street'}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {compLat.toFixed(4)}° N, {compLng.toFixed(4)}° E
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewComplaint(comp)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>View on Leaflet Map</span>
                            </button>
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${compLat}&mlon=${compLng}#map=16/${compLat}/${compLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-0.5"
                            >
                              OSM <ArrowUpRight className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {renderStatusBadge(comp.status)}
                        </div>
                      </div>

                      {/* 4-Step Roadside Pickup Progress Tracker */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                          <span className="uppercase text-slate-400">Roadside Pickup Progress</span>
                          <span className="text-slate-800 font-extrabold">{comp.status || 'Under Review'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold text-center">
                          <div className={`p-1.5 rounded-lg border transition ${
                            comp.status ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            1. Reported
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            (comp.assignedDriver && comp.assignedDriver !== 'Unassigned') || comp.status === 'In Progress' || comp.status === 'On the Way' || isResolvedItem
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            2. Vehicle Assigned
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            comp.status === 'On the Way' || isResolvedItem
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            3. Truck En Route
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            isResolvedItem
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            4. Cleared & Done
                          </div>
                        </div>
                      </div>

                      {/* Fleet Dispatch Card */}
                      <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            comp.assignedVehicle ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Assigned Fleet Vehicle & Crew
                            </span>
                            <strong className="text-slate-800 font-bold block">
                              {comp.assignedVehicle || 'Compactor Vehicle Pending Assignment'}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              Driver: {comp.assignedDriver && comp.assignedDriver !== 'Unassigned' ? comp.assignedDriver : 'Municipal Dispatcher Assigning'}
                            </span>
                          </div>
                        </div>

                        {isEnRoute && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                            🚚 Compactor Truck is Driving to Site!
                          </span>
                        )}

                        {isResolvedItem && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                            ✓ Waste Cleared & Sanitized
                          </span>
                        )}
                      </div>

                      {comp.resolutionNotes && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <strong className="block text-[10px] uppercase text-emerald-700">Driver Clearance Slip:</strong>
                              {comp.clearedWeightKg ? (
                                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                                  ⚖️ Cleared: {comp.clearedWeightKg} kg
                                </span>
                              ) : null}
                            </div>
                            <span className="block mt-0.5">{comp.resolutionNotes}</span>
                            {comp.resolvedAt && (
                              <span className="text-[10px] text-slate-500 block mt-1">
                                Cleared At: {new Date(comp.resolvedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: COMPLAIN HISTORY (MASTER AUDIT TRAIL) */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                Comprehensive Complain History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete archive of all your household grievances and roadside dump clearance records.
              </p>
            </div>

            {/* Metrics pills */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
                {complaints.length} Total Tickets
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                {complaints.filter(isResolved).length} Resolved
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800">
                {complaints.filter(c => !isResolved(c)).length} Active
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by Ticket #, subject, or landmark..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-slate-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Status:</span>
              {['ALL', 'ACTIVE', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setHistoryStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    historyStatusFilter === st 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <span className="text-slate-300 mx-1">|</span>

              <span className="text-slate-400 font-bold">Type:</span>
              <button
                onClick={() => setHistoryTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  historyTypeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setHistoryTypeFilter('RESIDENT')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  historyTypeFilter === 'RESIDENT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Household
              </button>
              <button
                onClick={() => setHistoryTypeFilter('ROADSIDE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  historyTypeFilter === 'ROADSIDE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Roadside
              </button>
            </div>
          </div>

          {/* Master History Records */}
          <div className="divide-y divide-slate-100">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 opacity-50" />
                <p className="font-bold text-slate-800 text-sm">No History Records Found</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search query or filter selection.</p>
              </div>
            ) : (
              filteredHistory.map(comp => {
                const isRoadsideItem = isRoadside(comp);
                const isResolvedItem = isResolved(comp);

                return (
                  <div key={comp._id || comp.customId} className="py-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {comp.ticketNumber || comp.customId || '#CMP-HIST'}
                          </span>

                          {isRoadsideItem ? (
                            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                              <Trash2 className="w-3 h-3 text-amber-700" /> Roadside Dump
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300 flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-700" /> Household Grievance
                            </span>
                          )}

                          <span className="text-xs font-bold text-slate-900">
                            {comp.title || 'Service Ticket'}
                          </span>

                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {comp.category || comp.type || 'General'}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {comp.priority || 'Medium'} Priority
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {comp.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Logged: {comp.date || (comp.createdAt ? new Date(comp.createdAt).toLocaleDateString() : 'N/A')}
                          </span>
                          {(comp.landmark || comp.residentAddress) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {comp.landmark || comp.residentAddress}
                            </span>
                          )}
                          {comp.assignedDriver && comp.assignedDriver !== 'Unassigned' && (
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              {comp.assignedVehicle ? `${comp.assignedVehicle} • ` : ''}{comp.assignedDriver}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {renderStatusBadge(comp.status)}
                      </div>
                    </div>

                    {comp.resolutionNotes && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[10px] uppercase text-emerald-700">Official Municipal Resolution:</strong>
                          <span>{comp.resolutionNotes}</span>
                          {comp.resolvedAt && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Cleared At: {new Date(comp.resolvedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Interactive Leaflet Location Preview Modal */}
      {previewComplaint && (
        <LocationPreviewModal
          isOpen={Boolean(previewComplaint)}
          onClose={() => setPreviewComplaint(null)}
          title={previewComplaint.title || 'Roadside Garbage Incident'}
          customId={previewComplaint.ticketNumber || previewComplaint.customId || '#CMP'}
          lat={previewComplaint.lat || previewComplaint.location?.lat}
          lng={previewComplaint.lng || previewComplaint.location?.lng}
          landmark={previewComplaint.landmark}
          address={previewComplaint.residentAddress || previewComplaint.location?.address}
          status={previewComplaint.status}
          priority={previewComplaint.priority}
          complaintType={previewComplaint.complaintType}
          assignedDriver={previewComplaint.assignedDriver}
          assignedVehicle={previewComplaint.assignedVehicle}
        />
      )}
    </div>
  );
}
