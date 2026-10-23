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
  Building,
  Key,
  Users,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Gift,
  FileText,
  Radio,
  Server,
  Activity,
  Award,
  Clock,
  Compass
} from 'lucide-react';

const PRESET_ADMIN_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'
];

const ADMIN_AUTHORITIES = [
  { id: 'fleet', name: 'Fleet Telemetry & Vehicle Dispatch', desc: 'Real-time GPS tracking, vehicle telemetry & driver route allocations', icon: Truck, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'emergencies', name: 'Emergency SOS Priority Dispatch', desc: 'Direct vehicle-to-house emergency route override authority', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
  { id: 'citizens', name: 'Citizen Directory & GIS Property Pins', desc: 'Household onboardings, sector geofences & municipal citations', icon: Users, color: 'text-blue-500 bg-blue-50' },
  { id: 'complaints', name: 'Incident & Roadside Cleanup Command', desc: 'AI waste vision dispatch, illegal dump spot investigations', icon: MessageSquare, color: 'text-amber-500 bg-amber-50' },
  { id: 'finance', name: 'Billing, Invoicing & Financial Approvals', desc: 'Municipal service fees, Stripe oversight & refund reversals', icon: CreditCard, color: 'text-purple-500 bg-purple-50' },
  { id: 'rewards', name: 'Eco-Points Economy & Gift Inventory', desc: 'Points multiplier calibration, gift approvals & fulfillment', icon: Gift, color: 'text-pink-500 bg-pink-50' },
  { id: 'rbac', name: 'Staff Onboarding & Access Control', desc: 'Cryptographic permissions, role definitions & staff credentials', icon: Key, color: 'text-indigo-500 bg-indigo-50' },
  { id: 'audit', name: 'System Security & Forensic Audit Logs', desc: 'Immutable tamper-proof municipal incident and operational logs', icon: ShieldCheck, color: 'text-slate-700 bg-slate-100' }
];

export default function AdminProfilePage({
  adminUser,
  data,
  onRefresh,
  showToast,
  onNavigateTab
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(adminUser?.name || 'Municipal Administrator');
  const [phone, setPhone] = useState(adminUser?.phone || '+91 120 234 5670');
  const [title, setTitle] = useState(adminUser?.title || adminUser?.roleName || 'Chief Municipal Sanitation Commissioner');
  const [department, setDepartment] = useState(adminUser?.department || 'Urban Sanitation & Waste Logistics Command');
  const [officeLocation, setOfficeLocation] = useState(adminUser?.officeLocation || 'Civic Centre, 4th Floor, Command Suite 402');
  const [city, setCity] = useState(adminUser?.city || 'Greater Noida Smart City');
  const [emergencyPhone, setEmergencyPhone] = useState(adminUser?.emergencyPhone || '+91 120 234 9999');
  const [avatar, setAvatar] = useState(adminUser?.avatar || PRESET_ADMIN_AVATARS[0]);

  // Sync state if adminUser changes from backend
  useEffect(() => {
    if (adminUser && !isEditing) {
      if (adminUser.name) setName(adminUser.name);
      if (adminUser.phone) setPhone(adminUser.phone);
      if (adminUser.title) setTitle(adminUser.title);
      if (adminUser.department) setDepartment(adminUser.department);
      if (adminUser.officeLocation) setOfficeLocation(adminUser.officeLocation);
      if (adminUser.city) setCity(adminUser.city);
      if (adminUser.emergencyPhone) setEmergencyPhone(adminUser.emergencyPhone);
      if (adminUser.avatar) setAvatar(adminUser.avatar);
    }
  }, [adminUser, isEditing]);

  const customId = adminUser?.customId || 'ADM-001';
  const email = adminUser?.email || 'admin@swmms.gov.in';
  const roleDisplay = (adminUser?.role || 'admin').toUpperCase();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (showToast) showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('tmt_admin_token') || localStorage.getItem('tmt_token');
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          title: title.trim(),
          department: department.trim(),
          officeLocation: officeLocation.trim(),
          city: city.trim(),
          emergencyPhone: emergencyPhone.trim(),
          avatar
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        // Sync to local storage
        try {
          const stored = localStorage.getItem('tmt_admin_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('tmt_admin_user', JSON.stringify({ ...parsed, ...result.admin }));
          }
          const userStored = localStorage.getItem('tmt_user');
          if (userStored) {
            const parsedUser = JSON.parse(userStored);
            if (parsedUser.email === result.admin.email) {
              localStorage.setItem('tmt_user', JSON.stringify({ ...parsedUser, ...result.admin }));
            }
          }
        } catch (e) {
          console.warn('Could not update localStorage admin:', e);
        }

        if (showToast) showToast('🎉 Administrator profile updated successfully!', 'success');
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(result.message || 'Failed to update admin profile', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating administrator profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(adminUser?.name || 'Municipal Administrator');
    setPhone(adminUser?.phone || '+91 120 234 5670');
    setTitle(adminUser?.title || adminUser?.roleName || 'Chief Municipal Sanitation Commissioner');
    setDepartment(adminUser?.department || 'Urban Sanitation & Waste Logistics Command');
    setOfficeLocation(adminUser?.officeLocation || 'Civic Centre, 4th Floor, Command Suite 402');
    setCity(adminUser?.city || 'Greater Noida Smart City');
    setEmergencyPhone(adminUser?.emergencyPhone || '+91 120 234 9999');
    setAvatar(adminUser?.avatar || PRESET_ADMIN_AVATARS[0]);
    setIsEditing(false);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `TMT-ADMIN-HQ-${customId}-CLEARANCE-LVL5`
  )}&bgcolor=0F172A&color=00B074&qzone=1`;

  const totalVehicles = data?.vehiclesList?.length || data?.stats?.totalVehicles || 12;
  const totalServiceAreas = data?.serviceAreas?.length || data?.stats?.totalServiceAreas || 8;
  const totalResidents = data?.residentsList?.length || data?.stats?.totalResidents || 48;
  const totalEmergencies = data?.emergencies?.length || data?.stats?.openEmergencies || 15;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img 
              src={avatar || PRESET_ADMIN_AVATARS[0]} 
              alt={name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-800 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs shadow-xs text-white" title="Administrator Active & Synced">
              ●
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{name}</h2>
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                {roleDisplay}
              </span>
              <span className="bg-emerald-100 text-[#00B074] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                LEVEL 5 CLEARANCE
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{title}</p>
            <p className="text-xs text-slate-400">
              Department: <span className="font-medium text-slate-600">{department}</span> • Municipal ID: <span className="font-mono text-slate-600 font-bold">{customId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#00B074] hover:bg-[#009e68] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00B074] flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Supervised Fleet</span>
            <span className="text-xl font-black text-[#0F172A]">{totalVehicles} Vehicles</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Compactors & In-Transit</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Service Zones</span>
            <span className="text-xl font-black text-[#0F172A]">{totalServiceAreas} Wards</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Active GIS Geofences</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Base</span>
            <span className="text-xl font-black text-[#0F172A]">{totalResidents} Households</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Curbside Collections</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Incident Authority</span>
            <span className="text-xl font-black text-[#0F172A]">{totalEmergencies} Recorded SOS</span>
            <p className="text-[11px] text-slate-500 mt-0.5">High Priority Dispatches</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form (if active) */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-400 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Modify Administrator Credentials</h3>
              <p className="text-xs text-slate-400">Update officer particulars, designated department, and official contact lines.</p>
            </div>
            <span className="bg-emerald-50 text-[#00B074] text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
              Editing Mode
            </span>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Official Officer Avatar</label>
            <div className="flex flex-wrap gap-3">
              {PRESET_ADMIN_AVATARS.map((av, idx) => (
                <img
                  key={idx}
                  src={av}
                  alt={`Preset ${idx + 1}`}
                  onClick={() => setAvatar(av)}
                  className={`w-14 h-14 rounded-2xl object-cover cursor-pointer border-2 transition hover:scale-105 ${
                    avatar === av ? 'border-[#00B074] ring-2 ring-emerald-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. Dr. Rajesh Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. Chief Municipal Sanitation Commissioner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designated Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. Urban Sanitation & Waste Logistics Command"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Direct Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. +91 120 234 5670"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Office Location / Chamber Room</label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. Civic Centre, 4th Floor, Command Suite 402"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jurisdiction City / Region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. Greater Noida Smart City"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Escalation Hotline</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#00B074]"
                placeholder="e.g. +91 120 234 9999"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#00B074] hover:bg-[#009e68] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Digital Command Smart Pass + Office Particulars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Smart Pass & Particulars */}
        <div className="lg:col-span-2 space-y-6">
          {/* Digital Municipal Command Smart Pass */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00B074] to-emerald-700 flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">MUNICIPAL COMMAND CREDENTIAL</span>
                  <h3 className="font-bold text-lg text-white">Digital Administrative Smart Pass</h3>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                ACTIVE • VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6 items-center">
              <div className="sm:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Officer Name</span>
                    <span className="font-bold text-white text-sm">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Official Badge Code</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{customId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Designation</span>
                    <span className="font-medium text-slate-200">{title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Department</span>
                    <span className="font-medium text-slate-200">{department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Executive Role</span>
                    <span className="font-bold text-emerald-400">{roleDisplay}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Jurisdiction Ward</span>
                    <span className="font-medium text-slate-200">{city}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block font-mono">
                    Issuing Authority: Department of Urban Development & Municipal Sanitation HQ
                  </span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
                <img 
                  src={qrUrl} 
                  alt="Municipal Command QR Pass" 
                  className="w-32 h-32 rounded-xl object-contain bg-slate-900"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-400" />
                  <span>Scan for Verification</span>
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Valid across all municipal depots, weighbridge stations & emergency control centers</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">TAMPER-PROOF DIGITALLY SIGNED</span>
            </div>
          </div>

          {/* Administrative Privileges Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Administrative Authorities & Privileges</h3>
                <p className="text-xs text-slate-400">Authorized operations and command permissions assigned to this profile.</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                8 Permissions Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {ADMIN_AUTHORITIES.map((auth) => {
                const Icon = auth.icon;
                return (
                  <div key={auth.id} className="p-3.5 rounded-2xl border border-slate-200/70 hover:border-slate-300 transition bg-slate-50/50 flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${auth.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#0F172A] truncate">{auth.name}</h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{auth.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Office Coordinates & System Telemetry */}
        <div className="space-y-6">
          {/* Official Coordinates Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              <span>Headquarters Coordinates</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px] block">OFFICIAL EMAIL</span>
                <span className="text-[#0F172A] font-bold text-xs">{email}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px] block">DIRECT PHONE</span>
                <span className="text-[#0F172A] font-bold text-xs">{phone}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px] block">EMERGENCY HOTLINE</span>
                <span className="text-rose-600 font-bold text-xs">{emergencyPhone}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px] block">CHAMBER / OFFICE LOCATION</span>
                <span className="text-[#0F172A] font-medium text-xs">{officeLocation}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 font-semibold text-[11px] block">MUNICIPAL WARD REGION</span>
                <span className="text-[#0F172A] font-medium text-xs">{city}</span>
              </div>
            </div>
          </div>

          {/* System Telemetry & Cluster Node Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              <span>System & Command Telemetry</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">WebSocket Beacon</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Synced
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Database Node</span>
                <span className="text-slate-800 font-mono font-bold">Atlas MongoDB Cluster</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">AI Dispatch Vision</span>
                <span className="text-indigo-600 font-bold">Gemini 2.5 Operational</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Encryption Standard</span>
                <span className="text-slate-800 font-mono font-bold">AES-256 JWT Token</span>
              </div>
            </div>

            {onNavigateTab && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('logs')}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Inspect Audit Logs Trail</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
