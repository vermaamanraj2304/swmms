import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../../services/socket';
import AdminLayout from './layout/AdminLayout';
import AdminFleetMapPage from './pages/AdminFleetMapPage';
import AdminKpiGrid from './components/AdminKpiGrid';
import ResidentsTable from './components/ResidentsTable';
import DriversTable from './components/DriversTable';
import ComplaintsTable from './components/ComplaintsTable';
import ComplaintManagementPage from './pages/ComplaintManagementPage';
import EmergenciesTable from './components/EmergenciesTable';
import AddResidentModal from './components/AddResidentModal';
import AddDriverModal from './components/AddDriverModal';
import AssignEmergencyModal from './components/AssignEmergencyModal';
import ResidentRegistrationPage from './pages/ResidentRegistrationPage';
import DriverRegistrationPage from './pages/DriverRegistrationPage';
import DriverAreaAssignmentPage from './pages/DriverAreaAssignmentPage';
import ServiceAreasPage from './pages/ServiceAreasPage';
import VehiclesPage from './pages/VehiclesPage';
import MunicipalRBACPage from './pages/MunicipalRBACPage';
import PaymentManagementPage from './pages/PaymentManagementPage';
import AdminRewardsManagementPage from './pages/AdminRewardsManagementPage';
import EmergencyManagementPage from './pages/EmergencyManagementPage';
import DriverManagementPage from './pages/DriverManagementPage';
import ResidentManagementPage from './pages/ResidentManagementPage';
import SystemAuditLogsPage from './pages/SystemAuditLogsPage';
import AdminFleetLiveMap from './components/AdminFleetLiveMap';
import AdminProfilePage from './pages/AdminProfilePage';
import { soundManager } from '../../utils/audioAlerts';
import { ShieldX, ArrowLeft } from 'lucide-react';

const TAB_PERMISSION_MAP = {
  // Driver Management
  driver_management: 'manage_drivers',
  drivers: 'manage_drivers',
  register_driver: 'manage_drivers',
  assign_fleets: 'assign_driver_areas',
  fleet: 'fleet_live_telemetry',

  // Resident Management
  resident_management: 'manage_residents',
  residents: 'manage_residents',
  register_resident: 'manage_residents',

  // Service Areas
  service_areas: 'manage_service_areas',
  all_areas: 'manage_service_areas',
  register_area: 'manage_service_areas',

  // Vehicles
  vehicles: 'manage_vehicles',
  vehicle_registration: 'manage_vehicles',
  vehicle_records: 'manage_vehicles',
  vehicle_assign_drivers: 'manage_vehicles',
  vehicle_fuel: 'manage_vehicles',
  vehicle_service: 'manage_vehicles',
  vehicle_issues: 'manage_vehicles',

  // Staff / RBAC
  rbac: 'rbac_management',
  staff_management: 'rbac_management',
  all_staff: 'rbac_management',
  staff_registration: 'rbac_management',
  role_registration: 'rbac_management',
  staff_other: 'rbac_management',

  // Complaints
  complaints: 'resolve_complaints',
  complaints_resident: 'resolve_complaints',
  complaints_roadside: 'resolve_complaints',
  complaints_orders: 'resolve_complaints',
  complaints_pending: 'resolve_complaints',
  complaints_resolved: 'resolve_complaints',
  complaints_history: 'resolve_complaints',

  // Emergencies
  emergencies: 'dispatch_emergencies',
  emergency_pickups: 'dispatch_emergencies',
  emergencies_active: 'dispatch_emergencies',
  emergencies_status: 'dispatch_emergencies',
  emergencies_history: 'dispatch_emergencies',

  // Finance / Payments
  payments: 'manage_payments',
  finance_dashboard: 'manage_payments',
  payment_records: 'manage_payments',
  subscription_plans: 'manage_payments',

  // Rewards
  rewards: 'rewards_management',
  rewards_catalog: 'rewards_management',
  rewards_orders: 'rewards_management',
  rewards_history: 'rewards_management',
  rewards_points_config: 'rewards_management',

  // System Logs
  logs: 'system_audit_logs',

  // Settings
  settings: 'rbac_management'
};

