import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import ResidentsTable from '../components/ResidentsTable';
import ResidentRegistrationPage from './ResidentRegistrationPage';

export default function ResidentManagementPage({
  initialSubTab = 'directory',
  residents = [],
  serviceAreas = [],
  onRefresh,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const activeAccounts = residents.filter(r => r.billing?.status === 'Active' || !r.billing?.status || r.billing?.status !== 'Cancelled').length;
  const totalPoints = residents.reduce((sum, r) => sum + (r.garbagePoints || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Hub Banner & Quick Switcher */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  CITIZEN SERVICE MANAGEMENT
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {residents.length} Citizens Enrolled
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mt-0.5">Municipal Resident Management</h2>
              <p className="text-xs text-slate-500">
                Manage citizen profiles, household property GPS locations, and waste collection subscriptions.
              </p>
            </div>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'directory'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Residents Directory</span>
            </button>

            <button
              onClick={() => setActiveSubTab('register')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeSubTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Register Resident</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TOTAL RESIDENTS</span>
            <span className="text-xl font-bold text-slate-800">{residents.length}</span>
          </div>
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">ACTIVE SUBSCRIPTIONS</span>
            <span className="text-xl font-bold text-emerald-700">{activeAccounts}</span>
          </div>
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">ACCUMULATED ECO POINTS</span>
            <span className="text-xl font-bold text-amber-700">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'directory' && (
          <ResidentsTable 
            residents={residents} 
            onAddResident={() => setActiveSubTab('register')} 
            onRefresh={onRefresh}
            showToast={showToast}
          />
        )}

        {activeSubTab === 'register' && (
          <ResidentRegistrationPage 
            serviceAreas={serviceAreas}
            onRegistrationSuccess={onRefresh}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
