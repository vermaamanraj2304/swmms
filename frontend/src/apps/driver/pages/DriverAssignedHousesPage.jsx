import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Scale, 
  Search, 
  Filter, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DriverAssignedHousesPage({
  data,
  onRecordStop
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'PICKED'

  const sectorName = data?.activeSector || data?.driver?.activeSector || 'Assigned Sector';
  const vehicleName = data?.assignedVehicle || data?.driver?.assignedVehicle || 'Assigned Truck';
  const routeStops = data?.routeStops || [];

  const filteredStops = useMemo(() => {
    return routeStops.filter(stop => {
      const matchesSearch = !searchQuery || 
        (stop.residentName && stop.residentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (stop.address && stop.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (stop.customId && stop.customId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PICKED' && stop.status === 'PICKED') ||
        (statusFilter === 'PENDING' && stop.status !== 'PICKED');

      return matchesSearch && matchesStatus;
    });
  }, [routeStops, searchQuery, statusFilter]);

  const totalCount = routeStops.length;
  const pickedCount = routeStops.filter(s => s.status === 'PICKED').length;
  const pendingCount = totalCount - pickedCount;
  const completionPercent = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Sector Header & Key Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00B074] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              ASSIGNED SECTOR HOUSE COLLECTION ROSTER
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Home className="w-7 h-7 text-[#00B074]" />
            <span>{sectorName}</span>
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned Collection Vehicle: <strong className="text-white">{vehicleName}</strong></span>
            <span>•</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Sector Isolation Active</span>
          </p>
        </div>

        {/* Progress Metric Ring & Badges */}
        <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">PROGRESS</span>
            <div className="text-xl font-black text-white">{pickedCount} / {totalCount}</div>
            <span className="text-[11px] text-emerald-400 font-bold">{completionPercent}% Complete</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-700 border-t-[#00B074] flex items-center justify-center font-bold text-xs text-white">
            {completionPercent}%
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TOTAL ASSIGNED HOUSES</span>
          <h3 className="text-2xl font-black text-[#0F172A]">{totalCount}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Designated households in {sectorName}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">PICKED UP / CLEARED</span>
          <h3 className="text-2xl font-black text-emerald-600">{pickedCount}</h3>
          <span className="text-xs text-emerald-600/80 font-semibold mt-1 inline-block">Waste weighed & points credited</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block mb-1">PENDING PICKUPS</span>
          <h3 className="text-2xl font-black text-amber-600">{pendingCount}</h3>
          <span className="text-xs text-amber-600/80 font-semibold mt-1 inline-block">Awaiting curbside collection</span>
        </div>
      </div>

      {/* Controls: Search & Status Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search house by resident name, address, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00B074]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('PICKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === 'PICKED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Picked ({pickedCount})
          </button>
        </div>
      </div>

      {/* Household Cards Grid */}
      {filteredStops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStops.map((stop, idx) => {
            const isPicked = stop.status === 'PICKED';
            const displayName = stop.residentName || `Household Stop #${idx + 1}`;
            const displayAddr = stop.address || stop.location || `${sectorName} Household`;

            return (
              <div
                key={stop.id || stop._id || idx}
                className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between shadow-xs ${
                  isPicked 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-[#00B074] hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Stop Index & Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      House #{stop.customId || String(idx + 1).padStart(2, '0')}
                    </span>
                    {isPicked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PICKED UP
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> PENDING PICKUP
                      </span>
                    )}
                  </div>

                  {/* Resident Info & Address */}
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <Home className={`w-4 h-4 ${isPicked ? 'text-emerald-600' : 'text-[#00B074]'}`} />
                      <span>{displayName}</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{displayAddr}</span>
                    </p>
                  </div>

                  {/* Contact & Bin Category */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">BIN STREAM</span>
                      <span className="font-bold text-slate-700">{stop.binType || 'General Waste'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">CONTACT</span>
                      {stop.residentPhone ? (
                        <a
                          href={`tel:${stop.residentPhone}`}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {stop.residentPhone}
                        </a>
                      ) : (
                        <span className="text-slate-400">Unlisted</span>
                      )}
                    </div>
                  </div>

                  {stop.notes && (
                    <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-600 border border-slate-100 italic">
                      {stop.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Action: Weigh / Update Status */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  {isPicked ? (
                    <div className="w-full py-2.5 bg-emerald-100/70 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Collection Cleared & Points Credited</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRecordStop({
                        id: stop.id || stop._id || idx,
                        residentId: stop.residentId,
                        residentName: displayName,
                        location: displayAddr,
                        binType: stop.binType || 'Organic'
                      })}
                      className="w-full py-2.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Weigh & Mark Picked Up</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">No Assigned Households Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery 
              ? `No houses matched the query "${searchQuery}". Try clearing search filters.` 
              : `There are currently no households registered under ${sectorName}.`}
          </p>
        </div>
      )}
    </div>
  );
}
