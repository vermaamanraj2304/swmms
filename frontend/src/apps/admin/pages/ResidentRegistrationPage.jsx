import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  Home, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Send, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  Copy,
  Lock
} from 'lucide-react';
import { MapResizeHandler } from '../../../components/MapCustomIcons.js';

// SVG Resident Home Pin Icon
const residentHomePinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#00B074" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>
`;

const residentHomePinIcon = L.divIcon({
  html: residentHomePinSvg,
  className: 'custom-leaflet-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

function ResidentMapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    }
  });
  return null;
}

function ResidentMapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !center[0] || !center[1] || !map) return;
    map.setView(center, 15, { animate: true });
  }, [center, map]);
  return null;
}

export default function ResidentRegistrationPage({ serviceAreas = [], onRegistrationSuccess, showToast }) {
  // Filter for only active/serviceable areas
  const serviceableAreas = serviceAreas.filter(area => area.status !== 'Inactive');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    sector: serviceableAreas[0]?.displayName || serviceableAreas[0]?.name || '',
    plan: 'Standard Pro (120 Gallons)',
    password: 'Resident@123'
  });

  // Sync default sector when serviceAreas load if not set
  useEffect(() => {
    if (!formData.sector && serviceableAreas.length > 0) {
      setFormData(prev => ({
        ...prev,
        sector: serviceableAreas[0].displayName || serviceableAreas[0].name
      }));
    }
  }, [serviceAreas]);

  // Location States
  // 1. Fixed Location (House / Property GPS coordinates)
  const [fixedCoords, setFixedCoords] = useState({
    lat: 28.6139,
    lng: 77.2090
  });

  // 2. Dynamic Live Location (Live detected resident GPS via Leaflet map)
  const [liveCoords, setLiveCoords] = useState({
    lat: 28.6139,
    lng: 77.2090
  });

  const [geoDetecting, setGeoDetecting] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result state after registration
  const [registrationResult, setRegistrationResult] = useState(null);

  // Auto detect live location on initial mount via Browser Geolocation API & Leaflet map
  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setGeoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6))
        };
        setLiveCoords(newCoords);
        // By default, set fixed coordinates to live coordinates as initial suggestion
        setFixedCoords(newCoords);
        setGeoSuccess(true);
        setGeoDetecting(false);
        if (showToast) showToast('Live GPS coordinates acquired via browser GPS & Leaflet!', 'success');
      },
      (error) => {
        setGeoDetecting(false);
        console.warn('Geolocation error:', error);
        if (showToast) showToast('Could not fetch exact GPS. Default municipal coordinates loaded.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLiveLocation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        plan: formData.plan,
        password: formData.password,
        houseLocation: {
          address: formData.address,
          lat: fixedCoords.lat,
          lng: fixedCoords.lng,
          sector: formData.sector
        },
        liveLocation: {
          lat: liveCoords.lat,
          lng: liveCoords.lng,
          address: formData.address,
          speedKm: 0,
          heading: 'Static',
          lastBroadcastTime: 'Registered Now'
        }
      };

      const res = await fetch('/api/admin/add-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setRegistrationResult(data);
        if (showToast) showToast(`Citizen ${formData.name} onboarded! Credentials dispatched to Email & WhatsApp.`, 'success');
        if (onRegistrationSuccess) onRegistrationSuccess();
      } else {
        if (showToast) showToast(data.message || 'Failed to register resident', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Server error during resident registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`${label} copied to clipboard!`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">CITIZEN ONBOARDING PORTAL</span>
          <h2 className="text-2xl font-bold text-[#0F172A]">Resident Household Registration</h2>
          <p className="text-xs text-slate-400">
            Register citizen with fixed household address and real-time live GPS location via Leaflet. Credentials will be dispatched to Email & WhatsApp automatically.
          </p>
        </div>
      </div>

      {registrationResult ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Resident Successfully Registered!</h3>
              <p className="text-xs text-slate-500">
                Official credentials generated and dispatched to citizen channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CITIZEN LOGIN ID</span>
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-800">{registrationResult.credentials?.customId}</span>
                <button onClick={() => copyToClipboard(registrationResult.credentials?.customId, 'Login ID')} className="text-slate-400 hover:text-slate-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">GENERATED PASSWORD</span>
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-emerald-700">{registrationResult.credentials?.password}</span>
                <button onClick={() => copyToClipboard(registrationResult.credentials?.password, 'Password')} className="text-slate-400 hover:text-slate-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp / Email Action Links */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Automated Credentials Notification
              </span>
              <p className="text-xs text-emerald-700">
                Notification dispatched to: <strong>{registrationResult.user?.email}</strong> & <strong>{registrationResult.user?.phone || 'SMS/WhatsApp'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {registrationResult.dispatch?.whatsappUrl && (
                <a
                  href={registrationResult.dispatch.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Send WhatsApp Direct
                </a>
              )}
              {registrationResult.dispatch?.mailtoUrl && (
                <a
                  href={registrationResult.dispatch.mailtoUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" /> Open Email Client
                </a>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setRegistrationResult(null);
              setFormData({
                name: '', email: '', phone: '', address: '', sector: serviceableAreas[0]?.displayName || serviceableAreas[0]?.name || '', plan: 'Standard Pro (120 Gallons)', password: 'Resident@123'
              });
              detectLiveLocation();
            }}
            className="w-full py-3 bg-[#00B074] text-white font-bold rounded-xl text-xs hover:bg-[#009663] transition"
          >
            Register Another Resident
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Details & Fixed Location */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
              <Home className="w-4 h-4 text-[#00B074]" /> Household Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Citizen Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Citizen Email (For Credentials) *</label>
                <input
                  type="email"
                  required
                  placeholder="priya@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For WhatsApp Dispatch) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Password *</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Fixed House Street Address *</label>
              <input
                type="text"
                required
                placeholder="Flat 302, Green Meadows, Sector 4, New Delhi"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Municipal Ward / Sector <span className="text-emerald-600 font-normal">({serviceableAreas.length} Serviceable Areas)</span>
                </label>
                {serviceableAreas.length > 0 ? (
                  <select
                    value={formData.sector}
                    onChange={e => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                  >
                    {serviceableAreas.map((area) => {
                      const label = area.displayName || `${area.name} (${area.zone || 'Zone'})`;
                      return (
                        <option key={area._id || area.name} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No active service areas configured yet. Please create one in Service Areas first.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Waste Subscription Plan</label>
                <select
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                >
                  <option value="Standard Pro (120 Gallons)">Standard Pro (120 Gallons)</option>
                  <option value="Eco Family (240 Gallons)">Eco Family (240 Gallons)</option>
                  <option value="Community Bulk (500 Gallons)">Community Bulk (500 Gallons)</option>
                </select>
              </div>
            </div>

            {/* Fixed Location Coordinates */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Fixed Property Location Coordinates (Permanent GIS Pin)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Fixed Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={fixedCoords.lat}
                    onChange={e => setFixedCoords({ ...fixedCoords, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Fixed Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={fixedCoords.lng}
                    onChange={e => setFixedCoords({ ...fixedCoords, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#00B074] hover:bg-[#009663] text-white font-bold rounded-xl text-xs transition shadow-sm mt-4 flex items-center justify-center gap-2"
            >
              {submitting ? 'Registering & Dispatching Credentials...' : 'Register Resident & Send Credentials to Email / WhatsApp'}
            </button>
          </div>

          {/* Right Column: Leaflet Live Location Capture */}
          <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                  Leaflet Live Location Capture
                </span>
                <button
                  type="button"
                  onClick={detectLiveLocation}
                  disabled={geoDetecting}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Navigation className={`w-3 h-3 ${geoDetecting ? 'animate-spin' : ''}`} />
                  {geoDetecting ? 'Detecting...' : 'Fetch Live GPS'}
                </button>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                The resident's dynamic live coordinates are captured during registration using Leaflet and browser GPS sensors. You can drag the green pin or click on the map to fine-tune the exact house location.
              </p>

              {/* Dynamic Live Coordinates Badge */}
              <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/80 mb-4 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Captured Live Latitude:</span>
                  <span className="font-mono font-bold text-emerald-400">{liveCoords.lat.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Captured Live Longitude:</span>
                  <span className="font-mono font-bold text-emerald-400">{liveCoords.lng.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Live Status:</span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Live Leaflet GPS
                  </span>
                </div>
              </div>

              {/* Live Leaflet Map Viewport */}
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-700 relative shadow-inner bg-slate-950">
                <MapContainer
                  center={[liveCoords.lat, liveCoords.lng]}
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
                  <ResidentMapCenterUpdater center={[liveCoords.lat, liveCoords.lng]} />
                  <ResidentMapEvents
                    onLocationSelect={(newLat, newLng) => {
                      setLiveCoords({ lat: newLat, lng: newLng });
                      setFixedCoords({ lat: newLat, lng: newLng });
                    }}
                  />
                  <Marker
                    position={[liveCoords.lat, liveCoords.lng]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const pos = e.target.getLatLng();
                        const newLat = Number(pos.lat.toFixed(6));
                        const newLng = Number(pos.lng.toFixed(6));
                        setLiveCoords({ lat: newLat, lng: newLng });
                        setFixedCoords({ lat: newLat, lng: newLng });
                      }
                    }}
                    icon={residentHomePinIcon}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <strong className="block text-slate-800">{formData.name || 'Resident Household'}</strong>
                        <span className="text-slate-500">{formData.address || 'Selected Household Location'}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Dynamic vs Fixed Sync:</span>
              <button
                type="button"
                onClick={() => {
                  setFixedCoords(liveCoords);
                  if (showToast) showToast('Synced fixed house location with live GPS coordinates!', 'info');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline"
              >
                Set House Location to Live GPS
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
