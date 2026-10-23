import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Truck, Home, AlertTriangle } from 'lucide-react';
import { createVehicleIcon, createResidentIcon, MapResizeHandler } from '../../../components/MapCustomIcons.js';

export default function AdminFleetLiveMap({ data, driverLocations = {}, height = '560px' }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'vehicles', 'residents', 'emergencies'

  // 1. Gather all fleet drivers with their latest telemetry (from socket or dashboard)
  const drivers = useMemo(() => {
    const list = data?.driversList || [];
    const combined = [...list];

    // Merge live socket telemetry if available
    Object.values(driverLocations).forEach(live => {
      const matchIndex = combined.findIndex(d => 
        (live.driverId && d.customId === live.driverId) ||
        (live.driverMongoId && String(d._id) === String(live.driverMongoId)) ||
        (live.driverName && d.name === live.driverName)
      );

      if (matchIndex >= 0) {
        combined[matchIndex] = {
          ...combined[matchIndex],
          isOnDuty: live.isOnDuty !== false,
          assignedVehicle: live.vehicle || combined[matchIndex].assignedVehicle,
          activeSector: live.sector || combined[matchIndex].activeSector,
          liveLocation: live.location || { lat: live.lat, lng: live.lng }
        };
      }
    });

    return combined.map(d => {
      const lat = Number(d.liveLocation?.lat || d.lat || 28.4830);
      const lng = Number(d.liveLocation?.lng || d.lng || 77.5088);
      return {
        ...d,
        lat: isNaN(lat) || lat === 0 ? 28.4830 : lat,
        lng: isNaN(lng) || lng === 0 ? 77.5088 : lng
      };
    });
  }, [data?.driversList, driverLocations]);

  // 2. Gather registered residents
  const residents = useMemo(() => {
    const list = data?.residentsList || [];
    return list.map(r => {
      const lat = Number(r.houseLocation?.lat || r.lat || r.liveLocation?.lat || 28.4830);
      const lng = Number(r.houseLocation?.lng || r.lng || r.liveLocation?.lng || 77.5088);
      return {
        ...r,
        lat: isNaN(lat) || lat === 0 ? 28.4830 : lat,
        lng: isNaN(lng) || lng === 0 ? 77.5088 : lng
      };
    });
  }, [data?.residentsList]);

  // 3. Gather active emergencies
  const emergencies = useMemo(() => {
    const list = data?.emergencies || [];
    return list
      .filter(e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP' && e.status !== 'CANCELLED')
      .map(e => {
        const lat = Number(e.lat || e.destinationLat || 28.4830);
        const lng = Number(e.lng || e.destinationLng || 77.5088);
        return {
          ...e,
          lat: isNaN(lat) || lat === 0 ? 28.4830 : lat,
          lng: isNaN(lng) || lng === 0 ? 77.5088 : lng
        };
      });
  }, [data?.emergencies]);

  const activeDriversCount = drivers.filter(d => d.isOnDuty).length;
  
  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col" style={{ height }}>
      {/* Top Filter and Telemetry Header */}
      <div className="px-5 py-3 bg-slate-900/95 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">Fleet Telemetry Map</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-300">
            <strong className="text-emerald-400">{activeDriversCount}</strong> Active Vehicles • <strong className="text-indigo-400">{residents.length}</strong> Households
          </span>
        </div>

        {/* View Filters & Reset Camera Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'all' ? 'bg-[#00B074] text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('vehicles')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'vehicles' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Trucks ({activeDriversCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('residents')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'residents' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Residents ({residents.length})
            </button>
            {emergencies.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('emergencies')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'emergencies' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> SOS ({emergencies.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div className="relative flex-1 w-full min-h-[460px] bg-slate-950">
        <MapContainer
          center={[28.4830, 77.5088]}
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

          {/* 1. VEHICLE MARKERS (Vehicle Logo) */}
          {(filterMode === 'all' || filterMode === 'vehicles') &&
            drivers.map((drv, idx) => {
              const vIcon = createVehicleIcon({
                label: drv.assignedVehicle || `Unit #${idx + 1}`,
                isEmergency: false
              });

              return (
                <Marker key={`driver-${drv._id || idx}`} position={[drv.lat, drv.lng]} icon={vIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5 text-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-[#00B074]">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{drv.assignedVehicle || 'Collection Truck'}</span>
                      </div>
                      <div className="font-bold text-slate-900">{drv.name}</div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 space-y-0.5">
                        <div>Driver ID: <span className="font-mono font-bold text-slate-700">{drv.customId || 'DRV'}</span></div>
                        <div>Duty Status: <span className={`font-bold ${drv.isOnDuty ? 'text-emerald-600' : 'text-slate-400'}`}>{drv.isOnDuty ? 'On Duty • Broadcasting GPS' : 'Off Duty'}</span></div>
                        <div>Sector: <span className="font-bold text-slate-700">{drv.activeSector || 'Municipal Route'}</span></div>
                        <div>GPS: <span className="font-mono text-slate-600">{drv.lat.toFixed(5)}, {drv.lng.toFixed(5)}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* 2. RESIDENT MARKERS (Resident Logo) */}
          {(filterMode === 'all' || filterMode === 'residents') &&
            residents.map((res, idx) => {
              const rIcon = createResidentIcon({
                label: res.name || `Household #${idx + 1}`,
                isSelf: false,
                isEmergency: false
              });

              return (
                <Marker key={`resident-${res._id || idx}`} position={[res.lat, res.lng]} icon={rIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5 text-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-indigo-600">
                        <Home className="w-3.5 h-3.5" />
                        <span>{res.name}</span>
                      </div>
                      <p className="text-slate-600">{res.address || 'Household Property'}</p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 space-y-0.5">
                        <div>Citizen ID: <span className="font-mono font-bold text-slate-700">{res.customId || 'RES'}</span></div>
                        <div>Points: <span className="font-bold text-emerald-600">{res.garbagePoints || 0} pts</span></div>
                        <div>Phone: <span className="font-bold text-slate-700">{res.phone || 'N/A'}</span></div>
                        <div>GPS: <span className="font-mono text-slate-600">{res.lat.toFixed(5)}, {res.lng.toFixed(5)}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* 3. EMERGENCY SOS DISPATCH MARKERS */}
          {(filterMode === 'all' || filterMode === 'emergencies') &&
            emergencies.map((em, idx) => {
              const emIcon = createResidentIcon({
                label: `SOS ${em.customId || em.reqId || ''}`,
                isSelf: false,
                isEmergency: true
              });

              return (
                <Marker key={`emergency-${em._id || idx}`} position={[em.lat, em.lng]} icon={emIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1 text-slate-800 text-xs">
                      <div className="flex items-center gap-1 font-extrabold text-rose-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>EMERGENCY SOS: {em.customId || em.reqId}</span>
                      </div>
                      <p className="font-bold text-slate-900">{em.residentName}</p>
                      <p className="text-slate-600">{em.address}</p>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                        <div>Type: <span className="font-bold text-rose-600">{em.type || em.garbageType}</span></div>
                        <div>Status: <span className="font-bold text-amber-600">{em.status}</span></div>
                        <div>Assigned Driver: <span className="font-bold text-slate-800">{em.assignedDriverName || 'Unassigned'}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center gap-4 text-xs font-bold text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
            <span>🚚 Vehicle Logo (Fleet Trucks)</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white"></span>
            <span>🏠 Resident Logo (Households)</span>
          </div>
          {emergencies.length > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-white"></span>
                <span>🚨 Emergency SOS</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
