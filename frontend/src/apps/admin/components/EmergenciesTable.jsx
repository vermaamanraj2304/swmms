import React from 'react';
import { AlertTriangle, Send, CheckCircle2, Navigation, Phone, MapPin, Truck, Trash2, ArrowUpRight } from 'lucide-react';

export default function EmergenciesTable({ emergencies = [], onDispatch, onDelete, onViewAll }) {
  const activeEmergencies = emergencies.filter(e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP');

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                Active Emergency Pickup Requests
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 self-start sm:self-auto shrink-0">
                {emergencies.length <= 1
                  ? (activeEmergencies.length > 0 ? 'Recent Active Request' : (emergencies.length === 0 ? '0' : 'Recent Request'))
                  : `${activeEmergencies.length} Active Requests`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">High-priority household SOS requests requiring rapid driver allocation</p>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition self-start sm:self-auto cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {emergencies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No emergency pickup requests recorded.
            </div>
          ) : (
            emergencies.map(em => {
              const isResolved = em.status === 'RESOLVED' || em.status === 'PICKED_UP';
              const isOnTheWay = em.status === 'ON THE WAY';
              const isDispatched = em.status === 'DISPATCHED';
              const isPending = !isResolved && !isOnTheWay && !isDispatched;

              const driverName = em.assignedDriverName || em.assignedDriver?.name || (typeof em.assignedDriver === 'string' ? em.assignedDriver : null);
              const driverVehicle = em.assignedDriverVehicle || em.assignedDriver?.assignedVehicle || 'Truck';
              const driverPhone = em.assignedDriverPhone || em.assignedDriver?.phone;

              return (
                <div key={em._id || em.customId} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {em.customId || em.reqId || '#REQ'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{em.reason}</h4>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                        {em.garbageType || em.type || 'Garbage'}
                      </span>

                      {/* Status Badges */}
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> RESOLVED / PICKED UP
                        </span>
                      )}
                      {isOnTheWay && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          ON THE WAY (Direct Route Active)
                        </span>
                      )}
                      {isDispatched && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                          DISPATCHED
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                          PENDING DISPATCH
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {em.address}
                      </span>
                      <span>•</span>
                      <span>Resident: <strong className="text-slate-800">{em.residentName}</strong></span>
                      <span>•</span>
                      <span>Weight: <strong className="text-slate-700">{em.estimatedQuantityKg || 10} KG</strong></span>
                      
                      {driverName && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Truck className="w-3 h-3 text-emerald-600" />
                            {driverName} ({driverVehicle})
                          </span>
                        </>
                      )}

                      {isOnTheWay && em.etaMinutes && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">ETA: ~{em.etaMinutes} mins</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    {!isResolved ? (
                      <button 
                        onClick={() => onDispatch(em)}
                        className={`transition-all px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs whitespace-nowrap ${
                          isDispatched || isOnTheWay 
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                            : 'bg-[#00B074] hover:bg-[#009e67] text-white'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" /> 
                        {isDispatched || isOnTheWay ? 'Re-assign Driver' : 'Dispatch Driver'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                        </span>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(em._id, em.customId || em.reqId)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition border border-transparent hover:border-rose-200"
                            title="Delete emergency record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
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
