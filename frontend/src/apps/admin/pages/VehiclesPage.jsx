import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Fuel, 
  Weight, 
  Search, 
  Filter, 
  Radio,
  FileText,
  UserCheck,
  UserX,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gauge,
  ClipboardList,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export default function VehiclesPage({ 
  vehicles = [], 
  drivers = [], 
  serviceAreas = [], 
  initialSection = 'records',
  onRefresh, 
  showToast 
}) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Search & Filter state for Records
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fuelFilter, setFuelFilter] = useState('ALL');

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState(null);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const initialRegistrationForm = {
    vehicleNumber: '',
    vehicleType: 'Compactor Truck',
    model: 'Tata 407 LPT',
    capacityKg: 2500,
    fuelType: 'CNG',
    status: 'Operational',
    assignedDriverName: 'Unassigned',
    assignedSector: 'Unassigned',
    odometerKm: 12500,
    gpsUnitId: `GPS-${Math.floor(1000 + Math.random() * 9000)}`,
    remarks: ''
  };

  const [regForm, setRegForm] = useState(initialRegistrationForm);

  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    quantity: 45,
    unit: 'Liters',
    cost: 4200,
    station: 'Municipal Central Depot Fueling Station',
    odometerKm: '',
    loggedBy: ''
  });

  const [serviceForm, setServiceForm] = useState({
    vehicleId: '',
    serviceType: 'Routine 10k Oil & Filters Servicing',
    cost: 6500,
    workshop: 'Central Municipal Depot Workshop',
    odometerKm: '',
    nextDue: '',
    technician: 'Lead Mechanic Suresh K.',
    notes: 'Engine oil flushed, oil filter and air filter replaced. Brake pressure calibrated.'
  });

  const [issueForm, setIssueForm] = useState({
    vehicleId: '',
    driverName: '',
    driverPhone: '',
    category: 'Hydraulic Compactor',
    severity: 'Medium',
    description: ''
  });

  const [resolveForm, setResolveForm] = useState({
    status: 'Resolved',
    resolutionNotes: 'Inspected and repaired by depot technician. Test drive passed.'
  });

  // Calculate aggregated lists
  const allFuelLogs = vehicles.flatMap(v => 
    (v.fuelLogs || []).map(f => ({ ...f, vehicleNumber: v.vehicleNumber, vehicleModel: v.model, vehicleId: v._id }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const allServiceLogs = vehicles.flatMap(v => 
    (v.serviceLogs || []).map(s => ({ ...s, vehicleNumber: v.vehicleNumber, vehicleModel: v.model, vehicleId: v._id }))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const allIssues = vehicles.flatMap(v => 
    (v.issues || []).map(iss => ({ ...iss, vehicleNumber: v.vehicleNumber, vehicleModel: v.model, vehicleId: v._id }))
  ).sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));

  const openIssuesCount = allIssues.filter(i => i.status !== 'Resolved').length;

  // 1. Submit Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Vehicle registered successfully in municipal registry!', 'success');
        setRegForm({
          ...initialRegistrationForm,
          gpsUnitId: `GPS-${Math.floor(1000 + Math.random() * 9000)}`
        });
        if (onRefresh) onRefresh();
        setActiveSection('records');
      } else {
        if (showToast) showToast(data.message || 'Failed to register vehicle', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error registering vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Edit Form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${editingVehicle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingVehicle)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Vehicle record updated successfully', 'success');
        setShowEditModal(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to update vehicle', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Vehicle
  const handleDeleteVehicle = async (v) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${v.vehicleNumber} from registry?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/vehicles/${v._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Vehicle record deleted', 'info');
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to delete vehicle', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error deleting vehicle', 'error');
    }
  };

  // 4. Assign Driver to Vehicle
  const handleAssignDriver = async (vehicleId, driverId, driverName) => {
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, driverName })
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Driver assignment updated', 'success');
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to update driver assignment', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating driver assignment', 'error');
    }
  };

  // 5. Submit Fuel Log
  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    if (!fuelForm.vehicleId) {
      if (showToast) showToast('Please select a vehicle', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${fuelForm.vehicleId}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fuelForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Fuel entry logged successfully', 'success');
        setShowFuelModal(false);
        setFuelForm({
          vehicleId: '',
          quantity: 45,
          unit: 'Liters',
          cost: 4200,
          station: 'Municipal Central Depot Fueling Station',
          odometerKm: '',
          loggedBy: ''
        });
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to log fuel entry', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error logging fuel', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Submit Service Log
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceForm.vehicleId) {
      if (showToast) showToast('Please select a vehicle', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${serviceForm.vehicleId}/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Maintenance record logged successfully', 'success');
        setShowServiceModal(false);
        setServiceForm({
          vehicleId: '',
          serviceType: 'Routine 10k Oil & Filters Servicing',
          cost: 6500,
          workshop: 'Central Municipal Depot Workshop',
          odometerKm: '',
          nextDue: '',
          technician: 'Lead Mechanic Suresh K.',
          notes: ''
        });
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to log service record', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error logging service record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Submit Vehicle Issue / Driver Complaint
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.vehicleId) {
      if (showToast) showToast('Please select a vehicle', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${issueForm.vehicleId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Vehicle issue ticket reported', 'success');
        setShowIssueModal(false);
        setIssueForm({
          vehicleId: '',
          driverName: '',
          driverPhone: '',
          category: 'Hydraulic Compactor',
          severity: 'Medium',
          description: ''
        });
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to report issue', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error reporting issue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Update Issue Status (e.g. In Repair or Resolved)
  const handleUpdateIssueStatus = async (status, notes = '') => {
    if (!selectedVehicleForAction || !selectedIssueForAction) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${selectedVehicleForAction._id}/issues/${selectedIssueForAction._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes: notes || resolveForm.resolutionNotes })
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || `Issue status marked as ${status}`, 'success');
        setShowResolveModal(false);
        setSelectedVehicleForAction(null);
        setSelectedIssueForAction(null);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to update issue status', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating issue status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered vehicles for Records view
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      (v.vehicleNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedDriverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedSector || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesFuel = fuelFilter === 'ALL' || (v.fuelType || '').toLowerCase() === fuelFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesFuel;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Operational':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Operational
          </span>
        );
      case 'In-Transit':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>In-Transit
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Under Maintenance
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            {status || 'Standby'}
          </span>
        );
    }
  };

  const getSeverityBadge = (sev) => {
    switch ((sev || '').toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  const getIssueStatusBadge = (st) => {
    switch (st) {
      case 'Resolved':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved</span>;
      case 'In Repair':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit"><Wrench className="w-3 h-3 text-blue-600 animate-spin" /> In Repair</span>;
      case 'Under Inspection':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit"><Search className="w-3 h-3 text-purple-600" /> Under Inspection</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3 text-rose-600" /> Reported</span>;
    }
  };

  return (
    <div className="space-y-6">


      {/* ========================================================= */}
      {/* SECTION 1: VEHICLE REGISTRATION (Enrollment Form) */}
      {/* ========================================================= */}
      {activeSection === 'registration' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0F172A]">Garbage Fleet Vehicle Enrollment</h3>
              <p className="text-xs text-slate-400">
                Register a new municipal sanitation truck, tipper van, or EV compactor with smart IoT telemetry.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vehicle License Plate / Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-01-EA-4921 or TRK-COMP-08"
                  value={regForm.vehicleNumber}
                  onChange={(e) => setRegForm({ ...regForm, vehicleNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Official municipal registration plate</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vehicle Category / Type
                </label>
                <select
                  value={regForm.vehicleType}
                  onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                >
                  <option value="Compactor Truck">Compactor Truck (Heavy Compaction)</option>
                  <option value="Mini Tipper">Mini Tipper (Narrow Residential Lanes)</option>
                  <option value="Bulk Carrier">Bulk Carrier (Commercial Waste)</option>
                  <option value="E-Waste Van">E-Waste Van (Specialized Electronics)</option>
                  <option value="Recycling Truck">Recycling Truck (Multi-Stream Segregated)</option>
                  <option value="Mechanical Road Sweeper">Mechanical Road Sweeper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Make & Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tata 407 LPT / Ashok Leyland Ecomet"
                  value={regForm.model}
                  onChange={(e) => setRegForm({ ...regForm, model: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payload Capacity (KG)
                </label>
                <input
                  type="number"
                  min="300"
                  max="25000"
                  value={regForm.capacityKg}
                  onChange={(e) => setRegForm({ ...regForm, capacityKg: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Fuel / Powertrain Type
                </label>
                <select
                  value={regForm.fuelType}
                  onChange={(e) => setRegForm({ ...regForm, fuelType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                >
                  <option value="CNG">CNG (Clean Compressed Natural Gas)</option>
                  <option value="Electric">Electric EV (Zero Emission)</option>
                  <option value="Diesel">Diesel (Heavy Fleet)</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Odometer (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  value={regForm.odometerKm}
                  onChange={(e) => setRegForm({ ...regForm, odometerKm: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  GPS Telemetry Unit ID
                </label>
                <input
                  type="text"
                  value={regForm.gpsUnitId}
                  onChange={(e) => setRegForm({ ...regForm, gpsUnitId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assign Driver (Optional)
                </label>
                <select
                  value={regForm.assignedDriverName}
                  onChange={(e) => setRegForm({ ...regForm, assignedDriverName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                >
                  <option value="Unassigned">-- Unassigned (Assign Later) --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.customId || 'Driver'} - {d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Operational Sector
                </label>
                <select
                  value={regForm.assignedSector}
                  onChange={(e) => setRegForm({ ...regForm, assignedSector: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                >
                  <option value="Unassigned">-- Unassigned Sector --</option>
                  {serviceAreas.map(area => (
                    <option key={area._id || area.name} value={area.displayName || area.name}>
                      {area.displayName || area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Fleet Status
                </label>
                <select
                  value={regForm.status}
                  onChange={(e) => setRegForm({ ...regForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                >
                  <option value="Operational">Operational (Ready for Route)</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="In-Transit">In-Transit</option>
                  <option value="Standby">Standby / Reserve Fleet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Technical Notes & Maintenance Remarks
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Equipped with weighing sensor; compliant with BS-VI emission standards; fitted with CCTV rear view."
                value={regForm.remarks}
                onChange={(e) => setRegForm({ ...regForm, remarks: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('records')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel & View Records
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Registering...' : 'Complete Vehicle Enrollment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: VEHICLE RECORDS (Fleet Registry Table) */}
      {/* ========================================================= */}
      {activeSection === 'records' && (
        <div className="space-y-6">
          {/* Header & Quick Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">MUNICIPAL FLEET ASSETS</span>
              <h2 className="text-2xl font-bold text-[#0F172A]">Garbage Vehicles Fleet Registry</h2>
              <p className="text-xs text-slate-400">
                Official records of municipal sanitation vehicles, specifications, maintenance status, and assigned collection sectors.
              </p>
            </div>
            <button
              onClick={() => setActiveSection('registration')}
              className="bg-[#00B074] hover:bg-[#009663] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Register New Vehicle
            </button>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL FLEET ASSETS</span>
                <Truck className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{vehicles.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Registered vehicles</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OPERATIONAL FLEET</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">
                {vehicles.filter(v => v.status === 'Operational' || v.status === 'In-Transit').length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Ready for pickup routes</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UNDER MAINTENANCE</span>
                <Wrench className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-600">
                {vehicles.filter(v => v.status === 'Under Maintenance').length}
              </h3>
              <span className="text-xs text-amber-600/80 mt-1 inline-block">Depot workshop repair</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASSIGNED DRIVERS</span>
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600">
                {vehicles.filter(v => v.assignedDriverName && v.assignedDriverName !== 'Unassigned').length}
              </h3>
              <span className="text-xs text-blue-600/80 mt-1 inline-block">Active crew deployed</span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search plate, model, driver, sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              {['ALL', 'Operational', 'In-Transit', 'Under Maintenance'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === st 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-400 mx-2">|</span>

              <span className="text-xs font-bold text-slate-400 mr-1">Fuel:</span>
              {['ALL', 'CNG', 'Electric', 'Diesel'].map((fl) => (
                <button
                  key={fl}
                  onClick={() => setFuelFilter(fl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    fuelFilter === fl 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {fl}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicles Table / Roster */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredVehicles.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Truck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No Garbage Vehicles Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {searchTerm || statusFilter !== 'ALL' || fuelFilter !== 'ALL'
                      ? 'No vehicle records match your selected search or filter criteria.'
                      : 'No vehicles registered in the municipal fleet catalog yet.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('registration')}
                  className="bg-[#00B074] hover:bg-[#009663] text-white px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Register New Vehicle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">VEHICLE PLATE & ODOMETER</th>
                      <th className="px-6 py-4">TYPE & MODEL</th>
                      <th className="px-6 py-4">CAPACITY & POWERTRAIN</th>
                      <th className="px-6 py-4">ASSIGNED DRIVER & SECTOR</th>
                      <th className="px-6 py-4">OPERATIONAL STATUS</th>
                      <th className="px-6 py-4">LOGS & ISSUES</th>
                      <th className="px-6 py-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredVehicles.map((v) => {
                      const vIssues = (v.issues || []).filter(i => i.status !== 'Resolved');
                      return (
                        <tr key={v._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                                <Truck className="w-4 h-4 text-slate-800" />
                              </div>
                              <div>
                                <strong className="text-slate-900 block font-bold text-xs">{v.vehicleNumber}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {v.odometerKm ? `${v.odometerKm.toLocaleString()} KM` : '0 KM'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 block">{v.vehicleType}</span>
                            <span className="text-[10px] text-slate-400">{v.model}</span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                                <Weight className="w-3.5 h-3.5 text-slate-400" />
                                {v.capacityKg ? `${v.capacityKg.toLocaleString()} KG` : '2,500 KG'}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5">
                                <Fuel className="w-3 h-3 text-emerald-600" />
                                {v.fuelType || 'CNG'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                {v.assignedDriverName || 'Unassigned'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {v.assignedSector || 'Unassigned Sector'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {getStatusBadge(v.status)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold" title="Fuel Logs Count">
                                ⛽ {(v.fuelLogs || []).length}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 font-bold" title="Service Logs Count">
                                🔧 {(v.serviceLogs || []).length}
                              </span>
                              {vIssues.length > 0 ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold animate-pulse" title="Active Issue Tickets">
                                  ⚠️ {vIssues.length}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                                  0 Issues
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingVehicle({ ...v });
                                  setShowEditModal(true);
                                }}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="Edit Vehicle Specs"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVehicle(v)}
                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: VEHICLE ASSIGN DRIVERS */}
      {/* ========================================================= */}
      {activeSection === 'assign_drivers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> Vehicle-to-Driver Deployment Board
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pair municipal sanitation vehicles with licensed drivers. Changes synchronize instantly across Driver and Vehicle records.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Total Drivers: {drivers.length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assigned: {vehicles.filter(v => v.assignedDriverName && v.assignedDriverName !== 'Unassigned').length}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5" /> Unassigned: {vehicles.filter(v => !v.assignedDriverName || v.assignedDriverName === 'Unassigned').length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => {
              const isAssigned = v.assignedDriverName && v.assignedDriverName !== 'Unassigned';
              return (
                <div 
                  key={v._id} 
                  className={`bg-white rounded-3xl p-5 border transition shadow-xs space-y-4 ${
                    isAssigned ? 'border-slate-200/80' : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isAssigned ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{v.vehicleNumber}</h4>
                        <span className="text-[10px] text-slate-400">{v.model} • {v.vehicleType}</span>
                      </div>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sector:</span>
                      <span className="font-semibold text-slate-700">{v.assignedSector || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capacity / Fuel:</span>
                      <span className="font-semibold text-slate-700">{v.capacityKg || 2500} KG • {v.fuelType || 'CNG'}</span>
                    </div>
                  </div>

                  {/* Assignment Controls */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Assigned Driver:
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={v.assignedDriverId || (v.assignedDriverName !== 'Unassigned' ? v.assignedDriverName : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || val === 'Unassigned') {
                            handleAssignDriver(v._id, null, 'Unassigned');
                          } else {
                            const foundDriver = drivers.find(d => d._id === val || d.name === val);
                            handleAssignDriver(
                              v._id, 
                              foundDriver?._id || val, 
                              foundDriver?.name || val
                            );
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-blue-500"
                      >
                        <option value="Unassigned">-- Unassigned --</option>
                        {drivers.map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.customId || 'Driver'})
                          </option>
                        ))}
                      </select>

                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleAssignDriver(v._id, null, 'Unassigned')}
                          className="px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition shrink-0"
                          title="Unassign Driver"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isAssigned ? (
                    <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Active Driver: <span className="text-slate-900">{v.assignedDriverName}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Pending Driver Assignment
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: VEHICLE FUEL MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'fuel' && (
        <div className="space-y-6">
          {/* Fuel Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL FUEL SPEND</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">
                ₹{allFuelLogs.reduce((acc, f) => acc + (f.cost || 0), 0).toLocaleString()}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Fleet fueling expenditure</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL QUANTITY</span>
                <Fuel className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">
                {allFuelLogs.reduce((acc, f) => acc + (f.quantity || 0), 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Liters / Kg / kWh consumed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LOGGED REFUELINGS</span>
                <FileText className="w-4 h-4 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{allFuelLogs.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Depot refill events</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AVG PER REFILL</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-600">
                ₹{allFuelLogs.length > 0 
                  ? Math.round(allFuelLogs.reduce((acc, f) => acc + (f.cost || 0), 0) / allFuelLogs.length).toLocaleString() 
                  : 0}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Average cost per vehicle</span>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-600" /> Fleet Fuel Logs & Refueling Records
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Record diesel, CNG, and EV charging cycles for municipal sanitation vehicles.
              </p>
            </div>

            <button
              onClick={() => {
                if (vehicles.length > 0) {
                  setFuelForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                }
                setShowFuelModal(true);
              }}
              className="bg-[#00B074] hover:bg-[#009663] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Log New Fuel Refill
            </button>
          </div>

          {/* Fuel History Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {allFuelLogs.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Fuel className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No Fuel Logs Recorded Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Log fuel and energy expenses for garbage trucks to monitor consumption and operational costs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (vehicles.length > 0) setFuelForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                    setShowFuelModal(true);
                  }}
                  className="bg-[#00B074] hover:bg-[#009663] text-white px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Log First Refill
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">VEHICLE PLATE</th>
                      <th className="px-6 py-4">QUANTITY & UNIT</th>
                      <th className="px-6 py-4">TOTAL COST (₹)</th>
                      <th className="px-6 py-4">FUEL STATION / DEPOT</th>
                      <th className="px-6 py-4">ODOMETER AT REFILL</th>
                      <th className="px-6 py-4">LOGGED BY</th>
                      <th className="px-6 py-4 text-right">DATE & TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allFuelLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {log.vehicleNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">{log.vehicleModel}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {log.quantity} {log.unit || 'Liters'}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          ₹{Number(log.cost || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {log.station || 'Central Municipal Fuel Depot'}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {log.odometerKm ? `${log.odometerKm.toLocaleString()} KM` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">
                          {log.loggedBy || 'Depot Attendant'}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-[11px]">
                          {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: VEHICLE SERVICE MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'service' && (
        <div className="space-y-6">
          {/* Service Health Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL SERVICE EXPENSE</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-600">
                ₹{allServiceLogs.reduce((acc, s) => acc + (s.cost || 0), 0).toLocaleString()}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Depot workshop repairs</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL SERVICE EVENTS</span>
                <Wrench className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{allServiceLogs.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Maintenance cycles</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GOOD HEALTH</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">
                {vehicles.filter(v => v.status === 'Operational').length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Fully certified fit</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CURRENTLY IN WORKSHOP</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-rose-600">
                {vehicles.filter(v => v.status === 'Under Maintenance').length}
              </h3>
              <span className="text-xs text-rose-600/80 mt-1 inline-block">Under repair right now</span>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" /> Vehicle Service & Maintenance Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track hydraulic compactor servicing, brake overhauls, engine fitness checks, and scheduled oil replacements.
              </p>
            </div>

            <button
              onClick={() => {
                if (vehicles.length > 0) {
                  setServiceForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                }
                setShowServiceModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Log Service / Maintenance
            </button>
          </div>

          {/* Service History Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {allServiceLogs.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Wrench className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No Service Records Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Log maintenance, workshop repairs, and fitness inspections to ensure municipal fleet uptime.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (vehicles.length > 0) setServiceForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                    setShowServiceModal(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Log First Maintenance
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">VEHICLE PLATE</th>
                      <th className="px-6 py-4">SERVICE TYPE</th>
                      <th className="px-6 py-4">WORKSHOP & TECHNICIAN</th>
                      <th className="px-6 py-4">COST (₹)</th>
                      <th className="px-6 py-4">ODOMETER</th>
                      <th className="px-6 py-4">NEXT DUE DATE</th>
                      <th className="px-6 py-4 text-right">DATE COMPLETED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allServiceLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {log.vehicleNumber}
                          <span className="block text-[10px] text-slate-400 font-normal">{log.vehicleModel}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-800 block">{log.serviceType}</span>
                          {log.notes && (
                            <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{log.notes}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          <span className="font-medium block">{log.workshop || 'Central Depot Workshop'}</span>
                          <span className="text-[10px] text-slate-400">{log.technician || 'Staff Mechanic'}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-600">
                          ₹{Number(log.cost || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {log.odometerKm ? `${log.odometerKm.toLocaleString()} KM` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {log.nextDue ? new Date(log.nextDue).toLocaleDateString() : 'Scheduled Routine'}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-[11px]">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 6: VEHICLE OTHER ISSUES (Driver Complaints & Faults) */}
      {/* ========================================================= */}
      {activeSection === 'issues' && (
        <div className="space-y-6">
          {/* Issue Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL FAULT TICKETS</span>
                <ClipboardList className="w-4 h-4 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{allIssues.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Driver reported problems</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE / OPEN TICKETS</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-2xl font-bold text-rose-600">{openIssuesCount}</h3>
              <span className="text-xs text-rose-600/80 mt-1 inline-block">Awaiting repair action</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IN WORKSHOP REPAIR</span>
                <Wrench className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-blue-600">
                {allIssues.filter(i => i.status === 'In Repair' || i.status === 'Under Inspection').length}
              </h3>
              <span className="text-xs text-blue-600/80 mt-1 inline-block">Mechanics working</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RESOLVED TICKETS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600">
                {allIssues.filter(i => i.status === 'Resolved').length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Closed & verified</span>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Driver Vehicle Complaints & Problem Reports
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage breakdown reports, hydraulic jam tickets, brake failures, and mechanical faults submitted by sanitation drivers.
              </p>
            </div>

            <button
              onClick={() => {
                if (vehicles.length > 0) {
                  setIssueForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                }
                setShowIssueModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Report New Vehicle Problem
            </button>
          </div>

          {/* Problem Tickets Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {allIssues.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No Vehicle Complaints or Problems</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    All municipal sanitation vehicles are operating properly with no reported driver complaints or mechanical faults.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (vehicles.length > 0) setIssueForm(prev => ({ ...prev, vehicleId: vehicles[0]._id }));
                    setShowIssueModal(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Report Vehicle Fault
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">TICKET ID & VEHICLE</th>
                      <th className="px-6 py-4">REPORTING DRIVER</th>
                      <th className="px-6 py-4">CATEGORY & SEVERITY</th>
                      <th className="px-6 py-4">FAULT DESCRIPTION</th>
                      <th className="px-6 py-4">TICKET STATUS</th>
                      <th className="px-6 py-4">REPORTED DATE</th>
                      <th className="px-6 py-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allIssues.map((iss) => {
                      const vObj = vehicles.find(v => v._id === iss.vehicleId);
                      return (
                        <tr key={iss._id || iss.customId} className="hover:bg-slate-50/60 transition">
                          <td className="px-6 py-4">
                            <span className="font-mono text-[11px] font-bold text-slate-900 block">
                              {iss.customId || 'ISS-FAULT'}
                            </span>
                            <span className="font-semibold text-slate-800 block text-xs">
                              {iss.vehicleNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">{iss.vehicleModel}</span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 block">{iss.driverName || 'Driver Staff'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{iss.driverPhone || 'On File'}</span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-800 block">{iss.category}</span>
                              {getSeverityBadge(iss.severity)}
                            </div>
                          </td>

                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                              {iss.description}
                            </p>
                            {iss.resolutionNotes && (
                              <span className="text-[10px] text-emerald-600 block mt-1 font-medium">
                                Resolution: {iss.resolutionNotes}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {getIssueStatusBadge(iss.status)}
                          </td>

                          <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                            {new Date(iss.reportedDate).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {iss.status !== 'In Repair' && iss.status !== 'Resolved' && (
                                <button
                                  onClick={() => {
                                    setSelectedVehicleForAction(vObj);
                                    setSelectedIssueForAction(iss);
                                    handleUpdateIssueStatus('In Repair', 'Vehicle transferred to workshop bay for diagnostic and repairs.');
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition"
                                  title="Mark In Repair"
                                >
                                  In Repair
                                </button>
                              )}

                              {iss.status !== 'Resolved' && (
                                <button
                                  onClick={() => {
                                    setSelectedVehicleForAction(vObj);
                                    setSelectedIssueForAction(iss);
                                    setShowResolveModal(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition shadow-xs"
                                  title="Resolve Problem"
                                >
                                  Resolve
                                </button>
                              )}

                              {iss.status === 'Resolved' && (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Closed
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT VEHICLE DETAILS */}
      {/* ========================================================= */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Edit Vehicle: {editingVehicle.vehicleNumber}</h3>
                  <p className="text-xs text-slate-400">Update technical specs, sector routing, and operational status</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle License Plate</label>
                  <input
                    type="text"
                    required
                    value={editingVehicle.vehicleNumber}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Category</label>
                  <select
                    value={editingVehicle.vehicleType}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, vehicleType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="Compactor Truck">Compactor Truck</option>
                    <option value="Mini Tipper">Mini Tipper</option>
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="E-Waste Van">E-Waste Van</option>
                    <option value="Recycling Truck">Recycling Truck</option>
                    <option value="Mechanical Road Sweeper">Mechanical Road Sweeper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make & Model</label>
                  <input
                    type="text"
                    value={editingVehicle.model || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payload (KG)</label>
                  <input
                    type="number"
                    value={editingVehicle.capacityKg || 2500}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, capacityKg: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Powertrain</label>
                  <select
                    value={editingVehicle.fuelType || 'CNG'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, fuelType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric EV</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Driver</label>
                  <select
                    value={editingVehicle.assignedDriverName || 'Unassigned'}
                    onChange={(e) => {
                      const dName = e.target.value;
                      const dObj = drivers.find(d => d.name === dName);
                      setEditingVehicle({
                        ...editingVehicle,
                        assignedDriverName: dName,
                        assignedDriverId: dObj?._id || null
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="Unassigned">-- Unassigned --</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d.name}>{d.name} ({d.customId || 'Driver'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Sector</label>
                  <select
                    value={editingVehicle.assignedSector || 'Unassigned'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, assignedSector: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="Unassigned">-- Unassigned Sector --</option>
                    {serviceAreas.map(area => (
                      <option key={area._id || area.name} value={area.displayName || area.name}>
                        {area.displayName || area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingVehicle.status || 'Operational'}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="Operational">Operational</option>
                    <option value="In-Transit">In-Transit</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Odometer (KM)</label>
                  <input
                    type="number"
                    value={editingVehicle.odometerKm || 0}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, odometerKm: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GPS Telemetry ID</label>
                  <input
                    type="text"
                    value={editingVehicle.gpsUnitId || ''}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, gpsUnitId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance & Fleet Notes</label>
                <textarea
                  rows="2"
                  value={editingVehicle.remarks || ''}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Vehicle Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOG FUEL ENTRY */}
      {/* ========================================================= */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Log Fuel / Energy Refill</h3>
                  <p className="text-xs text-slate-400">Record vehicle fuel consumption and cost in ₹</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFuelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Fleet Vehicle *</label>
                <select
                  required
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-emerald-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} ({v.model} - {v.fuelType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fuelForm.quantity}
                    onChange={(e) => setFuelForm({ ...fuelForm, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={fuelForm.unit}
                    onChange={(e) => setFuelForm({ ...fuelForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-emerald-500"
                  >
                    <option value="Liters">Liters (Diesel/Petrol)</option>
                    <option value="Kg">Kg (CNG)</option>
                    <option value="kWh">kWh (Electric EV)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 14200"
                    value={fuelForm.odometerKm}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometerKm: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Station / Depot</label>
                <input
                  type="text"
                  value={fuelForm.station}
                  onChange={(e) => setFuelForm({ ...fuelForm, station: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logged By (Driver / Attendant)</label>
                <input
                  type="text"
                  placeholder="e.g. Driver Ramesh Kumar or Station Supervisor"
                  value={fuelForm.loggedBy}
                  onChange={(e) => setFuelForm({ ...fuelForm, loggedBy: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009663] text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Fuel Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SCHEDULE / LOG SERVICE */}
      {/* ========================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Log Service & Maintenance</h3>
                  <p className="text-xs text-slate-400">Record depot workshop repairs and upcoming service schedule</p>
                </div>
              </div>
              <button 
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Fleet Vehicle *</label>
                <select
                  required
                  value={serviceForm.vehicleId}
                  onChange={(e) => setServiceForm({ ...serviceForm, vehicleId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-amber-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} ({v.model} - {v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Type *</label>
                <select
                  value={serviceForm.serviceType}
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-amber-500"
                >
                  <option value="Routine 10k Oil & Filters Servicing">Routine 10k Oil & Filters Servicing</option>
                  <option value="Hydraulic Compactor Overhaul">Hydraulic Compactor Overhaul</option>
                  <option value="Brake Pad & Drum Replacement">Brake Pad & Drum Replacement</option>
                  <option value="Tire Replacement & Wheel Alignment">Tire Replacement & Wheel Alignment</option>
                  <option value="Electrical & Battery Diagnostics">Electrical & Battery Diagnostics</option>
                  <option value="Annual Municipal Fitness Certification">Annual Municipal Fitness Certification</option>
                  <option value="Major Engine / Transmission Overhaul">Major Engine / Transmission Overhaul</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-amber-700 focus:bg-white focus:outline-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15800"
                    value={serviceForm.odometerKm}
                    onChange={(e) => setServiceForm({ ...serviceForm, odometerKm: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:bg-white focus:outline-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Workshop / Depot</label>
                  <input
                    type="text"
                    value={serviceForm.workshop}
                    onChange={(e) => setServiceForm({ ...serviceForm, workshop: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Next Service Due Date</label>
                  <input
                    type="date"
                    value={serviceForm.nextDue}
                    onChange={(e) => setServiceForm({ ...serviceForm, nextDue: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Inspector Name</label>
                <input
                  type="text"
                  value={serviceForm.technician}
                  onChange={(e) => setServiceForm({ ...serviceForm, technician: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Notes & Actions Taken</label>
                <textarea
                  rows="2"
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Service Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: REPORT VEHICLE PROBLEM / DRIVER COMPLAINT */}
      {/* ========================================================= */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Report Vehicle Problem</h3>
                  <p className="text-xs text-slate-400">Driver vehicle breakdown and fault ticket filing</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Affected Vehicle *</label>
                <select
                  required
                  value={issueForm.vehicleId}
                  onChange={(e) => setIssueForm({ ...issueForm, vehicleId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-rose-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.vehicleNumber} ({v.model} - Driver: {v.assignedDriverName || 'Unassigned'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reporting Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={issueForm.driverName}
                    onChange={(e) => setIssueForm({ ...issueForm, driverName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-rose-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driver Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={issueForm.driverPhone}
                    onChange={(e) => setIssueForm({ ...issueForm, driverPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Problem Category *</label>
                  <select
                    value={issueForm.category}
                    onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-rose-500"
                  >
                    <option value="Hydraulic Compactor">Hydraulic Compactor Jam</option>
                    <option value="Brakes & Braking System">Brakes & Braking System</option>
                    <option value="Engine & Transmission">Engine & Transmission</option>
                    <option value="Steering & Suspension">Steering & Suspension</option>
                    <option value="Electrical & Battery">Electrical & Battery</option>
                    <option value="GPS Telemetry Device">GPS Telemetry Offline</option>
                    <option value="Tire Puncture / Blowout">Tire Puncture / Blowout</option>
                    <option value="Body & Tailgate Latch">Body & Tailgate Latch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={issueForm.severity}
                    onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:bg-white focus:outline-rose-500"
                  >
                    <option value="Low">Low (Minor Noise / Cosmetic)</option>
                    <option value="Medium">Medium (Affecting Operations)</option>
                    <option value="High">High (Needs Depot Inspection)</option>
                    <option value="Critical">Critical (Ground Vehicle Immediately)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Problem Description *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe the vehicle issue observed by driver (e.g. compactor hydraulic cylinder making loud grinding noise and jammed at 60% stroke)."
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Reporting...' : 'Submit Problem Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RESOLVE ISSUE WITH NOTES */}
      {/* ========================================================= */}
      {showResolveModal && selectedIssueForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Resolve Fault Ticket</h3>
                  <p className="text-xs text-slate-400">Close issue {selectedIssueForAction.customId || 'ISS-FAULT'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs">
              <div className="font-bold text-slate-800">{selectedIssueForAction.vehicleNumber} • {selectedIssueForAction.category}</div>
              <p className="text-slate-500 line-clamp-2">{selectedIssueForAction.description}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Resolution & Repair Notes</label>
              <textarea
                rows="3"
                value={resolveForm.resolutionNotes}
                onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
                placeholder="Details of repair, parts replaced, or diagnostic check..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUpdateIssueStatus('Resolved', resolveForm.resolutionNotes)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