function RestrictedModuleView({ requiredPermission, onBackToOverview, roleName }) {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center max-w-xl mx-auto my-12 space-y-5 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
        <ShieldX className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700">
          Access Restricted
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Permission Required for this Module
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Your municipal staff role <span className="font-semibold text-slate-700">{roleName ? `(${roleName})` : ''}</span> is not granted authorization to view or manage this administrative division.
        </p>
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 inline-block font-mono">
        Required Permission: <span className="font-bold text-rose-600 font-sans">{requiredPermission}</span>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to City Operations Hub</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { tab: pathTab } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab synchronized with both path parameter (/admin/:tab) and query parameter (?tab=...)
  const activeTab = pathTab || searchParams.get('tab') || 'overview';

  const setActiveTab = useCallback((nextTab) => {
    if (pathTab) {
      navigate(nextTab === 'overview' ? '/admin' : `/admin/${nextTab}`);
    } else {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (nextTab === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', nextTab);
        }
        return next;
      });
    }
  }, [pathTab, navigate, setSearchParams]);

  const [usersExpanded, setUsersExpanded] = useState(true);

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

  const [data, setData] = useState(null);
  const [rbacData, setRbacData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Municipal Admin Command Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tmt_admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addNotification = (item) => {
    setNotifications(prev => {
      const newItem = {
        id: item.id || `admin_notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: item.title,
        message: item.message,
        type: item.type || 'info',
        createdAt: item.createdAt || new Date().toISOString(),
        read: false,
        actionTab: item.actionTab || null,
        metadata: item.metadata || {}
      };
      const updated = [newItem, ...(prev || [])].slice(0, 60);
      try {
        localStorage.setItem('tmt_admin_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('tmt_admin_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('tmt_admin_notifications');
    } catch {}
  };

  const handleNotificationClick = (id) => {
    const clickedItem = notifications.find(n => n.id === id);
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try {
        localStorage.setItem('tmt_admin_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (clickedItem?.actionTab) {
      setActiveTab(clickedItem.actionTab);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Selected Profile state
  const [selectedResident, setSelectedResident] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Live Driver Telemetry Feed
  const [driverLocations, setDriverLocations] = useState({});

  // Modals
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAssignEmergencyModal, setShowAssignEmergencyModal] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedDriverForDispatch, setSelectedDriverForDispatch] = useState('');

  // Form states
  const [residentForm, setResidentForm] = useState({
    name: '', email: '', phone: '', address: '', plan: 'Standard Pro (120 Gallons)'
  });
  const [driverForm, setDriverForm] = useState({
    name: '', email: '', phone: '', vehicle: '', sector: 'Unassigned',
    gender: 'Male', aadharNumber: '', drivingLicence: '', dob: '', bloodGroup: 'O+'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        localStorage.removeItem('tmt_admin_token');
        localStorage.removeItem('tmt_admin_user');
        window.location.href = '/login?portal=admin';
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch municipal command data');
      }
      setData(json);

      if (json.residentsList?.length > 0 && !selectedResident) {
        setSelectedResident(json.residentsList[0]);
      }
      if (json.driversList?.length > 0 && !selectedDriver) {
        setSelectedDriver(json.driversList[0]);
      }

      // Seed initial admin notifications if empty
      setNotifications(prev => {
        if (prev && prev.length > 0) return prev;
        const initial = [];
        if (json?.emergencies?.length > 0) {
          const firstEm = json.emergencies[0];
          initial.push({
            id: 'init_admin_sos_1',
            title: '🚨 Emergency SOS Task Active',
            message: `Emergency SOS #${firstEm.customId || 'SOS'} at ${firstEm.address || 'Resident Household'} is ${firstEm.status || 'PENDING'}.`,
            type: 'emergency',
            createdAt: firstEm.createdAt || new Date().toISOString(),
            read: true,
            actionTab: 'emergencies'
          });
        }
        if (json?.driversList?.some(d => d.isOnDuty)) {
          const onDutyDriver = json.driversList.find(d => d.isOnDuty);
          initial.push({
            id: 'init_admin_duty_1',
            title: '🚚 Fleet Operator Active On Duty',
            message: `Driver ${onDutyDriver.name} is on duty broadcasting GPS telemetry in ${onDutyDriver.activeSector || 'Sector'}.`,
            type: 'duty',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            read: true,
            actionTab: 'fleet'
          });
        }
        if (initial.length > 0) {
          try {
            localStorage.setItem('tmt_admin_notifications', JSON.stringify(initial));
          } catch {}
          return initial;
        }
        return prev;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRBAC = async () => {
    try {
      const res = await fetch('/api/admin/rbac');
      const json = await res.json();
      setRbacData(json);
      if (json.staff?.length > 0 && !selectedStaff) {
        setSelectedStaff(json.staff[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchRBAC();

    socket.on('driver-location-update', (loc) => {
      const driverKey = loc.driverId || loc.driverMongoId || loc.driverName || 'DRV';
      const lat = Number(loc.lat !== undefined ? loc.lat : loc.location?.lat);
      const lng = Number(loc.lng !== undefined ? loc.lng : loc.location?.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const normalizedLoc = {
        ...loc,
        lat,
        lng,
        location: {
          lat,
          lng,
          speedKm: loc.speedKm || loc.location?.speedKm || 20,
          heading: loc.heading || loc.location?.heading || 'In-Transit',
          lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      };

      setDriverLocations(prev => ({
        ...prev,
        [driverKey]: normalizedLoc
      }));
    });

    socket.on('driver-duty-changed', (duty) => {
      const driverKey = duty.driverMongoId || duty.driverId || duty.driverName || 'DRV';
      const driverName = duty?.driverName || 'Operator';
      const isOn = Boolean(duty?.isOnDuty);

      addNotification({
        type: 'duty',
        title: isOn ? '🚚 Driver Started Shift' : '🛑 Driver Finished Shift',
        message: `Driver ${driverName} is now ${isOn ? 'ON DUTY (Broadcasting GPS)' : 'OFF DUTY'} in ${duty?.sector || 'Assigned Sector'}.`,
        actionTab: 'fleet'
      });

      setDriverLocations(prev => {
        if (!duty.isOnDuty) {
          const copy = { ...prev };
          delete copy[driverKey];
          return copy;
        }
        return {
          ...prev,
          [driverKey]: {
            ...prev[driverKey],
            ...duty
          }
        };
      });
      fetchDashboard();
    });

    socket.on('complaint-created', (comp) => {
      soundManager.playNotificationPing();
      const ticketNo = comp?.ticketNumber || comp?.customId || 'TICKET';
      const isOrder = Boolean(comp?.orderId || comp?.orderCustomId);
      addNotification({
        type: 'complaint',
        title: isOrder ? '📦 New Order Grievance Ticket' : '📢 New Resident Grievance Filed',
        message: `Ticket #${ticketNo}: ${comp?.description || comp?.issueType || 'Resident grievance submitted.'} (${comp?.residentName || 'Resident'})`,
        actionTab: isOrder ? 'complaints_orders' : 'complaints'
      });
      fetchDashboard();
    });

    socket.on('complaint-status-updated', () => fetchDashboard());
    socket.on('complaint-updated', () => fetchDashboard());
    socket.on('complaint-deleted', () => fetchDashboard());

    socket.on('reward-redeemed', (red) => {
      soundManager.playNotificationPing();
      addNotification({
        type: 'order',
        title: '🎁 Eco-Reward Redeemed by Resident',
        message: `${red?.residentName || 'Resident'} redeemed ${red?.rewardTitle || 'Gift'} (-${red?.pointsRedeemed || 0} PTS). Pending depot packing.`,
        actionTab: 'rewards'
      });
      fetchDashboard();
    });

    socket.on('order-delivered', (ord) => {
      soundManager.playNotificationPing();
      addNotification({
        type: 'order',
        title: '✅ Reward Parcel Handover Verified',
        message: `Order #${ord?.customId || ''} successfully delivered to ${ord?.residentName || 'resident'}. Doorstep QR code verified.`,
        actionTab: 'rewards'
      });
      fetchDashboard();
    });

    socket.on('order-refunded', (refData) => {
      soundManager.playNotificationPing();
      addNotification({
        type: 'refund',
        title: '💰 Order Refund Credited to Resident',
        message: `Refund of +${refData?.pointsRefunded || 0} PTS (≈ ₹${refData?.amountInr || ((refData?.pointsRefunded || 0) * 0.5)}) processed for Order #${refData?.orderCustomId || ''}.`,
        actionTab: 'rewards'
      });
      fetchDashboard();
    });

    socket.on('garbage-picked-up', (pData) => {
      soundManager.playNotificationPing();
      addNotification({
        type: 'pickup',
        title: '♻️ Curbside Collection Verified',
        message: `Driver ${pData?.driver || 'Driver'} cleared ${pData?.weightKg || 0}kg of ${pData?.wasteType || 'household'} waste (+${pData?.pointsEarned || 0} PTS) for ${pData?.residentName || 'resident'}.`,
        actionTab: 'overview'
      });
      fetchDashboard();
    });

    socket.on('payment-updated', (pay) => {
      soundManager.playNotificationPing();
      addNotification({
        type: 'payment',
        title: '💳 Municipal Payment Processed',
        message: `Payment of ₹${pay?.amount || 0} received from ${pay?.residentName || 'Resident'}. Status: ${pay?.status || 'COMPLETED'}.`,
        actionTab: 'payments'
      });
      fetchDashboard();
    });

    // Emergency SOS Real-Time Sync
    const handleEmergencyCreated = (em) => {
      soundManager.playEmergencyAlertChime();
      showToast(`🚨 New Emergency SOS from ${em.residentName || 'Resident'} (${em.address})`, 'info');
      addNotification({
        type: 'emergency',
        title: '🚨 Emergency SOS Task Reported',
        message: `${em.residentName || 'Resident'} reported urgent collection at ${em.address || 'Household'} (${em.wasteType || 'Hazardous'}).`,
        actionTab: 'emergencies'
      });
      fetchDashboard();
    };

    const handleEmergencyEnRoute = (emData) => {
      showToast(`🚚 Driver ${emData.driver?.name || 'Driver'} is en route for SOS ${emData.emergency?.customId || ''}!`, 'info');
      fetchDashboard();
    };

    const handleEmergencyCompleted = (emData) => {
      showToast(`✅ Emergency ${emData.emergency?.customId || ''} marked as Picked Up / Resolved!`, 'success');
      addNotification({
        type: 'emergency',
        title: '✅ Emergency SOS Task Resolved',
        message: `Emergency SOS #${emData.emergency?.customId || ''} successfully resolved by driver ${emData.driver?.name || 'Driver'}.`,
        actionTab: 'emergencies'
      });
      fetchDashboard();
    };

    socket.on('emergency-created', handleEmergencyCreated);
    socket.on('emergency-assigned', fetchDashboard);
    socket.on('emergency-en-route', handleEmergencyEnRoute);
    socket.on('emergency-completed', handleEmergencyCompleted);
    socket.on('emergency-updated', fetchDashboard);
    socket.on('emergency-deleted', fetchDashboard);

    return () => {
      socket.off('driver-location-update');
      socket.off('driver-duty-changed');
      socket.off('complaint-created');
      socket.off('complaint-status-updated');
      socket.off('complaint-updated');
      socket.off('complaint-deleted');
      socket.off('reward-redeemed');
      socket.off('order-delivered');
      socket.off('order-refunded');
      socket.off('garbage-picked-up');
      socket.off('payment-updated');
      socket.off('emergency-created', handleEmergencyCreated);
      socket.off('emergency-assigned');
      socket.off('emergency-en-route', handleEmergencyEnRoute);
      socket.off('emergency-completed', handleEmergencyCompleted);
      socket.off('emergency-updated');
      socket.off('emergency-deleted');
    };
  }, []);

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/update-complaint-status/${complaintId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to update status');
      showToast(resData.message || `Complaint status updated to ${newStatus}`, 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint ticket? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/delete-complaint/${complaintId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to delete complaint');
      showToast(resData.message || 'Complaint ticket deleted successfully', 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete complaint', 'error');
    }
  };

  const handleDeleteEmergency = async (emergencyId, customId) => {
    if (!window.confirm(`Are you sure you want to delete emergency request ${customId || 'record'}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/delete-emergency/${emergencyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to delete emergency request');
      showToast(resData.message || 'Emergency pickup request deleted successfully', 'success');
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete emergency request', 'error');
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentForm)
      });
      if (res.ok) {
        showToast('Resident onboarded successfully!');
        setShowAddResidentModal(false);
        setResidentForm({ name: '', email: '', phone: '', address: '', plan: 'Standard Pro (120 Gallons)' });
        fetchDashboard();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add resident', 'error');
      }
    } catch (err) {
      showToast('Server error onboarding resident', 'error');
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/add-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm)
      });
      if (res.ok) {
        showToast('Fleet Driver registered successfully!');
        setShowAddDriverModal(false);
        setDriverForm({ name: '', email: '', phone: '', vehicle: '', sector: 'Unassigned' });
        fetchDashboard();
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add driver', 'error');
      }
    } catch (err) {
      showToast('Server error adding driver', 'error');
    }
  };

  const handleDispatchEmergency = async (e) => {
    e.preventDefault();
    if (!selectedEmergency || !selectedDriverForDispatch) return;
    try {
      const res = await fetch('/api/admin/assign-emergency-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyId: selectedEmergency._id,
          driverId: selectedDriverForDispatch
        })
      });
      if (res.ok) {
        showToast('Emergency task assigned and dispatched to driver!');
        setShowAssignEmergencyModal(false);
        setSelectedEmergency(null);
        setSelectedDriverForDispatch('');
        fetchDashboard();
      }
    } catch (err) {
      showToast('Failed to assign driver', 'error');
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      usersExpanded={usersExpanded}
      setUsersExpanded={setUsersExpanded}
      data={data}
      toast={toast}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={markAllRead}
      onClearAll={clearAllNotifications}
      onNotificationClick={handleNotificationClick}
    >
      {activeTab !== 'overview' && activeTab !== 'profile' && TAB_PERMISSION_MAP[activeTab] && !hasPermission(TAB_PERMISSION_MAP[activeTab]) ? (
        <RestrictedModuleView 
          requiredPermission={TAB_PERMISSION_MAP[activeTab]} 
          onBackToOverview={() => setActiveTab('overview')} 
          roleName={adminUser?.roleName || adminUser?.title} 
        />
      ) : (
        <>
          {activeTab === 'overview' && (
        <div className="space-y-6">
          <AdminKpiGrid 
            stats={data?.stats} 
            onViewEmergencies={() => setActiveTab('emergencies')} 
          />

          {/* Live Fleet Telemetry Map */}
          <AdminFleetLiveMap data={data} driverLocations={driverLocations} height="460px" />

          {/* Recent Operations Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplaintsTable 
              complaints={
                data?.complaints && data.complaints.length > 0
                  ? [...data.complaints]
                      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                      .slice(0, 1)
                  : []
              } 
              onUpdateStatus={handleUpdateComplaintStatus} 
              onDeleteComplaint={handleDeleteComplaint}
              onViewAll={() => setActiveTab('complaints')}
            />
            <EmergenciesTable 
              emergencies={
                data?.emergencies && data.emergencies.length > 0
                  ? (() => {
                      const active = data.emergencies.filter(
                        (e) => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP' && e.status !== 'CANCELLED'
                      );
                      const target = active.length > 0 ? active : data.emergencies;
                      return [...target]
                        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                        .slice(0, 1);
                    })()
                  : []
              } 
              onDispatch={(em) => {
                setSelectedEmergency(em);
                setShowAssignEmergencyModal(true);
              }}
              onDelete={handleDeleteEmergency}
              onViewAll={() => setActiveTab('emergencies')}
            />
          </div>
        </div>
      )}

      {activeTab === 'fleet' && (
        <AdminFleetMapPage data={data} driverLocations={driverLocations} />
      )}

      {activeTab === 'assign_fleets' && (
        <DriverAreaAssignmentPage 
          drivers={data?.driversList || []}
          vehicles={data?.vehiclesList || []}
          serviceAreas={data?.serviceAreas || []}
          onAssignmentComplete={fetchDashboard}
          showToast={showToast}
        />
      )}

      {['service_areas', 'all_areas', 'register_area'].includes(activeTab) && (
        <ServiceAreasPage
          initialSection={activeTab === 'register_area' ? 'register_area' : 'all_areas'}
          serviceAreas={data?.serviceAreas || []}
          drivers={data?.driversList || []}
          vehicles={data?.vehiclesList || []}
          onRefresh={fetchDashboard}
          showToast={showToast}
          setActiveTab={setActiveTab}
        />
      )}

      {['vehicles', 'vehicle_registration', 'vehicle_records', 'vehicle_assign_drivers', 'vehicle_fuel', 'vehicle_service', 'vehicle_issues'].includes(activeTab) && (
        <VehiclesPage 
          initialSection={
            activeTab === 'vehicle_registration' ? 'registration' :
            activeTab === 'vehicle_assign_drivers' ? 'assign_drivers' :
            activeTab === 'vehicle_fuel' ? 'fuel' :
            activeTab === 'vehicle_service' ? 'service' :
            activeTab === 'vehicle_issues' ? 'issues' :
            'records'
          }
          vehicles={data?.vehiclesList || []}
          drivers={data?.driversList || []}
          serviceAreas={data?.serviceAreas || []}
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {activeTab === 'residents' && (
        <ResidentsTable 
          residents={data?.residentsList || []} 
          onAddResident={() => setActiveTab('register_resident')} 
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {activeTab === 'register_resident' && (
        <ResidentRegistrationPage 
          serviceAreas={data?.serviceAreas || []}
          onRegistrationSuccess={fetchDashboard} 
          showToast={showToast} 
        />
      )}

      {activeTab === 'drivers' && (
        <DriversTable 
          drivers={data?.driversList || []} 
          vehicles={data?.vehiclesList || []}
          serviceAreas={data?.serviceAreas || []}
          onAddDriver={() => setActiveTab('register_driver')} 
          onRefresh={fetchDashboard}
          showToast={showToast}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'register_driver' && (
        <DriverRegistrationPage 
          vehicles={data?.vehiclesList || []}
          serviceAreas={data?.serviceAreas || []}
          onRegistrationSuccess={fetchDashboard} 
          showToast={showToast} 
        />
      )}

      {['rbac', 'staff_management', 'all_staff', 'staff_registration', 'role_registration', 'staff_other'].includes(activeTab) && (
        <MunicipalRBACPage 
          initialSection={
            activeTab === 'staff_registration' ? 'staff_registration' :
            activeTab === 'role_registration' ? 'role_registration' :
            activeTab === 'staff_other' ? 'other' :
            'all_staff'
          }
          rbacData={rbacData} 
          onRefresh={fetchRBAC} 
          showToast={showToast} 
        />
      )}

      {['complaints', 'complaints_resident', 'complaints_roadside', 'complaints_orders', 'complaints_pending', 'complaints_resolved', 'complaints_history'].includes(activeTab) && (
        <ComplaintManagementPage 
          initialSection={
            activeTab === 'complaints_resident' ? 'resident' :
            activeTab === 'complaints_roadside' ? 'roadside' :
            activeTab === 'complaints_orders' ? 'orders' :
            activeTab === 'complaints_pending' ? 'pending' :
            activeTab === 'complaints_resolved' ? 'resolved' :
            'history'
          }
          complaints={data?.complaints || []} 
          drivers={data?.driversList || []}
          vehicles={data?.vehiclesList || []}
          serviceAreas={data?.serviceAreas || []}
          onUpdateStatus={handleUpdateComplaintStatus} 
          onDeleteComplaint={handleDeleteComplaint}
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {['emergencies', 'emergency_pickups', 'emergencies_active', 'emergencies_status', 'emergencies_history'].includes(activeTab) && (
        <EmergencyManagementPage 
          activeSubTab={
            activeTab === 'emergencies_status' ? 'status' :
            activeTab === 'emergencies_history' ? 'history' : 'active'
          }
          emergencies={data?.emergencies || []} 
          drivers={data?.driversList || []}
          onDispatch={(em) => {
            setSelectedEmergency(em);
            setShowAssignEmergencyModal(true);
          }}
          onDelete={handleDeleteEmergency}
          onRefresh={fetchDashboard}
          onNavigateSubTab={(tab) => {
            if (tab === 'active') setActiveTab('emergencies_active');
            else if (tab === 'status') setActiveTab('emergencies_status');
            else if (tab === 'history') setActiveTab('emergencies_history');
            else setActiveTab(tab);
          }}
          showToast={showToast}
        />
      )}

      {['payments', 'finance_dashboard', 'payment_records', 'subscription_plans'].includes(activeTab) && (
        <PaymentManagementPage 
          initialSection={
            activeTab === 'payment_records' ? 'records' :
            activeTab === 'subscription_plans' ? 'plans' : 'dashboard'
          }
          residents={data?.residentsList || []}
          showToast={showToast}
        />
      )}

      {['rewards', 'rewards_catalog', 'rewards_orders', 'rewards_history', 'rewards_points_config'].includes(activeTab) && (
        <AdminRewardsManagementPage 
          activeSubTab={
            activeTab === 'rewards_orders' ? 'orders' :
            activeTab === 'rewards_history' ? 'history' :
            activeTab === 'rewards_points_config' ? 'points_config' : 'catalog'
          }
          onNavigateSubTab={(tab) => {
            if (tab === 'catalog') setActiveTab('rewards_catalog');
            else if (tab === 'orders') setActiveTab('rewards_orders');
            else if (tab === 'history') setActiveTab('rewards_history');
            else if (tab === 'points_config') setActiveTab('rewards_points_config');
            else setActiveTab(tab);
          }}
          showToast={showToast}
        />
      )}

      {activeTab === 'driver_management' && (
        <DriverManagementPage 
          drivers={data?.driversList || []}
          vehicles={data?.vehiclesList || []}
          serviceAreas={data?.serviceAreas || []}
          data={data}
          driverLocations={driverLocations}
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {activeTab === 'resident_management' && (
        <ResidentManagementPage 
          residents={data?.residentsList || []}
          serviceAreas={data?.serviceAreas || []}
          drivers={data?.driversList || []}
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {activeTab === 'logs' && (
        <SystemAuditLogsPage 
          showToast={showToast}
        />
      )}

      {activeTab === 'profile' && (
        <AdminProfilePage 
          adminUser={(() => {
            try {
              return JSON.parse(localStorage.getItem('tmt_admin_user')) || 
                     JSON.parse(localStorage.getItem('tmt_user')) || null;
            } catch {
              return null;
            }
          })()}
          data={data}
          onRefresh={fetchDashboard}
          showToast={showToast}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-base text-[#0F172A] mb-2">Municipal System Configurations</h3>
          <p className="text-xs text-slate-400">Telemetry rates, automated dispatch rules, and waste points multipliers.</p>
        </div>
      )}
        </>
      )}

      {/* Add Resident Modal */}
      <AddResidentModal 
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        residentForm={residentForm}
        setResidentForm={setResidentForm}
        onSubmit={handleAddResident}
      />

      {/* Add Driver Modal */}
      <AddDriverModal 
        isOpen={showAddDriverModal}
        onClose={() => setShowAddDriverModal(false)}
        driverForm={driverForm}
        setDriverForm={setDriverForm}
        onSubmit={handleAddDriver}
        vehicles={data?.vehiclesList || []}
      />

      {/* Assign Emergency Modal */}
      <AssignEmergencyModal 
        isOpen={showAssignEmergencyModal}
        onClose={() => setShowAssignEmergencyModal(false)}
        emergency={selectedEmergency}
        drivers={data?.driversList || []}
        selectedDriverId={selectedDriverForDispatch}
        setSelectedDriverId={setSelectedDriverForDispatch}
        onSubmit={handleDispatchEmergency}
      />
    </AdminLayout>
  );
}
