import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { X, Navigation, MapPin, Truck, ExternalLink, Calendar, User } from 'lucide-react';
import { 
  MapResizeHandler, 
  createGarbageSpotIcon, 
  createResidentIcon, 
  createVehicleIcon,
  calculateDistanceKm,
  calculateEtaMinutes
} from './MapCustomIcons.js';

export default function LocationPreviewModal({
  isOpen,
  onClose,
  title = 'Garbage Incident Location',
  customId = '#CMP-LOC',
  lat = 28.6139,
  lng = 77.2090,
  landmark = '',
  address = '',
  status = 'Under Review',
  priority = 'High',
  complaintType = 'Roadside Garbage',
  driverLocation = null, // { lat, lng, driverName, vehicle }
  assignedDriver = '',
  assignedVehicle = ''
}) {
  if (!isOpen) return null;

  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0 ? lat : 28.6139;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && lng !== 0 ? lng : 77.2090;
  const targetCoords = [safeLat, safeLng];

  const hasDriverCoords = driverLocation && 
    typeof driverLocation.lat === 'number' && 
    !isNaN(driverLocation.lat) && 
    typeof driverLocation.lng === 'number' && 
    !isNaN(driverLocation.lng);

  const driverCoords = hasDriverCoords ? [driverLocation.lat, driverLocation.lng] : null;

  const distanceKm = hasDriverCoords ? calculateDistanceKm(driverLocation.lat, driverLocation.lng, safeLat, safeLng) : null;
  const etaMins = distanceKm !== null ? calculateEtaMinutes(distanceKm) : null;

  const targetIcon = useMemo(() => {
    if (complaintType === 'Roadside Garbage' || title.toLowerCase().includes('roadside')) {
      return createGarbageSpotIcon({ 
        label: customId || 'Dump Spot', 
        priority, 
        isCleared: status.toLowerCase().includes('resolv') 
      });
    }
    return createResidentIcon({ 
      label: customId || 'Resident', 
      isEmergency: priority === 'Critical' 
    });
  }, [complaintType, title, customId, priority, status]);

  const truckIcon = useMemo(() => {
    if (!hasDriverCoords) return null;
    return createVehicleIcon({
      label: driverLocation.vehicle || assignedVehicle || 'Assigned Truck',
      isEmergency: priority === 'Critical'
    });
  }, [hasDriverCoords, driverLocation, assignedVehicle, priority]);

  // OpenStreetMap directions URL
  const osmRouteUrl = hasDriverCoords
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${driverCoords[0]}%2C${driverCoords[1]}%3B${targetCoords[0]}%2C${targetCoords[1]}`
    : `https://www.openstreetmap.org/?mlat=${safeLat}&mlon=${safeLng}#map=16/${safeLat}/${safeLng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              {customId}
            </span>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                {landmark || address || 'Leaflet Satellite & Street Telemetry'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leaflet Map Body */}
        <div className="relative w-full h-[360px] bg-slate-950">
          <MapContainer
            center={targetCoords}
            zoom={15}
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

            {/* Target Pin (Garbage or Household) */}
            <Marker position={targetCoords} icon={targetIcon}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="block text-slate-900 font-bold">{title}</strong>
                  <div className="text-slate-600 font-mono text-[10px] mt-0.5">
                    Lat: {safeLat.toFixed(5)}, Lng: {safeLng.toFixed(5)}
                  </div>
                  {landmark && (
                    <div className="text-[10px] text-slate-700 mt-1">
                      <strong>Landmark:</strong> {landmark}
                    </div>
                  )}
                  <div className="text-[10px] text-amber-700 font-bold mt-1">
                    Status: {status} • {priority} Priority
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Assigned Driver Truck Pin if coords available */}
            {hasDriverCoords && truckIcon && (
              <Marker position={driverCoords} icon={truckIcon}>
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="block text-emerald-700 font-bold">
                      {driverLocation.vehicle || assignedVehicle || 'Assigned Truck'}
                    </strong>
                    <div className="text-slate-600 text-[10px]">
                      Driver: {driverLocation.driverName || assignedDriver || 'On Duty'}
                    </div>
                    {distanceKm !== null && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-1">
                        ~{distanceKm} km away (ETA: ~{etaMins} mins)
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating Telemetry Stats Badge */}
          {hasDriverCoords && distanceKm !== null && (
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-white shadow-lg flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned Truck: <strong>~{distanceKm} km</strong> (~{etaMins} mins)</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              Coordinates: {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={osmRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in OpenStreetMap</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
