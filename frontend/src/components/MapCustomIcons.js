import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Standard Free OpenStreetMap Tile Layer (Zero API Key required)
 */
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Universal Map Resize Handler
 * Forces Leaflet to recalculate container bounds on mount and after delays,
 * curing grey/blank tile issues caused by tab switching or modal animations.
 */
export function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.invalidateSize();

    const t1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const t2 = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    const t3 = setTimeout(() => {
      map.invalidateSize();
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return null;
}

/**
 * Custom Vehicle Map Icon
 * High-visibility waste collection truck logo with real-time telemetry pulse.
 * Uses inline styling so Vite/Tailwind purging never affects rendering.
 */
export function createVehicleIcon({
  label = 'Collection Truck',
  sublabel = '',
  isEmergency = false,
  isOffDuty = false
} = {}) {
  const primaryGradient = isOffDuty
    ? 'linear-gradient(135deg, #64748b 0%, #334155 100%)'
    : (isEmergency
      ? 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)'
      : 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)');
  const borderColor = isOffDuty ? '#94a3b8' : (isEmergency ? '#fde68a' : '#ffffff');
  const pulseColor = isOffDuty ? 'rgba(100, 116, 139, 0.25)' : (isEmergency ? 'rgba(245, 158, 11, 0.45)' : 'rgba(16, 185, 129, 0.45)');
  const tagBg = isOffDuty ? 'rgba(30, 41, 59, 0.95)' : (isEmergency ? 'rgba(69, 10, 10, 0.95)' : 'rgba(15, 23, 42, 0.95)');
  const tagColor = isOffDuty ? '#cbd5e1' : (isEmergency ? '#fef08a' : '#ffffff');
  const tagBorder = isOffDuty ? '#475569' : (isEmergency ? '#b45309' : '#334155');

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      <!-- Real-time telemetry radar ping -->
      <div style="position: absolute; top: -6px; left: -6px; width: 52px; height: 52px; border-radius: 9999px; background-color: ${pulseColor}; pointer-events: none; animation: pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      
      <!-- Vehicle Logo Emblem Container -->
      <div style="position: relative; width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #ffffff; background: ${primaryGradient}; border: 2.5px solid ${borderColor}; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3); z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Truck Cabin & Chassis -->
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <!-- Front & Rear Wheels -->
          <circle cx="17" cy="18" r="2.2" fill="#ffffff" stroke="#ffffff"/>
          <circle cx="7" cy="18" r="2.2" fill="#ffffff" stroke="#ffffff"/>
        </svg>
      </div>

      <!-- Vehicle Label Tag -->
      <div style="margin-top: 4px; white-space: nowrap; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: ${tagBg}; color: ${tagColor}; border: 1px solid ${tagBorder}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 3;">
        🚚 ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-vehicle-leaflet-icon',
    iconSize: [42, 64],
    iconAnchor: [21, 32],
    popupAnchor: [0, -28]
  });
}

/**
 * Custom Resident Map Icon
 * Authentic house logo with status coloring for resident property coordinates.
 */
export function createResidentIcon({
  label = 'Resident Home',
  isSelf = true,
  isEmergency = false
} = {}) {
  const primaryGradient = isEmergency
    ? 'linear-gradient(135deg, #e11d48 0%, #b91c1c 100%)'
    : (isSelf ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)');
  const borderColor = isEmergency ? '#fecdd3' : '#ffffff';
  const pulseColor = isEmergency ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.35)';
  const tagBg = isEmergency ? 'rgba(76, 5, 25, 0.95)' : 'rgba(15, 23, 42, 0.95)';
  const tagColor = isEmergency ? '#fecdd3' : '#ffffff';
  const tagBorder = isEmergency ? '#be123c' : '#334155';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      ${isEmergency ? `
        <div style="position: absolute; top: -6px; left: -6px; width: 50px; height: 50px; border-radius: 9999px; background-color: ${pulseColor}; pointer-events: none; animation: pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      ` : ''}
      
      <!-- Resident House Logo Emblem -->
      <div style="position: relative; width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #ffffff; background: ${primaryGradient}; border: 2.5px solid ${borderColor}; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2); z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- House Structure -->
          <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z"/>
          <!-- Doorway -->
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>

      <!-- Resident Label Tag -->
      <div style="margin-top: 4px; white-space: nowrap; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; background: ${tagBg}; color: ${tagColor}; border: 1px solid ${tagBorder}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.5); z-index: 3;">
        🏠 ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-resident-leaflet-icon',
    iconSize: [40, 62],
    iconAnchor: [20, 30],
    popupAnchor: [0, -28]
  });
}

