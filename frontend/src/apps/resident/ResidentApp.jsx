import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../../services/socket';
import ResidentLayout from './layout/ResidentLayout';
import ResidentDashboardPage from './pages/ResidentDashboardPage';
import ResidentTrackingPage from './pages/ResidentTrackingPage';
import AIVisionScanner from './components/AIVisionScanner';
import AISpotReporter from './components/AISpotReporter';
import AIChatBox from './components/AIChatBox';
import EmergencyRequestModal from './components/EmergencyRequestModal';
import ResidentEmergenciesList from './components/ResidentEmergenciesList';
import RewardsCard from './components/RewardsCard';
import ResidentComplaintsPage from './pages/ResidentComplaintsPage';
import SubscriptionBillingPage from './pages/SubscriptionBillingPage';
import ResidentOrdersPage from './pages/ResidentOrdersPage';
import PointsHistorySection from './components/PointsHistorySection';
import PointsAndRewardPage from './pages/PointsAndRewardPage';
import ResidentProfilePage from './pages/ResidentProfilePage';
import { Trash2 } from 'lucide-react';
import { soundManager } from '../../utils/audioAlerts';
import { 
  fetchResidentDashboard, 
  redeemPoints, 
  submitEmergency, 
  deleteEmergency,
  submitComplaint, 
  deleteComplaint,
  getAuthHeaders 
} from './services/residentApi';

