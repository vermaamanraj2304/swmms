import React, { useState } from 'react';
import { 
  Truck, 
  Users, 
  UserPlus, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  ShieldCheck, 
  Navigation,
  Clock
} from 'lucide-react';
import DriversTable from '../components/DriversTable';
import DriverRegistrationPage from './DriverRegistrationPage';
import DriverAreaAssignmentPage from './DriverAreaAssignmentPage';
import AdminFleetMapPage from './AdminFleetMapPage';

export default function DriverManagementPage({
  initialSubTab = 'roster',
  drivers = [],
  vehicles = [],
  serviceAreas = [],
  data,
  driverLocations = {},
  onRefresh,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const activeOnDuty = drivers.filter(d => d.isOnDuty).length;
  const assignedWithVehicles = drivers.filter(d => d.assignedVehicle && d.assignedVehicle !== 'Unassigned').length;
  const standbyCount = drivers.length - activeOnDuty;

  return (
    <div className="space-y-6">
      {/* Top Hub Banner & Quick Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  CENTRAL LOGISTICS COMMAND
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {drivers.length} Drivers Roster
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mt-0.5">Municipal Driver Management</h2>
              <p className="text-xs text-slate-500">
                Complete operational suite for fleet drivers: roster directory, verification enrollment, area dispatch, and live GPS tracking.
              </p>
            </div>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('roster')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'roster'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Drivers Directory</span>
            </button>

            <button
              onClick={() => setActiveSubTab('register')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register Driver</span>
            </button>

            <button
              onClick={() => setActiveSubTab('assignment')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'assignment'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Area Assignment</span>
            </button>

            <button
              onClick={() => setActiveSubTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'telemetry'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Live Fleet GPS</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TOTAL DRIVERS</span>
            <span className="text-xl font-bold text-slate-800">{drivers.length}</span>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">ACTIVE ON DUTY</span>
            <span className="text-xl font-bold text-emerald-700">{activeOnDuty}</span>
          </div>
          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">VEHICLES ASSIGNED</span>
            <span className="text-xl font-bold text-blue-700">{assignedWithVehicles}</span>
          </div>
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">STANDBY DRIVERS</span>
            <span className="text-xl font-bold text-amber-700">{standbyCount}</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'roster' && (
          <DriversTable 
            drivers={drivers}
            vehicles={vehicles}
            serviceAreas={serviceAreas}
            onAddDriver={() => setActiveSubTab('register')}
            onRefresh={onRefresh}
            showToast={showToast}
            onNavigateTab={setActiveSubTab}
          />
        )}

        {activeSubTab === 'register' && (
          <DriverRegistrationPage 
            vehicles={vehicles}
            serviceAreas={serviceAreas}
            onRegistrationSuccess={onRefresh}
            showToast={showToast}
          />
        )}

        {activeSubTab === 'assignment' && (
          <DriverAreaAssignmentPage 
            drivers={drivers}
            vehicles={vehicles}
            serviceAreas={serviceAreas}
            onAssignmentComplete={onRefresh}
            showToast={showToast}
          />
        )}

        {activeSubTab === 'telemetry' && (
          <AdminFleetMapPage 
            data={data} 
            driverLocations={driverLocations} 
          />
        )}
      </div>
    </div>
  );
}
