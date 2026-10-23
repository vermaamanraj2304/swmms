import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polygon, 
  Circle, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Truck, 
  Compass, 
  CheckCircle2, 
  Send, 
  Layers, 
  Navigation, 
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { MapResizeHandler } from '../../../components/MapCustomIcons.js';

// SVG Pin icon for Sector Center
const sectorPinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="#00B074" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
  <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
</svg>
`;

const sectorPinIcon = L.divIcon({
  html: sectorPinSvg,
  className: 'custom-leaflet-marker',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34]
});

function MapCenterFollower({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !center[0] || !center[1] || !map) return;
    map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

const MUNICIPAL_SECTORS = [
  {
    id: 'Sector Alpha',
    name: 'Sector Alpha (Zone 1 - North Greenfield)',
    centerLat: 28.6139,
    centerLng: 77.2090,
    totalStops: 4,
    coverage: 'Residential & Commercial Core',
    recommendedVehicle: 'Pending Assignment'
  },
  {
    id: 'Sector Beta',
    name: 'Sector Beta (Zone 2 - Greenfield South)',
    centerLat: 28.5355,
    centerLng: 77.3910,
    totalStops: 5,
    coverage: 'High-Density Residential',
    recommendedVehicle: 'Truck #GFT-24'
  },
  {
    id: 'Sector Gamma',
    name: 'Sector Gamma (Zone 3 - West Industrial Belt)',
    centerLat: 28.7041,
    centerLng: 77.1025,
    totalStops: 6,
    coverage: 'Industrial & Recycling Centers',
    recommendedVehicle: 'Heavy Compactor #HVC-09'
  },
  {
    id: 'Sector Delta',
    name: 'Sector Delta (Central Metropolitan)',
    centerLat: 28.6289,
    centerLng: 77.2155,
    totalStops: 4,
    coverage: 'Civic Center & Hospital District',
    recommendedVehicle: 'Electric Van #EV-14'
  }
];

export default function DriverAreaAssignmentPage({ 
  drivers = [], 
  vehicles = [],
  serviceAreas = [],
  onAssignmentComplete, 
  showToast 
}) {
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?._id || '');
  const activeDriver = drivers.find(d => d._id === selectedDriverId) || drivers[0];

  // Vehicles that are not assigned to any other driver, or currently assigned to this driver
  const availableVehicles = vehicles.filter(v => {
    // If vehicle has no driver or is marked Unassigned
    const isFree = !v.assignedDriverName || v.assignedDriverName === 'Unassigned' || !v.assignedDriverId;
    // Or if it's already assigned to currently selected driver
    const isCurrentlyMine = (activeDriver && v.assignedDriverName === activeDriver.name) || 
      (activeDriver && v.assignedDriverId === activeDriver._id) ||
      (activeDriver && activeDriver.assignedVehicle === v.vehicleNumber);
    return isFree || isCurrentlyMine;
  });

  const [selectedSector, setSelectedSector] = useState(serviceAreas[0]?.name || '');
  const [assignedVehicle, setAssignedVehicle] = useState(
    activeDriver?.assignedVehicle || availableVehicles[0]?.vehicleNumber || ''
  );
  const [saving, setSaving] = useState(false);

  // Sync selected sector and vehicle when selected driver changes
  React.useEffect(() => {
    if (activeDriver) {
      if (activeDriver.activeSector && activeDriver.activeSector !== 'Unassigned') {
        setSelectedSector(activeDriver.activeSector);
      } else if (serviceAreas.length > 0 && !selectedSector) {
        setSelectedSector(serviceAreas[0].name);
      }

      if (activeDriver.assignedVehicle && activeDriver.assignedVehicle !== 'Unassigned') {
        setAssignedVehicle(activeDriver.assignedVehicle);
      } else if (availableVehicles.length > 0) {
        setAssignedVehicle(availableVehicles[0].vehicleNumber);
      }
    }
  }, [selectedDriverId, drivers, vehicles]);

  const activeSectorData = serviceAreas.find(s => s.name === selectedSector) || serviceAreas[0] || {
    name: selectedSector || 'Sector Area',
    displayName: selectedSector || 'Sector Area',
    centerLat: 28.6139,
    centerLng: 77.2090,
    coverageType: 'Residential',
    radiusKm: 4.0
  };

  const handleSectorChange = (sectorName) => {
    setSelectedSector(sectorName);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriverId) {
      if (showToast) showToast('Please select a driver to assign', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/assign-driver-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriverId,
          sector: selectedSector,
          vehicle: assignedVehicle,
          areaName: activeSectorData.name,
          areaDisplayName: activeSectorData.displayName,
          areaId: activeSectorData._id || activeSectorData.id
        })
      });

      const json = await res.json();
      if (res.ok) {
        if (showToast) showToast(json.message || `Driver assigned to ${selectedSector} successfully!`, 'success');
        if (onAssignmentComplete) onAssignmentComplete();
      } else {
        if (showToast) showToast(json.message || 'Failed to assign area', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Server error assigning driver to area', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">MUNICIPAL FLEET DISPATCH</span>
          <h2 className="text-2xl font-bold text-[#0F172A]">Driver Area & Sector Assignment</h2>
          <p className="text-xs text-slate-400">
            Allocate municipal collection sectors, coverage routes, and designated waste trucks to fleet drivers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assignment Configuration Form */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Dispatch Configuration</h3>
              <p className="text-xs text-slate-400">Select driver and bind to municipal route perimeter</p>
            </div>
          </div>

          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            {/* Driver Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Fleet Driver Operator *</label>
              <select
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
              >
                {drivers.map(drv => (
                  <option key={drv._id} value={drv._id}>
                    {drv.name} ({drv.customId || 'DRV'}) — Current: {drv.activeSector || 'Unassigned'}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Area / Sector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Target Sector / Ward *</label>
              {serviceAreas.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs space-y-1">
                  <span className="font-bold">No Service Areas Created</span>
                  <p className="text-[11px] text-amber-700">Please go to <strong>Service Areas & Sectors</strong> to create your city service perimeters first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto">
                  {serviceAreas.map(sec => (
                    <div
                      key={sec._id}
                      onClick={() => handleSectorChange(sec.name)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        selectedSector === sec.name
                          ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 ${selectedSector === sec.name ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">{sec.displayName || sec.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block pl-5">{sec.coverageType || 'Residential'} • {sec.radiusKm || 4} km coverage</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedSector === sec.name ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}>
                        {selectedSector === sec.name && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Assignment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-xs">
                  Designated Waste Vehicle Plate / ID *
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {availableVehicles.length} Available Vehicles
                </span>
              </div>

              {availableVehicles.length > 0 ? (
                <div className="relative">
                  <Truck className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                  <select
                    required
                    value={assignedVehicle}
                    onChange={e => setAssignedVehicle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500 font-medium text-slate-800"
                  >
                    <option value="">-- Select Available Registered Vehicle --</option>
                    {availableVehicles.map(veh => {
                      const isCurrentlyWithThisDriver = activeDriver && (
                        veh.assignedDriverName === activeDriver.name || 
                        activeDriver.assignedVehicle === veh.vehicleNumber
                      );
                      return (
                        <option key={veh._id} value={veh.vehicleNumber}>
                          {veh.vehicleNumber} — {veh.vehicleType || 'Truck'} ({veh.fuelType || 'CNG'}, {veh.capacityKg || 2500} KG) {isCurrentlyWithThisDriver ? '[Currently Assigned to this Driver]' : '[Available / Unassigned]'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span>No Unassigned Vehicles in Registry</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    All registered garbage vehicles are currently assigned to other drivers. Please add a new vehicle in <strong>Garbage Vehicles</strong> or unassign one first.
                  </p>
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Or enter manual vehicle number (e.g. DL-01-EA-4921)"
                      value={assignedVehicle}
                      onChange={e => setAssignedVehicle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs focus:outline-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active Driver Overview Card */}
            {activeDriver && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Driver Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${activeDriver.isOnDuty ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {activeDriver.isOnDuty ? 'On Duty' : 'Off Shift'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Assigned Call-Sign:</span>
                  <span className="font-mono font-bold text-slate-700">{activeDriver.customId || 'DRV-902'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Currently Bound To:</span>
                  <span className="font-semibold text-emerald-600">{activeDriver.activeSector || 'None'}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-[#00B074] hover:bg-[#009663] text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {saving ? 'Broadcasting Area Assignment...' : 'Confirm Driver Area & Vehicle Assignment'}
            </button>
          </form>
        </div>

        {/* Right Column: Leaflet Sector Perimeter & Active Fleet Roster */}
        <div className="lg:col-span-6 space-y-6">
          {/* Leaflet Visualizer for Selected Area */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">LEAFLET SECTOR BOUNDARY & MAP</span>
                <h4 className="font-bold text-sm text-white">{activeSectorData.name}</h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80">
                {Number(activeSectorData.centerLat || 28.6139).toFixed(4)}°, {Number(activeSectorData.centerLng || 77.2090).toFixed(4)}°
              </span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-slate-700 relative shadow-inner bg-slate-950">
              <MapContainer
                center={[activeSectorData.centerLat || 28.6139, activeSectorData.centerLng || 77.2090]}
                zoom={14}
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
                <MapCenterFollower center={[activeSectorData.centerLat || 28.6139, activeSectorData.centerLng || 77.2090]} />

                {/* Free Shape Polygon Boundary */}
                {Array.isArray(activeSectorData.polygonCoordinates) && activeSectorData.polygonCoordinates.length >= 3 && (
                  <Polygon
                    positions={activeSectorData.polygonCoordinates.map(p => (Array.isArray(p) ? p : [p.lat, p.lng]))}
                    pathOptions={{ color: '#00B074', fillColor: '#00B074', fillOpacity: 0.22, weight: 2.5 }}
                  />
                )}

                {/* Or Circular Coverage */}
                {(!activeSectorData.polygonCoordinates || activeSectorData.polygonCoordinates.length < 3) && (
                  <Circle
                    center={[activeSectorData.centerLat || 28.6139, activeSectorData.centerLng || 77.2090]}
                    radius={(Number(activeSectorData.radiusKm) || 4.0) * 1000}
                    pathOptions={{ color: '#00B074', fillColor: '#00B074', fillOpacity: 0.16, weight: 2, dashArray: '4, 6' }}
                  />
                )}

                <Marker
                  position={[activeSectorData.centerLat || 28.6139, activeSectorData.centerLng || 77.2090]}
                  icon={sectorPinIcon}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      <strong className="block text-slate-800">{activeSectorData.name}</strong>
                      <span className="text-slate-500">{activeSectorData.displayName || activeSectorData.coverage}</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Sector Deployment:</span>
              <span className="font-bold text-emerald-400">{activeSectorData.coverage || activeSectorData.coverageType || 'Municipal Collection'}</span>
            </div>
          </div>

          {/* Current Fleet Deployment Roster */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" /> Active Sector Assignments Roster
            </h4>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {drivers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No drivers found.</p>
              ) : (
                drivers.map(drv => (
                  <div key={drv._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{drv.name}</span>
                      <span className="text-[11px] text-slate-400">{drv.assignedVehicle || 'No Vehicle Assigned'}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border block ${
                        drv.activeSector && drv.activeSector !== 'Unassigned' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {drv.activeSector || 'Unassigned Sector'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
