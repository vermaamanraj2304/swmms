import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, LocateFixed, Navigation, Compass } from 'lucide-react';
import { 
  MapResizeHandler, 
  createGarbageSpotIcon, 
  createLocationPinIcon, 
  createResidentIcon 
} from './MapCustomIcons.js';

/**
 * Controller to smoothly pan the map whenever coordinates change
 */
function MapRecenterController({ center }) {
  const map = useMap();
  const prevCenter = useRef(null);

  useEffect(() => {
    if (!center || isNaN(center[0]) || isNaN(center[1])) return;
    if (!prevCenter.current) {
      map.setView(center, 15, { animate: false });
      prevCenter.current = center;
    } else {
      const dLat = Math.abs(prevCenter.current[0] - center[0]);
      const dLng = Math.abs(prevCenter.current[1] - center[1]);
      if (dLat > 0.00005 || dLng > 0.00005) {
        map.panTo(center, { animate: true, duration: 0.6 });
        prevCenter.current = center;
      }
    }
  }, [center, map]);

  return null;
}

/**
 * Map click event listener to update pin position
 */
function MapClickHandler({ onClick, enabled = true }) {
  useMapEvents({
    click(e) {
      if (!enabled || !onClick) return;
      onClick({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    }
  });
  return null;
}

export default function LocationPickerMap({
  lat = 28.6139,
  lng = 77.2090,
  onChange,
  height = '240px',
  label = 'Garbage Location',
  pinType = 'garbage', // 'garbage' | 'resident' | 'pin'
  priority = 'High',
  allowClick = true,
  allowDrag = true,
  showGpsButton = true,
  className = ''
}) {
  const safeLat = typeof lat === 'number' && !isNaN(lat) && lat !== 0 ? lat : 28.6139;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && lng !== 0 ? lng : 77.2090;
  const position = useMemo(() => [safeLat, safeLng], [safeLat, safeLng]);

  const markerIcon = useMemo(() => {
    if (pinType === 'garbage') {
      return createGarbageSpotIcon({ label, priority });
    }
    if (pinType === 'resident') {
      return createResidentIcon({ label, isSelf: true });
    }
    return createLocationPinIcon({ label });
  }, [pinType, label, priority]);

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker && onChange) {
          const newPos = marker.getLatLng();
          onChange({
            lat: Number(newPos.lat.toFixed(6)),
            lng: Number(newPos.lng.toFixed(6))
          });
        }
      }
    }),
    [onChange]
  );

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (onChange) {
            onChange({
              lat: Number(pos.coords.latitude.toFixed(6)),
              lng: Number(pos.coords.longitude.toFixed(6))
            });
          }
        },
        () => {
          // Fallback to default
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs relative flex flex-col ${className}`}>
      {/* Top Leaflet Bar */}
      <div className="bg-slate-800/95 px-3.5 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-[11px] text-slate-200">
            Interactive Leaflet Pinpoint
          </span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
            ({safeLat.toFixed(4)}, {safeLng.toFixed(4)})
          </span>
        </div>

        {showGpsButton && (
          <button
            type="button"
            onClick={handleLocateMe}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer"
            title="Auto-detect current GPS location"
          >
            <LocateFixed className="w-3 h-3" />
            <span>My Location</span>
          </button>
        )}
      </div>

      {/* Map Leaflet Viewport */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        <MapContainer
          center={position}
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
          <MapRecenterController center={position} />
          {allowClick && <MapClickHandler onClick={onChange} enabled={allowClick} />}

          <Marker
            draggable={allowDrag}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={markerIcon}
          >
            <Popup>
              <div className="p-1 text-xs">
                <strong className="block text-slate-900 font-bold">{label}</strong>
                <span className="text-slate-600 font-mono text-[10px]">
                  {safeLat.toFixed(5)}, {safeLng.toFixed(5)}
                </span>
                {allowDrag && (
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                    Drag pin or click map to move
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Bottom Helper Overlay */}
        <div className="absolute bottom-2 left-2 z-10 bg-slate-900/85 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] text-slate-300 font-medium pointer-events-none flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>Click map or drag pin to position</span>
        </div>
      </div>
    </div>
  );
}
