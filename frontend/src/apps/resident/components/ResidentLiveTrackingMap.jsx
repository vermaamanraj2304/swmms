import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Home, Navigation, Gauge, Clock, ExternalLink, RefreshCw, Radio, Crosshair, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  createVehicleIcon, 
  createResidentIcon, 
  createDepotIcon,
  calculateDistanceKm, 
  calculateEtaMinutes,
  MapResizeHandler 
} from '../../../components/MapCustomIcons.js';

// Auto-fit map viewport to show both the Driver Vehicle and Resident Home on initial load
function MapFitBoundsHandler({ vehicleCoords, residentCoords, triggerFit, isOnDuty }) {
  const map = useMap();
  const hasFitInitially = useRef(false);

  useEffect(() => {
    if (!map) return;

    // When driver is OFF DUTY: strictly focus only on resident location!
    if (!isOnDuty) {
      if (residentCoords && Array.isArray(residentCoords) && !isNaN(residentCoords[0]) && !isNaN(residentCoords[1])) {
        try {
          map.setView([Number(residentCoords[0]), Number(residentCoords[1])], 16, { animate: hasFitInitially.current });
          hasFitInitially.current = true;
        } catch (err) {
          console.warn('Map setView notice:', err);
        }
      }
      return;
    }

    // When driver is ON DUTY: fit bounds between vehicle and resident
    if (!vehicleCoords) return;
    const vLat = Number(vehicleCoords[0]);
    const vLng = Number(vehicleCoords[1]);
    if (isNaN(vLat) || isNaN(vLng)) return;

    if (!hasFitInitially.current || triggerFit) {
      if (residentCoords && Array.isArray(residentCoords) && !isNaN(residentCoords[0]) && !isNaN(residentCoords[1])) {
        const bounds = L.latLngBounds([
          [vLat, vLng],
          [Number(residentCoords[0]), Number(residentCoords[1])]
        ]);
        try {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          hasFitInitially.current = true;
        } catch (err) {
          console.warn('Map fitBounds notice:', err);
        }
      } else {
        try {
          map.setView([vLat, vLng], map.getZoom() || 15);
          hasFitInitially.current = true;
        } catch (err) {
          console.warn('Map setView notice:', err);
        }
      }
    }
  }, [vehicleCoords, residentCoords, map, triggerFit, isOnDuty]);

  return null;
}

// Controller to smoothly pan to target coords
function MapCenterController({ centerTarget, zoomLevel = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (!centerTarget || !map) return;
    try {
      map.setView(centerTarget, zoomLevel, { animate: true });
    } catch (err) {
      console.warn('Map setView notice:', err);
    }
  }, [centerTarget, zoomLevel, map]);

  return null;
}

