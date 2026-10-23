import React from 'react';
import { Truck, LayoutDashboard, History, Settings, User, Trash2, Home, Navigation, Package, AlertTriangle } from 'lucide-react';

export default function DriverSidebar({ activeTab, setActiveTab, data, onCloseMobile, isMobileDrawer = false }) {
  const roadsideCount = data?.assignedComplaints?.filter(c => {
    const isResolved = (c.status || '').toUpperCase().includes('RESOLV');
    return !isResolved;
  })?.length || 0;

  const activeEmergenciesCount = (data?.emergencies || []).filter(e => {
    const st = (e.status || '').toUpperCase();
    return st !== 'RESOLVED' && st !== 'PICKED_UP' && st !== 'CANCELLED';
  }).length;

  const totalHouses = data?.routeStops?.length || 0;
  const pickedHouses = data?.routeStops?.filter(s => s.status === 'PICKED')?.length || 0;
  const pendingHouses = totalHouses - pickedHouses;

  const curLat = Number(data?.liveLocation?.lat || 28.4848);
  const curLng = Number(data?.liveLocation?.lng || 77.5135);

  // Calculate nearby houses count (< 500m)
  const nearbyCount = data?.routeStops?.filter(s => {
    if (!s.lat || !s.lng || s.status === 'PICKED') return false;
    const dLat = (Number(s.lat) - curLat) * 111000;
    const dLng = (Number(s.lng) - curLng) * 111000 * Math.cos(curLat * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist <= 500;
  })?.length || 0;

  const pendingOrdersCount = (data?.assignedOrders || []).filter(o => 
    o.deliveryStatus === 'PACKED' || o.deliveryStatus === 'OUT FOR DELIVERY'
  ).length;

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Route & Live Radar', icon: LayoutDashboard },
    { 
      id: 'assigned_houses', 
      label: 'Assigned Houses', 
      icon: Home,
      badge: totalHouses > 0 ? `${pickedHouses}/${totalHouses}` : null,
      badgeColor: pendingHouses === 0 && totalHouses > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'nearby_houses', 
      label: 'Nearby Houses', 
      icon: Navigation,
      badge: nearbyCount > 0 ? `${nearbyCount} Near` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    { 
      id: 'orders', 
      label: 'Reward Orders', 
      icon: Package,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : null,
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    { 
      id: 'emergency_dispatches', 
      label: 'Emergency Pickups', 
      icon: AlertTriangle,
      badge: activeEmergenciesCount > 0 ? `${activeEmergenciesCount} SOS` : null,
      badgeColor: 'bg-rose-100 text-rose-800'
    },
    { 
      id: 'roadside_pickups', 
      label: 'Roadside Pickups', 
      icon: Trash2,
      badge: roadsideCount > 0 ? `${roadsideCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    { id: 'history', label: 'Trip Logs', icon: History },
    { id: 'profile', label: 'Operator Profile', icon: User },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <nav className={`space-y-1 ${isMobileDrawer ? '' : 'bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isActive ? 'bg-[#00B074] text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
