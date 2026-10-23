import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  UserCheck, 
  UserPlus,
  AlertTriangle, 
  AlertCircle,
  MessageSquare, 
  Shield, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  MapPin,
  Layers,
  CreditCard,
  Gift,
  FileText,
  Radio,
  TrendingUp,
  Wrench,
  Fuel,
  ClipboardList,
  Plus,
  Key,
  User,
  Clock,
  CheckCircle2,
  Trash2,
  Package,
  ShoppingBag,
  Coins
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  data,
  onCloseMobile,
  isMobileDrawer = false
}) {
  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const [driversExpanded, setDriversExpanded] = useState(
    ['driver_management', 'drivers', 'register_driver', 'assign_fleets', 'fleet'].includes(activeTab) || true
  );

  const [residentsExpanded, setResidentsExpanded] = useState(
    ['resident_management', 'residents', 'register_resident'].includes(activeTab) || true
  );

  const [areasExpanded, setAreasExpanded] = useState(
    ['service_areas', 'all_areas', 'register_area'].includes(activeTab) || true
  );

  const [vehiclesExpanded, setVehiclesExpanded] = useState(
    ['vehicles', 'vehicle_registration', 'vehicle_records', 'vehicle_assign_drivers', 'vehicle_fuel', 'vehicle_service', 'vehicle_issues'].includes(activeTab) || true
  );

  const [staffExpanded, setStaffExpanded] = useState(
    ['rbac', 'staff_management', 'all_staff', 'staff_registration', 'role_registration', 'staff_other'].includes(activeTab) || true
  );

  const [financeExpanded, setFinanceExpanded] = useState(
    ['payments', 'finance_dashboard', 'payment_records', 'subscription_plans'].includes(activeTab) || true
  );

  const [complaintsExpanded, setComplaintsExpanded] = useState(
    ['complaints', 'complaints_resident', 'complaints_roadside', 'complaints_orders', 'complaints_pending', 'complaints_resolved', 'complaints_history'].includes(activeTab) || true
  );

  const [rewardsExpanded, setRewardsExpanded] = useState(
    ['rewards', 'rewards_catalog', 'rewards_orders', 'rewards_history', 'rewards_points_config'].includes(activeTab) || true
  );

  const [emergenciesExpanded, setEmergenciesExpanded] = useState(
    ['emergencies', 'emergencies_active', 'emergencies_status', 'emergencies_history', 'emergency_pickups'].includes(activeTab) || true
  );

  const activeEmergenciesCount = (data?.emergencies || []).filter(
    e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP'
  ).length || (data?.stats?.openEmergencies !== undefined ? data.stats.openEmergencies : (data?.stats?.activeEmergencies || 0));

  const pendingEmergenciesCount = (data?.emergencies || []).filter(
    e => e.status === 'NEW' || e.status === 'PENDING_DISPATCH' || e.status === 'PENDING' || (!e.assignedDriverId && e.status !== 'RESOLVED' && e.status !== 'PICKED_UP')
  ).length;

  const inProgressEmergenciesCount = (data?.emergencies || []).filter(
    e => e.status === 'DISPATCHED' || e.status === 'ON THE WAY'
  ).length;

  const openComplaintsCount = (data?.complaints || []).filter(
    c => c.status !== 'Resolved'
  ).length || (data?.stats?.openComplaints || 0);

  const orderComplaintsCount = (data?.complaints || []).filter(
    c => (c.complaintType === 'Order Complain' || c.orderId) && c.status !== 'Resolved'
  ).length;

  const isDriverTab = ['driver_management', 'drivers', 'register_driver', 'assign_fleets', 'fleet'].includes(activeTab);
  const isResidentTab = ['resident_management', 'residents', 'register_resident'].includes(activeTab);

  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('tmt_admin_user')) || 
             JSON.parse(localStorage.getItem('tmt_user')) || null;
    } catch {
      return null;
    }
  })();

  const isFullAdmin = (() => {
    if (!adminUser) return true;
    const role = (adminUser.role || '').toLowerCase();
    if (['admin', 'cityadmin', 'superadmin'].includes(role)) return true;
    if (Array.isArray(adminUser.permissions) && adminUser.permissions.includes('*')) return true;
    return false;
  })();

  const hasPermission = (permissionKey) => {
    if (isFullAdmin) return true;
    if (!adminUser?.permissions || !Array.isArray(adminUser.permissions)) return false;
    return adminUser.permissions.includes(permissionKey);
  };

  return (
    <div className="space-y-6 w-full">
      <nav className={`bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1 ${isMobileDrawer ? 'border-none shadow-none p-0 bg-transparent' : ''}`}>
        {/* Staff Role Clearance Badge (if staff) */}
        {adminUser?.role === 'staff' && (
          <div className="mb-2 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Assigned Staff Role</p>
                <p className="text-xs font-bold text-slate-800 truncate">{adminUser?.roleName || adminUser?.title || 'Staff Operator'}</p>
              </div>
            </div>
            {adminUser?.department && (
              <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">Dept: {adminUser.department}</p>
            )}
          </div>
        )}

        {/* Section: Overview */}
        <button
          onClick={() => handleNavClick('overview')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'overview' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>City Operations</span>
        </button>

        {/* ==================================================== */}
        {/* DRIVER MANAGEMENT (Group with all driver-related) */}
        {/* ==================================================== */}
        {(hasPermission('manage_drivers') || hasPermission('assign_driver_areas') || hasPermission('fleet_live_telemetry')) && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick(hasPermission('manage_drivers') ? 'driver_management' : (hasPermission('assign_driver_areas') ? 'assign_fleets' : 'fleet'))}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 transition text-left"
              >
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Driver Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {data?.driversList?.length || data?.stats?.totalDrivers || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setDriversExpanded(!driversExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {driversExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {driversExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-blue-100 ml-3">
                {hasPermission('manage_drivers') && (
                  <>
                    <button
                      onClick={() => handleNavClick('drivers')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        activeTab === 'drivers' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Drivers Directory</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavClick('register_driver')}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        activeTab === 'register_driver' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register Driver</span>
                    </button>
                  </>
                )}

                {hasPermission('assign_driver_areas') && (
                  <button
                    onClick={() => handleNavClick('assign_fleets')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'assign_fleets' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Area Assignment</span>
                  </button>
                )}

                {hasPermission('fleet_live_telemetry') && (
                  <button
                    onClick={() => handleNavClick('fleet')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      activeTab === 'fleet' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span>Live Fleet GPS</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* RESIDENT MANAGEMENT (Group with all resident-related) */}
        {/* ==================================================== */}
        {hasPermission('manage_residents') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('resident_management')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-600 transition text-left"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resident Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {data?.residentsList?.length || data?.stats?.totalResidents || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setResidentsExpanded(!residentsExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {residentsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {residentsExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-emerald-100 ml-3">
                <button
                  onClick={() => handleNavClick('residents')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'residents' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Residents Directory</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('register_resident')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'register_resident' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Resident</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* SERVICE AREAS & SECTORS (Collapsible Group) */}
        {/* ==================================================== */}
        {hasPermission('manage_service_areas') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('all_areas')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-indigo-600 transition text-left cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Service Areas & Sectors</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {data?.serviceAreas?.length || data?.stats?.totalServiceAreas || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setAreasExpanded(!areasExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  {areasExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {areasExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-indigo-100 ml-3">
                <button
                  onClick={() => handleNavClick('all_areas')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'all_areas' || activeTab === 'service_areas' 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>All Area</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeTab === 'all_areas' || activeTab === 'service_areas' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {data?.serviceAreas?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('register_area')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'register_area' 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Area</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* VEHICLE MANAGEMENT (Collapsible Group) */}
        {/* ==================================================== */}
        {hasPermission('manage_vehicles') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('vehicle_records')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-amber-600 transition text-left"
              >
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Vehicle Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {data?.vehiclesList?.length || data?.stats?.totalVehicles || 0}
                </span>
                <button
                  type="button"
                  onClick={() => setVehiclesExpanded(!vehiclesExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {vehiclesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {vehiclesExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-amber-100 ml-3">
                <button
                  onClick={() => handleNavClick('vehicle_records')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_records' || activeTab === 'vehicles' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Vehicle Records</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('vehicle_registration')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_registration' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vehicle Registration</span>
                </button>

                <button
                  onClick={() => handleNavClick('vehicle_assign_drivers')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_assign_drivers' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Drivers</span>
                </button>

                <button
                  onClick={() => handleNavClick('vehicle_fuel')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_fuel' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Fuel Management</span>
                </button>

                <button
                  onClick={() => handleNavClick('vehicle_service')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_service' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Service Management</span>
                </button>

                <button
                  onClick={() => handleNavClick('vehicle_issues')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'vehicle_issues' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Driver Complaints & Faults</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STAFF MANAGEMENT (Collapsible Group) */}
        {/* ==================================================== */}
        {hasPermission('rbac_management') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('all_staff')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 transition text-left"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Staff Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  {data?.staff?.length || 'RBAC'}
                </span>
                <button
                  type="button"
                  onClick={() => setStaffExpanded(!staffExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {staffExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {staffExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-blue-100 ml-3">
                <button
                  onClick={() => handleNavClick('all_staff')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'all_staff' || activeTab === 'rbac' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>All Staff</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('staff_registration')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'staff_registration' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Staff Registration</span>
                </button>

                <button
                  onClick={() => handleNavClick('role_registration')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'role_registration' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Role Registration</span>
                </button>

                <button
                  onClick={() => handleNavClick('staff_other')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'staff_other' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Other (Roles & Policies)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* FINANCE MANAGEMENT (Collapsible Group) */}
        {/* ==================================================== */}
        {hasPermission('manage_payments') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('finance_dashboard')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-600 transition text-left"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finance Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-emerald-700 font-bold border border-emerald-200">
                  ₹
                </span>
                <button
                  type="button"
                  onClick={() => setFinanceExpanded(!financeExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {financeExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {financeExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-emerald-100 ml-3">
                <button
                  onClick={() => handleNavClick('finance_dashboard')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'finance_dashboard' || activeTab === 'payments' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Payment Dashboard</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('payment_records')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'payment_records' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Payment Record</span>
                </button>

                <button
                  onClick={() => handleNavClick('subscription_plans')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'subscription_plans' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Subscription Plan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* COMPLAINT MANAGEMENT (Collapsible Group) */}
        {/* ==================================================== */}
        {hasPermission('resolve_complaints') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('complaints_resident')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-amber-600 transition text-left"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>Complaint Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                {openComplaintsCount > 0 ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">
                    {openComplaintsCount}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                    0
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setComplaintsExpanded(!complaintsExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                >
                  {complaintsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {complaintsExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-amber-100 ml-3">
                <button
                  onClick={() => handleNavClick('complaints_resident')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_resident' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Resident Complaints</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('complaints_roadside')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_roadside' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Roadside Garbage</span>
                </button>

                <button
                  onClick={() => handleNavClick('complaints_orders')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_orders' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Order Complaints</span>
                  </div>
                  {orderComplaintsCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-bold">
                      {orderComplaintsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('complaints_pending')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_pending' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Complaints</span>
                  </div>
                  {openComplaintsCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-500 text-white rounded-full font-bold">
                      {openComplaintsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('complaints_resolved')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_resolved' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolved Complaints</span>
                </button>

                <button
                  onClick={() => handleNavClick('complaints_history')}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'complaints_history' || activeTab === 'complaints' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>All Complain History</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* EMERGENCY MANAGEMENT (Collapsible Group)             */}
        {/* ==================================================== */}
        {hasPermission('dispatch_emergencies') && (
          <div className="pt-1.5">
            <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl transition ${
              activeEmergenciesCount > 0 ? 'bg-rose-50/90 border border-rose-200' : 'bg-slate-50/80 border border-slate-200/60'
            }`}>
              <button
                onClick={() => handleNavClick('emergencies_active')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-rose-600 transition text-left cursor-pointer"
              >
                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${activeEmergenciesCount > 0 ? 'text-rose-500 animate-pulse' : 'text-rose-500'}`} />
                <span>Emergency Management</span>
              </button>
              <div className="flex items-center gap-1.5">
                {activeEmergenciesCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs animate-pulse">
                    {activeEmergenciesCount}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                    SOS
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEmergenciesExpanded(!emergenciesExpanded)}
                  className="p-1 hover:bg-slate-200/60 rounded-md transition text-slate-400 hover:text-slate-700"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${emergenciesExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {emergenciesExpanded && (
              <div className="mt-1 pl-2.5 space-y-0.5 border-l-2 border-rose-200 ml-3 py-1">
                <button
                  onClick={() => handleNavClick('emergencies_active')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'emergencies_active' || activeTab === 'emergencies' || activeTab === 'emergency_pickups'
                      ? 'bg-rose-600 text-white font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Active Emergency</span>
                  </div>
                  {pendingEmergenciesCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'emergencies_active' || activeTab === 'emergencies' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {pendingEmergenciesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('emergencies_status')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'emergencies_status' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Emergency Status</span>
                  </div>
                  {inProgressEmergenciesCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'emergencies_status' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inProgressEmergenciesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavClick('emergencies_history')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === 'emergencies_history' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Emergency History</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* REWARD AND POINTS MANAGEMENT (Collapsible Group)     */}
        {/* ==================================================== */}
        {hasPermission('rewards_management') && (
          <div className="pt-1.5">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <button
                onClick={() => handleNavClick('rewards_catalog')}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-amber-600 transition text-left cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                <span>Reward & Points</span>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-slate-500 font-bold border border-slate-200">
                  Store
                </span>
                <button
                  type="button"
                  onClick={() => setRewardsExpanded(!rewardsExpanded)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  aria-label="Toggle Reward and Points menu"
                >
                  {rewardsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {rewardsExpanded && (
              <div className="space-y-1 mt-1 pl-2.5 border-l-2 border-amber-100 ml-3">
                <button
                  onClick={() => handleNavClick('rewards_catalog')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'rewards_catalog' || activeTab === 'rewards'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    <span>Reward Gift Catalog & Stock</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('rewards_orders')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'rewards_orders'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Resident Orders</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('rewards_history')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'rewards_history'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Order History</span>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('rewards_points_config')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === 'rewards_points_config'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Point Value Change</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* LOGS & AUDIT TRAIL */}
        {/* ==================================================== */}
        {hasPermission('system_audit_logs') && (
          <button
            onClick={() => handleNavClick('logs')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'logs' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
              <span>Logs & Audit Trail</span>
            </div>
            <span className="text-[10px] font-mono opacity-60">
              {data?.auditLogs?.length || data?.stats?.totalAuditLogs || 'Audit'}
            </span>
          </button>
        )}

        {/* ==================================================== */}
        {/* ADMINISTRATOR PROFILE */}
        {/* ==================================================== */}
        <button
          onClick={() => handleNavClick('profile')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'profile' ? 'bg-[#00B074] text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <User className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-white' : 'text-emerald-500'}`} />
            <span>{adminUser?.role === 'staff' ? 'Staff Profile' : 'Administrator Profile'}</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
            activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {adminUser?.role === 'staff' ? 'Operator' : 'HQ Pass'}
          </span>
        </button>

        {/* ==================================================== */}
        {/* SYSTEM CONFIG */}
        {/* ==================================================== */}
        {(isFullAdmin || hasPermission('rbac_management')) && (
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'settings' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>System Config</span>
          </button>
        )}
      </nav>
    </div>
  );
}
