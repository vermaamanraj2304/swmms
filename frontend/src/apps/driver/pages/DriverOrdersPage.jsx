import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  QrCode, 
  Search, 
  RefreshCw, 
  X, 
  Camera, 
  ShieldCheck, 
  Clock, 
  Check, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { soundManager } from '../../../utils/audioAlerts';

export default function DriverOrdersPage({ showToast, onRefreshDashboard }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pickup loading state
  const [pickingUpId, setPickingUpId] = useState(null);

  // QR Scanner Modal State
  const [scanningOrder, setScanningOrder] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const qrScannerRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/driver/orders', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching driver orders:', err);
      if (showToast) showToast('Failed to load assigned orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Step 1: Driver picks up packed parcel from depot
  const handlePickupOrder = async (orderId) => {
    try {
      setPickingUpId(orderId);
      const res = await fetch(`/api/driver/orders/${orderId}/pickup`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Parcel picked up! Out for delivery.', 'success');
        fetchOrders();
        if (onRefreshDashboard) onRefreshDashboard();
      } else {
        if (showToast) showToast(data.message || 'Failed to pick up order', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error picking up order', 'error');
    } finally {
      setPickingUpId(null);
    }
  };

  // Open Scanner Modal for specific order
  const handleOpenScanner = (order) => {
    setScanningOrder(order);
    setManualCode('');
    setCameraError(null);
    setCameraActive(false);
    // Auto-attempt starting camera once modal DOM mounts
    setTimeout(() => {
      startCamera();
    }, 250);
  };

  // Close scanner and cleanup camera (Instant, non-blocking)
  const handleCloseScanner = () => {
    const scanner = qrScannerRef.current;
    qrScannerRef.current = null;

    // 1. Immediately close modal so UI responds without delay
    setScanningOrder(null);
    setCameraActive(false);
    setCameraError(null);
    setManualCode('');

    // 2. Stop camera stream safely in the background
    if (scanner) {
      try {
        if (scanner.isScanning) {
          scanner.stop()
            .then(() => { try { scanner.clear(); } catch {} })
            .catch(() => { try { scanner.clear(); } catch {} });
        } else {
          try { scanner.clear(); } catch {}
        }
      } catch (e) {
        console.warn('Scanner stop warning:', e);
      }
    }
  };

  // Start Camera scanning using Html5Qrcode with multi-device fallback
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (qrScannerRef.current) {
        try {
          if (qrScannerRef.current.isScanning) {
            await qrScannerRef.current.stop();
          }
          qrScannerRef.current.clear();
        } catch {}
      }

      const container = document.getElementById('qr-reader-container');
      if (!container) return;

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      qrScannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      try {
        // Try environment (rear) camera first (ideal for mobile drivers)
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            handleVerifyDelivery(decodedText);
          },
          () => {}
        );
      } catch (backCameraErr) {
        console.warn('Back camera not found or failed, falling back to any available camera:', backCameraErr);
        // Fallback for laptops, webcams, or desktop testing
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cameras && cameras.length > 0) {
          await html5QrCode.start(
            cameras[0].id,
            config,
            (decodedText) => {
              handleVerifyDelivery(decodedText);
            },
            () => {}
          );
        } else {
          await html5QrCode.start(
            { facingMode: 'user' },
            config,
            (decodedText) => {
              handleVerifyDelivery(decodedText);
            },
            () => {}
          );
        }
      }

      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      let msg = 'Camera access not available or permission denied. Please use the manual code input below.';
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        msg = 'Camera permission denied. Please click the lock or camera icon in your browser URL bar and allow camera access.';
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        msg = 'No compatible camera found on this device. You can click "Auto Fill" below to verify.';
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  // Step 2: Verify Delivery via Scanned / Manual QR Code
  const handleVerifyDelivery = async (codeToVerify) => {
    const code = codeToVerify || manualCode;
    if (!code || !code.trim()) {
      if (showToast) showToast('Please scan QR or enter delivery code', 'error');
      return;
    }

    if (!scanningOrder) return;

    try {
      setVerifying(true);
      const res = await fetch(`/api/driver/orders/${scanningOrder._id}/deliver`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          scannedCode: code.trim(),
          qrCode: code.trim(),
          code: code.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        soundManager.playPointsCreditedChime();
        if (showToast) showToast(`🎉 ${data.message || 'Order Delivered Successfully! Handover verified.'}`, 'success');
        handleCloseScanner();
        fetchOrders();
        if (onRefreshDashboard) onRefreshDashboard();
      } else {
        if (showToast) showToast(data.message || 'QR Code verification failed', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error verifying delivery', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.stop();
          qrScannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      (o.customId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.redemptionCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.rewardTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.deliveryAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && o.deliveryStatus === filter;
  });

  const countPacked = orders.filter(o => o.deliveryStatus === 'PACKED').length;
  const countOutForDelivery = orders.filter(o => o.deliveryStatus === 'OUT FOR DELIVERY').length;
  const countDelivered = orders.filter(o => o.deliveryStatus === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
              <Package className="w-3 h-3 text-purple-600" /> Municipal Reward Deliveries
            </span>
            <span className="text-xs text-slate-400">• Sector Assigned Hub</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Assigned Reward Orders & Deliveries</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pick up packed parcels (garbage bag rolls, bins, vouchers) from depot, deliver to households, and scan resident QR codes to verify handover.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs self-start md:self-auto"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Awaiting Pickup</span>
            <div className="text-2xl font-black text-purple-700 font-mono">{countPacked}</div>
            <span className="text-[11px] text-purple-600 font-semibold">Ready at Depot</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Out for Delivery</span>
            <div className="text-2xl font-black text-blue-700 font-mono">{countOutForDelivery}</div>
            <span className="text-[11px] text-blue-600 font-semibold">In Truck with You</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Delivered Today</span>
            <div className="text-2xl font-black text-emerald-700 font-mono">{countDelivered}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">QR Verified</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID, Resident Name, or Address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PACKED', label: 'Ready to Pickup', badge: countPacked },
            { id: 'OUT FOR DELIVERY', label: 'Out for Delivery', badge: countOutForDelivery },
            { id: 'DELIVERED', label: 'Delivered' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500 text-white font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
            <h4 className="font-bold text-sm text-slate-700">No Orders in this Section</h4>
            <p className="text-xs text-slate-400">
              When the municipal administrator assigns reward orders in your service sector, they will appear here.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const st = (order.deliveryStatus || 'PACKED').toUpperCase();
            const isPacked = st === 'PACKED';
            const isOutForDelivery = st === 'OUT FOR DELIVERY';
            const isDelivered = st === 'DELIVERED';

            return (
              <div 
                key={order._id}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {order.customId}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {order.redemptionCode}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isDelivered 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isOutForDelivery 
                          ? 'bg-blue-100 text-blue-800 animate-pulse' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {st}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#0F172A] pt-1">
                      {order.rewardTitle}
                    </h3>
                    {order.size && (
                      <div className="text-xs font-mono font-semibold text-slate-500">
                        Specification: {order.size}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isPacked && (
                      <button
                        onClick={() => handlePickupOrder(order._id)}
                        disabled={pickingUpId === order._id}
                        className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-2"
                      >
                        {pickingUpId === order._id ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                        Pickup from Depot
                      </button>
                    )}

                    {isOutForDelivery && (
                      <button
                        onClick={() => handleOpenScanner(order)}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        Scan Resident Delivery QR
                      </button>
                    )}

                    {isDelivered && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Handover Complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Resident & Address Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resident</span>
                    <strong className="text-slate-800 font-semibold">{order.residentName}</strong>
                    {order.residentPhone && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${order.residentPhone}`} className="hover:text-emerald-600 underline">
                          {order.residentPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Address</span>
                    <div className="text-slate-800 font-medium flex items-start gap-1 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress || 'Registered Address'}</span>
                    </div>
                    {order.sector && (
                      <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-1">
                        Sector: {order.sector}
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 space-y-0.5 sm:col-span-2 md:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Points Deducted</span>
                    <div className="text-emerald-700 font-mono font-black text-sm">
                      -{order.pointsRedeemed} PTS
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Ordered: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>

                {order.hasComplaint && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Resident Filed a Complaint:</strong>
                      <p className="text-rose-700 italic">"{order.complaintText}"</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* SCANNER MODAL (Camera + Manual Fallback)                 */}
      {/* ======================================================== */}
      {scanningOrder && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseScanner();
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Scan Resident QR Code</h3>
                  <p className="text-xs text-slate-400">Order #{scanningOrder.customId}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseScanner}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Brief */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <strong className="text-slate-800">{scanningOrder.residentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <strong className="text-slate-800">{scanningOrder.rewardTitle} ({scanningOrder.size})</strong>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500">Expected Delivery Code:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-emerald-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {scanningOrder.redemptionCode}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setManualCode(scanningOrder.redemptionCode || '')}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-2xs"
                    title="Copy to code input"
                  >
                    Auto Fill
                  </button>
                </div>
              </div>
            </div>

            {/* Camera Viewport */}
            <div className="space-y-3">
              <div 
                id="qr-reader-container" 
                className="w-full bg-slate-950 rounded-2xl overflow-hidden min-h-[200px] flex items-center justify-center border border-slate-800"
              >
                {!cameraActive && (
                  <div className="p-6 text-center text-slate-400 space-y-3">
                    <Camera className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                    <p className="text-xs">Camera is currently paused or inactive</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs"
                    >
                      Start Camera Scanner
                    </button>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  {cameraError}
                </div>
              )}
            </div>

            {/* Manual Code Input Option */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700">
                  Or Type Resident Delivery Code:
                </label>
                {scanningOrder.redemptionCode && (
                  <button
                    type="button"
                    onClick={() => setManualCode(scanningOrder.redemptionCode)}
                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                  >
                    Fill "{scanningOrder.redemptionCode}"
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TMT-TRA-118359 or RED-7229"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-emerald-500 uppercase font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyDelivery(manualCode)}
                  disabled={verifying || !manualCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  {verifying ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Verify Delivery
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCloseScanner}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
