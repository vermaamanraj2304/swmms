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
  Truck
} from 'lucide-react';

export default function DriverComplaintsCard({
  assignedComplaints = [],
  driverLocation,
  onStartPickup,
  onCompletePickup
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'resolved'
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('Site cleared and garbage loaded onto vehicle.');
  const [clearedWeight, setClearedWeight] = useState('');

  const driverLat = driverLocation?.lat && driverLocation.lat !== 0 ? driverLocation.lat : 28.6139;
  const driverLng = driverLocation?.lng && driverLocation.lng !== 0 ? driverLocation.lng : 77.2090;

  const isResolved = (comp) => {
    const st = (comp.status || '').toUpperCase();
    return st.includes('RESOLV');
  };

  const activeComplaints = assignedComplaints.filter(c => !isResolved(c));
  const resolvedComplaints = assignedComplaints.filter(c => isResolved(c));

  const displayedList = activeTab === 'active' ? activeComplaints : resolvedComplaints;

  const handleResolveClick = async (complaintId) => {
    if (onCompletePickup) {
      await onCompletePickup(complaintId, resolutionNotes, clearedWeight ? Number(clearedWeight) : 0);
      setResolvingId(null);
      setClearedWeight('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              Assigned Roadside & Grievance Tasks
              {activeComplaints.length > 0 && (
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                  {activeComplaints.length} Pending Pickup
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Live waste complaints and roadside spots assigned to your vehicle for immediate clearance
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Tasks ({activeComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'resolved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cleared / History ({resolvedComplaints.length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 opacity-60" />
            <p className="font-semibold text-slate-700">
              {activeTab === 'active' 
                ? 'All assigned roadside waste spots have been cleared! Good job.'
                : 'No cleared tasks recorded yet today.'}
            </p>
          </div>
        ) : (
          displayedList.map((comp) => {
            const isRoadside = comp.complaintType === 'Roadside Garbage' || (comp.category || '').toLowerCase().includes('roadside');
            const compLat = comp.lat || comp.location?.lat || 28.6139;
            const compLng = comp.lng || comp.location?.lng || 77.2090;
            const isEnRoute = comp.status === 'On the Way';
            const isResolvedItem = isResolved(comp);
            const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverLat}%2C${driverLng}%3B${compLat}%2C${compLng}`;

            return (
              <div 
                key={comp._id} 
                className={`p-6 transition-colors ${
                  isEnRoute 
                    ? 'bg-amber-50/40 border-l-4 border-l-amber-500' 
                    : isResolvedItem 
                    ? 'bg-slate-50/40' 
                    : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  <div className="space-y-3 flex-1">
                    {/* Header Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {comp.customId || comp.ticketNumber || '#CMP-TASK'}
                      </span>

                      {isRoadside ? (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                          <Trash2 className="w-3 h-3 text-amber-700" /> Roadside Garbage Spot
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-700" /> Resident Grievance
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-900">
                        {comp.title || 'Collection Assignment'}
                      </span>

                      {/* Status Badges */}
                      {isEnRoute && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                          ON THE WAY FOR PICKUP
                        </span>
                      )}

                      {isResolvedItem && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Picked Up & Cleared
                        </span>
                      )}

                      {!isEnRoute && !isResolvedItem && (
                        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {comp.status || 'Assigned to Truck'}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-medium">
                      {comp.description}
                    </p>

                    {/* Coordinates & Location details */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Landmark / Location</span>
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{comp.landmark || comp.residentAddress || 'Designated Route Point'}</span>
                        </div>
                        {comp.residentSector && (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            Sector: {comp.residentSector}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">GPS Coordinates</span>
                        <div className="flex items-center gap-2">
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
                            GPS Directions
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Notes if Resolved */}
                    {comp.resolutionNotes && (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-[10px] uppercase text-emerald-700 block">Driver Resolution Slip:</span>
                          <span>{comp.resolutionNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 shrink-0 pt-1">
                    {!isResolvedItem ? (
                      <>
                        {!isEnRoute ? (
                          <button
                            onClick={() => onStartPickup && onStartPickup(comp._id)}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                          >
                            <Truck className="w-4 h-4" />
                            Go for Pickup (En Route)
                          </button>
                        ) : (
                          <div className="space-y-2 w-full sm:w-auto">
                            {resolvingId === comp._id ? (
                              <div className="space-y-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 w-full md:w-72 shadow-sm">
                                <div>
                                  <label className="text-[10px] font-bold text-emerald-800 uppercase block">Cleared Weight (KG)</label>
                                  <input
                                    type="number"
                                    value={clearedWeight}
                                    onChange={e => setClearedWeight(e.target.value)}
                                    placeholder="e.g. 150 (kg)"
                                    className="w-full text-xs px-2.5 py-1 rounded-lg border border-emerald-300 bg-white mb-1.5 focus:outline-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-emerald-800 uppercase block">Pickup Clearance Notes</label>
                                  <input
                                    type="text"
                                    value={resolutionNotes}
                                    onChange={e => setResolutionNotes(e.target.value)}
                                    placeholder="e.g. Cleared 250kg debris"
                                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white focus:outline-emerald-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handleResolveClick(comp._id)}
                                    className="flex-1 bg-emerald-600 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-emerald-700 transition"
                                  >
                                    Confirm Cleared
                                  </button>
                                  <button
                                    onClick={() => setResolvingId(null)}
                                    className="px-2 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setResolvingId(comp._id)}
                                className="text-xs bg-[#00B074] hover:bg-[#009663] text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark Picked Up & Cleared
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Moved to Complain History
                      </span>
                    )}
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
