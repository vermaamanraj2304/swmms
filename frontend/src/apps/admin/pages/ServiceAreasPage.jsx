import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Compass, 
  Users, 
  CheckCircle2, 
  Navigation,
  X,
  Crosshair,
  Search,
  Filter,
  Check,
  Building,
  RotateCcw,
  Truck,
  ArrowRight,
  Square,
  Maximize2,
  Circle,
  PenTool,
  Hexagon
} from 'lucide-react';
import InteractiveAreaMap from '../components/InteractiveAreaMap';

export default function ServiceAreasPage({ 
  initialSection = 'all_areas',
  serviceAreas = [], 
  drivers = [], 
  vehicles = [],
  onRefresh, 
  showToast,
  setActiveTab
}) {
  // Navigation tabs: 'all_areas' | 'register_area'
  const [activeSection, setActiveSection] = useState(
    initialSection === 'register_area' ? 'register_area' : 'all_areas'
  );

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection === 'register_area' ? 'register_area' : 'all_areas');
    }
  }, [initialSection]);

  const [selectedArea, setSelectedArea] = useState(serviceAreas[0] || null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  // Filter state for All Area
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Registration Form State
  const initialForm = {
    name: '',
    displayName: '',
    zone: 'Zone 1',
    description: '',
    coverageType: 'Residential',
    centerLat: 28.6139,
    centerLng: 77.2090,
    radiusKm: 4.0,
    coverageShape: 'polygon',
    polygonCoordinates: [],
    perimeterKm: 0,
    squareWidthKm: 4.0,
    squareHeightKm: 4.0,
    areaSqKm: 12.0,
    bounds: null,
    targetHouseholds: 250,
    collectionFrequency: 'Daily Morning (07:00 AM)',
    assignedVehicle: '',
    assignedDriverName: '',
    status: 'Active'
  };

  const [form, setForm] = useState(initialForm);

  // Sync selected area if list changes
  useEffect(() => {
    if (serviceAreas.length > 0 && !selectedArea) {
      setSelectedArea(serviceAreas[0]);
    }
  }, [serviceAreas, selectedArea]);

  // Open Registration Section (Fresh Form)
  const handleOpenRegister = () => {
    setEditingId(null);
    setForm(initialForm);
    setActiveSection('register_area');
    if (setActiveTab) setActiveTab('register_area');
  };

  // Open Edit Section (Populate Form)
  const handleOpenEdit = (area) => {
    setEditingId(area._id);
    const sqW = Number(area.squareWidthKm) || 4.0;
    const sqH = Number(area.squareHeightKm) || sqW;
    setForm({
      name: area.name || '',
      displayName: area.displayName || '',
      zone: area.zone || 'Zone 1',
      description: area.description || '',
      coverageType: area.coverageType || 'Residential',
      centerLat: Number(area.centerLat) || 28.6139,
      centerLng: Number(area.centerLng) || 77.2090,
      radiusKm: Number(area.radiusKm) || 4.0,
      coverageShape: area.coverageShape || (Array.isArray(area.polygonCoordinates) && area.polygonCoordinates.length >= 3 ? 'polygon' : 'square'),
      polygonCoordinates: Array.isArray(area.polygonCoordinates) ? area.polygonCoordinates : [],
      perimeterKm: Number(area.perimeterKm) || 0,
      squareWidthKm: sqW,
      squareHeightKm: sqH,
      areaSqKm: Number(area.areaSqKm) || Number((sqW * sqH).toFixed(2)),
      bounds: area.bounds || null,
      targetHouseholds: Number(area.targetHouseholds) || 250,
      collectionFrequency: area.collectionFrequency || 'Daily Morning (07:00 AM)',
      assignedVehicle: area.assignedVehicle || '',
      assignedDriverName: area.assignedDriverName || '',
      status: area.status || 'Active'
    });
    setActiveSection('register_area');
    if (setActiveTab) setActiveTab('register_area');
  };

  // Quick Preset Helper for Square Box
  const handlePresetSquare = (sideKm) => {
    const safeLat = Number(form.centerLat) || 28.6139;
    const safeLng = Number(form.centerLng) || 77.2090;
    const cosLat = Math.cos((safeLat * Math.PI) / 180) || 0.878;
    const dLat = (sideKm / 2) / 111;
    const dLng = (sideKm / 2) / (111 * cosLat);

    setForm(prev => ({
      ...prev,
      coverageShape: 'square',
      squareWidthKm: sideKm,
      squareHeightKm: sideKm,
      areaSqKm: Number((sideKm * sideKm).toFixed(2)),
      bounds: {
        north: Number((safeLat + dLat).toFixed(6)),
        south: Number((safeLat - dLat).toFixed(6)),
        east: Number((safeLng + dLng).toFixed(6)),
        west: Number((safeLng - dLng).toFixed(6))
      }
    }));
  };

  // Adjust Width & Height dimensions directly
  const handleDimensionsChange = (newWidth, newHeight) => {
    const w = Math.max(0.5, Number(newWidth) || 1);
    const h = Math.max(0.5, Number(newHeight) || 1);
    const safeLat = Number(form.centerLat) || 28.6139;
    const safeLng = Number(form.centerLng) || 77.2090;
    const cosLat = Math.cos((safeLat * Math.PI) / 180) || 0.878;
    const dLat = (h / 2) / 111;
    const dLng = (w / 2) / (111 * cosLat);

    setForm(prev => ({
      ...prev,
      coverageShape: 'square',
      squareWidthKm: w,
      squareHeightKm: h,
      areaSqKm: Number((w * h).toFixed(2)),
      bounds: {
        north: Number((safeLat + dLat).toFixed(6)),
        south: Number((safeLat - dLat).toFixed(6)),
        east: Number((safeLng + dLng).toFixed(6)),
        west: Number((safeLng - dLng).toFixed(6))
      }
    }));
  };

  // Cancel edit and return to new registration
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  // Detect GPS location directly in form to pin center coordinates
  const handleDetectCenterGps = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm(prev => ({
          ...prev,
          centerLat: Number(latitude.toFixed(6)),
          centerLng: Number(longitude.toFixed(6))
        }));
        setDetectingGps(false);
        if (showToast) showToast('📍 Captured live GPS coordinates for sector center pin!', 'success');
      },
      (error) => {
        setDetectingGps(false);
        console.warn('Geolocation error:', error);
        if (showToast) showToast('Could not fetch GPS. You can drag the pin on map or nudge coordinates.', 'info');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Nudge coordinates on Map
  const handleNudge = (dLat, dLng) => {
    setForm(prev => ({
      ...prev,
      centerLat: Number((prev.centerLat + dLat).toFixed(6)),
      centerLng: Number((prev.centerLng + dLng).toFixed(6))
    }));
  };

  // Submit Handler for Register / Update Area
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.displayName.trim()) {
      if (showToast) showToast('Please enter both Sector Code and Display Title', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = editingId 
        ? `/api/admin/service-areas/${editingId}`
        : '/api/admin/service-areas';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const json = await res.json();
      if (res.ok) {
        if (showToast) showToast(json.message || `🎉 Service area ${form.name} saved successfully!`, 'success');
        setForm(initialForm);
        setEditingId(null);
        if (onRefresh) onRefresh();
        // Return to All Area list after successful creation
        setActiveSection('all_areas');
        if (setActiveTab) setActiveTab('all_areas');
      } else {
        if (showToast) showToast(json.message || 'Failed to save area', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Server error saving service area', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (areaId, areaName) => {
    if (!window.confirm(`Are you sure you want to delete sector ${areaName || ''}?`)) return;
    try {
      const res = await fetch(`/api/admin/service-areas/${areaId}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        if (showToast) showToast(json.message || 'Service sector removed', 'info');
        if (onRefresh) onRefresh();
        if (selectedArea?._id === areaId) {
          setSelectedArea(serviceAreas.find(a => a._id !== areaId) || null);
        }
      } else {
        if (showToast) showToast(json.message || 'Failed to delete area', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Server error deleting service area', 'error');
    }
  };

  // Filtered list of service areas
  const filteredAreas = serviceAreas.filter(area => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      (area.name || '').toLowerCase().includes(q) || 
      (area.displayName || '').toLowerCase().includes(q) ||
      (area.zone || '').toLowerCase().includes(q) ||
      (area.description || '').toLowerCase().includes(q);

    const matchesZone = zoneFilter === 'ALL' || (area.zone || '').toLowerCase().includes(zoneFilter.toLowerCase());
    const matchesType = typeFilter === 'ALL' || (area.coverageType || '').toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesZone && matchesType;
  });

  // Calculate summary metrics
  const totalHouseholds = serviceAreas.reduce((acc, a) => acc + (Number(a.targetHouseholds) || 250), 0);
  const activeSectorsCount = serviceAreas.filter(a => a.status === 'Active').length;
  const uniqueZonesCount = new Set(serviceAreas.map(a => a.zone).filter(Boolean)).size;

  const active = selectedArea || filteredAreas[0] || serviceAreas[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" /> MUNICIPAL SECTOR MANAGEMENT
          </span>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">
            Service Areas & Sectors
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure municipal sanitation zones, fix geographic center pins on interactive maps, and assign collection fleets.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveSection('all_areas');
              if (setActiveTab) setActiveTab('all_areas');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSection === 'all_areas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>All Area</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeSection === 'all_areas' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {serviceAreas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenRegister}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSection === 'register_area'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? 'Edit Area' : 'Register Area'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TOTAL SECTORS</span>
          <h3 className="text-2xl font-bold text-[#0F172A]">{serviceAreas.length}</h3>
          <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Registered Municipal Areas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ACTIVE COVERAGE</span>
          <h3 className="text-2xl font-bold text-emerald-600">{activeSectorsCount} / {serviceAreas.length}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Active collection sectors</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">COVERED HOUSEHOLDS</span>
          <h3 className="text-2xl font-bold text-blue-600">~{totalHouseholds}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Total enrolled citizen capacity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">MUNICIPAL ZONES</span>
          <h3 className="text-2xl font-bold text-purple-600">{uniqueZonesCount || 1}</h3>
          <span className="text-xs text-slate-400 mt-1 inline-block">Geographic administrative zones</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ALL AREA (Sectors Directory & Interactive Map Inspector) */}
      {/* ========================================================================= */}
      {activeSection === 'all_areas' && (
        <div className="space-y-6">
          {/* Search, Filter, and Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Sector Name, Code, or Zone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Zone Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Zone:</span>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Zones</option>
                  <option value="Zone 1">Zone 1</option>
                  <option value="Zone 2">Zone 2</option>
                  <option value="Zone 3">Zone 3</option>
                  <option value="Zone 4">Zone 4</option>
                  <option value="Zone 5">Zone 5</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Types</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenRegister}
              className="bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Area
            </button>
          </div>

          {/* Service Areas Directory Cards Grid (Full-Width, No Map) */}
          {filteredAreas.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-800">No Service Areas Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchTerm || zoneFilter !== 'ALL' || typeFilter !== 'ALL'
                    ? 'No service areas match your active filter criteria. Try adjusting filters or search term.'
                    : 'No municipal service sectors have been registered yet. Click below to add your first sector.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenRegister}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Register First Service Area
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAreas.map((area) => {
                const mapCenterUrl = `https://www.openstreetmap.org/?mlat=${area.centerLat || 28.6139}&mlon=${area.centerLng || 77.2090}#map=15/${area.centerLat || 28.6139}/${area.centerLng || 77.2090}`;
                return (
                  <div
                    key={area._id}
                    className="p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition relative bg-white flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div>
                      {/* Top Header: Zone Badge & Status */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                          {area.zone || 'Zone 1'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                          area.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${area.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {area.status || 'Active'}
                        </span>
                      </div>

                      {/* Area Title & Identifier Code */}
                      <div>
                        <h4 className="font-extrabold text-base text-[#0F172A] tracking-tight">{area.name}</h4>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">{area.displayName}</p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                        {area.description || 'Designated municipal sanitation sector with regular household routing.'}
                      </p>

                      {/* Attribute Pills & Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-slate-100 text-slate-600">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block font-semibold">TYPE</span>
                            <span className="font-bold text-slate-800 text-[11px] truncate">{area.coverageType || 'Residential'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">CAPACITY</span>
                            <span className="font-bold text-slate-800 text-[11px]">~{area.targetHouseholds || 250} Homes</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {area.coverageShape === 'polygon' || (Array.isArray(area.polygonCoordinates) && area.polygonCoordinates.length >= 3) ? (
                            <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : area.coverageShape === 'square' || area.squareWidthKm ? (
                            <Square className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              {area.coverageShape === 'polygon' || (Array.isArray(area.polygonCoordinates) && area.polygonCoordinates.length >= 3)
                                ? 'FREE SHAPE'
                                : area.coverageShape === 'square' || area.squareWidthKm 
                                ? 'COVERED BOX' 
                                : 'RADIUS'}
                            </span>
                            <span className="font-bold text-slate-800 text-[11px] truncate">
                              {area.coverageShape === 'polygon' || (Array.isArray(area.polygonCoordinates) && area.polygonCoordinates.length >= 3)
                                ? `${area.polygonCoordinates?.length || 5} Pts • ${area.areaSqKm || 0} km²`
                                : area.squareWidthKm 
                                ? `${area.squareWidthKm}×${area.squareHeightKm || area.squareWidthKm} KM (${area.areaSqKm || (area.squareWidthKm * (area.squareHeightKm || area.squareWidthKm)).toFixed(1)} km²)`
                                : `${area.radiusKm || 4.0} KM`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Truck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block font-semibold">FLEET</span>
                            <span className={`font-bold text-[11px] truncate block ${
                              area.assignedVehicle && area.assignedVehicle !== 'Unassigned' && area.assignedVehicle !== 'Truck #GFT-22'
                                ? 'text-slate-800'
                                : 'text-amber-600 italic'
                            }`}>
                              {area.assignedVehicle && area.assignedVehicle !== 'Unassigned' && area.assignedVehicle !== 'Truck #GFT-22'
                                ? area.assignedVehicle
                                : 'Pending Vehicle'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Driver & Frequency Badges */}
                      <div className="mt-2 text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Driver:</span>
                        <span className={`font-bold text-[11px] ${
                          area.assignedDriverName && area.assignedDriverName !== 'Unassigned'
                            ? 'text-emerald-700'
                            : 'text-slate-500 italic'
                        }`}>
                          {area.assignedDriverName && area.assignedDriverName !== 'Unassigned'
                            ? area.assignedDriverName
                            : 'Pending Driver'}
                        </span>
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Schedule:</span>
                        <span className="font-bold text-slate-700">{area.collectionFrequency || 'Daily Morning'}</span>
                      </div>
                    </div>

                    {/* Footer: Coordinates & Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <a
                        href={mapCenterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-indigo-600 hover:text-indigo-700 font-bold text-[11px] flex items-center gap-1 hover:underline"
                        title="View coordinates on map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{Number(area.centerLat || 28.6139).toFixed(4)}°, {Number(area.centerLng || 77.2090).toFixed(4)}°</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(area)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(area._id, area.name)}
                          title="Delete Area"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: REGISTER AREA (Dedicated Form with Interactive Map Pin Fixer) */}
      {/* ========================================================================= */}
      {activeSection === 'register_area' && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">
                  {editingId ? `Edit Service Sector: ${form.name}` : 'Register New Municipal Service Area'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure sector boundaries, set Leaflet map center coordinates, and establish sanitation routing capacity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Switch to New Area
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('all_areas');
                  if (setActiveTab) setActiveTab('all_areas');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Back to All Area</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Registration Form Grid: 2 Columns */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Fields (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Fleet Allocation Policy Notice */}
                <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-blue-950">Fleet Allocation Policy:</span>
                    <span className="text-blue-800 text-[11px]">
                      No fleet vehicle is assigned at area registration. Vehicles are assigned to drivers, and drivers are subsequently allocated to this service area via <strong>Driver Area Assignment</strong>.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sector Identifier Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sector Identifier Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sector Epsilon, Ward 12"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Official municipal registry code</span>
                  </div>

                  {/* Display Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sector Epsilon (Zone 5 South)"
                      value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Resident-facing title shown in portal</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Municipal Zone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Municipal Zone</label>
                    <select
                      value={form.zone}
                      onChange={e => setForm({ ...form, zone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Zone 1">Zone 1 (Downtown / Commercial Hub)</option>
                      <option value="Zone 2">Zone 2 (North Ridge Residential)</option>
                      <option value="Zone 3">Zone 3 (East Industrial Corridor)</option>
                      <option value="Zone 4">Zone 4 (South Greenfield Sector)</option>
                      <option value="Zone 5">Zone 5 (Suburban Extension)</option>
                      <option value="Central Hub">Central Sanitation Depot</option>
                    </select>
                  </div>

                  {/* Coverage Classification */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Coverage Classification</label>
                    <select
                      value={form.coverageType}
                      onChange={e => setForm({ ...form, coverageType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Residential">Residential Households</option>
                      <option value="Commercial">Commercial & Markets</option>
                      <option value="Industrial">Industrial Estates</option>
                      <option value="Mixed Use">Mixed Commercial / Residential</option>
                      <option value="Institutional">Schools / Hospitals / Civic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Household Capacity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Household Capacity</label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      placeholder="250"
                      value={form.targetHouseholds}
                      onChange={e => setForm({ ...form, targetHouseholds: Number(e.target.value) || 200 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Operational Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Operational Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Active">Active Route (Daily Collections)</option>
                      <option value="Maintenance">Maintenance / Route Shift</option>
                      <option value="Planned">Planned / Future Ward</option>
                    </select>
                  </div>
                </div>

                {/* Collection Frequency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collection Frequency</label>
                  <select
                    value={form.collectionFrequency}
                    onChange={e => setForm({ ...form, collectionFrequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Daily Morning (07:00 AM)">Daily Morning (07:00 AM)</option>
                    <option value="Daily Evening (05:00 PM)">Daily Evening (05:00 PM)</option>
                    <option value="Alternate Days (Mon/Wed/Fri)">Alternate Days (Mon/Wed/Fri)</option>
                    <option value="Twice Weekly">Twice Weekly</option>
                  </select>
                </div>

                {/* Coverage Shape & Covered Area Dimensions */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Coverage Boundary Shape:</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      {form.coverageShape === 'polygon' 
                        ? '✏️ Free Shape (Custom Boundary)' 
                        : form.coverageShape === 'square' 
                        ? 'Square Box (Map Selection)' 
                        : 'Circle Radius'}
                    </span>
                  </div>

                  {/* 3-Way Shape Switcher Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, coverageShape: 'polygon' }))}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        form.coverageShape === 'polygon'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span className="truncate">Free Shape</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, coverageShape: 'square' }))}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        form.coverageShape === 'square'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span className="truncate">Square Box</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, coverageShape: 'circle' }))}
                      className={`py-2 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        form.coverageShape === 'circle'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Circle className="w-3.5 h-3.5" />
                      <span className="truncate">Circle Radius</span>
                    </button>
                  </div>

                  {/* 1. FREE SHAPE POLYGON CONTROLS */}
                  {form.coverageShape === 'polygon' && (
                    <div className="space-y-3 pt-1">
                      {/* Live Polygon Area & Perimeter Metric Pill */}
                      <div className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span className="font-bold text-slate-700">Custom Boundary:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-indigo-700 font-mono text-xs">
                            {form.areaSqKm || 0} km² Enclosed
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold ml-2">
                            ({form.polygonCoordinates?.length || 6} Points • {form.perimeterKm || 0} km Perimeter)
                          </span>
                        </div>
                      </div>

                      <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80 space-y-2">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Draw Any Free Boundary:</span>
                        </span>
                        <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                          <li>Click <strong>"✏️ Click Map to Add Points"</strong> on the map header to click points along roads, canals, or ward boundaries!</li>
                          <li>Drag any numbered vertex pin (<strong>1, 2, 3...</strong>) to stretch, curve, and fine-tune corners.</li>
                          <li>Drag the green center pin to move the entire boundary.</li>
                          <li>Click <strong>"Undo"</strong> to remove the last point or <strong>"Clear"</strong> to start over.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. SQUARE BOX CONTROLS */}
                  {form.coverageShape === 'square' && (
                    <div className="space-y-3 pt-1">
                      {/* Live Area Metric Pill */}
                      <div className="flex items-center justify-between text-xs bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-slate-700">Covered Dimensions:</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-indigo-700 font-mono text-xs">
                            {form.squareWidthKm || 4.0} KM (W) × {form.squareHeightKm || 4.0} KM (H)
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold ml-1.5">
                            ({form.areaSqKm || ((form.squareWidthKm || 4.0) * (form.squareHeightKm || 4.0)).toFixed(1)} km²)
                          </span>
                        </div>
                      </div>

                      {/* Quick Square Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500 font-semibold">
                          <span>Quick Square Presets:</span>
                          <span className="text-[10px] text-slate-400">Click to snap</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: '2×2 KM', size: 2, sub: '4 km²' },
                            { label: '4×4 KM', size: 4, sub: '16 km²' },
                            { label: '6×6 KM', size: 6, sub: '36 km²' },
                            { label: '8×8 KM', size: 8, sub: '64 km²' }
                          ].map(preset => (
                            <button
                              key={preset.size}
                              type="button"
                              onClick={() => handlePresetSquare(preset.size)}
                              className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                                (form.squareWidthKm === preset.size && form.squareHeightKm === preset.size)
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span className="block font-bold text-xs">{preset.label}</span>
                              <span className={`block text-[9px] ${
                                (form.squareWidthKm === preset.size && form.squareHeightKm === preset.size)
                                  ? 'text-indigo-100'
                                  : 'text-slate-400'
                              }`}>{preset.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders for Width and Height */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                            <span>Width (East-West):</span>
                            <span className="font-mono text-indigo-600 font-extrabold">{form.squareWidthKm || 4.0} KM</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="15"
                            step="0.5"
                            value={form.squareWidthKm || 4.0}
                            onChange={e => handleDimensionsChange(parseFloat(e.target.value) || 4.0, form.squareHeightKm || 4.0)}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                            <span>Height (North-South):</span>
                            <span className="font-mono text-indigo-600 font-extrabold">{form.squareHeightKm || 4.0} KM</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="15"
                            step="0.5"
                            value={form.squareHeightKm || 4.0}
                            onChange={e => handleDimensionsChange(form.squareWidthKm || 4.0, parseFloat(e.target.value) || 4.0)}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. CIRCLE RADIUS CONTROLS */}
                  {form.coverageShape === 'circle' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Circular Radius:</span>
                        <span className="font-extrabold text-indigo-600 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                          {form.radiusKm} KM
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="0.5"
                        value={form.radiusKm}
                        onChange={e => setForm({ ...form, radiusKm: parseFloat(e.target.value) || 4 })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>1 KM (Dense Ward)</span>
                        <span>5 KM (Standard Sector)</span>
                        <span>15 KM (Rural / Highway)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description & Boundaries */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description & Boundaries</label>
                  <textarea
                    rows="3"
                    placeholder="Specific arterial roads, gated residential societies, commercial plazas, and dump depot boundaries..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Right Column: Geographic Center Pin Fixer & Interactive Map (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                        GEOGRAPHIC CENTER & FREE SHAPE BOUNDS
                      </span>
                      <span className="text-xs font-mono text-emerald-300">
                        {Number(form.centerLat).toFixed(5)}°, {Number(form.centerLng).toFixed(5)}°
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDetectCenterGps}
                      disabled={detectingGps}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                      <span>{detectingGps ? 'Detecting...' : 'Pin My GPS'}</span>
                    </button>
                  </div>

                  {/* Fully Interactive Leaflet Map Center Fixer & Free Shape Boundary Drawer */}
                  <InteractiveAreaMap
                    lat={Number(form.centerLat)}
                    lng={Number(form.centerLng)}
                    radiusKm={form.radiusKm || 4.0}
                    coverageShape={form.coverageShape || 'polygon'}
                    polygonCoordinates={form.polygonCoordinates || []}
                    squareWidthKm={form.squareWidthKm || 4.0}
                    squareHeightKm={form.squareHeightKm || 4.0}
                    bounds={form.bounds}
                    interactive={true}
                    onLocationChange={(newLat, newLng) => {
                      setForm(prev => ({
                        ...prev,
                        centerLat: newLat,
                        centerLng: newLng
                      }));
                    }}
                    onPolygonChange={(polyData) => {
                      setForm(prev => ({
                        ...prev,
                        coverageShape: 'polygon',
                        polygonCoordinates: polyData.coordinates,
                        areaSqKm: polyData.areaSqKm,
                        perimeterKm: polyData.perimeterKm,
                        centerLat: polyData.centerLat,
                        centerLng: polyData.centerLng
                      }));
                    }}
                    onSquareChange={(squareData) => {
                      setForm(prev => ({
                        ...prev,
                        centerLat: squareData.centerLat,
                        centerLng: squareData.centerLng,
                        squareWidthKm: squareData.widthKm,
                        squareHeightKm: squareData.heightKm,
                        areaSqKm: Number((squareData.widthKm * squareData.heightKm).toFixed(2)),
                        bounds: {
                          north: squareData.north,
                          south: squareData.south,
                          east: squareData.east,
                          west: squareData.west
                        }
                      }));
                    }}
                    height="350px"
                  />

                  {/* Fine-Tuning Nudge Controls */}
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Fine-Tuning Nudge Controls:</span>
                      <span className="text-[10px] text-slate-500">Step: ±0.001° (~110m)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleNudge(0.001, 0)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        ↑ North
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge(-0.001, 0)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        ↓ South
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge(0, -0.001)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        ← West
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNudge(0, 0.001)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        → East
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {form.coverageShape === 'polygon'
                      ? '💡 Click map to add boundary points. Drag numbered pins (1, 2, 3...) to reshape. Drag center pin to move entire shape.'
                      : form.coverageShape === 'square'
                      ? '💡 Drag corners (NW, NE, SE, SW) to resize square. Drag green center pin to move entire box.'
                      : `💡 Click anywhere on map or drag green pin to fix center. The dashed circle shows active ${form.radiusKm} KM radius.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('all_areas');
                  if (setActiveTab) setActiveTab('all_areas');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel & Return to All Area
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {submitting 
                    ? 'Saving Service Sector...' 
                    : editingId 
                    ? 'Update Service Sector' 
                    : 'Register Service Area'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
