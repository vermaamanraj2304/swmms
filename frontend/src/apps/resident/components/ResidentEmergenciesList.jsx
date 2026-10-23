import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, Navigation, Phone, Truck, MapPin, Trash2 } from 'lucide-react';

export default function ResidentEmergenciesList({ emergencies = [], onTrackRoute, onDelete }) {
  if (!emergencies || emergencies.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            My Emergency Pickup Requests
          </h3>
          <p className="text-xs text-slate-400">
            Real-time status tracking for your dispatched household SOS requests
          </p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          {emergencies.length} Total Requests
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {emergencies.map((em) => {
          const isResolved = em.status === 'RESOLVED' || em.status === 'PICKED_UP';
          const isEnRoute = em.status === 'ON THE WAY';
          const isDispatched = em.status === 'DISPATCHED';
          const isPending = !isResolved && !isEnRoute && !isDispatched;

          return (
            <div 
              key={em._id || em.customId} 
              className={`p-6 transition-colors ${
                isEnRoute 
                  ? 'bg-amber-50/50 border-l-4 border-l-amber-500' 
                  : isDispatched 
                  ? 'bg-blue-50/30 border-l-4 border-l-blue-500' 
                  : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {em.customId || em.reqId || '#REQ-SOS'}
                    </span>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {em.priority || 'High'} Priority
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {em.garbageType || em.type || 'General Organic'} • {em.estimatedQuantityKg || 10} KG
                    </span>

                    {/* Status Badge */}
                    {isResolved && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PICKED UP & RESOLVED
                      </span>
                    )}
                    {isEnRoute && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        DRIVER ON THE WAY (Direct Route Active)
                      </span>
                    )}
                    {isDispatched && (
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                        DRIVER ASSIGNED & DISPATCHED
                      </span>
                    )}
                    {isPending && (
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        PENDING DRIVER ALLOCATION
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-[#0F172A]">{em.reason}</h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {em.address}
                    </span>
                    <span>•</span>
                    <span>Created: {new Date(em.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Driver Details Card when Dispatched or En Route */}
                  {(isDispatched || isEnRoute) && em.assignedDriverName && (
                    <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00B074] flex items-center justify-center border border-emerald-200">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{em.assignedDriverName}</span>
                            <span className="text-[10px] font-normal text-slate-400">({em.assignedDriverVehicle || 'Municipal Truck'})</span>
                          </div>
                          <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                            {em.assignedDriverPhone && (
                              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                <Phone className="w-3 h-3" /> {em.assignedDriverPhone}
                              </span>
                            )}
                            {isEnRoute && em.etaMinutes && (
                              <span className="text-amber-700 font-bold">
                                • Estimated Arrival: ~{em.etaMinutes} Mins
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEnRoute && onTrackRoute && (
                        <button
                          onClick={onTrackRoute}
                          className="bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 animate-pulse" />
                          Track Direct Route to House
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                  {isResolved && (
                    <button
                      type="button"
                      onClick={() => onDelete && onDelete(em._id, em.customId || em.reqId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200/80 transition-all shadow-2xs hover:shadow-xs whitespace-nowrap"
                      title="Delete completed emergency request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Record</span>
                    </button>
                  )}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => onDelete && onDelete(em._id, em.customId || em.reqId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition whitespace-nowrap"
                      title="Cancel emergency request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
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
