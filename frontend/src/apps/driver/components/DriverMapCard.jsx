import React, { useMemo, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
import { ExternalLink, Truck, MapPin, Crosshair, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import { createVehicleIcon, createResidentIcon, MapResizeHandler } from '../../../components/MapCustomIcons.js';

// Controller to smoothly pan the map to follow the driver
function DriverCenterFollower({ position, followMode = true }) {
  const map = useMap();
  const prevPosRef = useRef(null);

  useEffect(() => {
    if (!position || !position[0] || !position[1] || !map) return;
    if (!followMode) return;

    if (!prevPosRef.current) {
      map.setView(position, map.getZoom() || 14, { animate: false });
      prevPosRef.current = position;
    } else {
      const dLat = Math.abs(prevPosRef.current[0] - position[0]);
      const dLng = Math.abs(prevPosRef.current[1] - position[1]);
      if (dLat > 0.0001 || dLng > 0.0001) {
        map.panTo(position, { animate: true, duration: 1 });
        prevPosRef.current = position;
      }
    }
  }, [position, followMode, map]);

  return null;
}

// Controller to manually recenter map
function ManualRecenterController({ target, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!target || !trigger || !map) return;
    map.setView(target, 15, { animate: true });
  }, [target, trigger, map]);
  return null;
}

