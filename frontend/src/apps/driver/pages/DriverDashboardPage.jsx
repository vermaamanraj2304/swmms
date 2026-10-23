import React from 'react';
import { Truck, Power, Radio } from 'lucide-react';
import DriverMapCard from '../components/DriverMapCard';
import CollectionLogTable from '../components/CollectionLogTable';
import DriverComplaintsCard from '../components/DriverComplaintsCard';

export default function DriverDashboardPage({ 
  data, 
  isOnDuty = false,
  onToggleDuty,
  setSelectedStop, 
  onStartPickup, 
  onCompletePickup,
  onStartComplaintPickup,
  onCompleteComplaintPickup
}) {
  const driverLat = data?.liveLocation?.lat && data.liveLocation.lat !== 0 ? data.liveLocation.lat : 28.6139;
  const driverLng = data?.liveLocation?.lng && data.liveLocation.lng !== 0 ? data.liveLocation.lng : 77.2090;
  const nextPending = data?.routeStops?.find(s => s.status !== 'PICKED');
  const nextStop = nextPending 
    ? (nextPending.residentName ? `${nextPending.residentName} (${nextPending.address || nextPending.location})` : (nextPending.address || nextPending.location))
    : (data?.routeStops?.length > 0 ? 'All sector houses cleared' : 'Sector Depot Hub');

  return (
    <div className="space-y-6">
      {/* Prominent Shift Duty Controller Banner */}
      <div className={`rounded-3xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isOnDuty 
          ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-500/40' 
          : 'bg-gradient-to-r from-amber-500/10 via-slate-50 to-amber-500/10 border-amber-300/80'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
            isOnDuty ? 'bg-emerald-600' : 'bg-slate-700'
          }`}>
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <h3 className="font-bold text-base text-[#0F172A]">
                {isOnDuty ? 'Shift Active • Broadcasting Live Route GPS' : 'Shift Inactive • Currently Off Duty'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isOnDuty 
                ? `You are on duty in ${data?.activeSector || 'your assigned sector'}. Your live GPS telemetry is streaming to residents in real-time.`
                : `You are clocked off. Residents see your truck stationed at the Base Depot. Click "Start Duty Shift" when ready to begin.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            if (e && e.preventDefault) e.preventDefault();
            if (onToggleDuty) onToggleDuty(e);
          }}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer shrink-0 ${
            isOnDuty 
              ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnDuty ? 'End Duty Shift (Clock Out)' : 'Start Duty Shift (Begin Route)'}</span>
        </button>
      </div>
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ASSIGNED SECTOR</span>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] truncate" title={data?.activeSector || 'Unassigned Sector'}>
            {data?.activeSector || 'Sector Alpha'}
          </h3>
          <span className="text-[11px] sm:text-xs text-emerald-600 font-semibold mt-1 inline-block truncate">
            {data?.assignedVehicle || data?.driver?.assignedVehicle || 'Assigned Truck'}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">HOUSES CLEARED</span>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
            {data?.routeStops?.filter(s => s.status === 'PICKED').length || 0} / {data?.routeStops?.length || 0}
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 inline-block truncate">Assigned household route</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">PAYLOAD WEIGHED</span>
          <h3 className="text-lg sm:text-xl font-bold text-[#00B074]">
            {data?.stats?.totalCollectedKg || 1240} <span className="text-xs text-slate-400 font-normal">KG</span>
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 inline-block truncate">Certified scales</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">DISPATCHED TASKS</span>
          <h3 className="text-lg sm:text-xl font-bold text-amber-600">
            {(data?.assignedComplaints?.length || 0) + (data?.emergencies?.length || 0)}
          </h3>
          <span className="text-[11px] sm:text-xs text-slate-400 mt-1 inline-block truncate">
            {data?.assignedComplaints?.filter(c => (c.status || '').toUpperCase() !== 'RESOLVED').length || 0} Roadside spots
          </span>
        </div>
      </div>

      {/* Assigned Roadside Garbage & Grievance Pickups */}
      <DriverComplaintsCard 
        assignedComplaints={data?.assignedComplaints || []}
        driverLocation={data?.liveLocation}
        onStartPickup={onStartComplaintPickup}
        onCompletePickup={onCompleteComplaintPickup}
      />

      {/* Map & Category Donut Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DriverMapCard 
          lat={driverLat}
          lng={driverLng}
          nextStop={nextStop}
          routeStops={data?.routeStops || []}
          emergencies={data?.emergencies || []}
          assignedArea={data?.assignedArea || data?.serviceArea}
          vehicleName={data?.assignedVehicle || data?.driver?.assignedVehicle || 'Collection Truck'}
          isOnDuty={isOnDuty}
        />

        {/* Load Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-sm text-[#0F172A]">Load Distribution</h4>
            <span className="text-xs text-slate-400">Current route payload</span>
          </div>

          <div className="flex items-center justify-center relative py-4">
            <div className="w-28 h-28 rounded-full border-8 border-emerald-500 border-t-blue-500 flex items-center justify-center">
              <div className="text-center">
                <span className="text-lg font-black text-[#0F172A]">
                  {data?.routeStops?.filter(s => s.status === 'PICKED').length || 0}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">PICKED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Log Table */}
      <CollectionLogTable 
        routeStops={data?.routeStops || []}
        onRecordStop={setSelectedStop}
      />
    </div>
  );
}
