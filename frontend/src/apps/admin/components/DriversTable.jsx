import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  User, 
  Radio, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Calendar, 
  Heart, 
  FileText, 
  Edit3, 
  Navigation,
  Compass,
  Gauge,
  Trash2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  MapResizeHandler, 
  createVehicleIcon, 
  MAP_TILE_URL, 
  MAP_ATTRIBUTION 
} from '../../../components/MapCustomIcons.js';

export default function DriversTable({ 
  drivers = [], 
  vehicles = [], 
  serviceAreas = [], 
  onAddDriver, 
  onRefresh, 
  showToast,
  onNavigateTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dutyFilter, setDutyFilter] = useState('ALL'); // 'ALL' | 'ON_DUTY' | 'OFF_DUTY'
  const [vehicleFilter, setVehicleFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'
  const [sectorFilter, setSectorFilter] = useState('ALL');

  // Selected Driver for Full Dossier Modal
  const [viewingDriver, setViewingDriver] = useState(null);

  // Quick Assignment Modal
  const [assigningDriver, setAssigningDriver] = useState(null);
  const [assignForm, setAssignForm] = useState({ sector: '', vehicle: '' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Driver Deletion State
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Filter Logic
  const filteredDrivers = useMemo(() => {
    return drivers.filter(drv => {
      // 1. Text Search
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        !term ||
        (drv.name || '').toLowerCase().includes(term) ||
        (drv.customId || '').toLowerCase().includes(term) ||
        (drv.phone || '').toLowerCase().includes(term) ||
        (drv.email || '').toLowerCase().includes(term) ||
        (drv.assignedVehicle || '').toLowerCase().includes(term) ||
        (drv.activeSector || '').toLowerCase().includes(term) ||
        (drv.drivingLicence || '').toLowerCase().includes(term);

      if (!matchSearch) return false;

      // 2. Duty Status Filter
      if (dutyFilter === 'ON_DUTY' && !drv.isOnDuty) return false;
      if (dutyFilter === 'OFF_DUTY' && drv.isOnDuty) return false;

      // 3. Vehicle Filter
      const hasVehicle = drv.assignedVehicle && drv.assignedVehicle !== 'Unassigned' && drv.assignedVehicle !== '';
      if (vehicleFilter === 'ASSIGNED' && !hasVehicle) return false;
      if (vehicleFilter === 'UNASSIGNED' && hasVehicle) return false;

      // 4. Sector Filter
      if (sectorFilter !== 'ALL') {
        if (!drv.activeSector || !drv.activeSector.toLowerCase().includes(sectorFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [drivers, searchTerm, dutyFilter, vehicleFilter, sectorFilter]);

  // Handle Quick Reassign
  const handleOpenAssignModal = (drv) => {
    setAssigningDriver(drv);
    setAssignForm({
      sector: drv.activeSector && drv.activeSector !== 'Unassigned' ? drv.activeSector : (serviceAreas[0]?.displayName || serviceAreas[0]?.name || ''),
      vehicle: drv.assignedVehicle && drv.assignedVehicle !== 'Unassigned' ? drv.assignedVehicle : (vehicles[0]?.vehicleNumber || '')
    });
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assigningDriver) return;
    try {
      setAssignSubmitting(true);
      const matchedArea = serviceAreas.find(a => a.name === assignForm.sector || a.displayName === assignForm.sector);
      const res = await fetch('/api/admin/assign-driver-area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: assigningDriver._id || assigningDriver.customId,
          sector: assignForm.sector,
          vehicle: assignForm.vehicle,
          areaName: matchedArea?.name,
          areaDisplayName: matchedArea?.displayName,
          areaId: matchedArea?._id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update driver assignment');

      if (showToast) showToast(data.message || `✅ ${assigningDriver.name} updated: ${assignForm.sector} & ${assignForm.vehicle}`, 'success');
      setAssigningDriver(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    try {
      setDeleteSubmitting(true);
      const id = driverToDelete._id || driverToDelete.customId;
      const res = await fetch(`/api/admin/drivers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove driver');

      if (showToast) showToast(data.message || `✅ Driver ${driverToDelete.name} removed successfully`, 'success');
      setDriverToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Directory Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
              FLEET ROSTER DIRECTORY
            </span>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredDrivers.length} of {drivers.length} registered operators
            </span>
          </div>
          <h3 className="font-bold text-xl text-[#0F172A] mt-1">Municipal Fleet Drivers Directory</h3>
          <p className="text-xs text-slate-500">
            Comprehensive operator roster with assigned sectors, collection vehicles, licensing, and live GPS telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAddDriver && (
            <button 
              onClick={onAddDriver}
              className="bg-[#00B074] hover:bg-[#009e67] transition-all text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Register New Driver
            </button>
          )}
        </div>
      </div>

      {/* Search, Filter & Quick Stats Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, phone, vehicle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 focus:bg-white focus:outline-blue-500 font-medium"
            />
          </div>

          {/* 2. Duty Status Filter */}
          <div>
            <select
              value={dutyFilter}
              onChange={e => setDutyFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 font-semibold text-slate-700 focus:bg-white focus:outline-blue-500"
            >
              <option value="ALL">All Duty Statuses</option>
              <option value="ON_DUTY">🟢 On Duty (Active Telemetry)</option>
              <option value="OFF_DUTY">⚪ Off Duty (Standby)</option>
            </select>
          </div>

          {/* 3. Vehicle Assignment Filter */}
          <div>
            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 font-semibold text-slate-700 focus:bg-white focus:outline-blue-500"
            >
              <option value="ALL">All Vehicle States</option>
              <option value="ASSIGNED">🚚 Assigned Vehicle</option>
              <option value="UNASSIGNED">⚠️ Unassigned Vehicle</option>
            </select>
          </div>

          {/* 4. Sector Filter */}
          <div>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50/70 font-semibold text-slate-700 focus:bg-white focus:outline-blue-500"
            >
              <option value="ALL">All Service Sectors</option>
              {serviceAreas.map(area => (
                <option key={area._id || area.name} value={area.name}>
                  {area.displayName || area.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Drivers Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-5 py-4">Driver Profile</th>
                <th className="px-5 py-4">Assigned Vehicle</th>
                <th className="px-5 py-4">Assigned Sector / Ward</th>
                <th className="px-5 py-4">Contact & License</th>
                <th className="px-5 py-4">Duty & Telemetry</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Truck className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
                      <p className="font-bold text-slate-700 text-sm">No Fleet Drivers Found</p>
                      <p className="text-[11px] text-slate-400">
                        No operators match the current search or filter criteria.
                      </p>
                      {(searchTerm || dutyFilter !== 'ALL' || vehicleFilter !== 'ALL' || sectorFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setDutyFilter('ALL');
                            setVehicleFilter('ALL');
                            setSectorFilter('ALL');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800 font-bold text-xs underline cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(drv => {
                  const hasVehicle = drv.assignedVehicle && drv.assignedVehicle !== 'Unassigned' && drv.assignedVehicle.trim() !== '';
                  const hasSector = drv.activeSector && drv.activeSector !== 'Unassigned' && drv.activeSector.trim() !== '';
                  const liveLoc = drv.liveLocation;
                  const hasCoords = liveLoc && typeof liveLoc.lat === 'number' && typeof liveLoc.lng === 'number' && (liveLoc.lat !== 0 || liveLoc.lng !== 0);

                  return (
                    <tr key={drv._id || drv.customId} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Driver Profile Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {(drv.name || 'D').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-slate-900 font-bold text-sm block">
                                {drv.name}
                              </strong>
                              <span className="font-mono text-[10px] font-extrabold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {drv.customId || '#DRV'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {drv.title || 'Fleet Operator'}
                              {drv.experienceYears ? ` • ${drv.experienceYears} Yrs Exp` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Assigned Vehicle Column */}
                      <td className="px-5 py-4">
                        {hasVehicle ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span>{drv.assignedVehicle}</span>
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block pl-1">
                              ✓ Vehicle Bound
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Not Assigned</span>
                            </span>
                            <button
                              onClick={() => handleOpenAssignModal(drv)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline block pl-1 cursor-pointer"
                            >
                              Assign Vehicle
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 3. Assigned Sector / Ward Column */}
                      <td className="px-5 py-4">
                        {hasSector ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-200 text-xs max-w-[200px] truncate" title={drv.activeSector}>
                              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate">{drv.activeSector}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block pl-1">
                              Municipal Coverage Route
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Unassigned Sector</span>
                            </span>
                            <button
                              onClick={() => handleOpenAssignModal(drv)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline block pl-1 cursor-pointer"
                            >
                              Assign Route Area
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 4. Contact & License Column */}
                      <td className="px-5 py-4 space-y-1 text-slate-600">
                        {drv.phone && (
                          <a 
                            href={`tel:${drv.phone}`} 
                            className="flex items-center gap-1.5 text-slate-800 hover:text-blue-600 font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{drv.phone}</span>
                          </a>
                        )}
                        {drv.drivingLicence && (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>DL: {drv.drivingLicence}</span>
                          </div>
                        )}
                        {drv.email && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[170px]" title={drv.email}>
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{drv.email}</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Duty & Telemetry Column */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 ${
                            drv.isOnDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${drv.isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {drv.isOnDuty ? 'On Duty (Active)' : 'Off Shift (Standby)'}
                          </span>

                          {drv.isOnDuty && hasCoords && (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                              <span>{liveLoc.speedKm || 20} km/h • GPS Synced</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAssignModal(drv)}
                            title="Reassign Sector & Vehicle"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setViewingDriver(drv)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer"
                          >
                            <span>Full Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => setDriverToDelete(drv)}
                            title="Delete Driver from Directory"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: FULL DRIVER DOSSIER & LIVE LEAFLET LOCATION MAP */}
      {/* ========================================================= */}
      {viewingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {(viewingDriver.name || 'D').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{viewingDriver.name}</h3>
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                      {viewingDriver.customId || '#DRV'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      viewingDriver.isOnDuty ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {viewingDriver.isOnDuty ? '🟢 On Duty' : '⚪ Off Shift'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {viewingDriver.title || 'Municipal Sanitation Fleet Operator'} • Registered Driver Dossier
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingDriver(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Top Operational Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ASSIGNED VEHICLE</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">
                        {viewingDriver.assignedVehicle || 'Unassigned Vehicle'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {viewingDriver.assignedVehicle ? 'Municipal Waste Compactor Truck' : 'No vehicle currently paired'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sector Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ASSIGNED SECTOR & WARD</span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block truncate max-w-[240px]">
                        {viewingDriver.activeSector || 'Unassigned Sector'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {viewingDriver.activeSector ? 'Designated collection boundary' : 'No service area assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal & Verification Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Personal, Verification & Contact Details
                </h4>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Phone Number</span>
                    <strong className="text-slate-800">{viewingDriver.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Email Address</span>
                    <strong className="text-slate-800 truncate block">{viewingDriver.email || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Driving License</span>
                    <strong className="text-slate-800 font-mono">{viewingDriver.drivingLicence || 'DL-PENDING'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Aadhar Card</span>
                    <strong className="text-slate-800 font-mono">{viewingDriver.aadharNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Blood Group</span>
                    <strong className="text-slate-800 font-bold text-rose-600">{viewingDriver.bloodGroup || 'O+'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-bold uppercase">Gender & DOB</span>
                    <strong className="text-slate-800">{viewingDriver.gender || 'Male'} • {viewingDriver.dob || 'N/A'}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-bold uppercase">Emergency Contact</span>
                      <strong className="text-slate-800">
                        {viewingDriver.emergencyContact ? `${viewingDriver.emergencyContact} (${viewingDriver.emergencyPhone || 'No Phone'})` : 'None Listed'}
                      </strong>
                    </div>
                    {viewingDriver.address && (
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold uppercase">Home Address</span>
                        <span className="text-slate-700">{viewingDriver.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Location Telemetry & Leaflet Map */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    Live Driver GPS Position & Route Map (Leaflet)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lat: {(viewingDriver.liveLocation?.lat || 28.6139).toFixed(4)}, Lng: {(viewingDriver.liveLocation?.lng || 77.2090).toFixed(4)}
                  </span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 h-52 bg-slate-900 relative">
                  <MapContainer
                    center={[viewingDriver.liveLocation?.lat || 28.6139, viewingDriver.liveLocation?.lng || 77.2090]}
                    zoom={14}
                    scrollWheelZoom={false}
                    className="w-full h-full"
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution={MAP_ATTRIBUTION}
                      url={MAP_TILE_URL}
                    />
                    <MapResizeHandler />
                    <Marker
                      position={[viewingDriver.liveLocation?.lat || 28.6139, viewingDriver.liveLocation?.lng || 77.2090]}
                      icon={createVehicleIcon({ label: viewingDriver.assignedVehicle || viewingDriver.name })}
                    >
                      <Popup>
                        <div className="p-1 text-xs font-semibold">
                          <strong className="block text-slate-900 font-bold">{viewingDriver.name}</strong>
                          <span className="text-slate-600">{viewingDriver.assignedVehicle || 'Collection Truck'}</span>
                          <div className="text-[10px] text-emerald-600 font-bold mt-1">
                            Status: {viewingDriver.isOnDuty ? 'On Duty' : 'Off Shift'}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs">
              <span className="text-slate-400">
                Driver record registered under Municipal Sanitation Service.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const drv = viewingDriver;
                    setViewingDriver(null);
                    handleOpenAssignModal(drv);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Change Area / Vehicle Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDriver(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: QUICK VEHICLE & SECTOR ASSIGNMENT */}
      {/* ========================================================= */}
      {assigningDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Assign Vehicle & Sector</h3>
                  <p className="text-xs text-slate-500">Update operator deployment for <strong>{assigningDriver.name}</strong></p>
                </div>
              </div>
              <button onClick={() => setAssigningDriver(null)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Area / Sector *</label>
                <select
                  required
                  value={assignForm.sector}
                  onChange={e => setAssignForm({ ...assignForm, sector: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:outline-blue-500"
                >
                  <option value="">-- Choose Municipal Sector --</option>
                  {serviceAreas.map(area => (
                    <option key={area._id || area.name} value={area.displayName || area.name}>
                      {area.displayName || area.name} ({area.zone || 'Zone 1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Garbage Collection Vehicle *</label>
                <select
                  required
                  value={assignForm.vehicle}
                  onChange={e => setAssignForm({ ...assignForm, vehicle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:bg-white focus:outline-blue-500"
                >
                  <option value="">-- Choose Garbage Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.type || v.model || 'Compactor'} • Status: {v.status || 'Active'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningDriver(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs disabled:opacity-50"
                >
                  {assignSubmitting ? 'Saving...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation Modal */}
      {driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Remove Driver from Directory</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove <strong className="text-slate-800">{driverToDelete.name}</strong> ({driverToDelete.customId || 'Driver'})?
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-800 space-y-1.5">
              <p className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>This deletion will:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 font-medium pl-1">
                <li>Permanently delete driver record from database.</li>
                <li>Unbind vehicle: <strong>{driverToDelete.assignedVehicle || 'None'}</strong>.</li>
                <li>Unbind sector: <strong>{driverToDelete.activeSector || 'None'}</strong>.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDriver}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteSubmitting ? 'Removing...' : 'Confirm Remove Driver'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
