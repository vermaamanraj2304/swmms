import React, { useState } from 'react';
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
  Coins,
  Recycle,
  Scale,
  Leaf,
  Calendar,
  Building,
  CreditCard
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
];

const SECTORS = [
  'Sector Alpha',
  'Sector Beta',
  'Sector Gamma',
  'Sector Delta',
  'Sector 4 Market Area',
  'Greenfield Central Avenue',
  'South Extension Zone'
];

export default function ResidentProfilePage({
  resident,
  garbagePoints = 0,
  onUpdateProfile,
  onNavigateToBilling,
  onRefresh,
  showToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(resident?.name || 'Aman Verma');
  const [phone, setPhone] = useState(resident?.phone || '+91 98112 34567');
  const [address, setAddress] = useState(resident?.address || resident?.houseLocation?.address || 'House #142, Sector Alpha');
  const [city, setCity] = useState(resident?.city || 'Greenfield Smart City');
  const [sector, setSector] = useState(resident?.houseLocation?.sector || resident?.sector || 'Sector Alpha');
  const [avatar, setAvatar] = useState(resident?.avatar || PRESET_AVATARS[0]);

  const residentId = resident?.customId || 'RES-101';
  const points = resident?.garbagePoints !== undefined ? resident.garbagePoints : garbagePoints;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      if (showToast) showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
      const res = await fetch('/api/resident/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          sector: sector.trim(),
          avatar
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        if (showToast) showToast('🎉 Profile details saved successfully!', 'success');
        setIsEditing(false);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(result.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Network error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(resident?.name || 'Aman Verma');
    setPhone(resident?.phone || '+91 98112 34567');
    setAddress(resident?.address || resident?.houseLocation?.address || 'House #142, Sector Alpha');
    setCity(resident?.city || 'Greenfield Smart City');
    setSector(resident?.houseLocation?.sector || resident?.sector || 'Sector Alpha');
    setAvatar(resident?.avatar || PRESET_AVATARS[0]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <img 
              src={avatar || PRESET_AVATARS[0]} 
              alt={name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs" title="Verified Household">
              ✓
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{name}</h2>
              <span className="bg-emerald-100 text-[#00B074] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Citizen
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {resident?.email || 'resident@swmms.gov'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Household ID: {residentId}
              </span>
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" /> {sector}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Edit Household Profile
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

      {/* 4 Eco Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ECO-POINTS</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-amber-600">{points} PTS</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">₹{(points * 0.5).toFixed(2)} bill rebate value</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RECYCLED YIELD</span>
            <Recycle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-600">{resident?.recycledPercent || 78}%</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Segregated dry recyclables</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DIVERTED WASTE</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-blue-600">{resident?.divertedWasteKg || 142} KG</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Diverted from municipal landfill</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">CO₂ SAVINGS</span>
            <Leaf className="w-4 h-4 text-teal-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-teal-600">{resident?.co2SavedKg || 38.5} KG</h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Net greenhouse emissions saved</span>
        </div>
      </div>

      {/* Main Grid: Edit Form / Profile Details + Digital ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Details / Edit Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                {isEditing ? 'Edit Profile & Household Information' : 'Household Registration Particulars'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Official municipal sanitation registry details
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
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
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
                  <label className="block font-bold text-slate-700 mb-1">City / Municipality *</label>
                  <input 
                    type="text" 
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Municipal Sector / Ward *</label>
                <select 
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:bg-white focus:outline-emerald-500 text-slate-800"
                >
                  {SECTORS.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">House / Doorstep Address *</label>
                <textarea 
                  rows={2}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:bg-white focus:outline-emerald-500"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Choose Avatar Picture</label>
                <div className="flex items-center gap-2.5">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition ${
                        avatar === av ? 'border-[#00B074] scale-105 shadow-xs' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
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
                  {saving ? 'Saving Updates...' : 'Save Profile Changes'}
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Resident Full Name</span>
                  <span className="text-slate-800 font-bold text-sm block">{name}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contact Phone</span>
                  <span className="text-slate-800 font-bold text-sm block">{phone}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Municipal Ward / Sector</span>
                  <span className="text-emerald-700 font-bold text-sm block">{sector}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">City / Territory</span>
                  <span className="text-slate-800 font-bold text-sm block">{city}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Doorstep Service Address</span>
                <span className="text-slate-800 font-semibold block leading-relaxed">{address}</span>
              </div>

              {/* Assigned Vehicle & Driver Details */}
              <div className="bg-[#E6F7F2] p-4 rounded-2xl border border-[#00B074]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#00B074] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" /> Assigned Doorstep Collection Crew
                  </span>
                  <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Daily Route 07:30 - 10:30 AM
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fleet Compactor Truck:</span>
                    <strong className="text-xs font-bold">{resident?.assignedVehicle || 'Compactor Truck DL-01-EA-5544'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Driver In-Charge:</span>
                    <strong className="text-xs font-bold">{resident?.assignedDriverName || 'Vikram (Lead Fleet Operator)'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Digital Household Card & Subscription */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Household Waste Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 border border-slate-700 shadow-lg space-y-4 relative overflow-hidden">
            <div className="w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl absolute -top-10 -right-10 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-xs tracking-wider uppercase text-slate-300">
                    MUNICIPAL SANITATION CARD
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold">SWM&MS Smart City</span>
                </div>
              </div>
              <span className="font-mono text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-700/60">
                {residentId}
              </span>
            </div>

            {/* QR Code Graphic Box */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-slate-900 shadow-sm space-y-2">
              <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center">
                <QrCode className="w-full h-full text-white" />
              </div>
              <span className="font-mono text-[11px] font-extrabold tracking-wider text-slate-700">
                TMT-{residentId}-PASS
              </span>
              <p className="text-[10px] text-slate-400 text-center font-medium">
                Show QR to curbside collection driver for instant weight verification & point credit
              </p>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Doorstep Household</span>
              <p className="font-semibold text-slate-200 truncate">{address}</p>
            </div>
          </div>

          {/* Active Plan Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Active Service Plan
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <strong className="text-xs font-bold text-slate-900 block">
                  {resident?.billing?.plan || 'Standard Pro (120 Gallons)'}
                </strong>
                <span className="text-[11px] text-slate-500">
                  Includes daily curbside & 24/7 SOS pickups
                </span>
              </div>
              <span className="text-base font-extrabold text-emerald-600">
                ₹{resident?.billing?.price || 29}/mo
              </span>
            </div>

            {onNavigateToBilling && (
              <button
                type="button"
                onClick={onNavigateToBilling}
                className="w-full text-xs font-bold text-[#00B074] hover:text-[#009663] bg-emerald-50 hover:bg-emerald-100/70 py-2.5 rounded-xl border border-emerald-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Billing & Invoice History</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
