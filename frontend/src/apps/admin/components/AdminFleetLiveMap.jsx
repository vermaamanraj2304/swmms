import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, AlertTriangle, Home, AlertCircle } from 'lucide-react';
import { 
  createVehicleIcon, 
  createResidentIcon, 
  createComplaintHouseIcon, 
  MapResizeHandler 
} from '../../../components/MapCustomIcons.js';

// Controller to auto-focus viewport on active on-duty fleet vehicles and complaint houses
function FleetBoundsController({ drivers, complaintHouses }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || hasFittedRef.current) return;
    const allPoints = [
      ...drivers.map(d => [d.lat, d.lng]),
      ...complaintHouses.map(h => [h.lat, h.lng])
    ];
    if (allPoints.length === 0) return;

    try {
      if (allPoints.length === 1) {
        map.setView(allPoints[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
      hasFittedRef.current = true;
    } catch {
      // ignore viewport fit errors
    }
  }, [map, drivers, complaintHouses]);

  return null;
}

export default function AdminFleetLiveMap({ data, driverLocations = {}, height = '560px' }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'vehicles', 'complaints', 'emergencies'

  // 1. Gather ONLY ON-DUTY fleet drivers with their latest telemetry (from socket or dashboard)
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
          isOnDuty: live.isOnDuty !== undefined ? Boolean(live.isOnDuty) : Boolean(combined[matchIndex].isOnDuty),
          assignedVehicle: live.vehicle || combined[matchIndex].assignedVehicle,
          activeSector: live.sector || combined[matchIndex].activeSector,
          liveLocation: live.location || { lat: live.lat, lng: live.lng }
        };
      } else if (live.isOnDuty) {
        combined.push({
          _id: live.driverMongoId,
          customId: live.driverId,
          name: live.driverName || 'Driver',
          isOnDuty: true,
          assignedVehicle: live.vehicle || 'Collection Truck',
          activeSector: live.sector || 'Municipal Route',
          liveLocation: live.location || { lat: live.lat, lng: live.lng }
        });
      }
    });

    // STRICT: Only show drivers who are currently ON DUTY (exclude off-duty drivers)
    return combined
      .filter(d => Boolean(d.isOnDuty))
      .map(d => {
        const lat = Number(d.liveLocation?.lat || d.lat || 28.4830);
        const lng = Number(d.liveLocation?.lng || d.lng || 77.5088);
        return {
          ...d,
          lat: isNaN(lat) || lat === 0 ? 28.4830 : lat,
          lng: isNaN(lng) || lng === 0 ? 77.5088 : lng
        };
      });
  }, [data?.driversList, driverLocations]);

  // 2. Gather ONLY houses that have made ANY complaint
  const complaintHouses = useMemo(() => {
    const complaints = data?.complaints || [];
    if (complaints.length === 0) return [];

    const residents = data?.residentsList || [];
    const houseMap = new Map();

    complaints.forEach((comp, idx) => {
      // Find matching resident profile if available
      const resident = residents.find(r => 
        (comp.residentId && String(r._id) === String(comp.residentId)) ||
        (comp.residentCustomId && r.customId === comp.residentCustomId) ||
        (comp.residentName && r.name && r.name.toLowerCase().trim() === comp.residentName.toLowerCase().trim())
      );

      const key = resident?._id ? String(resident._id) : (comp.residentCustomId || comp.residentName || comp.customId || `house-${idx}`);

      const lat = Number(
        resident?.houseLocation?.lat ||
        comp.lat ||
        comp.location?.lat ||
        resident?.lat ||
        28.4830
      );
      const lng = Number(
        resident?.houseLocation?.lng ||
        comp.lng ||
        comp.location?.lng ||
        resident?.lng ||
        77.5088
      );

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      if (!houseMap.has(key)) {
        houseMap.set(key, {
          id: key,
          name: resident?.name || comp.residentName || 'Resident Household',
          customId: resident?.customId || comp.residentCustomId || 'RES',
          address: resident?.houseLocation?.address || resident?.address || comp.residentAddress || comp.landmark || 'Residential Property',
          phone: resident?.phone || comp.residentPhone || 'N/A',
          sector: resident?.houseLocation?.sector || comp.residentSector || resident?.sector || 'Beta 2',
          lat,
          lng,
          complaints: [comp]
        });
      } else {
        const existing = houseMap.get(key);
        existing.complaints.push(comp);
      }
    });

    return Array.from(houseMap.values());
  }, [data?.complaints, data?.residentsList]);

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
            <strong className="text-emerald-400">{drivers.length}</strong> On-Duty Fleet • <strong className="text-amber-400">{complaintHouses.length}</strong> Complaint {complaintHouses.length === 1 ? 'House' : 'Houses'}
          </span>
        </div>

        {/* View Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterMode === 'all' ? 'bg-[#00B074] text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Active ({drivers.length + complaintHouses.length + emergencies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('vehicles')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'vehicles' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Trucks ({drivers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('complaints')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'complaints' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Complaint Houses ({complaintHouses.length})
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
          <FleetBoundsController drivers={drivers} complaintHouses={complaintHouses} />

          {/* 1. VEHICLE MARKERS (Vehicle Logo) - STRICTLY ON-DUTY ONLY */}
          {(filterMode === 'all' || filterMode === 'vehicles') &&
            drivers.map((drv, idx) => {
              const vIcon = createVehicleIcon({
                label: drv.assignedVehicle || `Unit #${idx + 1}`,
                isEmergency: false
              });

              return (
                <Marker key={`driver-${drv._id || drv.customId || idx}`} position={[drv.lat, drv.lng]} icon={vIcon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5 text-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-[#00B074]">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{drv.assignedVehicle || 'Collection Truck'}</span>
                      </div>
                      <div className="font-bold text-slate-900">{drv.name}</div>
                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 space-y-0.5">
                        <div>Driver ID: <span className="font-mono font-bold text-slate-700">{drv.customId || 'DRV'}</span></div>
                        <div>Duty Status: <span className="font-bold text-emerald-600">On Duty • Broadcasting GPS</span></div>
                        <div>Sector: <span className="font-bold text-slate-700">{drv.activeSector || 'Municipal Route'}</span></div>
                        <div>GPS: <span className="font-mono text-slate-600">{drv.lat.toFixed(5)}, {drv.lng.toFixed(5)}</span></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* 2. HOUSES WHO MADE A COMPLAINT */}
          {(filterMode === 'all' || filterMode === 'complaints') &&
            complaintHouses.map((house, idx) => {
              const priority = house.complaints.some(c => c.priority === 'Critical')
                ? 'Critical'
                : (house.complaints.some(c => c.priority === 'High') ? 'High' : 'Medium');

              const icon = createComplaintHouseIcon({
                label: house.name,
                complaintCount: house.complaints.length,
                priority
              });

              return (
                <Marker key={`complaint-house-${house.id || idx}`} position={[house.lat, house.lng]} icon={icon}>
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-2 text-slate-800 text-xs min-w-[230px] max-w-[280px]">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-1.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-amber-600">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Complaint House</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                          {house.complaints.length} {house.complaints.length === 1 ? 'Complaint' : 'Complaints'}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm">{house.name}</div>
                        <p className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                          <Home className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{house.address}</span>
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Citizen ID: <span className="font-mono font-bold text-slate-700">{house.customId}</span> • Sector: <span className="font-semibold text-slate-700">{house.sector}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-1.5 space-y-1.5 max-h-[160px] overflow-y-auto">
                        {house.complaints.map((c, cIdx) => (
                          <div key={c._id || cIdx} className="p-2 rounded-lg bg-amber-50/80 border border-amber-200 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="text-amber-800 font-mono text-[10px]">{c.customId || c.ticketNumber || '#CMP'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold ${
                                c.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.priority || 'Medium'} Priority
                              </span>
                            </div>
                            <div className="font-semibold text-slate-800 text-[11px]">{c.title || c.category || 'Service Complaint'}</div>
                            <p className="text-slate-600 text-[10px] line-clamp-2">{c.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                              <span>Status: <strong className="text-amber-700">{c.status || 'Under Review'}</strong></span>
                              {c.assignedVehicle && <span className="text-emerald-700 font-medium">🚚 {c.assignedVehicle}</span>}
                            </div>
                          </div>
                        ))}
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
            <span>🚚 On-Duty Fleet Trucks</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
            <span>🏠 Complaint Houses ({complaintHouses.length})</span>
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

        {/* Notification banner if 0 drivers and 0 complaints */}
        {drivers.length === 0 && complaintHouses.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2.5 text-xs text-slate-300 font-semibold pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>No on-duty vehicles or complaint houses currently active on the map.</span>
          </div>
        )}
      </div>
    </div>
  );
}
