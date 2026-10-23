import React from 'react';
import { 
  AlertTriangle, 
  Navigation, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  MapPin, 
  Clock, 
  Truck,
  ArrowRight
} from 'lucide-react';

export default function DriverEmergenciesCard({ 
  emergencies = [], 
  driverLocation, 
  onStartPickup, 
  onCompletePickup 
}) {
  if (!emergencies || emergencies.length === 0) {
    return null;
  }

  // Driver GPS coordinates
  const driverLat = driverLocation?.lat && driverLocation.lat !== 0 ? driverLocation.lat : 28.6139;
  const driverLng = driverLocation?.lng && driverLocation.lng !== 0 ? driverLocation.lng : 77.2090;

  // Active emergencies sorted: ON THE WAY first, then DISPATCHED, then PENDING, then RESOLVED
  const sortedEmergencies = [...emergencies].sort((a, b) => {
    const order = { 'ON THE WAY': 1, 'DISPATCHED': 2, 'PENDING_DISPATCH': 3, 'NEW': 4, 'RESOLVED': 5, 'PICKED_UP': 6 };
    return (order[a.status] || 99) - (order[b.status] || 99);
  });

  const activeCount = emergencies.filter(e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              Assigned Emergency Dispatches
              {activeCount > 0 && (
                <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {activeCount} Active SOS
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Immediate household collection requests requiring direct vehicle-to-house route
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          {emergencies.length} Total Registered
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {sortedEmergencies.map((em) => {
          const isEnRoute = em.status === 'ON THE WAY';
          const isDispatched = em.status === 'DISPATCHED';
          const isResolved = em.status === 'RESOLVED' || em.status === 'PICKED_UP';
          const isPending = em.status === 'PENDING_DISPATCH' || em.status === 'NEW';

          const emLat = em.lat || em.location?.lat;
          const emLng = em.lng || em.location?.lng;
          const directionsUrl = (emLat && emLng)
            ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverLat}%2C${driverLng}%3B${emLat}%2C${emLng}`
            : `https://www.openstreetmap.org/search?query=${encodeURIComponent(em.address)}`;

          return (
            <div 
              key={em._id || em.customId} 
              className={`p-6 transition-colors ${isEnRoute ? 'bg-amber-50/40 border-l-4 border-l-amber-500' : isDispatched ? 'bg-blue-50/20 border-l-4 border-l-blue-500' : 'hover:bg-slate-50/50'}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Details Section */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {em.customId || em.reqId || '#REQ-SOS'}
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {em.priority || 'High'} Priority
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {em.garbageType || em.type || 'General Waste'} • {em.estimatedQuantityKg || 10} KG
                    </span>

                    {/* Status Badge */}
                    {isEnRoute && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        ON THE WAY (Direct Route Active)
                      </span>
                    )}
                    {isDispatched && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                        DISPATCHED TO YOU
                      </span>
                    )}
                    {isResolved && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ PICKED UP & RESOLVED
                      </span>
                    )}
                    {isPending && (
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        PENDING DISPATCH
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-[#0F172A]">{em.reason}</h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {em.address}
                    </span>
                    <span>•</span>
                    <span>Resident: <strong className="text-slate-800">{em.residentName}</strong></span>
                    {em.assignedDriverName && (
                      <>
                        <span>•</span>
                        <span>Driver: <strong className="text-emerald-700">{em.assignedDriverName}</strong> ({em.assignedDriverVehicle || 'Truck'})</span>
                      </>
                    )}
                  </div>

                  {/* Route & ETA Alert when En Route */}
                  {isEnRoute && (
                    <div className="mt-3 bg-amber-100/70 border border-amber-300/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-amber-700 animate-spin" />
                        <span>
                          <strong>Direct vehicle-to-house route broadcasted!</strong> Resident notified with vehicle details and live telemetry.
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold bg-amber-200 px-2.5 py-1 rounded-lg">
                          ETA: ~{em.etaMinutes || 6} Mins
                        </span>
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold underline text-xs"
                        >
                          Turn-by-turn Navigation <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Action 1: Dispatched -> Start Route */}
                  {(isDispatched || isPending) && (
                    <button
                      onClick={() => onStartPickup(em._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Start Route to House (Go to Pickup)
                    </button>
                  )}

                  {/* Action 2: On The Way -> Mark Picked Up */}
                  {isEnRoute && (
                    <>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        View Map
                      </a>
                      <button
                        onClick={() => onCompletePickup(em._id)}
                        className="bg-[#00B074] hover:bg-[#009663] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Picked Up
                      </button>
                    </>
                  )}

                  {/* Action 3: Already Resolved */}
                  {isResolved && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pickup Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
