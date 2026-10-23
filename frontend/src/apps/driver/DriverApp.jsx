import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../../services/socket';
import DriverLayout from './layout/DriverLayout';
import DriverDashboardPage from './pages/DriverDashboardPage';
import DriverRoadsidePickupsPage from './pages/DriverRoadsidePickupsPage';
import DriverEmergenciesPage from './pages/DriverEmergenciesPage';
import DriverAssignedHousesPage from './pages/DriverAssignedHousesPage';
import DriverNearbyHousesPage from './pages/DriverNearbyHousesPage';
import DriverOrdersPage from './pages/DriverOrdersPage';
import DriverProfilePage from './pages/DriverProfilePage';
import RecordWeightModal from './components/RecordWeightModal';
import { soundManager } from '../../utils/audioAlerts';

const getAuthHeaders = () => {
  const token = localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const getLocalDriver = () => {
  try {
    return JSON.parse(localStorage.getItem('tmt_driver_user')) || 
           JSON.parse(localStorage.getItem('tmt_user')) || null;
  } catch {
    return null;
  }
};

export default function DriverApp() {
  const { tab: pathTab } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab synchronized with both path parameter (/driver/:tab) and query parameter (?tab=...)
  const activeTab = pathTab || searchParams.get('tab') || 'dashboard';

  const setActiveTab = useCallback((nextTab) => {
    if (pathTab) {
      navigate(nextTab === 'dashboard' ? '/driver' : `/driver/${nextTab}`);
    } else {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (nextTab === 'dashboard') {
          next.delete('tab');
        } else {
          next.set('tab', nextTab);
        }
        return next;
      });
    }
  }, [pathTab, navigate, setSearchParams]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Driver Terminal Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tmt_driver_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addNotification = (item) => {
    setNotifications(prev => {
      const newItem = {
        id: item.id || `drv_notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: item.title,
        message: item.message,
        type: item.type || 'info',
        createdAt: item.createdAt || new Date().toISOString(),
        read: false,
        actionTab: item.actionTab || null,
        metadata: item.metadata || {}
      };
      const updated = [newItem, ...(prev || [])].slice(0, 50);
      try {
        localStorage.setItem('tmt_driver_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('tmt_driver_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('tmt_driver_notifications');
    } catch {}
  };

  const handleNotificationClick = (id) => {
    const clickedItem = notifications.find(n => n.id === id);
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try {
        localStorage.setItem('tmt_driver_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (clickedItem?.actionTab) {
      setActiveTab(clickedItem.actionTab);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Live Duty & GPS State (defaults to false/off-duty upon login until driver starts shift)
  const [isOnDuty, setIsOnDuty] = useState(false);

  // Collection Weight Modal State
  const [selectedStop, setSelectedStop] = useState(null);
  const [weightKg, setWeightKg] = useState('');
  const [wasteType, setWasteType] = useState('Organic');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/driver/dashboard', {
        headers: getAuthHeaders()
      });
      if (res.status === 401) {
        const token = localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
        if (!token && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?portal=driver';
          return;
        }
      }
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setIsOnDuty(Boolean(json.isOnDuty));

        // Seed initial notifications if empty
        setNotifications(prev => {
          if (prev && prev.length > 0) return prev;
          const initial = [];
          if (json?.activeSector) {
            initial.push({
              id: 'init_drv_sector_1',
              title: '📍 Designated Service Sector',
              message: `Assigned to ${json.activeSector}. ${json.assignedHouses?.length || 0} household stops assigned for curbside clearing.`,
              type: 'area',
              createdAt: new Date().toISOString(),
              read: true,
              actionTab: 'assigned_houses'
            });
          }
          if (json?.assignedEmergencies?.length > 0) {
            const em = json.assignedEmergencies[0];
            initial.push({
              id: 'init_drv_sos_1',
              title: '🚨 Emergency SOS Dispatched',
              message: `Urgent pickup allocated at ${em.address || 'Household'}. Target: ${em.wasteType || 'Immediate collection'}.`,
              type: 'emergency',
              createdAt: em.createdAt || new Date().toISOString(),
              read: true,
              actionTab: 'dashboard'
            });
          }
          if (initial.length > 0) {
            try {
              localStorage.setItem('tmt_driver_notifications', JSON.stringify(initial));
            } catch {}
            return initial;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Driver dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    // Broadcast GPS location only when authenticated driver data is loaded from server
    const broadcastLocation = (lat, lng) => {
      const driver = data?.driver || data?.driverInfo;
      if (!driver || !driver._id) return;

      const sector = data?.activeSector || driver.activeSector || '';
      const payload = {
        driverId: driver.customId || 'DRV',
        driverMongoId: driver._id,
        driverName: driver.name || 'Fleet Operator',
        sector,
        vehicle: driver.assignedVehicle || 'Assigned Vehicle',
        isOnDuty: true,
        lat,
        lng,
        speedKm: Math.floor(18 + Math.random() * 10),
        heading: 'In-Transit'
      };

      // Broadcast to socket clients (Resident & Admin)
      socket.emit('update-location', payload);

      // Keep local state in sync so driver UI reflects it
      setData(prev => prev ? ({
        ...prev,
        liveLocation: {
          lat,
          lng,
          speedKm: payload.speedKm,
          heading: payload.heading,
          lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      }) : prev);
    };

    let watchId = null;
    const currentDriver = data?.driver || data?.driverInfo;

    if (isOnDuty && currentDriver && currentDriver._id) {
      // Broadcast immediate initial location
      const initLat = currentDriver?.liveLocation?.lat && currentDriver.liveLocation.lat !== 0 
        ? currentDriver.liveLocation.lat 
        : 28.6139;
      const initLng = currentDriver?.liveLocation?.lng && currentDriver.liveLocation.lng !== 0 
        ? currentDriver.liveLocation.lng 
        : 77.2090;
      broadcastLocation(initLat, initLng);

      let lastRealGpsTime = 0;

      // 1. Try real device GPS geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lastRealGpsTime = Date.now();
            const { latitude, longitude } = pos.coords;
            broadcastLocation(Number(latitude.toFixed(6)), Number(longitude.toFixed(6)));
          },
          (err) => {
            console.warn('Geolocation read failed or permission pending:', err.message);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            lastRealGpsTime = Date.now();
            const { latitude, longitude } = pos.coords;
            broadcastLocation(Number(latitude.toFixed(6)), Number(longitude.toFixed(6)));
          },
          (err) => {
            console.warn('Geolocation watch notice:', err.message);
          },
          { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
        );
      }

      // 2. Continuous Telemetry Heartbeat (ensures live telemetry streams to resident & admin)
      let currentLat = initLat;
      let currentLng = initLng;
      const gpsInterval = setInterval(() => {
        // If no real GPS position arrived in the last 6 seconds, simulate realistic subtle in-transit motion
        if (Date.now() - lastRealGpsTime > 6000) {
          currentLat = Number((currentLat + (Math.random() - 0.48) * 0.0008).toFixed(6));
          currentLng = Number((currentLng + (Math.random() - 0.48) * 0.0008).toFixed(6));
          broadcastLocation(currentLat, currentLng);
        }
      }, 5000);

      return () => {
        if (watchId !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
        clearInterval(gpsInterval);
      };
    }
  }, [isOnDuty, (data?.driver || data?.driverInfo)?.customId, data?.activeSector]);

  // Real-time Emergency SOS Socket Synchronization
  useEffect(() => {
    const handleEmergencyCreated = (newEm) => {
      soundManager.playEmergencyAlertChime();
      showToast(`🚨 New Emergency SOS: ${newEm?.address || 'Resident'}!`, 'info');
      addNotification({
        type: 'emergency',
        title: '🚨 New Emergency SOS Alert',
        message: `Urgent pickup request filed for ${newEm?.address || 'Household'} (${newEm?.wasteType || 'Immediate collection'}). Check dispatch queue.`,
        actionTab: 'dashboard'
      });
      fetchDashboard();
    };

    const handleEmergencyAssigned = (assignedEm) => {
      soundManager.playEmergencyAlertChime();
      showToast(`📋 Emergency ${assignedEm?.customId || assignedEm?.reqId || ''} assigned to fleet!`, 'info');
      addNotification({
        type: 'emergency',
        title: '🚨 Emergency SOS Task Assigned to You',
        message: `Emergency SOS #${assignedEm?.customId || assignedEm?.reqId || 'SOS'} at ${assignedEm?.address || 'Household'} assigned to your truck.`,
        actionTab: 'dashboard'
      });
      fetchDashboard();
    };

    const handleEmergencyUpdated = () => {
      fetchDashboard();
    };

    const handleEmergencyCompleted = () => {
      fetchDashboard();
    };

    socket.on('emergency-created', handleEmergencyCreated);
    socket.on('emergency-assigned', handleEmergencyAssigned);
    socket.on('emergency-updated', handleEmergencyUpdated);
    socket.on('emergency-completed', handleEmergencyCompleted);
    socket.on('emergency-deleted', fetchDashboard);

    // Complaint & Roadside Assignment Sync
    const handleComplaintAssigned = (payload) => {
      const curDriver = data?.driver || data?.driverInfo || getLocalDriver();
      if (!payload || payload.driverId === curDriver?._id || payload.driverName === curDriver?.name) {
        soundManager.playNotificationPing();
        showToast(`🚚 New task assigned: ${payload?.complaint?.customId || 'Complaint'} - ${payload?.complaint?.title || 'Roadside Waste Spot'}!`, 'info');
        addNotification({
          type: 'complaint',
          title: '📢 Roadside Cleanup Spot Assigned',
          message: `Ticket #${payload?.complaint?.customId || 'TICKET'}: ${payload?.complaint?.title || 'Reported Incident'} allocated to your route.`,
          actionTab: 'roadside_pickups'
        });
      }
      fetchDashboard();
    };

    socket.on('complaint-assigned-driver', handleComplaintAssigned);
    socket.on('complaint-status-updated', fetchDashboard);
    socket.on('complaint-created', fetchDashboard);
    socket.on('complaint-updated', fetchDashboard);

    // Area Assignment & House List Real-Time Sync
    const handleDriverAreaAssigned = (assignPayload) => {
      const curDriver = data?.driver || data?.driverInfo || getLocalDriver();
      if (!assignPayload || assignPayload.driverId === curDriver?._id || assignPayload.customId === curDriver?.customId) {
        soundManager.playNotificationPing();
        showToast(`📍 Assigned to ${assignPayload.sector}! ${assignPayload.stopsCount || 0} house collection stops loaded.`, 'success');
        addNotification({
          type: 'area',
          title: '📍 Route Sector Allocated by Admin',
          message: `You are assigned to ${assignPayload.sector}. ${assignPayload.stopsCount || 0} household collection stops loaded.`,
          actionTab: 'assigned_houses'
        });
        fetchDashboard();
      }
    };

    const handleHouseListUpdated = (housePayload) => {
      const curDriver = data?.driver || data?.driverInfo || getLocalDriver();
      if (!housePayload || housePayload.driverId === curDriver?._id) {
        showToast(`📋 House collection list updated: ${housePayload.stopsCount || 0} houses in ${housePayload.sector}`, 'info');
        addNotification({
          type: 'area',
          title: '📋 House Collection Stops Updated',
          message: `${housePayload.stopsCount || 0} household collection stops allocated for ${housePayload.sector}.`,
          actionTab: 'assigned_houses'
        });
        fetchDashboard();
      }
    };

    const handleOrderPacked = (order) => {
      soundManager.playNotificationPing();
      showToast(`📦 Reward parcel #${order?.customId || 'ORD'} packed and assigned to you for delivery!`, 'info');
      addNotification({
        type: 'order',
        title: '📦 Reward Parcel Ready at Depot',
        message: `Order #${order?.customId || 'ORD'} (${order?.rewardTitle || 'Gift'}) packed and ready for delivery to ${order?.recipientName || order?.residentName || 'Resident'}.`,
        actionTab: 'orders'
      });
      fetchDashboard();
    };

    const handleOrderDelivered = (order) => {
      soundManager.playPointsCreditedChime();
      addNotification({
        type: 'delivered',
        title: '✅ Reward Handover Verified',
        message: `Order #${order?.customId || 'ORD'} verified via resident QR scan. Delivery handover complete.`,
        actionTab: 'orders'
      });
      fetchDashboard();
    };

    const handleGarbagePickedUp = (pData) => {
      soundManager.playPointsCreditedChime();
      addNotification({
        type: 'pickup',
        title: '♻️ Curbside Collection Certified',
        message: `Logged ${pData?.weightKg || 0}kg of ${pData?.wasteType || 'household'} waste (+${pData?.pointsEarned || 0} PTS) for ${pData?.residentName || 'resident'}.`,
        actionTab: 'assigned_houses'
      });
      fetchDashboard();
    };

    socket.on('driver-area-assigned', handleDriverAreaAssigned);
    socket.on('house-list-updated', handleHouseListUpdated);
    socket.on('order-packed', handleOrderPacked);
    socket.on('order-delivered', handleOrderDelivered);
    socket.on('garbage-picked-up', handleGarbagePickedUp);
    socket.on('order-status-updated', fetchDashboard);

    return () => {
      socket.off('emergency-created', handleEmergencyCreated);
      socket.off('emergency-assigned', handleEmergencyAssigned);
      socket.off('emergency-updated', handleEmergencyUpdated);
      socket.off('emergency-completed', handleEmergencyCompleted);
      socket.off('emergency-deleted', fetchDashboard);
      socket.off('complaint-assigned-driver', handleComplaintAssigned);
      socket.off('complaint-status-updated', fetchDashboard);
      socket.off('complaint-created', fetchDashboard);
      socket.off('complaint-updated', fetchDashboard);
      socket.off('driver-area-assigned', handleDriverAreaAssigned);
      socket.off('house-list-updated', handleHouseListUpdated);
      socket.off('order-packed', handleOrderPacked);
      socket.off('order-delivered', handleOrderDelivered);
      socket.off('garbage-picked-up', handleGarbagePickedUp);
      socket.off('order-status-updated', fetchDashboard);
    };
  }, []);

  const handleToggleDuty = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const nextDuty = !isOnDuty;
    try {
      // 1. Optimistic UI update so button flips immediately
      setIsOnDuty(nextDuty);
      setData(prev => prev ? ({ ...prev, isOnDuty: nextDuty }) : prev);

      const currentDriver = data?.driver || data?.driverInfo || getLocalDriver();
      const currentSector = data?.activeSector || currentDriver?.activeSector || '';

      // 2. Real-time socket broadcast to residents & admin
      socket.emit('duty-change', {
        driverId: currentDriver?.customId || 'DRV',
        driverMongoId: currentDriver?._id,
        driverName: currentDriver?.name,
        sector: currentSector,
        vehicle: currentDriver?.assignedVehicle,
        isOnDuty: nextDuty,
        liveLocation: nextDuty ? data?.liveLocation : null
      });

      // 3. Persist to MongoDB backend
      const res = await fetch('/api/driver/toggle-duty', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isOnDuty: nextDuty })
      });

      if (res.ok) {
        const result = await res.json();
        setData(prev => prev ? ({ 
          ...prev, 
          isOnDuty: Boolean(result.isOnDuty),
          registeredLocation: result.registeredLocation || prev.registeredLocation
        }) : prev);
        showToast(nextDuty ? '⚡ Shift Started: Live GPS Telemetry Broadcasting' : '🛑 Duty Shift Ended', 'info');
      } else {
        // Revert on backend error
        setIsOnDuty(!nextDuty);
        setData(prev => prev ? ({ ...prev, isOnDuty: !nextDuty }) : prev);
        showToast('Failed to update shift status on server', 'error');
      }
    } catch (err) {
      // Revert on network exception
      setIsOnDuty(!nextDuty);
      setData(prev => prev ? ({ ...prev, isOnDuty: !nextDuty }) : prev);
      showToast('Network error updating shift status', 'error');
    }
  };

  const handleStartEmergencyPickup = async (emergencyId) => {
    try {
      const res = await fetch(`/api/driver/start-emergency-pickup/${emergencyId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (res.ok) {
        showToast('🚀 Route started! Vehicle coordinates & notification sent to resident.', 'success');
        fetchDashboard();
      } else {
        showToast(result.message || 'Failed to start emergency route', 'error');
      }
    } catch (err) {
      showToast('Network error starting emergency route', 'error');
    }
  };

  const handleCompleteEmergencyPickup = async (emergencyId) => {
    try {
      const res = await fetch(`/api/driver/complete-emergency-pickup/${emergencyId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (res.ok) {
        showToast('✅ Emergency pickup marked as Picked Up / Completed!', 'success');
        fetchDashboard();
      } else {
        showToast(result.message || 'Failed to mark emergency picked up', 'error');
      }
    } catch (err) {
      showToast('Network error completing emergency pickup', 'error');
    }
  };

  const handleStartComplaintPickup = async (complaintId) => {
    try {
      const res = await fetch(`/api/driver/complaints/${complaintId}/start-pickup`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const result = await res.json();
      if (res.ok) {
        showToast('🚚 En route! Status updated to "On the Way" for this complaint.', 'success');
        fetchDashboard();
      } else {
        showToast(result.message || 'Failed to update pickup status', 'error');
      }
    } catch (err) {
      showToast('Network error updating pickup status', 'error');
    }
  };

  const handleCompleteComplaintPickup = async (complaintId, notesOrPayload = '', weightKg = 0) => {
    try {
      const bodyData = typeof notesOrPayload === 'object' && notesOrPayload !== null
        ? notesOrPayload
        : { notes: notesOrPayload, clearedWeightKg: weightKg };

      const res = await fetch(`/api/driver/complaints/${complaintId}/complete-pickup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });
      const result = await res.json();
      if (res.ok) {
        showToast('✅ Waste collected & site cleared! Transferred to Complaint History.', 'success');
        fetchDashboard();
      } else {
        showToast(result.message || 'Failed to complete complaint pickup', 'error');
      }
    } catch (err) {
      showToast('Network error resolving complaint pickup', 'error');
    }
  };

  const handleRecordCollection = async (e) => {
    e.preventDefault();
    const targetResidentId = selectedStop?.residentId || selectedStop?._id || selectedStop?.id;
    if (!targetResidentId) {
      showToast('Error: Valid resident profile ID is required for weight recording', 'error');
      return;
    }
    try {
      const res = await fetch('/api/driver/record-collection', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          residentId: targetResidentId,
          wasteType,
          weightKg: parseFloat(weightKg)
        })
      });
      const result = await res.json();
      if (res.ok) {
        showToast(result.message, 'success');
        setSelectedStop(null);
        setWeightKg('');
        fetchDashboard();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Failed to record collection', 'error');
    }
  };

  return (
    <DriverLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      data={data}
      isOnDuty={isOnDuty}
      handleToggleDuty={handleToggleDuty}
      toast={toast}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={markAllRead}
      onClearAll={clearAllNotifications}
      onNotificationClick={handleNotificationClick}
    >
      {activeTab === 'dashboard' && (
        <DriverDashboardPage 
          data={data} 
          isOnDuty={isOnDuty}
          onToggleDuty={handleToggleDuty}
          setSelectedStop={setSelectedStop}
          onStartPickup={handleStartEmergencyPickup}
          onCompletePickup={handleCompleteEmergencyPickup}
          onStartComplaintPickup={handleStartComplaintPickup}
          onCompleteComplaintPickup={handleCompleteComplaintPickup}
        />
      )}

      {activeTab === 'assigned_houses' && (
        <DriverAssignedHousesPage 
          data={data}
          onRecordStop={setSelectedStop}
        />
      )}

      {activeTab === 'nearby_houses' && (
        <DriverNearbyHousesPage 
          data={data}
          driverLocation={data?.liveLocation}
          onRecordStop={setSelectedStop}
        />
      )}

      {activeTab === 'orders' && (
        <DriverOrdersPage 
          showToast={showToast}
          onRefreshDashboard={fetchDashboard}
        />
      )}

      {activeTab === 'emergency_dispatches' && (
        <DriverEmergenciesPage 
          emergencies={data?.emergencies || []}
          driverLocation={data?.liveLocation}
          driverInfo={data?.driver || data?.driverInfo || getLocalDriver()}
          onStartPickup={handleStartEmergencyPickup}
          onCompletePickup={handleCompleteEmergencyPickup}
        />
      )}

      {activeTab === 'roadside_pickups' && (
        <DriverRoadsidePickupsPage 
          assignedComplaints={data?.assignedComplaints || []}
          driverLocation={data?.liveLocation}
          driverInfo={data?.driver || data?.driverInfo || getLocalDriver()}
          onStartPickup={handleStartComplaintPickup}
          onCompletePickup={handleCompleteComplaintPickup}
        />
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h3 className="font-bold text-base text-[#0F172A] mb-2">Shift Collection Logs</h3>
          <p className="text-xs text-slate-400">All authenticated household weight slips from today's trip runs.</p>
        </div>
      )}

      {activeTab === 'profile' && (
        <DriverProfilePage
          driverInfo={data?.driver || data?.driverInfo || getLocalDriver()}
          isOnDuty={isOnDuty}
          onToggleDuty={handleToggleDuty}
          totalHouses={data?.routeStops?.length || data?.assignedHouses?.length || 0}
          clearedHouses={(data?.routeStops || []).filter(s => s.status === 'PICKED').length}
          onRefresh={fetchDashboard}
          showToast={showToast}
        />
      )}

      {/* Record Weight Modal */}
      <RecordWeightModal
        selectedStop={selectedStop}
        onClose={() => setSelectedStop(null)}
        wasteType={wasteType}
        setWasteType={setWasteType}
        weightKg={weightKg}
        setWeightKg={setWeightKg}
        onSubmit={handleRecordCollection}
      />
    </DriverLayout>
  );
}
