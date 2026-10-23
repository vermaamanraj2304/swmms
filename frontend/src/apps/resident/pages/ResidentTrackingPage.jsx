import React from 'react';
import { 
  Truck, 
  Map, 
  RefreshCw, 
  ExternalLink, 
  Navigation, 
  Radio, 
  Gauge, 
  CheckCircle2, 
  Clock, 
  Phone, 
  AlertTriangle,
  Volume2
} from 'lucide-react';
import ResidentLiveTrackingMap from '../components/ResidentLiveTrackingMap';
import { soundManager } from '../../../utils/audioAlerts';

export default function ResidentTrackingPage({ data, fetchDashboard, showToast, setActiveTab }) {
  const isEmergencyActive = Boolean(
    data?.assignedDriver?.isEmergencyDispatch || 
    data?.activeEmergency || 
    data?.emergencyRequests?.some(e => e.status === 'ON THE WAY' || e.status === 'DISPATCHED')
  );
  const emergencyItem = data?.activeEmergency || data?.emergencyRequests?.find(e => e.status === 'ON THE WAY' || e.status === 'DISPATCHED');
  const isEnRoute = emergencyItem?.status === 'ON THE WAY' || data?.assignedDriver?.emergencyStatus === 'ON THE WAY';

  const driverLoc = data?.assignedDriver?.liveLocation || emergencyItem?.driverLiveLocation;
  const hasValidCoords = driverLoc && typeof driverLoc.lat === 'number' && typeof driverLoc.lng === 'number' && (driverLoc.lat !== 0 || driverLoc.lng !== 0);
  const truckLat = hasValidCoords ? Number(driverLoc.lat) : 28.6139;
  const truckLng = hasValidCoords ? Number(driverLoc.lng) : 77.2090;
  const truckSpeed = driverLoc?.speedKm || 28;
  const driverName = data?.assignedDriver?.name || emergencyItem?.assignedDriverName || 'Assigned Municipal Driver';
  const vehicleName = data?.assignedDriver?.van || emergencyItem?.assignedDriverVehicle || 'Waste Collection Truck';
  const driverPhone = data?.assignedDriver?.phone || emergencyItem?.assignedDriverPhone || '+1 (555) 019-2834';
  const targetAddress = emergencyItem?.address || data?.resident?.address || data?.resident?.houseLocation?.address || 'Resident Household';
  const activeSector = data?.assignedDriver?.route || (isEmergencyActive ? `Emergency: ${targetAddress}` : 'Sector Beta / Greenfield');
  const etaMinutes = data?.assignedDriver?.etaMinutes || emergencyItem?.etaMinutes || 6;

  const isOnDuty = Boolean(data?.assignedDriver?.isOnDuty) || isEmergencyActive;


  return (
    <div className="space-y-6">
      {/* Off-Duty Status Banner if Driver is not on duty */}
      {!isOnDuty && (
        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <h4 className="font-bold text-xs text-slate-800">Assigned Driver ({driverName}) is Currently Off Duty</h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Displaying your property location and route sector. Live GPS coordinates will stream in real-time as soon as the driver checks in.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchDashboard();
              showToast('Checking driver shift status...', 'info');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-200 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>
      )}
      {/* Emergency Active Banner */}
      {isEmergencyActive && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black shadow-sm shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Emergency Dispatch {emergencyItem?.customId || emergencyItem?.reqId || '#REQ-SOS'}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {isEnRoute ? '🚚 Driver En Route to House' : 'Driver Dispatched'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mt-1.5">
                {isEnRoute 
                  ? `Driver ${driverName} is coming directly to your house in ${vehicleName}!` 
                  : `Driver ${driverName} (${vehicleName}) is assigned and preparing for emergency collection.`}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Direct vehicle-to-house route active • Destination: <strong className="text-slate-900">{targetAddress}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${driverPhone}`}
              onClick={() => showToast(`Calling driver: ${driverPhone}`, 'info')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" /> Call Driver ({driverPhone})
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {isEmergencyActive ? 'EMERGENCY DIRECT ROUTE TELEMETRY' : isOnDuty ? 'REAL-TIME GPS TELEMETRY' : 'PROPERTY LOCATION RADAR'}
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A]">
            {isEmergencyActive ? 'Emergency Vehicle-to-House Live Navigation' : isOnDuty ? 'Garbage Truck Live GPS Tracking' : 'Property Location & Route Radar'}
          </h2>
          <p className="text-xs text-slate-400">
            {isEmergencyActive 
              ? `Direct telemetry broadcast from vehicle to ${targetAddress}. ETA: ~${etaMinutes} mins.`
              : isOnDuty
                ? `Live route telemetry and proximity indicator for ${targetAddress}.`
                : `Driver telemetry offline while off-duty. Centered on your household at ${targetAddress}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            isEmergencyActive 
              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
              : isOnDuty
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isEmergencyActive ? 'bg-amber-500 animate-pulse' : isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}></span>
            {isEmergencyActive ? 'Direct Route Stream Synced' : isOnDuty ? 'Live GPS Connected' : 'Driver Off Duty • Standby'}
          </span>
        </div>
      </div>

      {/* Interactive Live Telemetry Map with Vehicle Logo & Resident Logo */}
      <ResidentLiveTrackingMap
        driverLocation={driverLoc}
        registeredLocation={data?.assignedDriver?.registeredLocation}
        residentLocation={data?.resident?.houseLocation || data?.houseLocation || data?.resident}
        driverName={driverName}
        vehicleName={vehicleName}
        residentName={data?.resident?.name || 'My Household'}
        residentAddress={targetAddress}
        activeSector={activeSector}
        isEmergency={isEmergencyActive}
        isOnDuty={isOnDuty}
        etaMinutes={etaMinutes}
        height="520px"
      />

      {/* Sub-panel: Today's Household Pickup Status & Progress */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              HOUSEHOLD ROUTINE COLLECTION STATUS
            </span>
            <h4 className="font-bold text-base text-white mt-0.5">
              Curbside Waste Pickup for {targetAddress}
            </h4>
          </div>
          <span className={`text-xs px-3.5 py-1.5 rounded-full font-black inline-flex items-center gap-1.5 self-start sm:self-auto ${
            (data?.todayPickupStatus === 'PICKED UP' || Boolean(data?.todayCollection))
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {(data?.todayPickupStatus === 'PICKED UP' || Boolean(data?.todayCollection)) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{(data?.todayPickupStatus === 'PICKED UP' || Boolean(data?.todayCollection)) ? 'PICKED UP TODAY' : 'PENDING COLLECTION'}</span>
          </span>
        </div>

        {(data?.todayPickupStatus === 'PICKED UP' || Boolean(data?.todayCollection)) ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">COLLECTED WEIGHT</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {data?.todayCollection?.weightKg ?? data?.lastPickup?.weightKg ?? 0} kg
              </div>
              <span className="text-xs text-slate-300 font-medium">
                {data?.todayCollection?.type || data?.lastPickup?.wasteType || 'General'} Waste
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">POINTS CREDITED</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                +{data?.todayCollection?.pointsEarned ?? data?.lastPickup?.pointsEarned ?? 0} PTS
              </div>
              <span className="text-xs text-slate-300 font-medium">Added to Resident Wallet</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">PICKUP LOG</span>
              <div className="text-sm font-bold text-white mt-1">
                Cleared at {data?.lastPickup?.time || 'Today'}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                By {data?.todayCollection?.driver || driverName}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">ASSIGNED VEHICLE</span>
              <p className="font-bold text-white text-sm">{vehicleName}</p>
              <span className="text-slate-400">Designated Sector Truck</span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">DRIVER SHIFT</span>
              <p className="font-bold text-white text-sm">{isOnDuty ? 'Active on Sector Route' : 'Standby at Base Depot'}</p>
              <span className={isOnDuty ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isOnDuty ? '● Live GPS Broadcasting' : '○ Standby Depot'}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">DOORSTEP SIREN ALERT</span>
              <p className="font-bold text-amber-300 text-sm">Automated Audio Alarm</p>
              <span className="text-slate-400 text-xs block">Triggers siren on device when truck reaches &lt;80m</span>
              <button
                type="button"
                onClick={() => {
                  soundManager.playDoorstepSiren(4);
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🔊 Test Siren Sound</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Driver Contact & Emergency Notice Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={data?.assignedDriver?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"} 
              alt="Driver" 
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <h4 className="font-bold text-sm text-[#0F172A]">{driverName}</h4>
              <p className="text-xs text-slate-400">Assigned Driver • {vehicleName}</p>
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                isOnDuty ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {isOnDuty ? 'On Duty & Dispatched' : 'Off Duty • Stationed at Base Depot'}
              </span>
            </div>
          </div>
          {driverPhone ? (
            <a 
              href={`tel:${driverPhone}`}
              className="flex items-center gap-2 bg-[#E6F7F2] text-[#00B074] hover:bg-[#d5f4eb] px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Call ({driverPhone})
            </a>
          ) : (
            <button 
              onClick={() => showToast('Calling driver dispatch hotline...', 'info')}
              className="flex items-center gap-2 bg-[#E6F7F2] text-[#00B074] hover:bg-[#d5f4eb] px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Phone className="w-4 h-4" /> Call Driver
            </button>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-[#0F172A]">Need Urgent Bin Clearance?</h4>
            <p className="text-xs text-slate-400 mt-0.5">Request an on-demand immediate pickup if your bin is overflowing.</p>
          </div>
          <button 
            onClick={() => setActiveTab('emergency')}
            className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" /> Request SOS
          </button>
        </div>
      </div>
    </div>
  );
}
