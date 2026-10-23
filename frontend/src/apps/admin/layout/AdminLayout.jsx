import React, { useState } from 'react';
import { 
  Sparkles, 
  Building2, 
  Menu, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  LogOut 
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminNotificationBell from '../components/AdminNotificationBell';

function getActiveTabLabel(tab) {
  switch (tab) {
    case 'overview': return 'City Operations';
    case 'driver_management':
    case 'drivers': return 'Drivers Directory';
    case 'register_driver': return 'Register Driver';
    case 'assign_fleets': return 'Area Assignment';
    case 'fleet': return 'Live Fleet GPS';
    case 'resident_management':
    case 'residents': return 'Resident Directory';
    case 'register_resident': return 'Register Resident';
    case 'service_areas':
    case 'all_areas': return 'Service Areas';
    case 'register_area': return 'Register Service Area';
    case 'vehicles':
    case 'vehicle_records': return 'Vehicle Records';
    case 'vehicle_registration': return 'Vehicle Enrollment';
    case 'vehicle_assign_drivers': return 'Assign Vehicle Operators';
    case 'vehicle_fuel': return 'Vehicle Fuel Logs';
    case 'vehicle_service': return 'Vehicle Maintenance';
    case 'vehicle_issues': return 'Vehicle Defect Reports';
    case 'rbac':
    case 'staff_management':
    case 'all_staff': return 'Municipal Staff';
    case 'staff_registration': return 'Staff Enrollment';
    case 'role_registration': return 'Custom RBAC Roles';
    case 'payments':
    case 'finance_dashboard': return 'Treasury & Finance';
    case 'payment_records': return 'Payment Records';
    case 'subscription_plans': return 'Subscription Plans';
    case 'complaints':
    case 'complaints_resident': return 'Complaints Center';
    case 'complaints_roadside': return 'Roadside Incidents';
    case 'complaints_orders': return 'Order Complaints';
    case 'complaints_pending': return 'Pending Grievances';
    case 'complaints_resolved': return 'Resolved Grievances';
    case 'complaints_history': return 'Complaints History';
    case 'rewards':
    case 'rewards_catalog': return 'Reward Gift Catalog & Stock';
    case 'rewards_orders': return 'Resident Orders';
    case 'rewards_history': return 'Order History';
    case 'rewards_points_config': return 'Point Value & Rates Configuration';
    case 'emergencies':
    case 'emergency_pickups':
    case 'emergencies_active': return 'Active Emergency';
    case 'emergencies_status': return 'Emergency Status';
    case 'emergencies_history': return 'Emergency History';
    case 'logs':
    case 'audit_logs': return 'System Audit Logs';
    case 'profile': return 'Administrator Profile';
    case 'settings': return 'System Settings';
    default: return 'City Command';
  }
}

export default function AdminLayout({
  activeTab,
  setActiveTab,
  usersExpanded,
  setUsersExpanded,
  data,
  toast,
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('tmt_admin_user')) || 
             JSON.parse(localStorage.getItem('tmt_user')) || null;
    } catch {
      return null;
    }
  })();

  const adminRole = (() => {
    if (!adminUser) return 'Metro Sanitation HQ';
    if (adminUser.roleName) return adminUser.roleName;
    if (adminUser.title) return adminUser.title;
    
    const role = (adminUser.role || '').toLowerCase();
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'cityadmin':
        return 'City Admin';
      case 'admin':
        return 'Municipal Admin';
      case 'staff':
        return 'Municipal Staff';
      default:
        return adminUser.role 
          ? adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1) 
          : 'Metro Sanitation HQ';
    }
  })();

  const userInitials = (() => {
    if (!adminUser?.name) return 'GNA';
    const parts = adminUser.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  })();

  const activeEmergenciesCount = (data?.emergencies || []).filter(
    e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP'
  ).length || (data?.stats?.openEmergencies !== undefined ? data.stats.openEmergencies : (data?.stats?.activeEmergencies || 0));

  const handleLogout = () => {
    localStorage.removeItem('tmt_admin_user');
    localStorage.removeItem('tmt_admin_token');
    try {
      const u = JSON.parse(localStorage.getItem('tmt_user') || '{}');
      if (['admin', 'cityadmin', 'superadmin', 'staff'].includes(u.role)) {
        localStorage.removeItem('tmt_user');
        localStorage.removeItem('tmt_token');
      }
    } catch {}
    window.location.href = '/login?portal=admin';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl font-medium text-sm flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-[#00B074] text-white'
        }`}>
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
          {/* Left: Mobile Menu Trigger + Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-0.5 -ml-1 cursor-pointer focus:outline-none"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div 
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#0F172A] rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-[#0F172A] leading-tight truncate">SWM&MS</h1>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase block truncate">Greater Noida</span>
              </div>
            </div>
          </div>

          {/* Center: Active View Breadcrumb Indicator (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-100/80 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[220px]">{getActiveTabLabel(activeTab)}</span>
          </div>

          {/* Right Header: SOS Alert, Notification Bell, Division Tag, HQ Avatar & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {activeEmergenciesCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('emergencies');
                  setMobileMenuOpen(false);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition shadow-2xs cursor-pointer animate-pulse"
                title="View Active Emergency SOS Requests"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{activeEmergenciesCount} SOS</span>
              </button>
            )}

            {/* Municipal Command Notification Bell */}
            <AdminNotificationBell 
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={onMarkAllRead}
              onClearAll={onClearAll}
              onNotificationClick={onNotificationClick}
            />

            <div 
              onClick={() => setActiveTab('profile')}
              className="text-right hidden sm:block cursor-pointer group"
              title="View Administrator Profile"
            >
              <span className="font-bold text-xs text-[#0F172A] block leading-tight truncate max-w-[220px] group-hover:text-[#00B074] transition">
                {adminUser?.name || 'Greater Noida Municipal Authority'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[220px]">
                {adminRole}
              </span>
            </div>

            {adminUser?.avatar ? (
              <img
                src={adminUser.avatar}
                alt={adminUser.name || 'Staff Avatar'}
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#00B074] transition"
                title="View Administrator Profile"
              />
            ) : (
              <div 
                onClick={() => setActiveTab('profile')}
                className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#00B074] transition"
                title="View Administrator Profile"
              >
                {userInitials}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-xl border border-slate-200 hover:bg-rose-50 transition cursor-pointer shrink-0"
              title="Logout from Municipal Admin Command"
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
                <div className="w-8 h-8 bg-[#0F172A] rounded-xl flex items-center justify-center text-white shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[#0F172A]">Command Navigation</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">City Operations Hub</span>
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
              <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                usersExpanded={usersExpanded}
                setUsersExpanded={setUsersExpanded}
                data={data}
                onCloseMobile={() => setMobileMenuOpen(false)}
                isMobileDrawer
              />
            </div>

            {/* Drawer Footer with Logout & Authority info */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {adminUser?.avatar ? (
                  <img
                    // src={adminUser.avatar}
                    alt={adminUser.name || 'Staff Avatar'}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="text-left">
                  <span className="font-bold text-xs text-slate-800 block truncate max-w-[160px]">
                    {adminUser?.name || 'Municipal Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                    {adminRole}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex-1">
        <div className="grid grid-cols-12 gap-6">
          {/* Desktop Persistent Sidebar (Only visible on lg: and up) */}
          <aside className="hidden lg:block lg:col-span-2 space-y-6">
            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              usersExpanded={usersExpanded}
              setUsersExpanded={setUsersExpanded}
              data={data}
            />
          </aside>

          {/* Main Content Area (Spans full 12 cols on mobile/tablet, 10 cols on desktop) */}
          <main className="col-span-12 lg:col-span-10 space-y-6 min-w-0">
            {/* Mobile Section Header Bar with quick drawer trigger */}
            <div className="flex lg:hidden items-center justify-between gap-2 pb-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[200px]">Section: {getActiveTabLabel(activeTab)}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {activeEmergenciesCount > 0 && activeTab !== 'emergencies' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('emergencies')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold border border-rose-300 animate-pulse cursor-pointer shrink-0"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>{activeEmergenciesCount} SOS</span>
                </button>
              )}
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
