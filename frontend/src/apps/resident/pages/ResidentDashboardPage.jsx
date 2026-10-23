import React from 'react';
import { PlusCircle, ExternalLink, Phone, Truck, CheckCircle2, Clock, Sparkles, Scale, Receipt, Gift } from 'lucide-react';
import ResidentLiveTrackingMap from '../components/ResidentLiveTrackingMap';

export default function ResidentDashboardPage({ data, setActiveTab }) {
  const isPickedUp = data?.todayPickupStatus === 'PICKED UP' || Boolean(data?.todayCollection);
  const todayWeight = data?.todayCollection?.weightKg ?? data?.lastPickup?.weightKg;
  const todayPoints = data?.todayCollection?.pointsEarned ?? data?.lastPickup?.pointsEarned;
  const todayType = data?.todayCollection?.type || data?.lastPickup?.wasteType || 'Organic';
  const pickupTime = data?.lastPickup?.time || 'Today';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400">
            Welcome back, {data?.resident?.name || 'Resident'}
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A]">Waste & Recycling Overview</h2>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {data?.resident?.address || 'Greenfield District'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('emergency')}
            className="w-full sm:w-auto bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Request Extra Pickup
          </button>
        </div>
      </div>
      
      {/* 3 Overview Cards: Eco-Balance, Today's Pickup Status, and Assigned Driver */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Eco-Balance Score */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-[#E6F7F2] text-[#00B074] px-3 py-1 rounded-full text-xs font-semibold">
                Eco-Balance Score
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +{data?.garbagePoints || 0} Points
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">{data?.divertedWasteKg || 0}</span>
              <span className="text-base sm:text-lg font-bold text-slate-400">kg diverted</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Total household waste diverted from landfills for <strong className="text-[#00B074]">{data?.resident?.address || 'Greenfield District'}</strong>.
            </p>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <button 
              onClick={() => setActiveTab('points-history')}
              className="text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Points and Reward ➔
            </button>
            <button 
              onClick={() => setActiveTab('rewards')}
              className="text-[#00B074] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" /> Redeem Gifts ({data?.garbagePoints || 0} PTS)
            </button>
          </div>
        </div>

        {/* Card 2: Today's Routine Pickup Status */}
        {isPickedUp ? (
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 rounded-2xl p-6 border-2 border-emerald-300 flex flex-col justify-between shadow-sm animate-in fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  TODAY'S PICKUP STATUS
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PICKED UP
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700">{todayWeight || 0}</span>
                  <span className="text-sm font-bold text-slate-500">kg of {todayType}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    +{todayPoints || 0} Points Credited
                  </span>
                  <span className="text-[11px] text-slate-500">at {pickupTime}</span>
                </div>
              </div>
              <p className="text-xs text-emerald-950 font-medium pt-1">
                Curbside waste collected by driver <strong>{data?.todayCollection?.driver || data?.assignedDriver?.name || 'Municipal Driver'}</strong>.
              </p>
            </div>
            <div className="pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              ✓ Household collection verified & signed off
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  TODAY'S PICKUP STATUS
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> PENDING PICKUP
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Scheduled Municipal Stop</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Collection truck is assigned for routine curbside pickup in <strong>{data?.resident?.sector || 'your sector'}</strong>.
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                💡 <span className="font-semibold text-slate-700">Curbside Tip:</span> Please place segregated organic & recyclable bins outside before driver arrives.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Driver Status:</span>
              <span className={`font-bold ${data?.assignedDriver?.isOnDuty ? 'text-emerald-600' : 'text-slate-500'}`}>
                {data?.assignedDriver?.isOnDuty ? '● Live on Route' : '○ Standby / Depot'}
              </span>
            </div>
          </div>
        )}

        {/* Card 3: Assigned Sector Driver */}

        {data?.assignedDriver?.name && data.assignedDriver.name !== 'Unassigned' ? (
          data?.assignedDriver?.isOnDuty ? (
            <div className="bg-[#009663] text-white rounded-2xl p-6 flex flex-col justify-between shadow-md animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-200">ASSIGNED SECTOR DRIVER</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#009663] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live On Duty
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-lg shrink-0">
                    {data.assignedDriver.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{data.assignedDriver.name}</h3>
                    <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{data.assignedDriver.van || data.assignedDriver.vehicle || 'Assigned Truck'}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-100 pt-1">
                  Active in <strong>{data.assignedDriver.route || data.resident?.sector || 'Your Sector'}</strong>.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                {data.assignedDriver.phone && (
                  <a
                    href={`tel:${data.assignedDriver.phone}`}
                    className="w-full bg-white/15 hover:bg-white/25 border border-white/30 text-white py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Driver ({data.assignedDriver.phone})
                  </a>
                )}
                <button 
                  onClick={() => setActiveTab('tracking')}
                  className="w-full bg-white text-[#009663] py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-50 transition shadow-sm cursor-pointer"
                >
                  Track Live Telemetry
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">ASSIGNED SECTOR DRIVER</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Standby / Off Duty
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-lg shrink-0">
                    {data.assignedDriver.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{data.assignedDriver.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{data.assignedDriver.van || data.assignedDriver.vehicle || 'Assigned Truck'}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Designated collector for <strong>{data.assignedDriver.route || data.resident?.sector || 'Your Sector'}</strong>. Shift starts 08:00 AM.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                {data.assignedDriver.phone && (
                  <a
                    href={`tel:${data.assignedDriver.phone}`}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Dispatch Contact: {data.assignedDriver.phone}
                  </a>
                )}
                <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold text-center border border-emerald-100">
                  ✓ Designated Household Coverage Active
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">SECTOR ASSIGNMENT</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></span>
                <h3 className="text-base font-bold text-slate-700">Dispatch Queueing</h3>
              </div>
              <p className="text-xs text-slate-500">
                Municipal Admin is allocating a dedicated collection driver and vehicle for {data?.resident?.sector || 'your area'}.
              </p>
            </div>
            <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-medium flex items-center justify-between">
              <span>Next Routine Route</span>
              <span className="font-semibold text-slate-700">Daily 08:00 AM</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Route & Collection Leaflet Radar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              {data?.assignedDriver?.isOnDuty ? 'REAL-TIME GPS TELEMETRY' : 'PROPERTY RADAR • DRIVER OFF DUTY'}
            </span>
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${data?.assignedDriver?.isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {data?.assignedDriver?.isOnDuty ? 'Live Waste Collection Vehicle Radar' : 'Household Waste Collection Radar'}
            </h3>
            <p className="text-xs text-slate-400">
              {data?.assignedDriver?.isOnDuty
                ? 'Interactive Leaflet satellite tracking of your sector collection truck and household coordinates.'
                : 'Driver is off duty. Telemetry is paused and centered on your household coordinates.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('tracking')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00B074] hover:text-[#009663] bg-[#E6F7F2] hover:bg-[#d5f3eb] px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <span>Full Radar View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <ResidentLiveTrackingMap
          driverLocation={data?.assignedDriver?.liveLocation}
          registeredLocation={data?.assignedDriver?.registeredLocation}
          residentLocation={data?.resident?.houseLocation || data?.houseLocation}
          residentAddress={data?.resident?.address || data?.resident?.houseLocation?.address || ''}
          residentName={data?.resident?.name || 'Resident Home'}
          vehicleName={data?.assignedDriver?.van || 'Collection Truck'}
          driverName={data?.assignedDriver?.name}
          activeSector={data?.assignedDriver?.route || data?.resident?.sector}
          isOnDuty={Boolean(data?.assignedDriver?.isOnDuty)}
          isEmergency={false}
          height="400px"
        />
      </div>
    </div>
  );
}
