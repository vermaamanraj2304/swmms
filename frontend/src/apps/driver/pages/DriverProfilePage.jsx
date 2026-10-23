import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  QrCode, 
  ShieldCheck, 
  Truck, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Power,
  Radio,
  FileText,
  Award,
  AlertCircle,
  HeartPulse,
  IdCard,
  Compass
} from 'lucide-react';

const PRESET_DRIVER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function DriverProfilePage({
  driverInfo,
  isOnDuty = false,
  onToggleDuty,
  totalHouses = 0,
  clearedHouses = 0,
  onRefresh,
  showToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(driverInfo?.name || 'Vikram Singh');
  const [phone, setPhone] = useState(driverInfo?.phone || '+91 98765 43210');
  const [address, setAddress] = useState(driverInfo?.address || 'Staff Quarters, Municipal Depot #4');
  const [drivingLicence, setDrivingLicence] = useState(driverInfo?.drivingLicence || 'DL-0420110098234');
  const [aadharNumber, setAadharNumber] = useState(driverInfo?.aadharNumber || 'XXXX-XXXX-8921');
  const [bloodGroup, setBloodGroup] = useState(driverInfo?.bloodGroup || 'O+');
  const [emergencyContact, setEmergencyContact] = useState(driverInfo?.emergencyContact || 'Sunita Singh (Spouse)');
  const [emergencyPhone, setEmergencyPhone] = useState(driverInfo?.emergencyPhone || '+91 98765 99887');
  const [experienceYears, setExperienceYears] = useState(driverInfo?.experienceYears || 5);
  const [avatar, setAvatar] = useState(driverInfo?.avatar || PRESET_DRIVER_AVATARS[0]);

  // Keep state synced when driverInfo updates from backend
  useEffect(() => {
    if (driverInfo && !isEditing) {
      if (driverInfo.name) setName(driverInfo.name);
      if (driverInfo.phone) setPhone(driverInfo.phone);
      if (driverInfo.address) setAddress(driverInfo.address);
      if (driverInfo.drivingLicence) setDrivingLicence(driverInfo.drivingLicence);
      if (driverInfo.aadharNumber) setAadharNumber(driverInfo.aadharNumber);
      if (driverInfo.bloodGroup) setBloodGroup(driverInfo.bloodGroup);
      if (driverInfo.emergencyContact) setEmergencyContact(driverInfo.emergencyContact);
      if (driverInfo.emergencyPhone) setEmergencyPhone(driverInfo.emergencyPhone);
      if (driverInfo.experienceYears !== undefined) setExperienceYears(driverInfo.experienceYears);
      if (driverInfo.avatar) setAvatar(driverInfo.avatar);
    }
  }, [driverInfo, isEditing]);

  const driverId = driverInfo?.customId || 'DRV-902';
  const assignedVehicle = driverInfo?.assignedVehicle || 'Compactor Truck DL-01-EA-5544';
  const activeSector = driverInfo?.activeSector || 'Sector Alpha';
  const title = driverInfo?.title || 'Senior Municipal Fleet Operator';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (showToast) showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          avatar,
          drivingLicence: drivingLicence.trim(),
          aadharNumber: aadharNumber.trim(),
          bloodGroup: bloodGroup.trim(),
          emergencyContact: emergencyContact.trim(),
          emergencyPhone: emergencyPhone.trim(),
          experienceYears: Number(experienceYears) || 0
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        try {
          const stored = localStorage.getItem('tmt_driver_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('tmt_driver_user', JSON.stringify({ ...parsed, ...result.driver }));
          }
        } catch (e) {
          console.warn('Could not update localStorage driver:', e);
        }
        if (showToast) showToast('🎉 Operator profile updated successfully!', 'success');
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(result.message || 'Failed to update driver profile', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating driver profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(driverInfo?.name || 'Vikram Singh');
    setPhone(driverInfo?.phone || '+91 98765 43210');
    setAddress(driverInfo?.address || 'Staff Quarters, Municipal Depot #4');
    setDrivingLicence(driverInfo?.drivingLicence || 'DL-0420110098234');
    setAadharNumber(driverInfo?.aadharNumber || 'XXXX-XXXX-8921');
    setBloodGroup(driverInfo?.bloodGroup || 'O+');
    setEmergencyContact(driverInfo?.emergencyContact || 'Sunita Singh (Spouse)');
    setEmergencyPhone(driverInfo?.emergencyPhone || '+91 98765 99887');
    setExperienceYears(driverInfo?.experienceYears || 5);
    setAvatar(driverInfo?.avatar || PRESET_DRIVER_AVATARS[0]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img 
              src={avatar || PRESET_DRIVER_AVATARS[0]} 
              alt={name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
            />
            <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs text-white ${
              isOnDuty ? 'bg-emerald-500' : 'bg-slate-400'
            }`} title={isOnDuty ? 'On Duty (Broadcasting GPS)' : 'Off Duty'}>
              {isOnDuty ? '●' : '○'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{name}</h2>
              <span className="bg-emerald-100 text-[#00B074] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Certified Municipal Driver
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                isOnDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                <Radio className={`w-3 h-3 ${isOnDuty ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                {isOnDuty ? 'On Duty (GPS Broadcasting)' : 'Off Duty (Standby)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {driverInfo?.email || 'driver@swmms.gov'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Operator ID: {driverId}
              </span>
              <span className="text-xs text-slate-700 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200 flex items-center gap-1">
                <Truck className="w-3 h-3 text-amber-600" /> {assignedVehicle}
              </span>
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> {activeSector}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {onToggleDuty && (
            <button
              type="button"
              onClick={onToggleDuty}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer ${
                isOnDuty 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Power className="w-4 h-4" />
              {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
            </button>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Edit Driver Profile
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* 4 Fleet Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASSIGNED TRUCK</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{assignedVehicle}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Compactor Hydraulic Loader</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE SECTOR</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-emerald-700 truncate">{activeSector}</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Primary Municipal Ward</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TODAY'S HOUSES</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-blue-600">{clearedHouses} / {totalHouses}</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Household checkpoints cleared</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">EXPERIENCE</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-purple-700">{experienceYears} Years</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Certified Heavy Vehicle Driver</span>
        </div>
      </div>

      {/* Main Grid: Edit Form / Details + Digital Smart Pass */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Driver Details / Edit Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                {isEditing ? 'Edit Operator Credentials & Details' : 'Official Driver Personnel Record'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Municipal Sanitation Authority Fleet Register
              </p>
            </div>
            {isEditing && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Editing Mode Active
              </span>
            )}
          </div>

          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Operator Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commercial Driving Licence *</label>
                  <input 
                    type="text" 
                    required
                    value={drivingLicence}
                    onChange={e => setDrivingLicence(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select 
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500 text-slate-800"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="40"
                    value={experienceYears}
                    onChange={e => setExperienceYears(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential / Staff Quarters Address</label>
                <textarea 
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                  <input 
                    type="text" 
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Spouse / Relative Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input 
                    type="text" 
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="e.g. +91 98765 00000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Choose Driver Avatar</label>
                <div className="flex items-center gap-2.5">
                  {PRESET_DRIVER_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition ${
                        avatar === av ? 'border-[#00B074] scale-105 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Driver avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#00B074] hover:bg-[#009663] disabled:opacity-50 text-white py-3 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Read-Only Details Grid */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operator Full Name</span>
                  <span className="text-slate-800 font-bold text-sm block">{name}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Official Mobile Phone</span>
                  <span className="text-slate-800 font-bold text-sm block">{phone}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Commercial Driving Licence</span>
                  <span className="text-slate-900 font-mono font-bold text-xs block">{drivingLicence}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Blood Group</span>
                  <span className="text-rose-700 font-bold text-sm block">{bloodGroup} Positive</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Residential / Depot Address</span>
                <span className="text-slate-800 font-semibold block leading-relaxed">{address}</span>
              </div>

              {/* Emergency Contact Box */}
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Emergency Contact Particulars
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-0.5">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contact Name:</span>
                    <strong className="text-xs font-bold text-slate-900">{emergencyContact}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Contact Phone:</span>
                    <strong className="text-xs font-bold text-slate-900">{emergencyPhone}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Digital Operator Smart Pass & Telemetry Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Operator Smart Pass */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 border border-slate-700 shadow-lg space-y-4 relative overflow-hidden">
            <div className="w-32 h-32 bg-amber-500/10 rounded-full blur-2xl absolute -top-10 -right-10 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs tracking-wider uppercase text-slate-300">
                    MUNICIPAL OPERATOR PASS
                  </h4>
                  <span className="text-[10px] text-amber-400 font-semibold">SWM&MS Smart Fleet</span>
                </div>
              </div>
              <span className="font-mono text-xs font-extrabold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-700/60">
                {driverId}
              </span>
            </div>

            {/* QR Code Graphic Box */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-slate-900 shadow-sm space-y-2">
              <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center">
                <QrCode className="w-full h-full text-white" />
              </div>
              <span className="font-mono text-[11px] font-extrabold tracking-wider text-slate-700">
                TMT-OPERATOR-{driverId}
              </span>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Scan at municipal fueling terminal & depot weighing weighbridge for automated shift log
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Assigned Vehicle:</span>
                <span className="font-bold text-amber-400">{assignedVehicle}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Base Depot:</span>
                <span className="font-bold text-slate-200">Central Municipal Depot #4</span>
              </div>
            </div>
          </div>

          {/* Telemetry & Base Station */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" /> GPS Telemetry Beacon
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOnDuty ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isOnDuty ? 'Broadcasting GPS' : 'Standby'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Base Station Depot:</span>
                <span className="font-bold text-slate-800">Sector Alpha Base Station</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Depot Coordinates:</span>
                <span className="font-mono text-indigo-700 font-bold">28.4848° N, 77.5135° E</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Emergency Frequency:</span>
                <span className="font-semibold text-rose-700">Channel 14 (Municipal SOS)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
