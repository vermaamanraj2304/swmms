import React, { useState } from 'react';
import { Sparkles, Menu, X, ChevronRight, LogOut, Truck } from 'lucide-react';
import DriverSidebar from './DriverSidebar';
import DriverNotificationBell from '../components/DriverNotificationBell';

function getActiveDriverTabLabel(tab) {
  switch (tab) {
    case 'dashboard': return 'Route & Live Radar';
    case 'assigned_houses': return 'Assigned Houses';
    case 'nearby_houses': return 'Nearby Houses';
    case 'orders': return 'Reward Orders';
    case 'emergency_dispatches': return 'Emergency Pickups (SOS)';
    case 'roadside_pickups': return 'Roadside Pickups';
    case 'history': return 'Trip Logs';
    case 'profile': return 'Operator Profile';
    case 'settings': return 'System Settings';
    default: return 'Driver Terminal';
  }
}

export default function DriverLayout({
  activeTab,
  setActiveTab,
  data,
  isOnDuty,
  handleToggleDuty,
  toast,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('tmt_driver_user')) || 
             JSON.parse(localStorage.getItem('tmt_user')) || null;
    } catch {
      return null;
    }
  })();

  const currentDriver = data?.driver || data?.driverInfo || localUser;
  const driverName = currentDriver?.name || 'Driver';
  const driverVehicle = currentDriver?.assignedVehicle || 'Vehicle Pending Assignment';
  const driverAvatar = currentDriver?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250";

  const handleLogout = () => {
    localStorage.removeItem('tmt_driver_user');
    localStorage.removeItem('tmt_driver_token');
    try {
      const u = JSON.parse(localStorage.getItem('tmt_user') || '{}');
      if (u.role === 'driver') {
        localStorage.removeItem('tmt_user');
        localStorage.removeItem('tmt_token');
      }
    } catch {}
    window.location.href = '/login?portal=driver';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 bg-[#00B074] text-white px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Driver Terminal Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          {/* Left: Hamburger trigger + Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-0.5 -ml-1 cursor-pointer focus:outline-none shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#00B074] rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-[#0F172A] leading-tight truncate">SWM&MS</h1>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block truncate">DRIVER TERMINAL</span>
              </div>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* GPS Telemetry Pill */}
            <div className="hidden md:flex bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full items-center gap-2 text-xs font-semibold text-slate-600">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
              <span>GPS: {data?.liveLocation?.lat ? `${Number(data.liveLocation.lat).toFixed(4)}, ${Number(data.liveLocation.lng).toFixed(4)}` : 'Standby'}</span>
            </div>

            {/* Duty Shift Toggle Button */}
            {/* <button 
              type="button"
              onClick={handleToggleDuty}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 shadow-2xs ${
                isOnDuty ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-white animate-pulse' : 'bg-slate-500'}`}></span>
              <span className="sm:hidden">{isOnDuty ? 'On Duty' : 'Off Duty'}</span>
              <span className="hidden sm:inline">{isOnDuty ? 'Broadcasting Shift GPS' : 'Shift Inactive (Off Duty)'}</span>
            </button> */}

            {/* Notification Bell */}
            <DriverNotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={onMarkAllRead}
              onClearAll={onClearAll}
              onNotificationClick={onNotificationClick}
            />

            {/* Driver Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">
              <div 
                onClick={() => setActiveTab('profile')}
                className="text-right hidden sm:block cursor-pointer group"
                title="View Operator Profile"
              >
                <span className="font-bold text-xs text-[#0F172A] block leading-tight group-hover:text-[#00B074] transition">{driverName}</span>
                <span className="text-[10px] text-slate-400">{driverVehicle}</span>
              </div>
              <img 
                src={driverAvatar} 
                alt={driverName} 
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#00B074] transition"
                title="View Operator Profile"
              />
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl border border-slate-200 hover:bg-rose-50 transition cursor-pointer shrink-0"
                title="Logout from Driver Terminal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (Slide-Over on < lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00B074] rounded-xl flex items-center justify-center text-white shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#0F172A]">Driver Navigation</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Vehicle Operations</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Shift Status Bar inside Drawer */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span className="text-xs font-bold text-slate-700">
                  {isOnDuty ? 'Shift Active (GPS Live)' : 'Shift Inactive (Off Duty)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleDuty}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  isOnDuty ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-600 text-white shadow-2xs'
                }`}
              >
                {isOnDuty ? 'Clock Out' : 'Start Shift'}
              </button>
            </div>

            {/* Drawer Body - Scrollable Navigation */}
            <div className="overflow-y-auto flex-1 p-3">
              <DriverSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                data={data}
                onCloseMobile={() => setMobileMenuOpen(false)}
                isMobileDrawer
              />
            </div>

            {/* Drawer Footer with Driver Info & Logout */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={driverAvatar} 
                  alt={driverName} 
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="text-left min-w-0">
                  <span className="font-bold text-xs text-slate-800 block truncate">{driverName}</span>
                  <span className="text-[10px] text-slate-400 truncate block">{driverVehicle}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition cursor-pointer shrink-0"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex-1">
        <div className="grid grid-cols-12 gap-6">
          {/* Desktop Persistent Sidebar (Only visible on lg: and up) */}
          <aside className="hidden lg:block lg:col-span-2 space-y-6">
            <DriverSidebar activeTab={activeTab} setActiveTab={setActiveTab} data={data} />
          </aside>

          {/* Main Content Area */}
          <main className="col-span-12 lg:col-span-10 space-y-6 min-w-0">
            {/* Mobile Section Header Bar with quick drawer trigger */}
            <div className="flex lg:hidden items-center justify-between gap-2 pb-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50 transition cursor-pointer min-w-0"
              >
                <Menu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[180px]">Section: {getActiveDriverTabLabel(activeTab)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                isOnDuty ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                <span>{isOnDuty ? 'GPS Active' : 'Off Duty'}</span>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
