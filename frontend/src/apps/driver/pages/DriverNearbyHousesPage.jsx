import React, { useMemo } from 'react';
import { 
  Navigation, 
  MapPin, 
  Scale, 
  CheckCircle2, 
  Clock, 
  Phone, 
  AlertTriangle, 
  Home, 
  ExternalLink, 
  Radio, 
  ShieldCheck,
  Compass
} from 'lucide-react';

// Haversine distance calculator in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function DriverNearbyHousesPage({
  data,
  driverLocation,
  onRecordStop
}) {
  const curLat = Number(driverLocation?.lat || data?.liveLocation?.lat || 28.4848);
  const curLng = Number(driverLocation?.lng || data?.liveLocation?.lng || 77.5135);
  const sectorName = data?.activeSector || data?.driver?.activeSector || 'Assigned Zone';
  const routeStops = data?.routeStops || [];

  // Compute live distance and sort closest first
  const housesWithProximity = useMemo(() => {
    return routeStops.map(stop => {
      const stopLat = Number(stop.lat);
      const stopLng = Number(stop.lng);
      const distanceMeters = (!isNaN(stopLat) && !isNaN(stopLng) && stopLat !== 0 && stopLng !== 0)
        ? getDistanceMeters(curLat, curLng, stopLat, stopLng)
        : 99999;

      const isAtDoorstep = distanceMeters <= 80;
      const isNearby = distanceMeters <= 500;

      return {
        ...stop,
        distanceMeters,
        isAtDoorstep,
        isNearby,
        formattedDistance: distanceMeters < 1000 
          ? `${distanceMeters}m away` 
          : `${(distanceMeters / 1000).toFixed(2)} km away`
      };
    }).sort((a, b) => {
      // Pending first, then by closest distance
      if (a.status === 'PICKED' && b.status !== 'PICKED') return 1;
      if (a.status !== 'PICKED' && b.status === 'PICKED') return -1;
      return a.distanceMeters - b.distanceMeters;
    });
  }, [routeStops, curLat, curLng]);

  const nearbyHouses = housesWithProximity.filter(h => h.isNearby && h.status !== 'PICKED');
  const doorstepHouses = housesWithProximity.filter(h => h.isAtDoorstep && h.status !== 'PICKED');

  return (
    <div className="space-y-6">
      {/* Live Proximity Radar Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-6 border border-emerald-900/40 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              LIVE PROXIMITY GPS RADAR
            </span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Navigation className="w-7 h-7 text-[#00B074]" />
            <span>Nearby Assigned Households</span>
          </h2>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Tracking: <strong className="text-emerald-300">{curLat.toFixed(5)}, {curLng.toFixed(5)}</strong></span>
            <span>•</span>
            <span>Sector: <strong className="text-white">{sectorName}</strong></span>
          </p>
        </div>

        {/* Live Radar Counter */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl shrink-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">WITHIN 500M RADAR</span>
            <div className="text-xl font-black text-white">
              {nearbyHouses.length} <span className="text-xs text-emerald-400 font-semibold">Households Near</span>
            </div>
            {doorstepHouses.length > 0 && (
              <span className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1 animate-pulse">
                🚨 {doorstepHouses.length} at doorstep!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Proximity Summary Notice */}
      {doorstepHouses.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-rose-900">
                🚨 Truck At Resident Doorstep ({doorstepHouses[0].residentName || 'Household'})
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Distance: ~{doorstepHouses[0].distanceMeters}m. Doorstep arrival siren has been triggered on resident's device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRecordStop({
              id: doorstepHouses[0].id || doorstepHouses[0]._id,
              residentId: doorstepHouses[0].residentId,
              residentName: doorstepHouses[0].residentName,
              location: doorstepHouses[0].address || doorstepHouses[0].location,
              binType: doorstepHouses[0].binType || 'Organic'
            })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Weigh Doorstep Pickup</span>
          </button>
        </div>
      )}

      {/* Nearby Household List (Sorted by distance) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <span>Dynamic Curbside Queue (Closest First)</span>
            <span className="text-xs font-normal text-slate-400">• Updates with truck movement</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {housesWithProximity.length} Total Route Houses
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {housesWithProximity.map((stop, idx) => {
            const isPicked = stop.status === 'PICKED';
            const displayName = stop.residentName || `Household #${idx + 1}`;
            const displayAddr = stop.address || stop.location || `${sectorName} Household`;

            let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
            let badgeText = stop.formattedDistance;

            if (isPicked) {
              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              badgeText = '✓ Picked Up';
            } else if (stop.isAtDoorstep) {
              badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
              badgeText = `🚨 At Doorstep (${stop.distanceMeters}m)`;
            } else if (stop.isNearby) {
              badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              badgeText = `🔔 Nearby (${stop.distanceMeters}m)`;
            }

            const directionsUrl = stop.lat && stop.lng
              ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${curLat}%2C${curLng}%3B${stop.lat}%2C${stop.lng}`
              : `https://www.openstreetmap.org/#map=16/${curLat}/${curLng}`;

            return (
              <div
                key={stop.id || stop._id || idx}
                className={`bg-white rounded-2xl border p-4.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  stop.isAtDoorstep && !isPicked
                    ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/20'
                    : stop.isNearby && !isPicked
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Info: Distance Badge + Resident Details */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-20 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border text-center w-full ${badgeStyle}`}>
                      {badgeText}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400 mt-1">
                      #{stop.customId || String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                      <Home className="w-4 h-4 text-slate-500" />
                      <span>{displayName}</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{displayAddr}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[11px] pt-1">
                      <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                        Bin: {stop.binType || 'Organic'}
                      </span>
                      {stop.residentPhone && (
                        <a 
                          href={`tel:${stop.residentPhone}`} 
                          className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {stop.residentPhone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Record Weight & Directions */}
                <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Open OpenStreetMap Directions"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Directions</span>
                  </a>

                  {isPicked ? (
                    <div className="px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Picked Up</span>
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
                      className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                        stop.isAtDoorstep 
                          ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' 
                          : 'bg-[#00B074] hover:bg-[#009663]'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Weigh & Mark Picked</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