export default function ResidentLiveTrackingMap({
  driverLocation,
  registeredLocation = null,
  residentLocation,
  driverName = 'Fleet Operator',
  vehicleName = 'Collection Truck',
  residentName = 'My Household',
  residentAddress = 'Greenfield Sector',
  activeSector = 'Sector Alpha',
  isEmergency = false,
  isOnDuty = true,
  etaMinutes: customEta,
  height = '500px'
}) {
  const [triggerFitCount, setTriggerFitCount] = useState(0);
  const [panTarget, setPanTarget] = useState(null);
  const [isHudMinimized, setIsHudMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 && !isOnDuty;
    }
    return false;
  });

  // When driver is on duty, track live location. When off duty, do not use driver location for the map!
  const dLat = Number(driverLocation?.lat !== undefined ? driverLocation.lat : driverLocation?.location?.lat);
  const dLng = Number(driverLocation?.lng !== undefined ? driverLocation.lng : driverLocation?.location?.lng);
  const hasValidDriverCoords = !isNaN(dLat) && !isNaN(dLng) && (dLat !== 0 || dLng !== 0);

  const vehicleCoords = useMemo(() => {
    return hasValidDriverCoords ? [dLat, dLng] : [28.4848, 77.5135];
  }, [dLat, dLng, hasValidDriverCoords]);

  // Normalize Resident Coordinates
  const rLat = Number(residentLocation?.lat !== undefined ? residentLocation.lat : residentLocation?.houseLocation?.lat);
  const rLng = Number(residentLocation?.lng !== undefined ? residentLocation.lng : residentLocation?.houseLocation?.lng);
  const hasValidResidentCoords = !isNaN(rLat) && !isNaN(rLng) && (rLat !== 0 || rLng !== 0);

  const residentCoords = useMemo(() => {
    if (hasValidResidentCoords) return [rLat, rLng];
    return null;
  }, [rLat, rLng, hasValidResidentCoords]);

  // Initial map center: if off duty, residentCoords is the sole primary focus
  const initialCenter = useMemo(() => {
    if (!isOnDuty && residentCoords) {
      return residentCoords;
    }
    if (isOnDuty && hasValidDriverCoords) {
      return vehicleCoords;
    }
    return residentCoords || [28.6139, 77.2090];
  }, [isOnDuty, residentCoords, hasValidDriverCoords, vehicleCoords]);

  // Real-time calculations (only computed when driver is on duty)
  const distanceKm = useMemo(() => {
    if (!isOnDuty || !residentCoords || !hasValidDriverCoords) return null;
    return calculateDistanceKm(vehicleCoords[0], vehicleCoords[1], residentCoords[0], residentCoords[1]);
  }, [isOnDuty, vehicleCoords, residentCoords, hasValidDriverCoords]);

  const liveEta = useMemo(() => {
    if (!isOnDuty) return null;
    if (!distanceKm) return customEta || 8;
    return customEta || calculateEtaMinutes(distanceKm, driverLocation?.speedKm || 22);
  }, [isOnDuty, distanceKm, customEta, driverLocation?.speedKm]);

  // Route path coordinates between Vehicle and Resident (only rendered when driver is on duty)
  const routePolyline = useMemo(() => {
    if (!isOnDuty || !residentCoords || !hasValidDriverCoords) return null;
    return [vehicleCoords, residentCoords];
  }, [isOnDuty, vehicleCoords, residentCoords, hasValidDriverCoords]);

  // Custom Markers
  const vehicleIcon = useMemo(() => {
    return createVehicleIcon({
      label: vehicleName || 'Truck Unit',
      isEmergency,
      isOffDuty: false
    });
  }, [vehicleName, isEmergency]);

  const residentIcon = useMemo(() => {
    return createResidentIcon({
      label: residentName || 'Resident Home',
      isSelf: true,
      isEmergency
    });
  }, [residentName, isEmergency]);

  const navigationDirectionsUrl = (isOnDuty && residentCoords && hasValidDriverCoords)
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${vehicleCoords[0]}%2C${vehicleCoords[1]}%3B${residentCoords[0]}%2C${residentCoords[1]}`
    : (residentCoords 
        ? `https://www.openstreetmap.org/?mlat=${residentCoords[0]}&mlon=${residentCoords[1]}#map=16/${residentCoords[0]}/${residentCoords[1]}`
        : `https://www.openstreetmap.org/#map=15/${vehicleCoords[0]}/${vehicleCoords[1]}`);

  const handleRecenterHome = () => {
    if (residentCoords) {
      setPanTarget({ coords: residentCoords, zoom: 16, key: Date.now() });
    }
  };

  const handleRecenterTruck = () => {
    if (isOnDuty && hasValidDriverCoords) {
      setPanTarget({ coords: vehicleCoords, zoom: 15, key: Date.now() });
    }
  };

  const handleFitAll = () => {
    if (!isOnDuty) {
      if (residentCoords) {
        setPanTarget({ coords: residentCoords, zoom: 16, key: Date.now() });
      }
    } else {
      setTriggerFitCount(prev => prev + 1);
    }
  };

  return (
    <div className="relative w-full min-h-[380px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950" style={{ height }}>
      {/* Interactive Leaflet Map with OpenStreetMap tiles */}
      <MapContainer
        center={initialCenter}
        zoom={isOnDuty ? 14 : 16}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. VEHICLE MARKER - Strictly ONLY shown when driver is ON DUTY */}
        {isOnDuty && hasValidDriverCoords && (
          <Marker position={vehicleCoords} icon={vehicleIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 space-y-1 text-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-[#00B074]">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{vehicleName}</span>
                </div>
                <p className="font-semibold text-slate-700">{driverName}</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 space-y-0.5">
                  <div>
                    Status:{' '}
                    <span className="font-bold text-emerald-600">
                      On Duty • Live GPS
                    </span>
                  </div>
                  <div>Station / Sector: <span className="font-bold text-slate-700">{activeSector}</span></div>
                  <div>Speed: <span className="font-bold text-slate-700">{driverLocation?.speedKm || 20} km/h</span></div>
                  <div>Coordinates: {vehicleCoords[0].toFixed(5)}, {vehicleCoords[1].toFixed(5)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. RESIDENT MARKER (Only rendered when valid resident coordinates exist) */}
        {residentCoords && (
          <Marker position={residentCoords} icon={residentIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 space-y-1 text-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-indigo-600">
                  <Home className="w-3.5 h-3.5" />
                  <span>{residentName || 'Household'}</span>
                </div>
                <p className="text-slate-600 font-medium">{residentAddress || 'Registered Property'}</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 space-y-0.5">
                  <div>Pickup Point: <span className="font-bold text-slate-700">Resident Property</span></div>
                  {isOnDuty && distanceKm && <div>Distance from Truck: <span className="font-bold text-emerald-600">{distanceKm} km</span></div>}
                  {!isOnDuty && <div className="text-amber-700 font-bold">Driver Status: Currently Off Duty</div>}
                  <div>Coordinates: {residentCoords[0].toFixed(5)}, {residentCoords[1].toFixed(5)}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. Direct In-Transit Route Line connecting Vehicle to Resident - Strictly ONLY when ON DUTY */}
        {isOnDuty && routePolyline && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: isEmergency ? '#E11D48' : '#00B074',
              weight: 4,
              opacity: 0.85,
              dashArray: '10, 8'
            }}
          />
        )}

        {/* Dynamic Bounds Manager and Tile Invalidator */}
        <MapResizeHandler />
        <MapFitBoundsHandler 
          vehicleCoords={vehicleCoords} 
          residentCoords={residentCoords} 
          triggerFit={triggerFitCount}
          isOnDuty={isOnDuty}
        />
        {panTarget && (
          <MapCenterController 
            centerTarget={panTarget.coords} 
            zoomLevel={panTarget.zoom} 
          />
        )}
      </MapContainer>

      {/* Floating Top Telemetry & ETA HUD */}
      {isHudMinimized ? (
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-auto z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/80 shadow-2xl text-white pointer-events-auto flex items-center justify-between gap-3 max-w-[calc(100%-1.25rem)] sm:max-w-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{residentName || 'Household'}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {isOnDuty ? `Driver: ${driverName} • ~${liveEta} min` : 'Driver Off Duty (Standby)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {residentCoords && (
              <button
                type="button"
                onClick={handleRecenterHome}
                className="bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-lg px-2 py-1 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Focus Home"
              >
                <Home className="w-3 h-3" />
                <span className="hidden xs:inline">Home</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsHudMinimized(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-2 py-1 text-[10px] font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
              title="Show HUD Details"
            >
              <span>Details</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-auto z-10 bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-700/80 max-w-[calc(100%-1.25rem)] sm:max-w-sm space-y-2 sm:space-y-2.5 shadow-2xl text-white pointer-events-auto">
          {/* Top Bar with Status and Minimize Button */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className={`flex items-center gap-1.5 ${isOnDuty ? 'text-emerald-400' : 'text-amber-400'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="truncate">{isOnDuty ? 'LIVE FLEET STREAM' : 'DRIVER OFF DUTY • TELEMETRY PAUSED'}</span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-emerald-300 bg-emerald-950/70 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-800/60 text-[9px] sm:text-[10px]">
                {isOnDuty 
                  ? `${vehicleCoords[0].toFixed(4)}°, ${vehicleCoords[1].toFixed(4)}°` 
                  : (residentCoords ? `${residentCoords[0].toFixed(4)}°, ${residentCoords[1].toFixed(4)}°` : 'Standby')}
              </span>
              <button
                type="button"
                onClick={() => setIsHudMinimized(true)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Minimize card to view full map"
                aria-label="Minimize HUD"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5 truncate">
                {isOnDuty ? (
                  <>
                    <Truck className="w-3.5 h-3.5 text-[#00B074] shrink-0" />
                    <span className="truncate">{vehicleName}</span>
                  </>
                ) : (
                  <>
                    <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{residentName || 'Household Property'}</span>
                  </>
                )}
              </h4>
              <span className="text-[10px] sm:text-[11px] text-slate-300 truncate block">
                {isOnDuty 
                  ? `${driverName} • ${activeSector}` 
                  : `${residentAddress || activeSector} • (Driver Offline)`}
              </span>
            </div>

            {/* Live ETA / Duty Pill */}
            <div className={`border rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-right shrink-0 ${
              isOnDuty 
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/40' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                {isOnDuty ? 'EST. ARRIVAL' : 'DUTY STATUS'}
              </span>
              <div className={`text-xs sm:text-base font-extrabold leading-tight ${isOnDuty ? 'text-emerald-300' : 'text-amber-400'}`}>
                {isOnDuty ? `~${liveEta} min` : 'Off Duty'}
              </div>
            </div>
          </div>

          {/* Metrics Row: Only display when driver is ON DUTY */}
          {isOnDuty ? (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Distance: <strong className="text-white">{distanceKm ? `${distanceKm} km` : 'In Transit'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Speed: <strong className="text-white">{`${driverLocation?.speedKm || 22} km/h`}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Home className="w-3 h-3 text-indigo-400" />
                <span>Centered on household</span>
              </span>
              <span className="text-amber-400/90 font-medium">Standby Mode</span>
            </div>
          )}

          {/* Quick Map Controls */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            {residentCoords && (
              <button
                type="button"
                onClick={handleRecenterHome}
                className="flex-1 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 rounded-lg px-2.5 py-1 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Home className="w-3 h-3" /> Focus Home
              </button>
            )}
            {isOnDuty && (
              <button
                type="button"
                onClick={handleRecenterTruck}
                className="flex-1 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60 rounded-lg px-2.5 py-1 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Truck className="w-3 h-3" /> Focus Truck
              </button>
            )}
            <button
              type="button"
              onClick={handleFitAll}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg px-2.5 py-1 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Crosshair className="w-3 h-3" /> Reset View
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Legend Indicator (Hidden on mobile to keep map 100% visible) */}
      <div className="hidden sm:flex absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-xl items-center gap-3 text-xs font-bold text-white pointer-events-auto">
        {isOnDuty ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
              <span>🚚 Driver Truck ({vehicleName})</span>
            </div>
            {residentCoords && (
              <>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white"></span>
                  <span>🏠 {residentName || 'Household'}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white"></span>
            <span>🏠 {residentName || 'Household'} (Pickup Location)</span>
            <span className="text-slate-400 text-[11px] font-normal">• Driver offline</span>
          </div>
        )}
      </div>

      {/* Bottom Right External Navigation Link (Compact on mobile) */}
      <div className="absolute bottom-2.5 sm:bottom-4 right-2.5 sm:right-4 z-10 pointer-events-auto">
        <a
          href={navigationDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold border border-slate-700 shadow-xl transition"
        >
          <span className="hidden sm:inline">{isOnDuty ? 'Turn-by-Turn Navigation' : 'Open in Maps'}</span>
          <span className="sm:hidden text-[10px]">Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