/**
 * Custom Depot / Station Map Icon
 */
export function createDepotIcon({ label = 'Municipal Depot' } = {}) {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      <div style="position: relative; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ffffff; background: linear-gradient(135deg, #475569 0%, #1e293b 100%); border: 2px solid #94a3b8; box-shadow: 0 6px 16px rgba(0,0,0,0.4); z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <path d="M9 9h1"/>
          <path d="M9 13h1"/>
          <path d="M9 17h1"/>
        </svg>
      </div>
      <div style="margin-top: 3px; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: #0f172a; color: #cbd5e1; border: 1px solid #475569; white-space: nowrap;">
        🏢 ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-depot-leaflet-icon',
    iconSize: [38, 58],
    iconAnchor: [19, 29],
    popupAnchor: [0, -26]
  });
}

/**
 * Custom Garbage Spot Map Icon
 * Used for roadside garbage reports and dump locations.
 */
export function createGarbageSpotIcon({ 
  label = 'Garbage Dump', 
  priority = 'High', 
  isCleared = false 
} = {}) {
  const isCritical = priority === 'Critical';
  const primaryGradient = isCleared
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : (isCritical
      ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)'
      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)');
  const borderColor = isCleared ? '#a7f3d0' : (isCritical ? '#fecaca' : '#fef3c7');
  const pulseColor = isCleared ? 'rgba(16, 185, 129, 0.4)' : (isCritical ? 'rgba(220, 38, 38, 0.5)' : 'rgba(245, 158, 11, 0.45)');
  const tagBg = isCleared ? 'rgba(6, 78, 59, 0.95)' : (isCritical ? 'rgba(69, 10, 10, 0.95)' : 'rgba(69, 39, 10, 0.95)');
  const tagColor = isCleared ? '#a7f3d0' : (isCritical ? '#fecaca' : '#fef3c7');
  const tagBorder = isCleared ? '#059669' : (isCritical ? '#b91c1c' : '#d97706');

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; user-select: none;">
      ${!isCleared ? `
        <div style="position: absolute; top: -6px; left: -6px; width: 48px; height: 48px; border-radius: 9999px; background-color: ${pulseColor}; pointer-events: none; animation: pulse 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      ` : ''}
      
      <!-- Garbage Pin Emblem -->
      <div style="position: relative; width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ffffff; background: ${primaryGradient}; border: 2px solid ${borderColor}; box-shadow: 0 8px 20px -3px rgba(0, 0, 0, 0.4); z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </div>

      <!-- Label Badge -->
      <div style="margin-top: 3px; white-space: nowrap; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; background: ${tagBg}; color: ${tagColor}; border: 1px solid ${tagBorder}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); z-index: 3;">
        🗑️ ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-garbage-leaflet-icon',
    iconSize: [38, 58],
    iconAnchor: [19, 29],
    popupAnchor: [0, -26]
  });
}

/**
 * Custom Location Pin Map Icon (Draggable Pin)
 */
export function createLocationPinIcon({ label = 'Drag to Position' } = {}) {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: grab; user-select: none;">
      <div style="position: relative; width: 38px; height: 38px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #ffffff; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border: 3px solid #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.4); z-index: 2;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="margin-top: 3px; white-space: nowrap; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: #0f172a; color: #ffffff; border: 1px solid #334155; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 3;">
        📍 ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-pin-leaflet-icon',
    iconSize: [38, 56],
    iconAnchor: [19, 36],
    popupAnchor: [0, -32]
  });
}

/**
 * Haversine formula: Calculates distance in Kilometers between two coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return 0;
  if (nLat1 === nLat2 && nLon1 === nLon2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = (nLat2 - nLat1) * Math.PI / 180;
  const dLon = (nLon2 - nLon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculates Estimated Time of Arrival (ETA) in Minutes based on distance and municipal speed
 */
export function calculateEtaMinutes(distanceKm, averageSpeedKmh = 22) {
  if (!distanceKm || distanceKm <= 0) return 2;
  const minutes = (distanceKm / averageSpeedKmh) * 60;
  return Math.max(1, Math.round(minutes));
}
