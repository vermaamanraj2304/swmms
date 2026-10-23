import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  X, 
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Coins,
  History,
  FileText,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { socket } from '../../../services/socket';
import { soundManager } from '../../../utils/audioAlerts';

export default function ResidentOrdersPage({ 
  activeSubTab = 'orders', 
  onNavigateSubTab,
  showToast, 
  onNavigateToComplaints 
}) {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'orders'); // 'orders' | 'status' | 'history' | 'refund'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState({});
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Complaint / Refund Request Modal State
  const [selectedOrderForComplaint, setSelectedOrderForComplaint] = useState(null);
  const [complaintReason, setComplaintReason] = useState('Defective or Damaged Item');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Active QR Fullscreen modal
  const [activeQrModalOrder, setActiveQrModalOrder] = useState(null);

  // Sync prop changes
  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (t) => {
    setCurrentTab(t);
    setSearchTerm('');
    if (onNavigateSubTab) {
      onNavigateSubTab(t);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resident/orders', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        generateQRCodes(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching resident orders:', err);
      if (showToast) showToast('Failed to load your orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async (ordersList) => {
    const qrMap = {};
    for (const order of ordersList) {
      const payload = order.qrCode || order.redemptionCode || `TMT-DELV-${order.customId}`;
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF'
          }
        });
        qrMap[order._id] = url;
      } catch (err) {
        console.warn('QR generation error:', err);
      }
    }
    setQrImages(qrMap);
  };

  useEffect(() => {
    fetchOrders();

    const handleOrderSync = () => {
      fetchOrders();
    };

    socket.on('order-refunded', handleOrderSync);
    socket.on('order-status-updated', handleOrderSync);
    socket.on('redemption-status-updated', handleOrderSync);
    socket.on('order-accepted', handleOrderSync);
    socket.on('order-packed', handleOrderSync);
    socket.on('order-picked-up', handleOrderSync);
    socket.on('order-delivered', handleOrderSync);
    socket.on('complaint-status-updated', handleOrderSync);

    return () => {
      socket.off('order-refunded', handleOrderSync);
      socket.off('order-status-updated', handleOrderSync);
      socket.off('redemption-status-updated', handleOrderSync);
      socket.off('order-accepted', handleOrderSync);
      socket.off('order-packed', handleOrderSync);
      socket.off('order-picked-up', handleOrderSync);
      socket.off('order-delivered', handleOrderSync);
      socket.off('complaint-status-updated', handleOrderSync);
    };
  }, []);

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    if (showToast) showToast('Delivery code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleOpenComplaintModal = (order) => {
    setSelectedOrderForComplaint(order);
    setComplaintReason('Defective or Damaged Item');
    setComplaintDescription('');
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintDescription.trim()) {
      if (showToast) showToast('Please explain the issue or reason for refund', 'error');
      return;
    }

    try {
      setSubmittingComplaint(true);
      const res = await fetch('/api/resident/orders/complaint', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          orderId: selectedOrderForComplaint._id,
          reason: complaintReason,
          description: complaintDescription.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        if (showToast) showToast(data.message || 'Refund request / grievance submitted successfully!', 'success');
        setSelectedOrderForComplaint(null);
        fetchOrders();
      } else {
        if (showToast) showToast(data.message || 'Failed to submit refund request', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error submitting request', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const getStepProgress = (status = '') => {
    const st = status.toUpperCase();
    if (st === 'DELIVERED' || st === 'COMPLETED') return 4;
    if (st === 'OUT FOR DELIVERY' || st === 'DISPATCHED') return 3;
    if (st === 'PACKED') return 2;
    if (st === 'ACCEPTED') return 1;
    return 0; // ORDER PLACED or PROCESSING
  };

  // Categorize Orders
  const { activeOrders, inTransitOrders, historyOrders, refundOrders, totalRefundPoints, totalRefundInr } = useMemo(() => {
    const active = [];
    const inTransit = [];
    const history = [];
    const refund = [];
    let refPts = 0;
    let refInr = 0;

    orders.forEach((order) => {
      const st = (order.deliveryStatus || 'ORDER PLACED').toUpperCase();
      const isRef = Boolean(
        order.isRefunded || 
        order.deliveryStatus === 'REFUNDED' || 
        order.status === 'REFUNDED' || 
        order.complaintStatus?.toLowerCase().includes('refund') ||
        (order.refundedPoints && order.refundedPoints > 0)
      );

      if (isRef) {
        refund.push(order);
        const pts = order.refundedPoints || order.pointsRedeemed || 0;
        refPts += pts;
        refInr += (order.refundedAmountInr || Number((pts * 0.5).toFixed(2)));
      } else if (st === 'DELIVERED' || st === 'COMPLETED') {
        history.push(order);
      } else {
        // Active in processing
        active.push(order);
        if (st === 'OUT FOR DELIVERY' || st === 'PACKED') {
          inTransit.push(order);
        }
      }
    });

    return {
      activeOrders: active,
      inTransitOrders: inTransit,
      historyOrders: history,
      refundOrders: refund,
      totalRefundPoints: refPts,
      totalRefundInr: refInr.toFixed(2)
    };
  }, [orders]);

  // Filtered lists based on search
  const filteredActiveOrders = useMemo(() => {
    if (!searchTerm) return activeOrders;
    const q = searchTerm.toLowerCase();
    return activeOrders.filter(o => 
      (o.customId && o.customId.toLowerCase().includes(q)) ||
      (o.rewardTitle && o.rewardTitle.toLowerCase().includes(q)) ||
      (o.redemptionCode && o.redemptionCode.toLowerCase().includes(q))
    );
  }, [activeOrders, searchTerm]);

  const filteredStatusOrders = useMemo(() => {
    const pool = activeOrders.length > 0 ? activeOrders : orders;
    if (!searchTerm) return pool;
    const q = searchTerm.toLowerCase();
    return pool.filter(o => 
      (o.customId && o.customId.toLowerCase().includes(q)) ||
      (o.rewardTitle && o.rewardTitle.toLowerCase().includes(q)) ||
      (o.assignedDriverName && o.assignedDriverName.toLowerCase().includes(q))
    );
  }, [activeOrders, orders, searchTerm]);

  const filteredHistoryOrders = useMemo(() => {
    if (!searchTerm) return historyOrders;
    const q = searchTerm.toLowerCase();
    return historyOrders.filter(o => 
      (o.customId && o.customId.toLowerCase().includes(q)) ||
      (o.rewardTitle && o.rewardTitle.toLowerCase().includes(q)) ||
      (o.redemptionCode && o.redemptionCode.toLowerCase().includes(q))
    );
  }, [historyOrders, searchTerm]);

  const filteredRefundOrders = useMemo(() => {
    if (!searchTerm) return refundOrders;
    const q = searchTerm.toLowerCase();
    return refundOrders.filter(o => 
      (o.customId && o.customId.toLowerCase().includes(q)) ||
      (o.rewardTitle && o.rewardTitle.toLowerCase().includes(q)) ||
      (o.refundNotes && o.refundNotes.toLowerCase().includes(q)) ||
      (o.complaintStatus && o.complaintStatus.toLowerCase().includes(q))
    );
  }, [refundOrders, searchTerm]);

  // Order Card Renderer
  const renderOrderCard = (order, viewMode = 'default') => {
    const st = (order.deliveryStatus || 'ORDER PLACED').toUpperCase();
    const isRefunded = Boolean(
      order.isRefunded || 
      order.deliveryStatus === 'REFUNDED' || 
      order.status === 'REFUNDED' || 
      order.complaintStatus?.toLowerCase().includes('refund') ||
      (order.refundedPoints && order.refundedPoints > 0)
    );
    const refundPoints = order.refundedPoints || order.pointsRedeemed || 0;
    const refundInr = order.refundedAmountInr || Number((refundPoints * 0.5).toFixed(2));

    const stepIndex = isRefunded ? 5 : getStepProgress(st);
    const isDelivered = stepIndex >= 4;
    const isOutForDelivery = st === 'OUT FOR DELIVERY';
    const isPacked = st === 'PACKED';
    const isAccepted = st === 'ACCEPTED';
    const isPlaced = st === 'ORDER PLACED' || st === 'PROCESSING';

    const qrUrl = qrImages[order._id];
    const qrTextCode = order.qrCode || order.redemptionCode || `TMT-DELV-${order.customId}`;

    return (
      <div 
        key={order._id}
        className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition hover:border-slate-300 ${
          isRefunded ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80'
        }`}
      >
        {/* Top Card Info Bar */}
        <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isRefunded ? 'bg-amber-50/40 border-amber-200/70' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black bg-white text-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                {order.customId}
              </span>
              {order.isExchange && (
                <span className="font-mono text-xs font-black bg-purple-100 text-purple-900 px-2.5 py-1 rounded-xl border border-purple-300 flex items-center gap-1 shadow-2xs">
                  🔄 Exchange Replacement {order.originalOrderCustomId ? `(For #${order.originalOrderCustomId})` : ''}
                </span>
              )}
              {isRefunded && (
                <span className="font-mono text-xs font-black bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  💰 REFUNDED: +{refundPoints} PTS (₹{refundInr} Credited Back)
                </span>
              )}
              <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200">
                {order.redemptionCode}
              </span>
              <span className="text-xs text-slate-400">
                • Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
              </span>
            </div>

            <h3 className="text-lg font-black text-[#0F172A] tracking-tight pt-1">
              {order.rewardTitle}
            </h3>
            {order.size && (
              <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-[11px] font-mono font-bold text-slate-700 border border-slate-200">
                Size: {order.size}
              </span>
            )}
          </div>

          {/* Points & Status */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
            {isRefunded ? (
              <div className="text-right">
                <span className="text-xs line-through text-slate-400 font-mono block">
                  -{order.pointsRedeemed} PTS
                </span>
                <div className="text-lg font-black text-amber-800 font-mono flex items-center justify-end gap-1">
                  <span>+{refundPoints} PTS</span>
                  <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300">
                    Refunded
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 block">
                  ≈ ₹{refundInr} Credited to Wallet
                </span>
              </div>
            ) : order.isExchange ? (
              <div className="text-lg font-black text-purple-700 font-mono">
                0 <span className="text-xs font-bold text-slate-400">PTS (Free Exchange)</span>
              </div>
            ) : (
              <div className="text-lg font-black text-emerald-700 font-mono">
                -{order.pointsRedeemed} <span className="text-xs font-bold text-slate-400">PTS</span>
              </div>
            )}

            <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
              isRefunded
                ? 'bg-amber-100 text-amber-950 border border-amber-300 font-black'
                : isDelivered 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : isOutForDelivery 
                ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' 
                : isPacked
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : isAccepted
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {isRefunded && <RotateCcw className="w-3.5 h-3.5 text-amber-700" />}
              {!isRefunded && isDelivered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {!isRefunded && isOutForDelivery && <Truck className="w-3.5 h-3.5 text-blue-600" />}
              {!isRefunded && isPacked && <Package className="w-3.5 h-3.5 text-purple-600" />}
              {!isRefunded && isAccepted && <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {!isRefunded && isPlaced && <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>}
              {isRefunded ? 'REFUNDED TO WALLET' : st}
            </span>
          </div>
        </div>

        {/* Live Delivery Progress Stepper / Refund Milestone */}
        {isRefunded ? (
          <div className="p-4 px-6 border-b border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-emerald-50/40 to-amber-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 font-bold text-amber-950">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 border border-amber-300 flex items-center justify-center font-black shrink-0 shadow-2xs">
                ✓
              </div>
              <div>
                <div className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                  <span>Order Refund Processed & Points Credited</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600 text-white">
                    +{refundPoints} PTS (₹{refundInr})
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 font-normal">
                  {order.refundNotes || 'Municipal Admin approved points refund. Points have been credited back to your Eco-Points wallet.'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 uppercase tracking-wider self-start sm:self-auto">
              Settled & Closed
            </span>
          </div>
        ) : (
          <div className="p-6 border-b border-slate-100 bg-white">
            <div className="relative">
              <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-100 z-0" />
              <div 
                className="hidden sm:block absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500 z-0"
                style={{ width: `${(stepIndex / 4) * 88}%` }}
              />

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                {[
                  { title: 'Order Placed', desc: 'Points Deducted' },
                  { title: 'Accepted', desc: 'Approved by Admin' },
                  { title: 'Packed & Assigned', desc: 'Ready with Driver' },
                  { title: 'Out for Delivery', desc: 'Driver En Route' },
                  { title: 'Delivered', desc: 'Verified Handover' }
                ].map((step, idx) => {
                  const isDone = stepIndex >= idx;
                  const isCurrent = stepIndex === idx;

                  return (
                    <div key={step.title} className="flex sm:flex-col items-center gap-2 sm:text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isDone 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isCurrent ? 'text-emerald-700' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.title}
                        </div>
                        <div className="text-[10px] text-slate-400 hidden sm:block">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Handover Section & Driver Assignment Details */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Info: Delivery Address & Driver info */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Household</span>
                <div className="font-semibold text-slate-800 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress || 'Registered Address'}</span>
                </div>
                {order.sector && (
                  <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                    Sector: {order.sector}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Sector Driver</span>
                {order.assignedDriverName ? (
                  <div>
                    <strong className="text-slate-800 font-bold block">{order.assignedDriverName}</strong>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {order.assignedVehicle || 'Collection Truck'}
                    </span>
                    {order.assignedDriverPhone && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${order.assignedDriverPhone}`} className="hover:text-emerald-600 underline">
                          {order.assignedDriverPhone}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Assigning to sector driver...</span>
                )}
              </div>
            </div>

            {/* Complaint Notice or Refund Resolution Notice */}
            {isRefunded ? (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-2 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Refund Processed & Closed</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    +{refundPoints} PTS Recredited
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {order.refundNotes || `A full points refund of ${refundPoints} PTS (₹${refundInr}) was approved and credited back to your account balance.`}
                </p>
                {order.refundedAt && (
                  <span className="text-[10px] text-slate-500 block">
                    Refund Date: {new Date(order.refundedAt).toLocaleString()}
                  </span>
                )}
              </div>
            ) : order.hasComplaint ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <strong className="block">Active Complaint / Grievance Filed</strong>
                    <span className="text-[11px] text-rose-600">{order.complaintStatus || 'Admin is reviewing your issue'}</span>
                  </div>
                </div>
                {onNavigateToComplaints && (
                  <button
                    onClick={onNavigateToComplaints}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-[11px] hover:bg-rose-700 transition"
                  >
                    View Status
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenComplaintModal(order)}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 hover:underline transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Report Defect or Request Refund</span>
                </button>
              </div>
            )}
          </div>

          {/* Right / QR Code Display for Driver Handover */}
          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center space-y-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {isDelivered ? 'Handover Completed' : 'Contactless Verification'}
              </span>
              <p className="text-xs text-slate-500 pt-1">
                {isDelivered 
                  ? 'This order has been verified and delivered to your doorstep.' 
                  : 'Show this QR code to the driver upon delivery to confirm handover'}
              </p>
            </div>

            {qrUrl ? (
              <div 
                onClick={() => setActiveQrModalOrder(order)}
                className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:scale-105 transition transform group relative"
                title="Click to expand QR Code"
              >
                <img 
                  src={qrUrl} 
                  alt="Delivery QR Code" 
                  className={`w-36 h-36 object-contain ${isDelivered ? 'opacity-70 grayscale' : ''}`}
                />
                <span className="absolute inset-0 bg-slate-900/10 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-900 text-[10px] font-bold transition">
                  Enlarge QR
                </span>
              </div>
            ) : (
              <div className="w-36 h-36 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                <QrCode className="w-10 h-10 animate-pulse" />
              </div>
            )}

            <div className="w-full space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verification Code
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <code className="text-xs font-mono font-black text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200">
                  {qrTextCode}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyCode(qrTextCode)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                  title="Copy Code"
                >
                  {copiedCode === qrTextCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & KPI METRICS CARDS                     */}
      {/* ==================================================== */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-600" /> My Orders & Deliveries
            </span>
            <span className="text-xs text-slate-400">• Eco-Gifts & Handover Verification</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Eco-Gift Orders & Deliveries</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track claimed municipal eco-gifts, view live driver handover QR codes, verify completed deliveries, and manage order refunds.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs self-start md:self-auto cursor-pointer"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Orders */}
        <div 
          onClick={() => handleTabChange('orders')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'orders'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Orders</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeOrders.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">In Fulfillment</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Dispatched / Transit: <strong className="text-slate-800">{inTransitOrders.length}</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Order Status */}
        <div 
          onClick={() => handleTabChange('status')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'status'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Status</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{activeOrders.length > 0 ? activeOrders.length : orders.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">QR Telematics</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Handover ready: <strong className="text-blue-700">{activeOrders.length}</strong></span>
            <span className="text-blue-600 font-bold flex items-center gap-0.5">
              Track <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: History */}
        <div 
          onClick={() => handleTabChange('history')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered History</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{historyOrders.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Fulfilled</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>QR verified deliveries: <strong className="text-slate-800">{historyOrders.length}</strong></span>
            <span className="text-slate-700 font-bold flex items-center gap-0.5">
              Archive <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Refund & Refund History */}
        <div 
          onClick={() => handleTabChange('refund')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'refund'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Refunded Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">+{totalRefundPoints}</span>
            <span className="text-[11px] font-semibold text-slate-400">PTS Credited</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Refunds: <strong className="text-amber-800 font-bold">{refundOrders.length}</strong> (~₹{totalRefundInr})</span>
            <span className="text-amber-700 font-bold flex items-center gap-0.5">
              Ledger <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. SUB-SECTION TAB NAVIGATION BAR                    */}
      {/* ==================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Orders</span>
          {activeOrders.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'orders' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activeOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('status')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'status'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Order Status</span>
          {inTransitOrders.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'status' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}>
              {inTransitOrders.length} Live
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>History</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            currentTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {historyOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('refund')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'refund'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refund with Refund History</span>
          {refundOrders.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'refund' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {refundOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${
              currentTab === 'orders' ? 'active orders' :
              currentTab === 'status' ? 'delivery status' :
              currentTab === 'history' ? 'delivered history' : 'refunded orders'
            } by ID, item name, code...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. SECTION 1: ORDERS (Active orders queue)           */}
      {/* ==================================================== */}
      {currentTab === 'orders' && (
        <div className="space-y-4">
          {filteredActiveOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-3">
              <Package className="w-12 h-12 mx-auto text-slate-300 opacity-60" />
              <h3 className="font-bold text-base text-slate-700">No Active Reward Orders</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You currently have no reward gifts pending delivery. Explore the Eco-Rewards store to redeem compostable bags, bins, and home accessories!
              </p>
              {historyOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('history')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  View {historyOrders.length} Fulfilled Orders in History
                </button>
              )}
            </div>
          ) : (
            filteredActiveOrders.map(order => renderOrderCard(order, 'orders'))
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. SECTION 2: ORDER STATUS (Live Delivery Telematics) */}
      {/* ==================================================== */}
      {currentTab === 'status' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-blue-900 font-semibold">
              <Truck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Real-Time Delivery Status & Contactless QR Handover: Show your delivery code to the municipal driver.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
              Live Fleet Sync
            </span>
          </div>

          {filteredStatusOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-3">
              <Truck className="w-12 h-12 mx-auto text-slate-300 opacity-60" />
              <h3 className="font-bold text-base text-slate-700">No Orders in Transit</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active delivery orders found. Once an order is placed, you can monitor its step-by-step progress and scan handover QR codes here.
              </p>
            </div>
          ) : (
            filteredStatusOrders.map(order => renderOrderCard(order, 'status'))
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SECTION 3: HISTORY (Fulfilled Deliveries Archive)  */}
      {/* ==================================================== */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Archived Record of Fulfilled Deliveries: All successfully verified handovers to your household.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
              {historyOrders.length} Completed
            </span>
          </div>

          {filteredHistoryOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-3">
              <History className="w-12 h-12 mx-auto text-slate-300 opacity-60" />
              <h3 className="font-bold text-base text-slate-700">No Order History Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Fulfilled orders will appear here once the driver scans your QR code and completes delivery.
              </p>
            </div>
          ) : (
            filteredHistoryOrders.map(order => renderOrderCard(order, 'history'))
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. SECTION 4: REFUND WITH REFUND HISTORY              */}
      {/* ==================================================== */}
      {currentTab === 'refund' && (
        <div className="space-y-4">
          {/* Refund Summary Banner */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-amber-800/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-amber-400" /> Municipal Refund Ledger
                  </span>
                  <span className="text-xs text-amber-200/70">• 100% Points Protection</span>
                </div>
                <h3 className="text-xl font-black text-white">Refunded Orders & Points Re-Credit</h3>
                <p className="text-xs text-amber-100/80 max-w-xl">
                  If an item was reported damaged, defective, or out of stock, points are reversed directly back into your Eco-Points wallet with full rupee rebate parity.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 text-right">
                <span className="text-[10px] uppercase font-bold text-amber-200 block">Total Points Restored</span>
                <div className="text-2xl font-black font-mono text-white mt-0.5">
                  +{totalRefundPoints} <span className="text-xs text-amber-300">PTS</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 block">
                  ≈ ₹{totalRefundInr} Rupee Valuation
                </span>
              </div>
            </div>
          </div>

          {/* Refunded Orders List */}
          {filteredRefundOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80 shadow-xs space-y-3">
              <RotateCcw className="w-12 h-12 mx-auto text-amber-400/60" />
              <h3 className="font-bold text-base text-slate-700">No Refunded Orders</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You have no refunded or disputed orders on record. All your reward redemptions have been fulfilled smoothly.
              </p>
              {orders.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('orders')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    View All Orders
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredRefundOrders.map(order => renderOrderCard(order, 'refund'))
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SUBMIT COMPLAINT / REQUEST REFUND             */}
      {/* ==================================================== */}
      {selectedOrderForComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Request Refund or Report Issue</h3>
                  <p className="text-xs text-slate-400">Order #{selectedOrderForComplaint.customId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForComplaint(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <strong className="text-slate-800">{selectedOrderForComplaint.rewardTitle}</strong>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Points Redeemed:</span>
                  <strong className="text-emerald-700 font-mono">
                    {selectedOrderForComplaint.pointsRedeemed} PTS (≈ ₹{(selectedOrderForComplaint.pointsRedeemed * 0.5).toFixed(2)})
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nature of Problem / Grievance
                </label>
                <select
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="Defective or Damaged Item">Defective or Damaged Item (Request Points Refund)</option>
                  <option value="Wrong Item or Size Delivered">Wrong Item or Size Delivered (Exchange Request)</option>
                  <option value="Item Not Received But Marked Delivered">Item Not Received But Marked Delivered</option>
                  <option value="Delivery Delayed">Delivery Extremely Delayed</option>
                  <option value="Other Issue">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explain the Issue in Detail
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the issue with your item or delivery so our municipal staff can process your points refund or replacement."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForComplaint(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: FULLSCREEN QR HANDOVER PREVIEW                */}
      {/* ==================================================== */}
      {activeQrModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-xl">
                {activeQrModalOrder.customId}
              </span>
              <button 
                onClick={() => setActiveQrModalOrder(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#0F172A]">{activeQrModalOrder.rewardTitle}</h3>
              <p className="text-xs text-slate-400 font-mono">{activeQrModalOrder.size}</p>
            </div>

            {qrImages[activeQrModalOrder._id] && (
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-emerald-500 inline-block shadow-md">
                <img 
                  src={qrImages[activeQrModalOrder._id]} 
                  alt="Delivery QR" 
                  className="w-56 h-56 object-contain mx-auto"
                />
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Delivery Verification Code
              </span>
              <code className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                {activeQrModalOrder.qrCode || activeQrModalOrder.redemptionCode}
              </code>
            </div>

            <button
              onClick={() => setActiveQrModalOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