// Haversine distance calculator in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function ResidentApp() {
  const { tab: pathTab } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab synchronized with both path parameter (/resident/:tab) and query parameter (?tab=...)
  const activeTab = pathTab || searchParams.get('tab') || 'dashboard';

  const setActiveTab = useCallback((nextTab) => {
    if (pathTab) {
      navigate(nextTab === 'dashboard' ? '/resident' : `/resident/${nextTab}`);
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

  // Resident Portal Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('tmt_resident_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('tmt_resident_theme', theme);
    } catch {}
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  // Proximity & Doorstep Siren Alert State
  const [proximityAlert, setProximityAlert] = useState(null);
  const nearbyTriggeredRef = useRef(false);
  const doorstepTriggeredRef = useRef(false);
  const activeSirenStopRef = useRef(null);

  // Emergency Form State
  const [emergencyReason, setEmergencyReason] = useState('Excessive household waste (Post-event)');
  const [garbageType, setGarbageType] = useState('General Organic');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');

  // Complaint Form State
  const [complaintCategory, setComplaintCategory] = useState('Missed Scheduled Pickup');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // AI Vision State
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // AI Spot Dump State
  const [spotLocation, setSpotLocation] = useState('Greenfield Sector 4 Main Road');
  const [spotNotes, setSpotNotes] = useState('');
  const [spotReporting, setSpotReporting] = useState(false);
  const [spotReportResult, setSpotReportResult] = useState(null);

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am SWM&MS AI Assistant. Ask me anything about waste segregation, recycling rules, or truck schedules!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-Time Notification Bell State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('tmt_resident_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: notif.title || 'Municipal Notice',
      message: notif.message,
      type: notif.type || 'info',
      category: notif.category || notif.type || 'info',
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => {
      // Avoid duplicate consecutive identical messages within 10 seconds
      const exists = prev.some(n => n.message === notif.message && (Date.now() - new Date(n.createdAt).getTime()) < 10000);
      if (exists) return prev;
      const updated = [newNotif, ...prev].slice(0, 50);
      try {
        localStorage.setItem('tmt_resident_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('tmt_resident_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('tmt_resident_notifications');
    } catch {}
  };

  const handleNotificationClick = (id) => {
    const clickedItem = notifications.find(n => n.id === id);
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try {
        localStorage.setItem('tmt_resident_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (clickedItem) {
      const type = clickedItem.type || clickedItem.category;
      if (type === 'refund' || type === 'points') {
        setActiveTab('points-history');
      } else if (type === 'orders') {
        setActiveTab('orders');
      } else if (type === 'complaint') {
        setActiveTab('complaints');
      } else if (type === 'doorstep' || type === 'nearby' || type === 'duty') {
        setActiveTab('tracking');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSilenceSiren = () => {
    if (activeSirenStopRef.current) {
      activeSirenStopRef.current();
      activeSirenStopRef.current = null;
    }
    setProximityAlert(prev => prev ? { ...prev, sirenSilenced: true, type: null } : null);
  };

  const checkDriverProximity = (locData, residentHouseLoc) => {
    const lat = Number(locData?.lat !== undefined ? locData.lat : locData?.location?.lat);
    const lng = Number(locData?.lng !== undefined ? locData.lng : locData?.location?.lng);
    if (isNaN(lat) || isNaN(lng)) return;

    const houseLat = Number(residentHouseLoc?.lat);
    const houseLng = Number(residentHouseLoc?.lng);
    if (!houseLat || !houseLng || isNaN(houseLat) || isNaN(houseLng) || houseLat === 0 || houseLng === 0) return;

    const distMeters = calculateDistanceMeters(lat, lng, houseLat, houseLng);

    if (distMeters <= 80) {
      if (!doorstepTriggeredRef.current) {
        doorstepTriggeredRef.current = true;
        nearbyTriggeredRef.current = true;
        const stopFn = soundManager.playDoorstepSiren(12);
        activeSirenStopRef.current = stopFn;
        showToast(`🚨 DOORSTEP ARRIVAL: Collection truck is at your doorstep (~${distMeters}m)! Pickup underway.`, 'warning');
        addNotification({
          type: 'doorstep',
          title: '🚨 Truck at Your Doorstep',
          message: `Waste collection truck (${locData?.vehicle || 'Truck'}) has reached your doorstep (~${distMeters}m). Driver: ${locData?.driverName || 'Municipal Driver'}. Curbside collection underway.`
        });
      }
      setProximityAlert({
        type: 'doorstep',
        distanceMeters: distMeters,
        driverName: locData?.driverName || 'Municipal Driver',
        vehicle: locData?.vehicle || 'Collection Truck'
      });
    } else if (distMeters <= 400) {
      if (!nearbyTriggeredRef.current) {
        nearbyTriggeredRef.current = true;
        soundManager.playProximityChime();
        showToast(`🔔 Collection Truck Nearby! Driver ${locData?.driverName || 'Municipal Driver'} is approximately ${distMeters}m away. Please keep bins ready curbside.`, 'info');
        addNotification({
          type: 'nearby',
          title: '🔔 Collection Truck Nearby',
          message: `Driver ${locData?.driverName || 'Municipal Driver'} (${locData?.vehicle || 'Truck'}) is approaching (~${distMeters}m away). Please keep waste bins curbside.`
        });
      }
      setProximityAlert({
        type: 'nearby',
        distanceMeters: distMeters,
        driverName: locData?.driverName || 'Municipal Driver',
        vehicle: locData?.vehicle || 'Collection Truck'
      });
    } else if (distMeters > 550) {
      if (activeSirenStopRef.current) {
        activeSirenStopRef.current();
        activeSirenStopRef.current = null;
      }
      doorstepTriggeredRef.current = false;
      nearbyTriggeredRef.current = false;
      setProximityAlert(null);
    }
  };

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const json = await fetchResidentDashboard();
      setData(json);

      // Check proximity alert & doorstep siren if driver is on duty
      if (json?.assignedDriver?.isOnDuty && json?.assignedDriver?.liveLocation) {
        const houseLoc = json.resident?.houseLocation || json.houseLocation;
        checkDriverProximity({
          lat: json.assignedDriver.liveLocation.lat,
          lng: json.assignedDriver.liveLocation.lng,
          driverName: json.assignedDriver.name,
          vehicle: json.assignedDriver.van || json.assignedDriver.vehicle
        }, houseLoc);
      }

      // Seed initial notification history if resident has no stored notifications
      setNotifications(prev => {
        if (prev && prev.length > 0) return prev;
        const initial = [];
        if (json?.todayPickupStatus === 'PICKED UP' || json?.todayCollection) {
          initial.push({
            id: 'init_pickup_1',
            title: '✅ Waste Picked Up & Certified',
            message: `Today's curbside collection cleared: ${json?.todayCollection?.weightKg || json?.lastPickup?.weightKg || 0}kg of ${json?.todayCollection?.type || json?.lastPickup?.wasteType || 'Household'} waste (+${json?.todayCollection?.pointsEarned || json?.lastPickup?.pointsEarned || 0} PTS).`,
            type: 'pickup',
            category: 'pickup',
            createdAt: new Date().toISOString(),
            read: true
          });
        }
        if (json?.assignedDriver?.name && json.assignedDriver.name !== 'Unassigned') {
          initial.push({
            id: 'init_driver_1',
            title: '📍 Sector Driver Allocated',
            message: `Driver ${json.assignedDriver.name} (${json.assignedDriver.van || json.assignedDriver.vehicle || 'Truck'}) is assigned to ${json.assignedDriver.route || json.resident?.sector || 'your area'}.`,
            type: 'duty',
            category: 'duty',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: true
          });
        }
        if (initial.length > 0) {
          try {
            localStorage.setItem('tmt_resident_notifications', JSON.stringify(initial));
          } catch {}
          return initial;
        }
        return prev;
      });
    } catch (err) {
      console.error('Resident dashboard load error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const normalizeSector = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .toLowerCase()
        .replace(/sector[\s\-_]*/gi, '')
        .replace(/[\(\)\[\],.\-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    socket.on('driver-location-update', (locData) => {
      // Check if this driver is assigned to the resident's sector and is on duty
      setData(prev => {
        if (!prev) return prev;

        const residentSectorNorm = normalizeSector(prev.resident?.sector || prev.resident?.houseLocation?.sector);
        const incomingSectorNorm = normalizeSector(locData.sector);
        const incomingDriverId = locData.driverMongoId ? String(locData.driverMongoId) : null;
        const assignedDriverId = prev.assignedDriver?.id ? String(prev.assignedDriver.id) : (prev.resident?.assignedDriverId ? String(prev.resident.assignedDriverId) : null);

        // Match only if incoming driver is this resident's assigned driver OR exact sector matches
        const isSameDriver = Boolean(incomingDriverId && assignedDriverId && incomingDriverId === assignedDriverId);
        const isSameSector = Boolean(residentSectorNorm && incomingSectorNorm && residentSectorNorm === incomingSectorNorm);

        // If this location update is from another sector or different driver, DO NOT accept it!
        if (!isSameDriver && !isSameSector) {
          return prev;
        }

        // If driver is off duty, set isOnDuty false and fallback to registered base location
        if (locData.isOnDuty === false) {
          if (activeSirenStopRef.current) {
            activeSirenStopRef.current();
            activeSirenStopRef.current = null;
          }
          setProximityAlert(null);
          return {
            ...prev,
            assignedDriver: prev.assignedDriver ? { 
              ...prev.assignedDriver, 
              isOnDuty: false,
              liveLocation: prev.assignedDriver.registeredLocation || prev.assignedDriver.liveLocation
            } : null
          };
        }

        const lat = Number(locData?.lat !== undefined ? locData.lat : locData?.location?.lat);
        const lng = Number(locData?.lng !== undefined ? locData.lng : locData?.location?.lng);
        if (isNaN(lat) || isNaN(lng)) return prev;

        // Proximity calculation for nearby alert and doorstep siren
        checkDriverProximity(locData, prev.resident?.houseLocation || prev.houseLocation);

        const updatedLocation = {
          lat,
          lng,
          speedKm: locData?.speedKm || locData?.location?.speedKm || 22,
          heading: locData?.heading || locData?.location?.heading || 'In-Transit',
          lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        return {
          ...prev,
          assignedDriver: {
            ...(prev.assignedDriver || {}),
            id: incomingDriverId || prev.assignedDriver?.id,
            name: locData.driverName || prev.assignedDriver?.name || 'Municipal Driver',
            van: locData.vehicle || prev.assignedDriver?.van || 'Collection Vehicle',
            route: locData.sector || prev.assignedDriver?.route || prev.resident?.sector,
            isOnDuty: true,
            liveLocation: updatedLocation
          }
        };
      });
    });

    socket.on('driver-duty-changed', (dutyData) => {
      const { isOnDuty, sector, driverName, vehicle, liveLocation, registeredLocation, residentIds } = dutyData;
      setData(prev => {
        if (!prev) return prev;
        const curResidentId = String(prev.resident?._id || prev.resident?.id || '');
        const residentSectorNorm = normalizeSector(prev.resident?.sector || prev.resident?.houseLocation?.sector);
        const dutySectorNorm = normalizeSector(sector);
        const incomingDriverId = dutyData.driverMongoId ? String(dutyData.driverMongoId) : null;
        const assignedDriverId = prev.assignedDriver?.id ? String(prev.assignedDriver.id) : (prev.resident?.assignedDriverId ? String(prev.resident.assignedDriverId) : null);

        const isSameDriver = Boolean(incomingDriverId && assignedDriverId && incomingDriverId === assignedDriverId);
        const isSameSector = Boolean(residentSectorNorm && dutySectorNorm && residentSectorNorm === dutySectorNorm);
        const isListedResident = Boolean(residentIds && Array.isArray(residentIds) && residentIds.includes(curResidentId));

        if (!isSameDriver && !isSameSector && !isListedResident) return prev;

        const fixedLoc = registeredLocation || prev.assignedDriver?.registeredLocation || prev.assignedDriver?.liveLocation;

        if (isOnDuty) {
          soundManager.playDutyStartChime();
          showToast(`🚚 Shift Started: Driver ${driverName || 'Municipal Driver'} (${vehicle || 'Truck'}) is now ON DUTY in ${sector}! Collection route active.`, 'success');
          addNotification({
            type: 'duty',
            title: '🚚 Duty Shift Started',
            message: `Driver ${driverName || 'Municipal Driver'} (${vehicle || 'Truck'}) is now ON DUTY in ${sector}! Collection route active.`
          });
        } else {
          if (activeSirenStopRef.current) {
            activeSirenStopRef.current();
            activeSirenStopRef.current = null;
          }
          setProximityAlert(null);
          showToast('🅿️ Area Driver is OFF DUTY • Stationed at Base Depot', 'info');
          addNotification({
            type: 'duty',
            title: '🅿️ Driver Standby / Off Duty',
            message: `Driver ${driverName || 'Municipal Driver'} has concluded duty shift and is stationed at base depot.`
          });
        }

        return {
          ...prev,
          assignedDriver: {
            ...(prev.assignedDriver || {}),
            id: incomingDriverId || prev.assignedDriver?.id,
            customId: dutyData.driverId || prev.assignedDriver?.customId,
            name: driverName || prev.assignedDriver?.name,
            van: vehicle || prev.assignedDriver?.van,
            route: sector || prev.assignedDriver?.route,
            isOnDuty: Boolean(isOnDuty),
            registeredLocation: fixedLoc,
            liveLocation: isOnDuty ? (liveLocation || prev.assignedDriver?.liveLocation) : fixedLoc
          }
        };
      });
      loadDashboard(true);
    });

    socket.on('garbage-picked-up', (pickupData) => {
      setData(prev => {
        if (!prev) return prev;
        const curResidentId = String(prev.resident?._id || prev.resident?.id || '');
        if (pickupData.residentId && String(pickupData.residentId) !== curResidentId) {
          return prev;
        }

        if (activeSirenStopRef.current) {
          activeSirenStopRef.current();
          activeSirenStopRef.current = null;
        }
        setProximityAlert(null);
        soundManager.playPointsCreditedChime();

        showToast(`✅ Garbage Picked Up! ${pickupData.weightKg}kg of ${pickupData.wasteType} collected. +${pickupData.pointsEarned} Points credited!`, 'success');
        addNotification({
          type: 'pickup',
          title: '✅ Waste Picked Up & Certified',
          message: `Collected ${pickupData.weightKg}kg of ${pickupData.wasteType}. +${pickupData.pointsEarned} Points credited to your profile!`
        });

        return {
          ...prev,
          todayPickupStatus: 'PICKED UP',
          garbagePoints: (prev.garbagePoints || 0) + Number(pickupData.pointsEarned || 0),
          divertedWasteKg: (prev.divertedWasteKg || 0) + Number(pickupData.weightKg || 0),
          todayCollection: pickupData.collection,
          lastPickup: {
            status: 'PICKED UP',
            time: pickupData.time,
            weightKg: pickupData.weightKg,
            pointsEarned: pickupData.pointsEarned,
            wasteType: pickupData.wasteType
          }
        };
      });
    });

    socket.on('driver-area-assigned', (assignData) => {
      showToast(`📍 Municipal Fleet update: Driver assigned to ${assignData.sector}`, 'info');
      loadDashboard();
    });

    const handleResidentDriverAssigned = (payload) => {
      const curResident = data?.resident || getLocalResident();
      const mySectorNorm = normalizeSector(curResident?.sector || curResident?.houseLocation?.sector);
      const eventSectorNorm = normalizeSector(payload?.sector);
      const myId = (curResident?._id || curResident?.id || '').toString();

      const isForMe = Boolean(
        (payload?.residentIds && Array.isArray(payload.residentIds) && payload.residentIds.includes(myId)) ||
        (mySectorNorm && eventSectorNorm && mySectorNorm === eventSectorNorm)
      );

      if (isForMe) {
        const d = payload?.assignedDriver || {};
        showToast(`🚚 Area Driver Assigned: ${d.name || 'Municipal Driver'} (${d.van || d.vehicle || 'Vehicle'}) is now assigned to your area!`, 'success');
        addNotification({
          type: 'duty',
          title: '📍 Sector Driver Allocated',
          message: `Driver ${d.name || 'Municipal Driver'} (${d.van || d.vehicle || 'Vehicle'}) is now assigned to your area!`
        });
        loadDashboard();
      }
    };

    socket.on('resident-driver-assigned', handleResidentDriverAssigned);

    const handlePointsCredited = (ptsData) => {
      const curResidentId = String(data?.resident?._id || data?.resident?.id || '');
      if (ptsData?.residentId && curResidentId && String(ptsData.residentId) !== curResidentId) {
        return;
      }

      soundManager.playPointsCreditedChime();
      const isRefund = ptsData?.reason?.toLowerCase().includes('refund') || Boolean(ptsData?.orderCustomId);
      const points = Number(ptsData?.pointsEarned || 0);

      if (isRefund) {
        showToast(`💰 Points Refunded: +${points} PTS credited for Order #${ptsData?.orderCustomId || 'Order'}!`, 'success');
        addNotification({
          type: 'refund',
          category: 'refund',
          title: '💰 Order Points Refunded',
          message: `+${points} PTS refunded for Order #${ptsData?.orderCustomId || 'Order'} (${ptsData?.ticketNumber ? `Ticket ${ptsData.ticketNumber}` : 'Complaint Resolved'}).`
        });
      } else {
        showToast(`🎉 +${points} Garbage Points Credited!`, 'success');
        addNotification({
          type: 'points',
          category: 'points',
          title: '🎉 Garbage Points Credited',
          message: `+${points} Points added to your garbage points balance!`
        });
      }

      const bal = ptsData?.newBalance !== undefined ? ptsData.newBalance : ptsData?.totalPoints;
      if (bal !== undefined) {
        setData(prev => prev ? { ...prev, garbagePoints: bal } : prev);
      }
      loadDashboard(true);
    };

    const handleOrderRefunded = (refundData) => {
      const curResidentId = String(data?.resident?._id || data?.resident?.id || '');
      if (refundData?.residentId && curResidentId && String(refundData.residentId) !== curResidentId) {
        return;
      }

      soundManager.playPointsCreditedChime();
      const points = Number(refundData?.pointsRefunded || 0);
      const inrValue = refundData?.amountInr !== undefined 
        ? Number(refundData.amountInr).toFixed(2) 
        : (points * 0.5).toFixed(2);
      const orderRef = refundData?.orderCustomId ? `#${refundData.orderCustomId}` : 'your order';
      const newBal = refundData?.newBalance;

      showToast(`💰 Order Refund Processed: +${points} PTS (₹${inrValue}) credited back for ${orderRef}! New Balance: ${newBal !== undefined ? `${newBal} PTS` : ''}`, 'success');
      addNotification({
        type: 'refund',
        category: 'refund',
        title: '💰 Order Refund Credited to Wallet',
        message: `+${points} PTS (≈ ₹${inrValue} value) refunded for Order ${orderRef} (${refundData?.ticketNumber ? `Ticket ${refundData.ticketNumber}` : 'Complaint Resolved'}). ${newBal !== undefined ? `New Balance: ${newBal} PTS.` : ''}`
      });

      if (newBal !== undefined) {
        setData(prev => prev ? { ...prev, garbagePoints: newBal } : prev);
      }
      loadDashboard(true);
    };

    socket.on('points-credited', handlePointsCredited);
    socket.on('order-refunded', handleOrderRefunded);

    socket.on('complaint-created', () => {
      loadDashboard();
    });

    socket.on('complaint-status-updated', (updatedComp) => {
      const ticketId = updatedComp?.customId || updatedComp?.ticketId || 'Complaint';
      showToast(`📢 Ticket ${ticketId} status updated to: ${updatedComp?.status}`, 'info');
      addNotification({
        type: 'complaint',
        title: `📢 Ticket ${ticketId} Update`,
        message: `Status updated to: ${updatedComp?.status}`
      });
      loadDashboard();
    });

    socket.on('complaint-updated', () => {
      loadDashboard();
    });

    socket.on('complaint-deleted', (delData) => {
      const ticketNo = delData?.ticketNumber || 'Complaint';
      showToast(`🗑️ Ticket ${ticketNo} was removed`, 'info');
      loadDashboard();
    });

    // Real-Time Emergency SOS Notifications & Sync
    const handleEmergencyAssigned = (em) => {
      showToast(`📋 Municipal Admin assigned driver ${em?.assignedDriverName || 'Driver'} to your emergency request!`, 'info');
      addNotification({
        type: 'emergency',
        title: '📋 Emergency Request Dispatched',
        message: `Driver ${em?.assignedDriverName || 'Municipal Driver'} assigned to your emergency request (${em?.customId || em?.reqId || 'SOS'}).`
      });
      loadDashboard();
    };

    const handleEmergencyEnRoute = (payload) => {
      const driver = payload?.driver || {};
      const em = payload?.emergency || {};
      const eta = payload?.etaMinutes || em?.etaMinutes || 6;
      showToast(`🚨 Driver ${driver.name || 'Municipal Driver'} is ON THE WAY in ${driver.vehicle || 'Truck'}! Contact: ${driver.phone || 'Driver'} • ETA: ~${eta} mins. Direct vehicle-to-house route active!`, 'info');
      addNotification({
        type: 'emergency',
        title: '🚨 Emergency Driver En Route',
        message: `Driver ${driver.name || 'Municipal Driver'} is on the way in ${driver.vehicle || 'Truck'}. ETA: ~${eta} mins.`
      });
      loadDashboard();
    };

    const handleEmergencyCompleted = (payload) => {
      const em = payload?.emergency || {};
      showToast(`✅ Emergency Pickup ${em.customId || em.reqId || ''} Completed! Driver marked waste picked up.`, 'success');
      addNotification({
        type: 'emergency',
        title: '✅ Emergency Pickup Resolved',
        message: `Emergency pickup ${em.customId || em.reqId || ''} completed and waste cleared.`
      });
      loadDashboard();
    };

    socket.on('emergency-created', loadDashboard);
    socket.on('emergency-assigned', handleEmergencyAssigned);
    socket.on('emergency-en-route', handleEmergencyEnRoute);
    socket.on('emergency-completed', handleEmergencyCompleted);
    socket.on('emergency-updated', loadDashboard);
    socket.on('emergency-deleted', (delData) => {
      const reqNo = delData?.customId || delData?.reqId || 'Record';
      showToast(`🗑️ Emergency request ${reqNo} was removed`, 'info');
      loadDashboard();
    });

    socket.on('resident-points-updated', (updateData) => {
      if (updateData?.garbagePoints !== undefined) {
        setData(prev => prev ? { ...prev, garbagePoints: updateData.garbagePoints } : prev);
      }
      loadDashboard(true);
    });
    socket.on('reward-redeemed', loadDashboard);
    socket.on('payment-updated', loadDashboard);

    // Reward Orders Lifecycle Handlers
    const handleOrderAccepted = (order) => {
      showToast(`📦 Admin accepted your reward order #${order?.customId || 'ORD'}! Preparing package.`, 'info');
      addNotification({
        type: 'orders',
        title: '📦 Order Accepted',
        message: `Admin has accepted your reward order for ${order?.rewardTitle || 'Gift'} (${order?.customId || 'ORD'}).`
      });
      loadDashboard();
    };

    const handleOrderPacked = (order) => {
      showToast(`🎁 Order #${order?.customId || 'ORD'} is PACKED and assigned to driver ${order?.assignedDriverName || 'Driver'}!`, 'info');
      addNotification({
        type: 'orders',
        title: '🎁 Order Packed & Assigned',
        message: `Your package is packed! Driver ${order?.assignedDriverName || 'Driver'} will pick it up for delivery.`
      });
      loadDashboard();
    };

    const handleOrderPickedUp = (order) => {
      soundManager.playDutyStartChime();
      showToast(`🚚 Driver ${order?.assignedDriverName || 'Driver'} has picked up your parcel and is OUT FOR DELIVERY! Your delivery QR code is now active.`, 'success');
      addNotification({
        type: 'orders',
        title: '🚚 Order Out for Delivery',
        message: `Driver ${order?.assignedDriverName || 'Driver'} is on the way with your reward order! Show your delivery QR code to verify handover.`
      });
      loadDashboard();
    };

    const handleOrderDelivered = (order) => {
      soundManager.playPointsCreditedChime();
      showToast(`🎉 Order #${order?.customId || 'ORD'} Delivered Successfully! Handover verified by driver.`, 'success');
      addNotification({
        type: 'orders',
        title: '🎉 Order Delivered & Verified',
        message: `Your reward order #${order?.customId || 'ORD'} (${order?.rewardTitle || 'Gift'}) was handed over successfully.`
      });
      loadDashboard();
    };

    socket.on('order-accepted', handleOrderAccepted);
    socket.on('order-packed', handleOrderPacked);
    socket.on('order-picked-up', handleOrderPickedUp);
    socket.on('order-delivered', handleOrderDelivered);
    socket.on('order-status-updated', loadDashboard);

    // Silent background polling every 6s for live location and doorstep proximity on serverless deployments
    const pollInterval = setInterval(() => {
      loadDashboard(true);
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      socket.off('driver-location-update');
      socket.off('driver-duty-changed');
      socket.off('driver-area-assigned');
      socket.off('resident-driver-assigned', handleResidentDriverAssigned);
      socket.off('points-credited', handlePointsCredited);
      socket.off('order-refunded', handleOrderRefunded);
      socket.off('resident-points-updated');
      socket.off('reward-redeemed');
      socket.off('payment-updated');
      socket.off('complaint-created');
      socket.off('complaint-status-updated');
      socket.off('complaint-updated');
      socket.off('complaint-deleted');
      socket.off('emergency-created', loadDashboard);
      socket.off('emergency-assigned', handleEmergencyAssigned);
      socket.off('emergency-en-route', handleEmergencyEnRoute);
      socket.off('emergency-completed', handleEmergencyCompleted);
      socket.off('emergency-updated', loadDashboard);
      socket.off('emergency-deleted');
      socket.off('order-accepted', handleOrderAccepted);
      socket.off('order-packed', handleOrderPacked);
      socket.off('order-picked-up', handleOrderPickedUp);
      socket.off('order-delivered', handleOrderDelivered);
      socket.off('order-status-updated', loadDashboard);
    };
  }, []);

  const handleRedeemReward = async (rewardId, deliveryAddress, notes) => {
    try {
      const res = await fetch('/api/resident/redeem-points', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rewardId, deliveryAddress, notes })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Redemption failed');
      showToast(result.message || 'Reward gift claimed successfully!', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Redemption failed', 'error');
    }
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitEmergency({
        reason: emergencyReason,
        garbageType,
        estimatedQuantityKg: estimatedQuantity ? parseFloat(estimatedQuantity) : 10
      });
      showToast(res.message || 'Emergency pickup request dispatched!', 'success');
      loadDashboard();
    } catch (err) {
      showToast('Failed to log emergency pickup', 'error');
    }
  };

  const handleDeleteEmergency = async (emergencyId, customId) => {
    if (!window.confirm(`Are you sure you want to delete emergency request ${customId || 'record'}?`)) return;
    try {
      const res = await deleteEmergency(emergencyId);
      showToast(res.message || 'Emergency pickup request deleted successfully', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete emergency request', 'error');
    }
  };

  const handleResidentSubmitComplaint = async (payload) => {
    try {
      setIsSubmittingComplaint(true);
      const res = await submitComplaint(payload);
      const generatedTicket = res.ticketNumber || res.customId || res.complaint?.ticketNumber || res.complaint?.customId;
      showToast(res.message || `🎉 Complaint ticket ${generatedTicket || ''} generated successfully!`, 'success');
      loadDashboard();
      return res;
    } catch (err) {
      showToast(err.message || 'Failed to submit complaint', 'error');
      throw err;
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleDeleteComplaint = async (complaintId, ticketNo) => {
    if (!window.confirm(`Are you sure you want to delete ticket ${ticketNo || 'record'}?`)) return;
    try {
      const res = await deleteComplaint(complaintId);
      showToast(res.message || 'Complaint ticket deleted successfully', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete complaint ticket', 'error');
    }
  };

  const handleAIVisionScan = async (payload) => {
    try {
      setAiAnalyzing(true);
      const bodyData = (payload && typeof payload === 'object') ? payload : {
        imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600'
      };
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });
      const result = await res.json();
      if (result.success && result.analysis) {
        setAiAnalysisResult(result.analysis);
        showToast('AI Waste Detection Completed via Google Gemini!', 'success');
      } else {
        showToast(result.message || 'AI Analysis failed', 'error');
      }
    } catch (err) {
      showToast('AI Analysis request failed', 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleAISpotReport = async (payloadOrEvent) => {
    if (payloadOrEvent && payloadOrEvent.preventDefault) {
      payloadOrEvent.preventDefault();
    }
    const isPayload = payloadOrEvent && !payloadOrEvent.preventDefault && typeof payloadOrEvent === 'object';
    const bodyData = isPayload ? payloadOrEvent : {
      location: spotLocation || 'Main Sector Road',
      locationCoordinates: { lat: 28.6145, lng: 77.2095, address: spotLocation },
      images: [
        'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600'
      ],
      userNotes: spotNotes || ''
    };

    try {
      setSpotReporting(true);
      const res = await fetch('/api/ai/report-spot', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyData)
      });
      const result = await res.json();
      if (result.success) {
        setSpotReportResult(result);
        showToast('AI Spot Dump Report verified & emergency dispatch initiated!', 'success');
        loadDashboard();
      } else {
        showToast(result.message || 'Failed to log spot dump report', 'error');
      }
    } catch (err) {
      showToast('Failed to log spot dump report', 'error');
    } finally {
      setSpotReporting(false);
    }
  };

  const handleSendAIChat = async (e, customPrompt) => {
    if (e && e.preventDefault) e.preventDefault();
    const userMsg = (customPrompt || chatInput || '').trim();
    if (!userMsg) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessageObj = { sender: 'user', text: userMsg, timestamp: timeStr };
    const updatedMessages = [...chatMessages, userMessageObj];

    setChatMessages(updatedMessages);
    setChatInput('');
    setChatSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          message: userMsg,
          history: updatedMessages.slice(-8)
        })
      });
      const result = await res.json();
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: result.reply || 'Thank you for your inquiry.', 
          source: result.source || 'gemini',
          model: result.model,
          timestamp: result.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev, 
        { 
          sender: 'ai', 
          text: 'I could not connect to the AI service. Please verify your connection or check your API key in backend/.env.', 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setChatSending(false);
    }
  };

  const handleClearAIChat = () => {
    setChatMessages([
      { 
        sender: 'ai', 
        text: 'Hello! I am SWM&MS AI Assistant. Ask me anything about waste segregation, recycling rules, or truck schedules!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <ResidentLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      data={data} 
      toast={toast}
      proximityAlert={proximityAlert}
      onSilenceSiren={handleSilenceSiren}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={handleMarkAllNotificationsRead}
      onClearNotifications={handleClearNotifications}
      onNotificationClick={handleNotificationClick}
      theme={theme}
      setTheme={setTheme}
    >
      {activeTab === 'dashboard' && (
        <ResidentDashboardPage data={data} setActiveTab={setActiveTab} />
      )}

      {activeTab === 'tracking' && (
        <ResidentTrackingPage 
          data={data} 
          fetchDashboard={loadDashboard} 
          showToast={showToast} 
          setActiveTab={setActiveTab} 
        />
      )}

      {activeTab === 'ai-vision' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">AI Waste Image Analysis & Segregation</h2>
            <p className="text-xs text-slate-400 font-medium">Upload or scan a waste photo for automatic computer vision detection of recyclability, volume (kg), and segregation rules.</p>
          </div>
          <AIVisionScanner 
            onScan={handleAIVisionScan} 
            analyzing={aiAnalyzing} 
            result={aiAnalysisResult} 
          />
        </div>
      )}

      {activeTab === 'ai-spot' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">AI Multi-Angle Spot Dump Report</h2>
            <p className="text-xs text-slate-400 font-medium">Report roadside garbage dumps with 2+ photos and live GPS coordinates for instant AI verification and emergency dispatch.</p>
          </div>
          <AISpotReporter 
            spotLocation={spotLocation}
            setSpotLocation={setSpotLocation}
            spotNotes={spotNotes}
            setSpotNotes={setSpotNotes}
            onSubmit={handleAISpotReport}
            reporting={spotReporting}
            result={spotReportResult}
          />
        </div>
      )}

      {activeTab === 'ai-chat' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">AI Municipal Waste Assistant</h2>
            <p className="text-xs text-slate-400 font-medium">Ask questions regarding garbage segregation, e-waste pickup, composting tips, and truck schedules.</p>
          </div>
          <AIChatBox 
            messages={chatMessages}
            input={chatInput}
            setInput={setChatInput}
            sending={chatSending}
            onSend={handleSendAIChat}
            onClearChat={handleClearAIChat}
            onSelectPrompt={(text) => handleSendAIChat(null, text)}
          />
        </div>
      )}

      {activeTab === 'emergency' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Emergency Pickup Request</h2>
            <p className="text-xs text-slate-400 font-medium">Request immediate on-demand collection for event waste, hazardous materials, or overflow.</p>
          </div>
          <EmergencyRequestModal 
            reason={emergencyReason}
            setReason={setEmergencyReason}
            garbageType={garbageType}
            setGarbageType={setGarbageType}
            quantity={estimatedQuantity}
            setQuantity={setEstimatedQuantity}
            onSubmit={handleEmergencySubmit}
          />

          <ResidentEmergenciesList 
            emergencies={data?.emergencyRequests || []} 
            onTrackRoute={() => setActiveTab('tracking')} 
            onDelete={handleDeleteEmergency}
          />
        </div>
      )}

      {['billing', 'subscription_details', 'billing_invoices', 'billing_history'].includes(activeTab) && (
        <SubscriptionBillingPage 
          activeSubTab={
            activeTab === 'billing_invoices' ? 'billing' :
            activeTab === 'billing_history' ? 'history' : 'subscription'
          }
          onNavigateSubTab={(sub) => {
            if (sub === 'subscription') setActiveTab('subscription_details');
            else if (sub === 'billing') setActiveTab('billing_invoices');
            else if (sub === 'history') setActiveTab('billing_history');
          }}
          showToast={showToast} 
        />
      )}

      {['points-rewards', 'rewards', 'points-history', 'points_ledger', 'rewards_store', 'claimed_rewards'].includes(activeTab) && (
        <PointsAndRewardPage 
          points={data?.garbagePoints !== undefined ? data.garbagePoints : 380} 
          rewards={data?.availableRewards || []} 
          redemptions={data?.redemptions || []}
          residentAddress={data?.resident?.address || ''}
          onRedeem={handleRedeemReward} 
          onNavigateToBilling={() => setActiveTab('billing')}
          onNavigateToOrders={() => setActiveTab('orders_all')}
          showToast={showToast}
          initialSubTab={
            activeTab === 'rewards_store' || activeTab === 'rewards' ? 'catalog' :
            activeTab === 'claimed_rewards' ? 'orders' : 'history'
          }
          onNavigateSubTab={(sub) => {
            if (sub === 'catalog') setActiveTab('rewards_store');
            else if (sub === 'orders') setActiveTab('claimed_rewards');
            else if (sub === 'history') setActiveTab('points_ledger');
          }}
        />
      )}

      {['orders', 'orders_all', 'orders_status', 'orders_history', 'orders_refund'].includes(activeTab) && (
        <ResidentOrdersPage 
          activeSubTab={
            activeTab === 'orders_status' ? 'status' :
            activeTab === 'orders_history' ? 'history' :
            activeTab === 'orders_refund' ? 'refund' : 'orders'
          }
          onNavigateSubTab={(sub) => {
            if (sub === 'orders') setActiveTab('orders_all');
            else if (sub === 'status') setActiveTab('orders_status');
            else if (sub === 'history') setActiveTab('orders_history');
            else if (sub === 'refund') setActiveTab('orders_refund');
          }}
          showToast={showToast}
          onNavigateToComplaints={() => setActiveTab('complaints')}
        />
      )}

      {activeTab === 'complaints' && (
        <ResidentComplaintsPage
          complaints={data?.complaints || []}
          resident={data?.resident}
          onSubmitComplaint={handleResidentSubmitComplaint}
          onDeleteComplaint={handleDeleteComplaint}
          onRefresh={loadDashboard}
          showToast={showToast}
        />
      )}

      {activeTab === 'profile' && (
        <ResidentProfilePage
          resident={data?.resident}
          garbagePoints={data?.garbagePoints}
          onNavigateToBilling={() => setActiveTab('subscription_details')}
          onRefresh={loadDashboard}
          showToast={showToast}
        />
      )}
    </ResidentLayout>
  );
}
