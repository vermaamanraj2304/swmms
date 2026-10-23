import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  User, 
  Truck, 
  Search, 
  RotateCcw,
  Zap,
  ShieldAlert,
  Flame,
  Phone
} from 'lucide-react';

export default function DriverEmergenciesPage({
  emergencies = [],
  driverLocation,
  driverInfo,
  onStartPickup,
  onCompletePickup
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const driverLat = driverLocation?.lat && driverLocation.lat !== 0 ? driverLocation.lat : 28.6139;
  const driverLng = driverLocation?.lng && driverLocation.lng !== 0 ? driverLocation.lng : 77.2090;

  const isResolved = (em) => {
    const st = (em.status || '').toUpperCase();
    return st === 'RESOLVED' || st === 'PICKED_UP';
  };

  const activeEmergencies = emergencies.filter(e => !isResolved(e));
  const enRouteEmergencies = activeEmergencies.filter(e => (e.status || '').toUpperCase() === 'ON THE WAY');
  const resolvedEmergencies = emergencies.filter(e => isResolved(e));

  const listToDisplay = activeTab === 'active' ? activeEmergencies : resolvedEmergencies;

  const filteredList = listToDisplay.filter(em => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (em.customId || '').toLowerCase().includes(term) ||
      (em.reqId || '').toLowerCase().includes(term) ||
      (em.residentName || '').toLowerCase().includes(term) ||
      (em.address || '').toLowerCase().includes(term) ||
      (em.reason || '').toLowerCase().includes(term) ||
      (em.type || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (priorityFilter === 'CRITICAL') return (em.priority || '').toLowerCase() === 'critical';
    if (priorityFilter === 'HIGH') return (em.priority || '').toLowerCase() === 'high';

    return true;
  });

  const handleStartRoute = async (id) => {
    try {
      setSubmittingId(id);
      if (onStartPickup) await onStartPickup(id);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleComplete = async (id) => {
    try {
      setSubmittingId(id);
      if (onCompletePickup) await onCompletePickup(id);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-600 animate-pulse" /> HIGH-PRIORITY SOS DISPATCHES
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Emergency Pickups (SOS)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immediate household collection requests requiring direct vehicle-to-house route and rapid clearance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-rose-600" />
            {driverInfo?.assignedVehicle || 'Assigned Compactor Truck'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ACTIVE SOS REQUESTS</span>
          <h3 className="text-2xl font-bold text-rose-600">{activeEmergencies.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Direct doorstep SOS requiring response</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">EN ROUTE TO HOUSEHOLD</span>
          <h3 className="text-2xl font-bold text-amber-600">{enRouteEmergencies.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Vehicles traveling with active GPS navigation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">RESOLVED & CLEARED</span>
          <h3 className="text-2xl font-bold text-[#00B074]">{resolvedEmergencies.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Completed emergency pickups</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab & Search Bar */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'active' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Active Emergency SOS ({activeEmergencies.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'history' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed SOS History ({resolvedEmergencies.length})
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPriorityFilter('ALL')}
                className={`px-2 py-1 rounded-lg transition ${priorityFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('CRITICAL')}
                className={`px-2 py-1 rounded-lg transition ${priorityFilter === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Critical
              </button>
              <button
                type="button"
                onClick={() => setPriorityFilter('HIGH')}
                className={`px-2 py-1 rounded-lg transition ${priorityFilter === 'HIGH' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                High
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search emergency by ID, address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-rose-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Emergencies List */}
        <div className="divide-y divide-slate-100">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-60" />
              <p className="font-bold text-slate-800 text-sm">
                {activeTab === 'active' ? 'No active emergency SOS dispatches!' : 'No completed emergency history found'}
              </p>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'active'
                  ? 'All urgent collection dispatches in your sector have been completed.'
                  : 'Cleared emergency dispatches will be recorded here.'}
              </p>
            </div>
          ) : (
            filteredList.map((em) => {
              const isEnRoute = (em.status || '').toUpperCase() === 'ON THE WAY';
              const isResolvedItem = isResolved(em);
              const isDispatched = (em.status || '').toUpperCase() === 'DISPATCHED';

              const emLat = em.lat || em.location?.lat;
              const emLng = em.lng || em.location?.lng;
              const directionsUrl = (emLat && emLng)
                ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverLat}%2C${driverLng}%3B${emLat}%2C${emLng}`
                : `https://www.openstreetmap.org/search?query=${encodeURIComponent(em.address)}`;

              return (
                <div 
                  key={em._id || em.customId} 
                  className={`p-6 transition-colors ${
                    isEnRoute 
                      ? 'bg-rose-50/40 border-l-4 border-l-rose-500' 
                      : isResolvedItem 
                      ? 'bg-slate-50/30' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {em.customId || em.reqId || '#EMR-SOS'}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          (em.priority || '').toLowerCase() === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {em.priority || 'High'} Priority
                        </span>

                        <span className="text-xs font-bold text-slate-900">
                          {em.garbageType || em.type || 'Emergency Waste Pickup'} • {em.estimatedQuantityKg || 10} KG
                        </span>

                        {isEnRoute && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                            TRUCK EN ROUTE TO RESIDENCE
                          </span>
                        )}

                        {isResolvedItem && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ PICKED UP & RESOLVED
                          </span>
                        )}
                      </div>

                      {/* Reason Description */}
                      <p className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 leading-relaxed font-semibold">
                        {em.reason}
                      </p>

                      {/* Address & GPS */}
                      <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Pickup Address</span>
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{em.address}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Resident: <strong className="text-slate-800">{em.residentName}</strong>
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Direct Navigation</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {emLat && emLng && (
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {Number(emLat).toFixed(4)}° N, {Number(emLng).toFixed(4)}° E
                              </span>
                            )}
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
                          {em.assignedDriverName && em.assignedDriverName !== 'Unassigned' && (
                            <span className="text-[10px] text-emerald-700 font-semibold block pt-0.5">
                              Driver: {em.assignedDriverName} ({em.assignedDriverVehicle || 'Assigned Truck'})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resolution slip if resolved */}
                      {isResolvedItem && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Emergency collection cleared and sanitized on schedule.
                            </span>
                          </div>
                          {em.pickedUpAt && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(em.pickedUpAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0 pt-1">
                      {!isResolvedItem ? (
                        <>
                          {!isEnRoute ? (
                            <button
                              type="button"
                              onClick={() => handleStartRoute(em._id)}
                              disabled={submittingId === em._id}
                              className="text-xs bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Flame className="w-4 h-4" />
                              {submittingId === em._id ? 'Starting Route...' : 'Start Route (En Route)'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleComplete(em._id)}
                              disabled={submittingId === em._id}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {submittingId === em._id ? 'Completing...' : 'Mark Picked Up & Complete'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pickup Completed
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
