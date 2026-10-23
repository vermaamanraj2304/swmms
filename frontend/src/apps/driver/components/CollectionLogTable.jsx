import React from 'react';
import { Home, Phone, CheckCircle2, Clock, Scale } from 'lucide-react';

export default function CollectionLogTable({
  routeStops = [],
  onRecordStop
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-base font-bold text-[#0F172A]">Assigned Household Collection Roster</h3>
          </div>
          <span className="text-xs text-slate-400">
            Real-time house-by-house pickup registry for your assigned sector
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            {routeStops.filter(s => s.status === 'PICKED').length} / {routeStops.length} Houses Cleared
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5">HOUSE #</th>
              <th className="px-6 py-3.5">RESIDENT & ADDRESS</th>
              <th className="px-6 py-3.5">CONTACT</th>
              <th className="px-6 py-3.5">BIN CATEGORY</th>
              <th className="px-6 py-3.5">STATUS</th>
              <th className="px-6 py-3.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routeStops && routeStops.length > 0 ? (
              routeStops.map((stop, idx) => {
                const displayName = stop.residentName || `Household Stop #${idx + 1}`;
                const displayAddr = stop.address || stop.location || 'Assigned Sector House';
                const isCleared = stop.status === 'PICKED';

                return (
                  <tr key={stop.id || stop._id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-500">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg mt-0.5 ${isCleared ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          <Home className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{displayName}</span>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{displayAddr}</span>
                          {stop.notes && stop.notes !== displayName && (
                            <span className="text-[10px] text-slate-400 block mt-0.5 italic">{stop.notes}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {stop.residentPhone ? (
                        <a 
                          href={`tel:${stop.residentPhone}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-semibold"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{stop.residentPhone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unlisted</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700 block">{stop.binType || 'General Waste'}</span>
                      <span className="text-[10px] text-slate-400">{stop.type || 'Residential'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isCleared ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PICKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" /> PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onRecordStop({ 
                          id: stop.id || stop._id || idx, 
                          location: displayAddr, 
                          residentId: stop.residentId,
                          residentName: displayName 
                        })}
                        className="inline-flex items-center gap-1.5 bg-[#0066FF] hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Record Weight</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Home className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-600 text-xs">No household stops assigned to your route yet.</p>
                    <p className="text-[11px] text-slate-400">Once Admin allocates your vehicle to a sector, resident homes will appear here in sequence.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
