import React, { useState, useEffect } from 'react';
import { X, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AddDriverModal({ 
  isOpen, 
  onClose, 
  driverForm, 
  setDriverForm, 
  onSubmit,
  vehicles = []
}) {
  const [assignNow, setAssignNow] = useState(true);
  const [unassignedVehicles, setUnassignedVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/admin/unassigned-vehicles')
        .then(res => res.json())
        .then(data => {
          const list = data.vehicles || [];
          setUnassignedVehicles(list);
          if (list.length > 0 && !driverForm.vehicle) {
            setDriverForm(prev => ({ ...prev, vehicle: list[0].vehicleNumber }));
          } else if (list.length === 0) {
            setDriverForm(prev => ({ ...prev, vehicle: '' }));
          }
        })
        .catch(() => {
          const filtered = (vehicles || []).filter(v => !v.assignedDriverId || v.assignedDriverName === 'Unassigned');
          setUnassignedVehicles(filtered);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, vehicles]);

  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!assignNow) {
      setDriverForm(prev => ({ ...prev, vehicle: '', sector: 'Unassigned' }));
    }
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Register Fleet Driver</h3>
              <p className="text-[11px] text-slate-400">Add vehicle operator with compliance verification</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Driver Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Rajesh Kumar" 
                required 
                value={driverForm.name || ''} 
                onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address *</label>
              <input 
                type="email" 
                placeholder="driver@smartwaste.gov" 
                required 
                value={driverForm.email || ''} 
                onChange={e => setDriverForm({ ...driverForm, email: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile / Phone *</label>
              <input 
                type="tel" 
                placeholder="+91 98123 45678" 
                required 
                value={driverForm.phone || ''} 
                onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender *</label>
              <select
                value={driverForm.gender || 'Male'}
                onChange={e => setDriverForm({ ...driverForm, gender: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Aadhaar Number *</label>
              <input 
                type="text" 
                placeholder="12-digit UIDAI number" 
                required 
                value={driverForm.aadharNumber || ''} 
                onChange={e => setDriverForm({ ...driverForm, aadharNumber: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono focus:outline-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Driving Licence Number *</label>
              <input 
                type="text" 
                placeholder="e.g. DL-1420110012345" 
                required 
                value={driverForm.drivingLicence || ''} 
                onChange={e => setDriverForm({ ...driverForm, drivingLicence: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono focus:outline-blue-500 uppercase" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth (DOB) *</label>
              <input 
                type="date" 
                required 
                value={driverForm.dob || ''} 
                onChange={e => setDriverForm({ ...driverForm, dob: e.target.value })} 
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Group</label>
              <select
                value={driverForm.bloodGroup || 'O+'}
                onChange={e => setDriverForm({ ...driverForm, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-blue-500"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          {/* Toggle for Vehicle Assignment */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700">Assign Vehicle at Registration:</span>
              <button
                type="button"
                onClick={() => setAssignNow(!assignNow)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  assignNow ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    assignNow ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {assignNow ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Assigned Vehicle</label>
                {loading ? (
                  <div className="text-slate-400 py-1.5">Loading unassigned vehicles...</div>
                ) : unassignedVehicles.length > 0 ? (
                  <select
                    value={driverForm.vehicle || ''}
                    onChange={e => setDriverForm({ ...driverForm, vehicle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800 focus:outline-blue-500"
                  >
                    <option value="">-- Select an Unassigned Vehicle --</option>
                    {unassignedVehicles.map(v => (
                      <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                        {v.vehicleNumber} ({v.vehicleType || 'Compactor'} - {v.model})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled
                    value=""
                    className="w-full px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/50 text-red-600 font-bold cursor-not-allowed"
                  >
                    <option value="">No vehicle available</option>
                  </select>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Vehicle assignment skipped. Can be assigned later.</p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-all text-white font-bold rounded-xl shadow-sm mt-3"
          >
            Register Driver
          </button>
        </form>
      </div>
    </div>
  );
}
