import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Truck, Navigation, Trash2, CheckCircle2, RotateCw, MapPin } from 'lucide-react';
import { 
  MapResizeHandler, 
  createVehicleIcon, 
  createGarbageSpotIcon, 
  calculateDistanceKm 
} from '../../../components/MapCustomIcons.js';

function RecenterMap({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function RoadsideRadarMap({
  driverLat = 28.6139,
  driverLng = 77.2090,
  vehicleName = 'Collection Truck',
  driverName = 'Driver',
  complaints = [],
  onStartPickup,
  onCompletePickup,
  updatingId = null,
  height = '340px'
}) {
  const safeDriverLat = typeof driverLat === 'number' && !isNaN(driverLat) && driverLat !== 0 ? driverLat : 28.6139;
  const safeDriverLng = typeof driverLng === 'number' && !isNaN(driverLng) && driverLng !== 0 ? driverLng : 77.2090;
  const driverPosition = useMemo(() => [safeDriverLat, safeDriverLng], [safeDriverLat, safeDriverLng]);

  const vehicleIcon = useMemo(() => {
    return createVehicleIcon({ label: vehicleName || 'My Truck' });
  }, [vehicleName]);

  const activePoints = useMemo(() => {
    return complaints.map(c => {
      const cLat = typeof c.lat === 'number' && !isNaN(c.lat) ? c.lat : (c.location?.lat || 28.6139);
      const cLng = typeof c.lng === 'number' && !isNaN(c.lng) ? c.lng : (c.location?.lng || 77.2090);
      const isResolved = (c.status || '').toLowerCase().includes('resolv');
      const isEnRoute = c.status === 'On the Way';
      const dist = calculateDistanceKm(safeDriverLat, safeDriverLng, cLat, cLng);

      return {
        ...c,
        coords: [cLat, cLng],
        isResolved,
        isEnRoute,
        distanceKm: dist,
        icon: createGarbageSpotIcon({
          label: c.customId || c.ticketNumber || 'Dump Spot',
          priority: c.priority || 'High',
          isCleared: isResolved
        })
      };
    });
  }, [complaints, safeDriverLat, safeDriverLng]);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-lg relative flex flex-col">
      {/* Top Banner Toolbar */}
      <div className="bg-slate-800/90 px-5 py-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-amber-400" />
            Roadside Garbage Pickup Radar
          </span>
          <span className="bg-slate-700/80 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
            {activePoints.filter(p => !p.isResolved).length} Pending Spots
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending / Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Cleared
          </span>
        </div>
      </div>

      {/* Leaflet Map Viewport */}
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ height }}>
        <MapContainer
          center={driverPosition}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapResizeHandler />
          <RecenterMap center={driverPosition} />

          {/* Driver's Vehicle Marker */}
          <Marker position={driverPosition} icon={vehicleIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="block text-emerald-700 font-bold">{vehicleName}</strong>
                <span className="text-slate-600">Driver: {driverName}</span>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Active Broadcasting GPS
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Active Navigation Route for En-Route Pickups */}
          {activePoints.filter(p => p.isEnRoute).map(point => (
            <Polyline
              key={`route-${point._id}`}
              positions={[driverPosition, point.coords]}
              pathOptions={{
                color: '#F59E0B',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.9
              }}
            />
          ))}

          {/* Roadside Garbage Markers */}
          {activePoints.map(point => (
            <Marker key={point._id} position={point.coords} icon={point.icon}>
              <Popup>
                <div className="p-1.5 text-xs max-w-[220px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-mono font-bold text-amber-700">
                      {point.customId || point.ticketNumber || '#CMP-TASK'}
                    </strong>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {point.priority}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-900 text-xs line-clamp-2">
                    {point.title}
                  </p>

                  <div className="text-[10px] text-slate-600">
                    📍 {point.landmark || point.location?.address || 'Roadside spot'}
                  </div>

                  <div className="text-[10px] font-bold text-emerald-700">
                    ~{point.distanceKm} km from your truck
                  </div>

                  {/* Actions inside popup */}
                  <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5">
                    {!point.isResolved && !point.isEnRoute && onStartPickup && (
                      <button
                        onClick={() => onStartPickup(point._id)}
                        disabled={updatingId === point._id}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] py-1 px-2 rounded-lg transition"
                      >
                        {updatingId === point._id ? 'Starting...' : 'Go for Pickup'}
                      </button>
                    )}

                    {!point.isResolved && point.isEnRoute && onCompletePickup && (
                      <button
                        onClick={() => onCompletePickup(point._id)}
                        disabled={updatingId === point._id}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2 rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Cleared</span>
                      </button>
                    )}

                    {point.isResolved && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Site Cleared
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Bottom Info Pill */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-200 font-medium shadow-xl pointer-events-none flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Leaflet GPS Radar • Tap any spot to view details</span>
        </div>
      </div>
    </div>
  );
}
