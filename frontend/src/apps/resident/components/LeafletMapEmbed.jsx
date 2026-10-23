import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Map, RefreshCw, ExternalLink, Navigation, Radio, Gauge } from 'lucide-react';
import { createVehicleIcon, MapResizeHandler } from '../../../components/MapCustomIcons.js';

function MapCenterFollower({ center }) {
  const map = useMap();
  const prevCenter = useRef(null);

  useEffect(() => {
    if (!center || !center[0] || !center[1] || !map) return;
    if (!prevCenter.current) {
      map.setView(center, 15, { animate: false });
      prevCenter.current = center;
    } else {
      const dLat = Math.abs(prevCenter.current[0] - center[0]);
      const dLng = Math.abs(prevCenter.current[1] - center[1]);
      if (dLat > 0.0001 || dLng > 0.0001) {
        map.panTo(center, { animate: true, duration: 1 });
        prevCenter.current = center;
      }
    }
  }, [center, map]);

  return null;
}

export default function LeafletMapEmbed({
  lat = 28.6139,
  lng = 77.2090,
  driverName = 'Fleet Driver',
  vehicleName = 'Truck',
  activeSector = 'Sector Alpha',
  speedKm = 24,
  lastBroadcastTime = 'Continuous Stream',
  destinationAddress = '',
  height = '480px',
  onRefresh = null
}) {
  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0 ? lat : 28.6139;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && lng !== 0 ? lng : 77.2090;
  const position = [safeLat, safeLng];

  const vehicleIcon = createVehicleIcon(vehicleName);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative shadow-xl">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-800/95 border-b border-slate-700/60 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-emerald-400" /> Map Engine:
          </span>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-1.5 border border-slate-700 text-xs font-bold text-white shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Leaflet Real-Time Telemetry Map</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium text-xs bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Refresh coordinates"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync GPS</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Leaflet Viewport */}
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ height }}>
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapResizeHandler />
          <MapCenterFollower center={position} />

          <Marker position={position} icon={vehicleIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="block text-slate-900 font-bold">{vehicleName}</strong>
                <span className="text-slate-600">Driver: {driverName}</span>
                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                  Speed: {speedKm} km/h • {activeSector}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Telemetry HUD */}
        <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl max-w-sm text-white pointer-events-auto">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Leaflet GPS Stream
            </span>
            <span className="font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              {Number(safeLat).toFixed(4)}°, {Number(safeLng).toFixed(4)}°
            </span>
          </div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#00B074]" />
            {vehicleName}
          </h3>
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Driver:</span>
              <span className="font-semibold text-white">{driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Sector:</span>
              <span className="font-semibold text-emerald-400">{activeSector}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Telemetry Speed:</span>
              <span className="font-mono font-semibold text-white flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> {speedKm} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Distance / Status Pills */}
        <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 shadow-2xl text-white flex items-center gap-4 pointer-events-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Arrival</span>
            <span className="text-lg font-black text-emerald-400 leading-tight">6 - 8 Minutes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-[11px] font-medium text-slate-300 flex items-center gap-3 pointer-events-auto">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry Synced
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono text-[10px]">
            {lastBroadcastTime ? `Updated: ${lastBroadcastTime}` : 'Continuous Stream'}
          </span>
        </div>
      </div>
    </div>
  );
}
