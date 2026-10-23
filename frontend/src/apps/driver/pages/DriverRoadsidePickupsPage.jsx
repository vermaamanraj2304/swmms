import React, { useState } from 'react';
import { 
  Trash2, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  User,
  Truck,
  RotateCcw,
  Search,
  Check,
  Scale,
  Sparkles,
  Filter
} from 'lucide-react';
import RoadsideRadarMap from '../components/RoadsideRadarMap';

export default function DriverRoadsidePickupsPage({
  assignedComplaints = [],
  driverLocation,
  driverInfo,
  onStartPickup,
  onCompletePickup
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('Roadside pile cleared and loaded onto compactor truck.');
  const [clearedWeight, setClearedWeight] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'EN_ROUTE' | 'PENDING' | 'CRITICAL'

  const driverLat = driverLocation?.lat && driverLocation.lat !== 0 ? driverLocation.lat : 28.6139;
  const driverLng = driverLocation?.lng && driverLocation.lng !== 0 ? driverLocation.lng : 77.2090;

  const isResolved = (comp) => {
    const st = (comp.status || '').toUpperCase();
    return st.includes('RESOLV');
  };

  // Comprehensive filter to include all roadside & spot garbage incidents
  const roadsideComplaints = assignedComplaints.filter(comp => {
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
  });

  const activeRoadside = roadsideComplaints.filter(c => !isResolved(c));
  const enRouteRoadside = activeRoadside.filter(c => c.status === 'On the Way');
  const resolvedRoadside = roadsideComplaints.filter(c => isResolved(c));

  const listToDisplay = activeTab === 'active' ? activeRoadside : resolvedRoadside;
  const filteredList = listToDisplay.filter(c => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (c.customId || '').toLowerCase().includes(term) ||
      (c.ticketNumber || '').toLowerCase().includes(term) ||
      (c.title || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term) ||
      (c.landmark || '').toLowerCase().includes(term) ||
      (c.residentAddress || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeTab === 'active') {
      if (statusFilter === 'EN_ROUTE') return c.status === 'On the Way';
      if (statusFilter === 'PENDING') return c.status !== 'On the Way';
      if (statusFilter === 'CRITICAL') return (c.priority || '').toLowerCase() === 'critical';
    }
    return true;
  });

  const handleStartRoute = async (complaintId) => {
    try {
      setSubmittingId(complaintId);
      if (onStartPickup) await onStartPickup(complaintId);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmClear = async (complaintId) => {
    try {
      setSubmittingId(complaintId);
      const payload = {
        notes: resolutionNotes || 'Roadside waste collected, site cleared and sanitized by compactor truck crew.',
        clearedWeightKg: clearedWeight ? Number(clearedWeight) : 0
      };
      if (onCompletePickup) await onCompletePickup(complaintId, payload.notes, payload.clearedWeightKg);
      setResolvingId(null);
      setClearedWeight('');
    } finally {
      setSubmittingId(null);
    }
  };

  // Helper for 4-stage visual tracker
  const getStageIndex = (status = '') => {
    const st = status.toUpperCase();
    if (st.includes('RESOLV')) return 4;
    if (st.includes('WAY')) return 3;
    if (st.includes('PROGRESS') || st.includes('INVESTIGAT')) return 2;
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-amber-600" /> ROADSIDE CLEARANCE OPERATIONS
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Roadside Complain Pickups</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active roadside garbage spots, public dump incidents, and street heaps dispatched to your compactor truck.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-600" />
            {driverInfo?.assignedVehicle || 'Assigned Compactor Truck'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TO GO PICKUP</span>
          <h3 className="text-2xl font-bold text-amber-600">{activeRoadside.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Assigned roadside spots awaiting clearance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">EN ROUTE TO SPOT</span>
          <h3 className="text-2xl font-bold text-blue-600">{enRouteRoadside.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Vehicles currently traveling to dump site</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CLEARED & RESOLVED</span>
          <h3 className="text-2xl font-bold text-[#00B074]">{resolvedRoadside.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Transferred to completed complain history</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab & Search Bar */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'active' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              To Go Pickup ({activeRoadside.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pickup Clearance History ({resolvedRoadside.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {activeTab === 'active' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('EN_ROUTE')}
                  className={`px-2 py-1 rounded-lg transition ${statusFilter === 'EN_ROUTE' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  En Route ({enRouteRoadside.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CRITICAL')}
                  className={`px-2 py-1 rounded-lg transition ${statusFilter === 'CRITICAL' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Critical
                </button>
              </div>
            )}

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search spots by landmark, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-amber-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Live Leaflet Roadside Radar Map */}
        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-900/5">
          <RoadsideRadarMap
            driverLat={driverLat}
            driverLng={driverLng}
            vehicleName={driverInfo?.assignedVehicle || 'Collection Truck'}
            driverName={driverInfo?.name || 'Driver'}
            complaints={roadsideComplaints}
            onStartPickup={handleStartRoute}
            onCompletePickup={(id) => {
              setResolvingId(id);
              setActiveTab('active');
            }}
            updatingId={submittingId}
            height="340px"
          />
        </div>

        {/* Task Cards List */}
        <div className="divide-y divide-slate-100">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
              <p className="font-bold text-slate-800 text-sm">
                {activeTab === 'active' ? 'No pending roadside pickups!' : 'No completed roadside history found'}
              </p>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'active'
                  ? 'All assigned roadside waste spots in your operational sector have been cleared.'
                  : 'Cleared roadside dumps will be recorded here.'}
              </p>
            </div>
          ) : (
            filteredList.map((comp) => {
              const compLat = comp.lat || comp.location?.lat || 28.6139;
              const compLng = comp.lng || comp.location?.lng || 77.2090;
              const isEnRoute = comp.status === 'On the Way';
              const isResolvedItem = isResolved(comp);
              const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverLat}%2C${driverLng}%3B${compLat}%2C${compLng}`;
              const currentStage = getStageIndex(comp.status);

              return (
                <div 
                  key={comp._id} 
                  className={`p-6 transition-colors ${
                    isEnRoute 
                      ? 'bg-amber-50/40 border-l-4 border-l-amber-500' 
                      : isResolvedItem 
                      ? 'bg-slate-50/30' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {comp.customId || comp.ticketNumber || '#CMP-ROADSIDE'}
                        </span>

                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                          <Trash2 className="w-3 h-3 text-amber-700" /> Roadside Garbage Spot
                        </span>

                        <span className="text-xs font-bold text-slate-900">
                          {comp.title || 'Roadside Waste Incident'}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          (comp.priority || '').toLowerCase() === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : (comp.priority || '').toLowerCase() === 'high'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {comp.priority || 'Medium'} Priority
                        </span>

                        {isEnRoute && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                            TRUCK EN ROUTE TO SPOT
                          </span>
                        )}

                        {isResolvedItem && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Waste Picked Up & Cleared
                          </span>
                        )}
                      </div>

                      {/* 4-Step Status Progress Tracker */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                          <span className="uppercase text-slate-400">Roadside Pickup Lifecycle</span>
                          <span className="text-slate-700 font-extrabold">Status: {comp.status || 'Under Review'}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 text-[9px] font-bold text-center">
                          <div className={`p-1.5 rounded-lg border transition ${
                            currentStage >= 1 
                              ? 'bg-slate-100 text-slate-800 border-slate-300' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            1. Reported
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            currentStage >= 2 
                              ? 'bg-blue-50 text-blue-800 border-blue-300' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            2. Assigned Truck
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            currentStage >= 3 
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            3. En Route (On Way)
                          </div>
                          <div className={`p-1.5 rounded-lg border transition ${
                            currentStage >= 4 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            4. Cleared & Resolved
                          </div>
                        </div>
                      </div>

                      {/* Garbage Description */}
                      <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                        {comp.description}
                      </p>

                      {/* GPS & Location Details Box */}
                      <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Landmark / Street Spot</span>
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{comp.landmark || comp.residentAddress || 'Designated Public Point'}</span>
                          </div>
                          {comp.residentSector && (
                            <span className="text-[10px] text-emerald-600 font-medium block">
                              Ward / Sector: {comp.residentSector}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">GPS Navigation Coordinates</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {compLat.toFixed(4)}° N, {compLng.toFixed(4)}° E
                            </span>
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition"
                            >
                              <Navigation className="w-3 h-3" />
                              Open GPS Route
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Resolution Notes if Resolved */}
                      {comp.resolutionNotes && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] uppercase text-emerald-700 block">
                                Sanitation Clearance Slip:
                              </span>
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

                    {/* Right Action Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0 pt-1">
                      {!isResolvedItem ? (
                        <>
                          {!isEnRoute ? (
                            <button
                              type="button"
                              onClick={() => handleStartRoute(comp._id)}
                              disabled={submittingId === comp._id}
                              className="text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                              {submittingId === comp._id ? 'Starting Route...' : 'Go for Pickup (Start Route)'}
                            </button>
                          ) : (
                            <div className="space-y-2 w-full sm:w-auto">
                              {resolvingId === comp._id ? (
                                <div className="space-y-2.5 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 w-full sm:w-80 shadow-md">
                                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Confirm Spot Cleared
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setResolvingId(null)}
                                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                                      Estimated Cleared Weight (KG)
                                    </label>
                                    <input
                                      type="number"
                                      value={clearedWeight}
                                      onChange={e => setClearedWeight(e.target.value)}
                                      placeholder="e.g. 120 (kg)"
                                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-white focus:outline-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                                      Pickup Clearance Notes *
                                    </label>
                                    <input
                                      type="text"
                                      value={resolutionNotes}
                                      onChange={e => setResolutionNotes(e.target.value)}
                                      placeholder="e.g. Debris loaded and area sanitized"
                                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-white focus:outline-emerald-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmClear(comp._id)}
                                      disabled={submittingId === comp._id}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-xl transition shadow-xs cursor-pointer"
                                    >
                                      {submittingId === comp._id ? 'Confirming...' : 'Confirm Cleared & Complete'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setResolvingId(null)}
                                      className="px-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setResolvingId(comp._id)}
                                  className="text-xs bg-[#00B074] hover:bg-[#009663] text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Mark Picked Up & Cleared
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Moved to Complain History
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
