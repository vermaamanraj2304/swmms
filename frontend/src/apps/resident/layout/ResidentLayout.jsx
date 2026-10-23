import React, { useState } from 'react';
import { Sparkles, Volume2, VolumeX, Bell, AlertTriangle, Menu, X, ChevronRight, LogOut, Gift, Sun, Moon } from 'lucide-react';
import ResidentSidebar from './ResidentSidebar';
import ResidentNotificationBell from '../components/ResidentNotificationBell';

function getActiveTabLabel(tab) {
  switch (tab) {
    case 'dashboard': return 'Dashboard Overview';
    case 'tracking': return 'Live Fleet Radar';
    case 'emergency': return 'Emergency Pickup (SOS)';
    case 'complaints': return 'Complaint Center';
    case 'ai-vision': return 'AI Waste Vision';
    case 'ai-spot': return 'AI Spot Dump Report';
    case 'ai-chat': return 'AI Assistant';
    case 'profile': return 'My Profile';
    case 'billing':
    case 'subscription_details': return 'Subscription Details';
    case 'billing_invoices': return 'Municipal Waste Billing';
    case 'billing_history': return 'Billing History & Receipts';
    case 'points-rewards':
    case 'rewards':
    case 'points-history':
    case 'points_ledger': return 'Points Ledger & History';
    case 'rewards_store': return 'Eco-Rewards Store';
    case 'claimed_rewards': return 'Claimed Rewards & Deliveries';
    case 'orders':
    case 'orders_all': return 'My Orders';
    case 'orders_status': return 'Order Delivery Status';
    case 'orders_history': return 'Order History';
    case 'orders_refund': return 'Order Refunds & Refund History';
    default: return 'Resident Portal';
  }
}

export default function ResidentLayout({ 
  activeTab, 
  setActiveTab, 
  data, 
  toast, 
  proximityAlert,
  onSilenceSiren,
  notifications = [],
  unreadCount = 0,
  onMarkAllNotificationsRead,
  onClearNotifications,
  onNotificationClick,
  theme = 'light',
  setTheme,
  children 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('tmt_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const residentName = data?.resident?.name || storedUser?.name || 'Resident';
  const residentAddress = data?.resident?.address || storedUser?.address || 'Greenfield District';
  const residentAvatar = data?.resident?.avatar || storedUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";

  const handleLogout = () => {
    localStorage.removeItem('tmt_resident_user');
    localStorage.removeItem('tmt_resident_token');
    try {
      const u = JSON.parse(localStorage.getItem('tmt_user') || '{}');
      if (u.role === 'resident') {
        localStorage.removeItem('tmt_user');
        localStorage.removeItem('tmt_token');
      }
    } catch {}
    window.location.href = '/login?portal=resident';
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-[#0F172A]'} font-sans antialiased flex flex-col transition-colors duration-200`}>
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#00B074] text-white'
        }`}>
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Portal Header */}
      <header className={`${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b sticky top-0 z-30 h-16 shadow-xs transition-colors duration-200`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          {/* Left: Hamburger trigger + Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition mr-0.5 -ml-1 cursor-pointer focus:outline-none shrink-0 ${
                theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#00B074] rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className={`font-bold text-sm leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>SWM&MS</h1>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block truncate">RESIDENT PORTAL</span>
              </div>
            </div>
          </div>

          {/* Center: Active Tab Breadcrumb (Tablet & Desktop) */}
          <div className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
            theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100/80 border-slate-200/80 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#00B074] animate-pulse"></span>
            <span className="truncate max-w-[220px]">{getActiveTabLabel(activeTab)}</span>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Quick Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={() => {
                if (setTheme) {
                  setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                }
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Switch to Day Shift (Light Mode)' : 'Switch to Night Vision (Dark Mode)'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Real-time Notification Bell */}
            <ResidentNotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={onMarkAllNotificationsRead}
              onClearAll={onClearNotifications}
              onNotificationClick={onNotificationClick}
            />

            <div className="text-right hidden sm:block">
              <span className={`font-bold text-xs block leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{residentName}</span>
              <span className="text-[10px] text-slate-400">{residentAddress}</span>
            </div>
            
            <img 
              src={residentAvatar} 
              alt={residentName} 
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />

            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl border border-slate-200 hover:bg-rose-50 transition cursor-pointer shrink-0"
              title="Logout from Resident Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
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
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#0F172A]">Resident Menu</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">SWM&MS</span>
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

            {/* Drawer Body - Scrollable Navigation */}
            <div className="overflow-y-auto flex-1 p-3">
              <ResidentSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                data={data}
                onCloseMobile={() => setMobileMenuOpen(false)}
                isMobileDrawer
              />
            </div>

            {/* Drawer Footer with Points & Logout */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={residentAvatar} 
                  alt={residentName} 
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="text-left min-w-0">
                  <span className="font-bold text-xs text-slate-800 block truncate">{residentName}</span>
                  <span className="text-[10px] font-bold text-[#00B074]">
                    {data?.garbagePoints !== undefined ? data.garbagePoints : 0} PTS Balance
                  </span>
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

      {/* Main Grid Layout */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex-1">
        <div className="grid grid-cols-12 gap-6">
          {/* Desktop Persistent Sidebar (Only visible on lg: and up) */}
          <aside className="hidden lg:block lg:col-span-2 space-y-6">
            <ResidentSidebar activeTab={activeTab} setActiveTab={setActiveTab} data={data} />
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
                <Menu className="w-3.5 h-3.5 text-[#00B074] shrink-0" />
                <span className="truncate max-w-[200px]">Section: {getActiveTabLabel(activeTab)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0" />
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('points-rewards')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200 cursor-pointer"
                >
                  <Gift className="w-3 h-3 text-[#00B074]" />
                  <span>{data?.garbagePoints !== undefined ? data.garbagePoints : 0} PTS</span>
                </button>

                {activeTab !== 'emergency' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('emergency')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold border border-rose-300 animate-pulse cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>SOS</span>
                  </button>
                )}
              </div>
            </div>

            {/* Proximity & Doorstep Siren Alert Banners */}
            {proximityAlert?.type === 'doorstep' && (
              <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center font-black shadow-md shrink-0">
                    <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-950/70 text-white px-2.5 py-0.5 rounded-full border border-rose-400">
                        🚨 SIREN ACTIVE • AT YOUR DOORSTEP
                      </span>
                      <span className="text-xs font-bold text-amber-200">
                        ~{proximityAlert.distanceMeters}m away
                      </span>
                    </div>
                    <h3 className="font-black text-sm sm:text-base text-white mt-1">
                      Waste Collection Truck is at your Doorstep!
                    </h3>
                    <p className="text-xs text-rose-100 mt-0.5">
                      Driver {proximityAlert.driverName || 'Municipal Driver'} ({proximityAlert.vehicle || 'Collection Truck'}) has arrived. Curbside pickup in progress.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 sm:self-center w-full sm:w-auto">
                  <button
                    onClick={onSilenceSiren}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>Silence Siren</span>
                  </button>
                </div>
              </div>
            )}

            {proximityAlert?.type === 'nearby' && (
              <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-4 sm:p-4.5 rounded-3xl shadow-md border border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400 text-emerald-200">
                        🔔 NEARBY APPROACH (~{proximityAlert.distanceMeters}m)
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">
                      Collection Truck is Approaching Your Household
                    </h4>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      Driver {proximityAlert.driverName || 'Municipal Driver'} is in your street. Please keep your waste bins ready curbside.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
