import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Rectangle, 
  Polygon,
  Polyline,
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Crosshair, 
  Move, 
  Square, 
  Circle as CircleIcon, 
  MousePointer, 
  Maximize2,
  PenTool,
  Undo2,
  Trash2,
  CheckCircle2,
  Plus,
  Layers,
  Hexagon
} from 'lucide-react';
import { MapResizeHandler } from '../../../components/MapCustomIcons.js';

// Custom SVG Map Pin Icon for Center
const pinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="#00B074" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
  <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
</svg>
`;

const customPinIcon = L.divIcon({
  html: pinSvg,
  className: 'custom-leaflet-marker',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

// Vertex Handle Icon for Free-Shape Polygon
const createPolygonVertexIcon = (index) => L.divIcon({
  html: `
    <div style="
      width: 22px; 
      height: 22px; 
      background: #00B074; 
      border: 2px solid #ffffff; 
      border-radius: 50%; 
      box-shadow: 0 3px 8px rgba(0,0,0,0.5); 
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 900;
      color: #ffffff;
      user-select: none;
    ">
      ${index}
    </div>
  `,
  className: 'custom-polygon-vertex-icon',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Corner handle icons for Square
const createCornerHandleIcon = (label) => L.divIcon({
  html: `
    <div style="
      width: 22px; 
      height: 22px; 
      background: #ffffff; 
      border: 3px solid #00B074; 
      border-radius: 6px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.45); 
      cursor: crosshair;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 900;
      color: #00B074;
      user-select: none;
    ">
      ${label}
    </div>
  `,
  className: 'custom-corner-handle-icon',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const nwIcon = createCornerHandleIcon('NW');
const neIcon = createCornerHandleIcon('NE');
const seIcon = createCornerHandleIcon('SE');
const swIcon = createCornerHandleIcon('SW');

// Helper: Geodesic Shoelace formula for polygon area (km²)
export function calculatePolygonAreaSqKm(coords) {
  if (!coords || coords.length < 3) return 0;
  const lats = coords.map(p => (Array.isArray(p) ? p[0] : p.lat));
  const lngs = coords.map(p => (Array.isArray(p) ? p[1] : p.lng));
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const cosLat = Math.cos((avgLat * Math.PI) / 180);

  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const x1 = lngs[i] * 111.32 * cosLat;
    const y1 = lats[i] * 111.32;
    const x2 = lngs[j] * 111.32 * cosLat;
    const y2 = lats[j] * 111.32;
    area += x1 * y2 - x2 * y1;
  }
  return Number((Math.abs(area) / 2).toFixed(2));
}

// Helper: Perimeter in km
export function calculatePolygonPerimeterKm(coords) {
  if (!coords || coords.length < 2) return 0;
  const lats = coords.map(p => (Array.isArray(p) ? p[0] : p.lat));
  const lngs = coords.map(p => (Array.isArray(p) ? p[1] : p.lng));
  const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const cosLat = Math.cos((avgLat * Math.PI) / 180);

  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const dx = (lngs[j] - lngs[i]) * 111.32 * cosLat;
    const dy = (lats[j] - lats[i]) * 111.32;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return Number(perimeter.toFixed(2));
}

// Helper: Centroid of polygon
export function calculatePolygonCentroid(coords) {
  if (!coords || coords.length === 0) return null;
  const lats = coords.map(p => (Array.isArray(p) ? p[0] : p.lat));
  const lngs = coords.map(p => (Array.isArray(p) ? p[1] : p.lng));
  return [
    Number((lats.reduce((a, b) => a + b, 0) / coords.length).toFixed(6)),
    Number((lngs.reduce((a, b) => a + b, 0) / coords.length).toFixed(6))
  ];
}

// Helper: Generate regular polygon vertices around center
export function generateDefaultPolygon(centerLat, centerLng, sides = 5, radiusKm = 2.0) {
  const cosLat = Math.cos((centerLat * Math.PI) / 180) || 0.878;
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * cosLat);
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const ptLat = Number((centerLat + dLat * Math.sin(angle)).toFixed(6));
    const ptLng = Number((centerLng + dLng * Math.cos(angle)).toFixed(6));
    pts.push([ptLat, ptLng]);
  }
  return pts;
}

// Handles clicks on the map
function MapEventDispatcher({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    }
  });
  return null;
}

// Re-centers map when center prop updates
function MapCenterUpdater({ center }) {
  const map = useMap();
  const prevCenter = useRef(null);

  useEffect(() => {
    if (!center || !center[0] || !center[1] || !map) return;
    if (!prevCenter.current) {
      map.setView(center, map.getZoom() || 14, { animate: false });
      prevCenter.current = center;
    } else {
      const dLat = Math.abs(prevCenter.current[0] - center[0]);
      const dLng = Math.abs(prevCenter.current[1] - center[1]);
      if (dLat > 0.05 || dLng > 0.05) {
        map.panTo(center, { animate: true, duration: 0.8 });
        prevCenter.current = center;
      }
    }
  }, [center, map]);

  return null;
}

export default function InteractiveAreaMap({
  lat = 28.6139,
  lng = 77.2090,
  radiusKm = 4.0,
  coverageShape = 'polygon', // 'polygon' | 'square' | 'circle'
  polygonCoordinates = [],
  squareWidthKm = 4.0,
  squareHeightKm = 4.0,
  bounds: customBounds,
  interactive = true,
  onLocationChange,
  onSquareChange,
  onPolygonChange,
  height = '350px'
}) {
  const markerRef = useRef(null);
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 28.6139;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 77.2090;

  const [points, setPoints] = useState(() => {
    if (Array.isArray(polygonCoordinates) && polygonCoordinates.length >= 3) {
      return polygonCoordinates.map(p => (Array.isArray(p) ? p : [p.lat, p.lng]));
    }
    return generateDefaultPolygon(safeLat, safeLng, 6, 2.0);
  });

  // Sync with incoming polygonCoordinates prop
  useEffect(() => {
    if (Array.isArray(polygonCoordinates) && polygonCoordinates.length >= 3) {
      const formatted = polygonCoordinates.map(p => (Array.isArray(p) ? p : [p.lat, p.lng]));
      setPoints(formatted);
    }
  }, [polygonCoordinates]);

  // Point-by-point drawing mode (click map to add vertices)
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

  // Square 2-click draw mode
  const [isDrawingSquare, setIsDrawingSquare] = useState(false);
  const [firstSquarePoint, setFirstSquarePoint] = useState(null);

  // Notify parent of polygon updates
  const notifyPolygon = useCallback((newPoints) => {
    if (!newPoints || newPoints.length < 3) return;
    const areaSqKm = calculatePolygonAreaSqKm(newPoints);
    const perimeterKm = calculatePolygonPerimeterKm(newPoints);
    const centroid = calculatePolygonCentroid(newPoints);

    const formatted = newPoints.map(p => ({
      lat: p[0],
      lng: p[1]
    }));

    if (onPolygonChange) {
      onPolygonChange({
        coordinates: formatted,
        areaSqKm,
        perimeterKm,
        centerLat: centroid ? centroid[0] : safeLat,
        centerLng: centroid ? centroid[1] : safeLng
      });
    }
  }, [onPolygonChange, safeLat, safeLng]);

  // Drag a single vertex of the polygon
  const handleVertexDrag = (index, e) => {
    const newPos = e.target.getLatLng();
    const updated = [...points];
    updated[index] = [
      Number(newPos.lat.toFixed(6)),
      Number(newPos.lng.toFixed(6))
    ];
    setPoints(updated);
    notifyPolygon(updated);
  };

  // Undo last added point
  const handleUndoPoint = () => {
    if (points.length <= 3) return;
    const updated = points.slice(0, -1);
    setPoints(updated);
    notifyPolygon(updated);
  };

  // Clear all points to start drawing from scratch
  const handleClearPoints = () => {
    setPoints([]);
    setIsDrawingPolygon(true);
  };

  // Quick Preset Shapes for Free Shape Boundary
  const handlePolygonPreset = (sides) => {
    const newPts = generateDefaultPolygon(safeLat, safeLng, sides, 2.2);
    setPoints(newPts);
    setIsDrawingPolygon(false);
    notifyPolygon(newPts);
  };

  const squareBounds = useMemo(() => {
    if (customBounds && customBounds.north && customBounds.south) {
      return {
        north: Number(customBounds.north),
        south: Number(customBounds.south),
        east: Number(customBounds.east),
        west: Number(customBounds.west)
      };
    }

    const cosLat = Math.cos((safeLat * Math.PI) / 180) || 0.878;
    const dLat = (Number(squareHeightKm) / 2) / 111;
    const dLng = (Number(squareWidthKm) / 2) / (111 * cosLat);

    return {
      north: Number((safeLat + dLat).toFixed(6)),
      south: Number((safeLat - dLat).toFixed(6)),
      east: Number((safeLng + dLng).toFixed(6)),
      west: Number((safeLng - dLng).toFixed(6))
    };
  }, [customBounds, safeLat, safeLng, squareWidthKm, squareHeightKm]);

  const { north, south, east, west } = squareBounds;

  const currentWidthKm = useMemo(() => {
    const cosLat = Math.cos((((north + south) / 2) * Math.PI) / 180) || 0.878;
    return Number((Math.abs(east - west) * 111 * cosLat).toFixed(2));
  }, [north, south, east, west]);

  const currentHeightKm = useMemo(() => {
    return Number((Math.abs(north - south) * 111).toFixed(2));
  }, [north, south]);

  const currentAreaSqKm = Number((currentWidthKm * currentHeightKm).toFixed(2));

  const centerPosition = useMemo(() => {
    return [safeLat, safeLng];
  }, [safeLat, safeLng]);

  const leafletRectangleBounds = useMemo(() => {
    return [
      [south, west],
      [north, east]
    ];
  }, [south, west, north, east]);

  // Center Marker Drag: moves the center pin
  const handleCenterDrag = (e) => {
    const newPos = e.target.getLatLng();
    const newLat = Number(newPos.lat.toFixed(6));
    const newLng = Number(newPos.lng.toFixed(6));

    if (onLocationChange) {
      onLocationChange(newLat, newLng);
    }

    if (coverageShape === 'polygon' && points.length >= 3) {
      // Shift entire polygon by delta
      const dLat = newLat - safeLat;
      const dLng = newLng - safeLng;
      const shifted = points.map(p => [
        Number((p[0] + dLat).toFixed(6)),
        Number((p[1] + dLng).toFixed(6))
      ]);
      setPoints(shifted);
      notifyPolygon(shifted);
    } else if (coverageShape === 'square' && onSquareChange) {
      const cosLat = Math.cos((newLat * Math.PI) / 180) || 0.878;
      const dLat = (currentHeightKm / 2) / 111;
      const dLng = (currentWidthKm / 2) / (111 * cosLat);

      onSquareChange({
        north: Number((newLat + dLat).toFixed(6)),
        south: Number((newLat - dLat).toFixed(6)),
        east: Number((newLng + dLng).toFixed(6)),
        west: Number((newLng - dLng).toFixed(6)),
        widthKm: currentWidthKm,
        heightKm: currentHeightKm,
        centerLat: newLat,
        centerLng: newLng
      });
    }
  };

  // Square corner drag
  const handleCornerDrag = (corner, e) => {
    const newPos = e.target.getLatLng();
    const dragLat = Number(newPos.lat.toFixed(6));
    const dragLng = Number(newPos.lng.toFixed(6));

    let updatedNorth = north;
    let updatedSouth = south;
    let updatedEast = east;
    let updatedWest = west;

    if (corner === 'NW') {
      updatedNorth = Math.max(dragLat, south + 0.002);
      updatedWest = Math.min(dragLng, east - 0.002);
    } else if (corner === 'NE') {
      updatedNorth = Math.max(dragLat, south + 0.002);
      updatedEast = Math.max(dragLng, west + 0.002);
    } else if (corner === 'SE') {
      updatedSouth = Math.min(dragLat, north - 0.002);
      updatedEast = Math.max(dragLng, west + 0.002);
    } else if (corner === 'SW') {
      updatedSouth = Math.min(dragLat, north - 0.002);
      updatedWest = Math.min(dragLng, east - 0.002);
    }

    const newCenterLat = Number(((updatedNorth + updatedSouth) / 2).toFixed(6));
    const newCenterLng = Number(((updatedEast + updatedWest) / 2).toFixed(6));
    const cosLat = Math.cos((newCenterLat * Math.PI) / 180) || 0.878;
    const newWidthKm = Number((Math.abs(updatedEast - updatedWest) * 111 * cosLat).toFixed(2));
    const newHeightKm = Number((Math.abs(updatedNorth - updatedSouth) * 111).toFixed(2));

    if (onLocationChange) onLocationChange(newCenterLat, newCenterLng);

    if (onSquareChange) {
      onSquareChange({
        north: updatedNorth,
        south: updatedSouth,
        east: updatedEast,
        west: updatedWest,
        widthKm: newWidthKm,
        heightKm: newHeightKm,
        centerLat: newCenterLat,
        centerLng: newCenterLng
      });
    }
  };

  // Map Click Handler (Dispatches to polygon drawing, square drawing, or pin move)
  const handleMapClick = (clickLat, clickLng) => {
    if (coverageShape === 'polygon') {
      if (isDrawingPolygon) {
        // Append point to custom free shape
        const updated = [...points, [clickLat, clickLng]];
        setPoints(updated);
        notifyPolygon(updated);
      } else {
        // Move center pin
        if (onLocationChange) onLocationChange(clickLat, clickLng);
      }
    } else if (coverageShape === 'square') {
      if (isDrawingSquare) {
        if (!firstSquarePoint) {
          setFirstSquarePoint([clickLat, clickLng]);
        } else {
          const lat1 = firstSquarePoint[0];
          const lng1 = firstSquarePoint[1];
          const lat2 = clickLat;
          const lng2 = clickLng;

          const newNorth = Number(Math.max(lat1, lat2).toFixed(6));
          const newSouth = Number(Math.min(lat1, lat2).toFixed(6));
          const newEast = Number(Math.max(lng1, lng2).toFixed(6));
          const newWest = Number(Math.min(lng1, lng2).toFixed(6));

          const newCenterLat = Number(((newNorth + newSouth) / 2).toFixed(6));
          const newCenterLng = Number(((newEast + newWest) / 2).toFixed(6));
          const cosLat = Math.cos((newCenterLat * Math.PI) / 180) || 0.878;
          const newWidthKm = Number((Math.abs(newEast - newWest) * 111 * cosLat).toFixed(2));
          const newHeightKm = Number((Math.abs(newNorth - newSouth) * 111).toFixed(2));

          if (onLocationChange) onLocationChange(newCenterLat, newCenterLng);
          if (onSquareChange) {
            onSquareChange({
              north: newNorth,
              south: newSouth,
              east: newEast,
              west: newWest,
              widthKm: Math.max(0.5, newWidthKm),
              heightKm: Math.max(0.5, newHeightKm),
              centerLat: newCenterLat,
              centerLng: newCenterLng
            });
          }
          setIsDrawingSquare(false);
          setFirstSquarePoint(null);
        }
      } else {
        if (onLocationChange) onLocationChange(clickLat, clickLng);
      }
    } else {
      // Circle: click moves center pin
      if (onLocationChange) onLocationChange(clickLat, clickLng);
    }
  };

  // Live Polygon Metrics
  const polygonArea = useMemo(() => calculatePolygonAreaSqKm(points), [points]);
  const polygonPerimeter = useMemo(() => calculatePolygonPerimeterKm(points), [points]);

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden relative shadow-inner z-0 bg-slate-950">
      <MapContainer
        center={centerPosition}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapResizeHandler />
        <MapCenterUpdater center={centerPosition} />

        {interactive && (
          <MapEventDispatcher onMapClick={handleMapClick} />
        )}

        {coverageShape === 'polygon' && (
          <>
            {points.length >= 3 ? (
              <Polygon
                positions={points}
                pathOptions={{
                  color: '#00B074',
                  fillColor: '#00B074',
                  fillOpacity: 0.22,
                  weight: 3,
                  dashArray: isDrawingPolygon ? '6, 6' : null
                }}
              />
            ) : points.length > 0 ? (
              <Polyline
                positions={points}
                pathOptions={{
                  color: '#00B074',
                  weight: 3,
                  dashArray: '6, 6'
                }}
              />
            ) : null}

            {/* Draggable Numbered Vertex Handles */}
            {interactive && points.map((pt, idx) => (
              <Marker
                key={`vertex-${idx}-${pt[0]}-${pt[1]}`}
                position={pt}
                draggable={interactive}
                eventHandlers={{
                  dragend: (e) => handleVertexDrag(idx, e)
                }}
                icon={createPolygonVertexIcon(idx + 1)}
              />
            ))}
          </>
        )}

        {coverageShape === 'square' && (
          <>
            <Rectangle
              bounds={leafletRectangleBounds}
              pathOptions={{
                color: '#00B074',
                fillColor: '#00B074',
                fillOpacity: 0.18,
                weight: 2.5,
                dashArray: '6, 6'
              }}
            />

            {interactive && (
              <>
                <Marker
                  position={[north, west]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleCornerDrag('NW', e) }}
                  icon={nwIcon}
                />
                <Marker
                  position={[north, east]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleCornerDrag('NE', e) }}
                  icon={neIcon}
                />
                <Marker
                  position={[south, east]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleCornerDrag('SE', e) }}
                  icon={seIcon}
                />
                <Marker
                  position={[south, west]}
                  draggable={true}
                  eventHandlers={{ dragend: (e) => handleCornerDrag('SW', e) }}
                  icon={swIcon}
                />
              </>
            )}

            {isDrawingSquare && firstSquarePoint && (
              <Circle
                center={firstSquarePoint}
                radius={80}
                pathOptions={{
                  color: '#F59E0B',
                  fillColor: '#F59E0B',
                  fillOpacity: 0.9,
                  weight: 3
                }}
              />
            )}
          </>
        )}

        {coverageShape === 'circle' && (
          <Circle
            center={centerPosition}
            radius={Number(radiusKm) * 1000}
            pathOptions={{
              color: '#00B074',
              fillColor: '#00B074',
              fillOpacity: 0.16,
              weight: 2.5,
              dashArray: '4, 8'
            }}
          />
        )}

        <Marker
          draggable={interactive}
          eventHandlers={interactive ? { dragend: handleCenterDrag } : {}}
          position={centerPosition}
          ref={markerRef}
          icon={customPinIcon}
        />
      </MapContainer>

      {interactive && coverageShape === 'polygon' && (
        <div className="absolute top-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Draw / Done Toggle */}
            <button
              type="button"
              onClick={() => setIsDrawingPolygon(!isDrawingPolygon)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-md flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md ${
                isDrawingPolygon 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' 
                  : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 hover:bg-slate-900'
              }`}
            >
              <PenTool className="w-3 h-3" />
              <span>
                {isDrawingPolygon ? '✅ Done Drawing (Click Map to Add)' : '✏️ Click Map to Add Points'}
              </span>
            </button>

            {points.length > 3 && (
              <button
                type="button"
                onClick={handleUndoPoint}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md flex items-center gap-1 transition cursor-pointer backdrop-blur-md"
                title="Undo last point"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearPoints}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900/90 hover:bg-rose-950 text-rose-300 border border-rose-900/60 shadow-md flex items-center gap-1 transition cursor-pointer backdrop-blur-md"
              title="Clear shape and redraw"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/80 shadow-md">
            <span className="text-[9px] font-bold text-slate-400 mr-1">Presets:</span>
            {[
              { label: '5-Pt', sides: 5 },
              { label: '6-Pt', sides: 6 },
              { label: '8-Pt', sides: 8 }
            ].map(preset => (
              <button
                key={preset.sides}
                type="button"
                onClick={() => handlePolygonPreset(preset.sides)}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition cursor-pointer ${
                  points.length === preset.sides
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {interactive && coverageShape === 'square' && (
        <div className="absolute top-2 left-2 right-2 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setIsDrawingSquare(!isDrawingSquare);
              setFirstSquarePoint(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-md flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md ${
              isDrawingSquare 
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse' 
                : 'bg-slate-900/90 text-emerald-300 border-slate-700/80 hover:bg-slate-900'
            }`}
          >
            <Square className="w-3 h-3" />
            <span>
              {isDrawingSquare 
                ? (firstSquarePoint ? 'Click Point 2 (Opposite Corner)...' : 'Click Point 1 on Map...') 
                : '✏️ Select Square (Click 2 Points)'}
            </span>
          </button>
        </div>
      )}

      {interactive && (
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[10px] text-white shadow-xl flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {coverageShape === 'polygon' ? (
              <span className="font-bold">
                Free-Shape Boundary: <span className="text-emerald-400">{points.length} Points</span>
                <span className="text-slate-300 ml-1.5">({polygonArea} km² area • {polygonPerimeter} km perimeter)</span>
              </span>
            ) : coverageShape === 'square' ? (
              <span className="font-bold">
                Square Box: <span className="text-emerald-400">{currentWidthKm} KM (W) × {currentHeightKm} KM (H)</span>
                <span className="text-slate-400 ml-1.5">({currentAreaSqKm} km² area)</span>
              </span>
            ) : (
              <span className="font-bold">
                Radius Circle: <span className="text-emerald-400">{radiusKm} KM</span>
              </span>
            )}
          </div>

          <div className="text-[9px] text-slate-400 font-mono">
            {coverageShape === 'polygon' 
              ? (isDrawingPolygon 
                  ? '🖱️ Click anywhere on map to add boundary points' 
                  : '💡 Drag numbered pins (1, 2, 3...) to reshape boundary') 
              : coverageShape === 'square'
              ? '💡 Drag corners (NW, NE, SE, SW) or center pin'
              : '💡 Drag pin to move coverage center'}
          </div>
        </div>
      )}
    </div>
  );
}
