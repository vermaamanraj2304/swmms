import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  User, 
  CreditCard, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Heart,
  Award
} from 'lucide-react';

export default function DriverRegistrationPage({ 
  vehicles = [], 
  serviceAreas = [], 
  onRegistrationSuccess, 
  showToast 
}) {
  // Toggle to optionally assign vehicle and sector at the time of registration
  const [assignVehicleNow, setAssignVehicleNow] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Driver@123',
    gender: 'Male',
    aadharNumber: '',
    drivingLicence: '',
    dob: '',
    bloodGroup: 'O+',
    experienceYears: 4,
    vehicle: '',
    sector: 'Greenfield District'
  });

  // Unassigned Vehicles state
  const [unassignedVehicles, setUnassignedVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Fetch unassigned vehicles from API
  const fetchUnassignedVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const res = await fetch('/api/admin/unassigned-vehicles');
      if (res.ok) {
        const data = await res.json();
        const list = data.vehicles || [];
        setUnassignedVehicles(list);
        if (list.length > 0 && !formData.vehicle) {
          setFormData(prev => ({ ...prev, vehicle: list[0].vehicleNumber }));
        } else if (list.length === 0) {
          setFormData(prev => ({ ...prev, vehicle: '' }));
        }
      } else {
        // Fallback filter using vehicles prop if available
        const filtered = (vehicles || []).filter(v => 
          !v.assignedDriverId || 
          v.assignedDriverName === 'Unassigned' || 
          !v.assignedDriverName
        );
        setUnassignedVehicles(filtered);
        if (filtered.length > 0 && !formData.vehicle) {
          setFormData(prev => ({ ...prev, vehicle: filtered[0].vehicleNumber }));
        }
      }
    } catch (err) {
      console.warn('Error fetching unassigned vehicles:', err);
      const filtered = (vehicles || []).filter(v => 
        !v.assignedDriverId || 
        v.assignedDriverName === 'Unassigned' || 
        !v.assignedDriverName
      );
      setUnassignedVehicles(filtered);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    fetchUnassignedVehicles();
  }, [vehicles]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      if (showToast) showToast('Name, email, and phone are mandatory.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const finalVehicle = assignVehicleNow ? (formData.vehicle || '') : '';
      const finalSector = assignVehicleNow ? (formData.sector || 'Unassigned') : 'Unassigned';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password || 'Driver@123',
        gender: formData.gender,
        aadharNumber: formData.aadharNumber.trim(),
        drivingLicence: formData.drivingLicence.trim(),
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        experienceYears: Number(formData.experienceYears) || 0,
        vehicle: finalVehicle,
        sector: finalSector,
        liveLocation: {
          lat: 28.6139,
          lng: 77.2090,
          address: finalSector || 'Municipal Fleet Depot',
          speedKm: 0,
          heading: 'Standby'
        }
      };

      const res = await fetch('/api/admin/add-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setRegistrationResult(data);
        if (showToast) showToast(`Driver ${formData.name} registered successfully!`, 'success');
        if (onRegistrationSuccess) onRegistrationSuccess();
        // Refresh unassigned vehicles list since one may have been assigned
        fetchUnassignedVehicles();
      } else {
        if (showToast) showToast(data.message || 'Failed to register driver', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Server error registering driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`${label} copied to clipboard!`, 'info');
  };

  // Find currently selected vehicle object for quick preview
  const selectedVehicleObj = assignVehicleNow ? unassignedVehicles.find(v => v.vehicleNumber === formData.vehicle) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              MUNICIPAL FLEET RECRUITMENT
            </span>
            {unassignedVehicles.length > 0 ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {unassignedVehicles.length} Unassigned Vehicle{unassignedVehicles.length > 1 ? 's' : ''} Ready
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                No Vehicle Available
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Driver Fleet Registration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register commercial drivers with regulatory compliance (Aadhaar, Driving Licence, DOB) and dispatch login credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUnassignedVehicles}
          disabled={loadingVehicles}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingVehicles ? 'animate-spin text-blue-600' : ''}`} />
          Refresh Fleet Status
        </button>
      </div>

      {registrationResult ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl p-8 border border-blue-200 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">ENROLLMENT CONFIRMED</span>
              <h3 className="text-xl font-bold text-slate-900">Fleet Driver Successfully Enrolled!</h3>
              <p className="text-xs text-slate-500">
                Driver record created with verified compliance credentials. Account is ready for duty login.
              </p>
            </div>
          </div>

          {/* Credentials Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">DRIVER CALLSIGN / LOGIN ID</span>
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-800">{registrationResult.credentials?.customId}</span>
                <button 
                  onClick={() => copyToClipboard(registrationResult.credentials?.customId, 'Login ID')} 
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy Login ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">INITIAL PASSWORD</span>
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-blue-700">{registrationResult.credentials?.password}</span>
                <button 
                  onClick={() => copyToClipboard(registrationResult.credentials?.password, 'Password')} 
                  className="text-slate-400 hover:text-slate-700 p-1"
                  title="Copy Password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">ASSIGNED VEHICLE</span>
              <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  {registrationResult.user?.assignedVehicle || 'Vehicle Pending Assignment'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">DRIVING LICENCE</span>
              <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-bold text-slate-800">
                  {registrationResult.user?.drivingLicence || 'Verified On File'}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp & Email Actions */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Credentials Dispatch Channels
              </span>
              <p className="text-xs text-blue-700">
                Notification prepared for: <strong>{registrationResult.user?.email}</strong> & <strong>{registrationResult.user?.phone || 'SMS / WhatsApp'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {registrationResult.dispatch?.whatsappUrl && (
                <a
                  href={registrationResult.dispatch.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch via WhatsApp
                </a>
              )}
              {registrationResult.dispatch?.mailtoUrl && (
                <a
                  href={registrationResult.dispatch.mailtoUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
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
                name: '',
                email: '',
                phone: '',
                password: 'Driver@123',
                gender: 'Male',
                aadharNumber: '',
                drivingLicence: '',
                dob: '',
                bloodGroup: 'O+',
                experienceYears: 4,
                vehicle: unassignedVehicles[0]?.vehicleNumber || '',
                sector: 'Greenfield District'
              });
              setAssignVehicleNow(true);
            }}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-sm"
          >
            Register Another Fleet Driver
          </button>
        </div>
      ) : (
        /* Driver Registration Form (No Map, Clean Layout) */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Personal Information</h3>
                <p className="text-[11px] text-slate-400">Driver biographical details and demographic profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Driver Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Rodriguez"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-blue-500 transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date of Birth (DOB) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Identity & Regulatory Compliance Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Identity & Regulatory Compliance</h3>
                <p className="text-[11px] text-slate-400">Official identification and commercial driving permits</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Aadhaar Number (12 Digits) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5432 1098 7654"
                    value={formData.aadharNumber}
                    onChange={e => setFormData({ ...formData, aadharNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs font-medium focus:outline-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Commercial Driving Licence No. <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-1420110012345"
                    value={formData.drivingLicence}
                    onChange={e => setFormData({ ...formData, drivingLicence: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs font-medium focus:outline-purple-500 transition uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Blood Group
                </label>
                <div className="relative">
                  <Heart className="w-4 h-4 text-red-500 absolute left-3.5 top-3" />
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-purple-500 transition"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact Details & Account Setup */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Contact Details & Account Credentials</h3>
                <p className="text-[11px] text-slate-400">Communication endpoints for credentials delivery and login creation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="driver.fleet@citygov.org"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number (WhatsApp Dispatch) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98123 45678"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Driving Experience (Years)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    min="0"
                    max="45"
                    placeholder="e.g. 5"
                    value={formData.experienceYears}
                    onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Account Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs font-medium focus:outline-emerald-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Fleet Vehicle & Operational Sector Assignment with Toggle */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">Fleet Vehicle & Operational Sector Assignment</h3>
                  <p className="text-[11px] text-slate-400">Optionally assign a municipal vehicle and sector now, or defer for later</p>
                </div>
              </div>

              {/* Toggle Button */}
              <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Assign at registration:</span>
                <button
                  type="button"
                  onClick={() => setAssignVehicleNow(!assignVehicleNow)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    assignVehicleNow ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={assignVehicleNow}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      assignVehicleNow ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-[11px] font-bold ${assignVehicleNow ? 'text-blue-600' : 'text-slate-400'}`}>
                  {assignVehicleNow ? 'Enabled' : 'Deferred'}
                </span>
              </div>
            </div>

            {/* Conditionally Rendered when Toggle is ON */}
            {assignVehicleNow ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Vehicle Dropdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        Assigned Vehicle
                      </label>
                      {unassignedVehicles.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {unassignedVehicles.length} available
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          None Available
                        </span>
                      )}
                    </div>

                    {loadingVehicles ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-200">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        Scanning municipal vehicles...
                      </div>
                    ) : unassignedVehicles.length > 0 ? (
                      <select
                        value={formData.vehicle}
                        onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-amber-500 transition"
                      >
                        <option value="">-- Select an Unassigned Vehicle --</option>
                        {unassignedVehicles.map(v => (
                          <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                            {v.vehicleNumber} ({v.vehicleType || 'Compactor'} - {v.model || 'Standard'} • {v.fuelType || 'CNG'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        disabled
                        value=""
                        className="w-full px-4 py-2.5 rounded-xl border border-red-200 bg-red-50/50 text-xs font-bold text-red-600 cursor-not-allowed"
                      >
                        <option value="">No vehicle available</option>
                      </select>
                    )}
                  </div>

                  {/* Sector Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Assigned Municipal Operational Sector
                    </label>
                    <select
                      value={formData.sector}
                      onChange={e => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium focus:outline-amber-500 transition"
                    >
                      {serviceAreas.length > 0 ? (
                        serviceAreas.map(sa => (
                          <option key={sa._id || sa.name} value={sa.name}>{sa.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="Greenfield District">Greenfield District (Ward 1-4)</option>
                          <option value="North Eco Sector">North Eco Sector (Ward 5-8)</option>
                          <option value="Industrial Corridor">Industrial Corridor (Ward 9-12)</option>
                          <option value="Central Municipal Ward">Central Municipal Ward (Depot)</option>
                          <option value="Unassigned">Standby / Unassigned Pool</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Selected Vehicle Spec Preview (if chosen) */}
                {selectedVehicleObj && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VEHICLE TYPE</span>
                      <span className="font-semibold text-slate-800">{selectedVehicleObj.vehicleType || 'Compactor Truck'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MODEL</span>
                      <span className="font-semibold text-slate-800">{selectedVehicleObj.model || 'Tata 407 LPT'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CAPACITY / FUEL</span>
                      <span className="font-semibold text-slate-800">{selectedVehicleObj.capacityKg || 2500} kg • {selectedVehicleObj.fuelType || 'CNG'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GPS UNIT ID</span>
                      <span className="font-mono font-semibold text-blue-600">{selectedVehicleObj.gpsUnitId || 'Depot Calibrated'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-500 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Vehicle and sector assignment is deferred. Driver will be registered as <strong>Standby / Unassigned</strong> and can be assigned a vehicle anytime from the Driver Area Assignment panel.
                </span>
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Credentials will be generated and dispatched automatically via WhatsApp and Email upon registration.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enrolling Driver & Dispatching Credentials...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Driver Registration
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