export default function DriverMapCard({
  lat = 28.6139,
  lng = 77.2090,
  nextStop = 'Sector Collection Hub',
  routeStops = [],
  emergencies = [],
  assignedArea = null,
  vehicleName = 'Collection Truck',
  isOnDuty = false
}) {
  const [recenterCount, setRecenterCount] = useState(0);

  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0 ? lat : 28.6139;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && lng !== 0 ? lng : 77.2090;
  const driverPosition = useMemo(() => [safeLat, safeLng], [safeLat, safeLng]);

  // Filter active emergency pickup requests (Driver gets direct resident house access for emergency pickups)
  const activeEmergencies = useMemo(() => {
    if (!Array.isArray(emergencies)) return [];
    return emergencies.filter(e => {
      const s = (e.status || '').toUpperCase();
      return s !== 'RESOLVED' && s !== 'CANCELLED' && s !== 'PICKED_UP';
    });
  }, [emergencies]);

  const primaryEmergency = activeEmergencies[0] || null;

  // Next stop coords (offset slightly or point to primary emergency if active)
  const nextStopPosition = useMemo(() => {
    if (primaryEmergency) {
      const emLat = Number(primaryEmergency.destinationLat || primaryEmergency.lat);
      const emLng = Number(primaryEmergency.destinationLng || primaryEmergency.lng);
      if (!isNaN(emLat) && !isNaN(emLng) && emLat !== 0 && emLng !== 0) {
        return [emLat, emLng];
      }
    }
    return [safeLat + 0.0045, safeLng + 0.0035];
  }, [safeLat, safeLng, primaryEmergency]);

  const vehicleIcon = useMemo(() => {
    return createVehicleIcon({ 
      label: isOnDuty ? (vehicleName || 'My Truck') : `${vehicleName} (Off Duty)`,
      isEmergency: Boolean(primaryEmergency),
      isOffDuty: !isOnDuty
    });
  }, [vehicleName, primaryEmergency, isOnDuty]);

  // Polygon boundary coordinates of assigned service area
  const areaPolygon = useMemo(() => {
    if (assignedArea?.polygonCoordinates && Array.isArray(assignedArea.polygonCoordinates) && assignedArea.polygonCoordinates.length >= 3) {
      return assignedArea.polygonCoordinates.map(p => [Number(p.lat), Number(p.lng)]);
    }
    return null;
  }, [assignedArea]);

  const directionsUrl = primaryEmergency && nextStopPosition
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${safeLat}%2C${safeLng}%3B${nextStopPosition[0]}%2C${nextStopPosition[1]}`
    : `https://www.openstreetmap.org/#map=15/${safeLat}/${safeLng}`;

  const handleRecenter = () => {
    setRecenterCount(prev => prev + 1);
  };

  return (
    <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative h-[360px] shadow-sm flex flex-col">
      <div className="relative flex-1 w-full h-full">
        <MapContainer
          center={driverPosition}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapResizeHandler />
          <DriverCenterFollower position={driverPosition} followMode={true} />
          <ManualRecenterController target={driverPosition} trigger={recenterCount} />

          {/* 1. ASSIGNED SERVICE AREA BOUNDARY (Geofence Outline on Driver Map) */}
          {areaPolygon ? (
            <Polygon
              positions={areaPolygon}
              pathOptions={{
                color: '#00B074',
                fillColor: '#00B074',
                fillOpacity: 0.12,
                weight: 2.5,
                dashArray: '6, 6'
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 text-xs space-y-1">
                  <div className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Assigned Service Area Boundary</span>
                  </div>
                  <div className="font-bold text-slate-800">{assignedArea?.displayName || assignedArea?.name}</div>
                  <div className="text-[10px] text-slate-500">
                    Geofenced Sector • {assignedArea?.areaSqKm ? `${assignedArea.areaSqKm} km²` : 'Active Coverage'}
                  </div>
                </div>
              </Popup>
            </Polygon>
          ) : (
            assignedArea?.centerLat && assignedArea?.centerLng && (
              <Circle
                center={[Number(assignedArea.centerLat), Number(assignedArea.centerLng)]}
                radius={(Number(assignedArea.radiusKm) || 4.0) * 1000}
                pathOptions={{
                  color: '#00B074',
                  fillColor: '#00B074',
                  fillOpacity: 0.10,
                  weight: 2.5,
                  dashArray: '6, 6'
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 text-xs space-y-1">
                    <div className="font-bold text-emerald-600">Assigned Service Area Boundary</div>
                    <div className="font-bold text-slate-800">{assignedArea?.displayName || assignedArea?.name}</div>
                    <div className="text-[10px] text-slate-500">Coverage Radius: {assignedArea.radiusKm || 4} km</div>
                  </div>
                </Popup>
              </Circle>
            )
          )}

          {/* 2. VEHICLE MARKER (Driver Truck Live Location) */}
          <Marker position={driverPosition} icon={vehicleIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-xs font-semibold text-slate-800 space-y-1">
                <div className="text-[#00B074] font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{vehicleName}</span>
                </div>
                <div>
                  Status:{' '}
                  <span className={`font-bold ${isOnDuty ? 'text-emerald-600' : 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'}`}>
                    {isOnDuty ? 'On Duty • Live GPS' : 'Shift Inactive • Off Duty'}
                  </span>
                </div>
                <div>Sector: <span className="font-bold text-slate-700">{assignedArea?.displayName || assignedArea?.name || 'Assigned Zone'}</span></div>
                <div>Coordinates: {safeLat.toFixed(5)}, {safeLng.toFixed(5)}</div>
              </div>
            </Popup>
          </Marker>

          {/* 3. DIRECT EMERGENCY RESIDENT HOUSE MARKERS (Visible on Emergency Pickup) */}
          {activeEmergencies.map((em, idx) => {
            const emLat = Number(em.destinationLat || em.lat);
            const emLng = Number(em.destinationLng || em.lng);
            if (isNaN(emLat) || isNaN(emLng) || emLat === 0 || emLng === 0) return null;

            return (
              <React.Fragment key={em._id || em.customId || idx}>
                <Marker
                  position={[emLat, emLng]}
                  icon={createResidentIcon({
                    label: `🚨 SOS: ${em.residentName || 'Emergency House'}`,
                    isEmergency: true
                  })}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1.5 text-xs font-semibold text-slate-800 space-y-1 min-w-[210px]">
                      <div className="text-rose-600 font-extrabold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                        <span>DIRECT EMERGENCY RESIDENT PICKUP</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">🏠 {em.residentName}</div>
                      <div className="text-slate-600 text-xs font-medium">📍 {em.address}</div>
                      {em.residentPhone && (
                        <div className="text-slate-600 text-[11px]">
                          📞 Contact:{' '}
                          <a href={`tel:${em.residentPhone}`} className="text-blue-600 font-bold hover:underline">
                            {em.residentPhone}
                          </a>
                        </div>
                      )}
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-1.5 rounded-lg text-[11px] mt-1">
                        Waste Issue: <strong>{em.reason || em.garbageType || 'Urgent Overflow'}</strong>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Ticket: {em.customId || em.reqId}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                          {em.status || 'DISPATCHED'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Direct High-Visibility Navigation Polyline from Truck to Emergency House */}
                <Polyline
                  positions={[driverPosition, [emLat, emLng]]}
                  pathOptions={{
                    color: '#E11D48',
                    weight: 4,
                    dashArray: '10, 8',
                    opacity: 0.95
                  }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Info Badge at Top Left */}
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 max-w-sm space-y-1 shadow-lg text-white pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 gap-3">
            <span className={`flex items-center gap-1.5 ${activeEmergencies.length > 0 ? 'text-rose-400' : (isOnDuty ? 'text-emerald-400' : 'text-amber-400')}`}>
              <span className={`w-2 h-2 rounded-full ${activeEmergencies.length > 0 ? 'bg-rose-500 animate-ping' : (isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400')}`}></span>
              {activeEmergencies.length > 0 
                ? '🚨 DIRECT EMERGENCY DISPATCH' 
                : (isOnDuty ? 'LIVE GPS BROADCASTING' : 'OFF DUTY • STANDBY DEPOT')}
            </span>
            <span className="text-emerald-400 font-mono text-[9px]">{safeLat.toFixed(4)}, {safeLng.toFixed(4)}</span>
          </div>

          {activeEmergencies.length > 0 ? (
            <h4 className="font-bold text-xs text-rose-300 flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>SOS Target: {activeEmergencies[0].residentName} ({activeEmergencies[0].address})</span>
            </h4>
          ) : (
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00B074] shrink-0" />
              <span>Area: {assignedArea?.displayName || assignedArea?.name || 'Assigned Zone'}</span>
            </h4>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
            <span className="text-slate-400">
              {activeEmergencies.length > 0 
                ? `${activeEmergencies.length} direct emergency house request(s) active`
                : `${routeStops.filter(s => s.status === 'PICKED').length}/${routeStops.length} sector checkpoints cleared`}
            </span>
            <button
              type="button"
              onClick={handleRecenter}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded cursor-pointer"
            >
              <Crosshair className="w-2.5 h-2.5" /> Center Truck
            </button>
          </div>
        </div>

        {/* Bottom Right OpenStreetMap Navigation Link */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-auto">
          {activeEmergencies.length > 0 ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500 shadow-lg transition"
            >
              <span>Navigate to Emergency House</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <a
              href={`https://www.openstreetmap.org/#map=15/${safeLat}/${safeLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 shadow-lg transition"
            >
              <span>Sector Map View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
