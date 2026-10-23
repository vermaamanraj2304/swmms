import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  X, 
  Sparkles, 
  ShieldCheck, 
  CreditCard,
  MapPin,
  ExternalLink,
  UserCheck,
  AlertTriangle,
  QrCode,
  Check,
  Send,
  Phone,
  Layers,
  Coins,
  Sliders,
  Percent,
  Save,
  RotateCcw,
  Scale,
  IndianRupee,
  History
} from 'lucide-react';

export default function AdminRewardsManagementPage({ activeSubTab = 'catalog', onNavigateSubTab, showToast }) {
  const [activeTab, setActiveTab] = useState(activeSubTab || 'catalog');

  useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    setSearchTerm('');
    if (onNavigateSubTab) onNavigateSubTab(t);
  };

  const [data, setData] = useState({
    gifts: [],
    redemptions: [],
    drivers: [],
    pointRules: null,
    stats: {
      totalGifts: 0,
      activeGifts: 0,
      totalRedemptions: 0,
      pendingDeliveries: 0,
      totalPointsRedeemed: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Point rules state
  const defaultPointRules = {
    pointValueInr: 0.50,
    pointsPerRupee: 2,
    ratesPerKg: {
      Recyclable: 15,
      Organic: 10,
      'E-Waste': 50,
      Hazardous: 30,
      'General Waste': 5
    },
    minRedemptionPoints: 50,
    maxBillDiscountPercent: 50,
    bonusMultiplier: 1.0
  };

  const [pointRules, setPointRules] = useState(defaultPointRules);
  const [savingRules, setSavingRules] = useState(false);
  const [simWeight, setSimWeight] = useState({
    Recyclable: 5,
    Organic: 5,
    'E-Waste': 1
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState('ALL');
  const [historyFilter, setHistoryFilter] = useState('ALL');

  // Gift Modal State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pack & Assign Modal State
  const [selectedOrderForPack, setSelectedOrderForPack] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [packingLoading, setPackingLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const initialGiftForm = {
    title: '',
    category: 'Garbage Bags',
    size: 'Medium (30L / 25 Bags)',
    pointsRequired: 90,
    stock: 100,
    description: '',
    badge: 'Popular',
    color: 'emerald'
  };

  const [giftForm, setGiftForm] = useState(initialGiftForm);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/rewards');
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.pointRules) {
          setPointRules({
            pointValueInr: json.pointRules.pointValueInr ?? 0.50,
            pointsPerRupee: json.pointRules.pointsPerRupee ?? 2,
            ratesPerKg: {
              Recyclable: json.pointRules.ratesPerKg?.Recyclable ?? 15,
              Organic: json.pointRules.ratesPerKg?.Organic ?? 10,
              'E-Waste': json.pointRules.ratesPerKg?.['E-Waste'] ?? 50,
              Hazardous: json.pointRules.ratesPerKg?.Hazardous ?? 30,
              'General Waste': json.pointRules.ratesPerKg?.['General Waste'] ?? 5
            },
            minRedemptionPoints: json.pointRules.minRedemptionPoints ?? 50,
            maxBillDiscountPercent: json.pointRules.maxBillDiscountPercent ?? 50,
            bonusMultiplier: json.pointRules.bonusMultiplier ?? 1.0
          });
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to load rewards data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePointRules = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingRules(true);
      const res = await fetch('/api/admin/rewards/point-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pointRules)
      });
      const json = await res.json();
      if (res.ok) {
        if (showToast) showToast(json.message || 'Point values and waste rates saved successfully!', 'success');
        if (json.pointRules) setPointRules(json.pointRules);
      } else {
        if (showToast) showToast(json.message || 'Failed to update point rules', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Error connecting to points configuration service', 'error');
    } finally {
      setSavingRules(false);
    }
  };

  const handleUpdateStockDelta = async (giftId, delta) => {
    const gift = data.gifts.find(g => g._id === giftId);
    if (!gift) return;
    const newStock = Math.max(0, (gift.stock || 0) + delta);
    try {
      const res = await fetch(`/api/admin/rewards/gifts/${giftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        setData(prev => ({
          ...prev,
          gifts: prev.gifts.map(g => g._id === giftId ? { ...g, stock: newStock } : g)
        }));
        if (showToast) showToast(`Stock for ${gift.title} set to ${newStock} units`, 'success');
      }
    } catch (e) {
      if (showToast) showToast('Failed to adjust stock', 'error');
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleOpenAdd = () => {
    setEditingGiftId(null);
    setGiftForm(initialGiftForm);
    setShowGiftModal(true);
  };

  const handleOpenEdit = (gift) => {
    setEditingGiftId(gift._id);
    setGiftForm({
      title: gift.title,
      category: gift.category,
      size: gift.size || 'Standard',
      pointsRequired: gift.pointsRequired,
      stock: gift.stock || 100,
      description: gift.description || '',
      badge: gift.badge || '',
      color: gift.color || 'emerald'
    });
    setShowGiftModal(true);
  };

  const handleSaveGift = async (e) => {
    e.preventDefault();
    if (!giftForm.title.trim() || !giftForm.pointsRequired) {
      if (showToast) showToast('Title and points are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingGiftId ? `/api/admin/rewards/gifts/${editingGiftId}` : '/api/admin/rewards/gifts';
      const method = editingGiftId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(giftForm)
      });
      const resData = await res.json();

      if (res.ok) {
        if (showToast) showToast(resData.message || 'Gift saved successfully!', 'success');
        setShowGiftModal(false);
        fetchRewards();
      } else {
        if (showToast) showToast(resData.message || 'Error saving gift', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Failed to save gift', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGift = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the gift catalog?`)) return;

    try {
      const res = await fetch(`/api/admin/rewards/gifts/${id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (res.ok) {
        if (showToast) showToast(resData.message || 'Gift deleted', 'success');
        fetchRewards();
      } else {
        if (showToast) showToast(resData.message || 'Failed to delete gift', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error deleting gift', 'error');
    }
  };

  // Step 1: Admin accepts order
  const handleAcceptOrder = async (orderId) => {
    try {
      setAcceptingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resData = await res.json();
      if (res.ok) {
        if (showToast) showToast(resData.message || 'Order accepted! Now ready to pack.', 'success');
        fetchRewards();
      } else {
        if (showToast) showToast(resData.message || 'Failed to accept order', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error accepting order', 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  // Open modal for Pack & Assign Driver
  const handleOpenPackModal = (order) => {
    setSelectedOrderForPack(order);
    // Find driver matching sector
    const orderSector = (order.sector || '').toLowerCase();
    const matchingDriver = (data.drivers || []).find(d => 
      (d.activeSector || '').toLowerCase().includes(orderSector) ||
      orderSector.includes((d.activeSector || '').toLowerCase())
    );
    setSelectedDriverId(matchingDriver?._id || data.drivers?.[0]?._id || '');
  };

  // Step 2: Admin packs and assigns driver
  const handleConfirmPackAndAssign = async (e) => {
    e.preventDefault();
    if (!selectedOrderForPack || !selectedDriverId) {
      if (showToast) showToast('Please select an active driver for delivery assignment', 'error');
      return;
    }

    try {
      setPackingLoading(true);
      const res = await fetch(`/api/admin/orders/${selectedOrderForPack._id}/pack-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selectedDriverId })
      });
      const resData = await res.json();
      if (res.ok) {
        if (showToast) showToast(resData.message || 'Order packed and assigned to driver!', 'success');
        setSelectedOrderForPack(null);
        fetchRewards();
      } else {
        if (showToast) showToast(resData.message || 'Failed to pack and assign order', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error assigning order', 'error');
    } finally {
      setPackingLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (redemptionId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/rewards/redemptions/${redemptionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: newStatus })
      });
      const resData = await res.json();
      if (res.ok) {
        if (showToast) showToast(`Delivery status updated to ${newStatus}`, 'success');
        fetchRewards();
      } else {
        if (showToast) showToast(resData.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Network error updating status', 'error');
    }
  };

  // Filtered gifts
  const filteredGifts = (data.gifts || []).filter(g => {
    const matchesSearch = (g.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.size || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Active Orders (Claim orders currently in progress or awaiting fulfillment)
  const activeOrders = (data.redemptions || []).filter(r => 
    r.deliveryStatus !== 'DELIVERED' && 
    r.deliveryStatus !== 'COMPLETED'
  );

  const filteredActiveOrders = activeOrders.filter(r => {
    const matchesSearch = 
      (r.customId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.redemptionCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.rewardTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.assignedDriverName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (deliveryFilter === 'ALL') return matchesSearch;
    if (deliveryFilter === 'PENDING_ACTION') {
      return matchesSearch && ['ORDER PLACED', 'ACCEPTED', 'PROCESSING'].includes(r.deliveryStatus);
    }
    return matchesSearch && r.deliveryStatus === deliveryFilter;
  });

  // Historical / Completed / Delivered Orders
  const historyOrders = (data.redemptions || []).filter(r => 
    r.deliveryStatus === 'DELIVERED' || 
    r.deliveryStatus === 'COMPLETED' || 
    r.deliveryStatus === 'CANCELLED' ||
    r.deliveryStatus === 'REFUNDED'
  );

  const filteredHistoryOrders = historyOrders.filter(r => {
    const matchesSearch = 
      (r.customId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.redemptionCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.rewardTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.assignedDriverName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (historyFilter === 'ALL') return matchesSearch;
    return matchesSearch && r.deliveryStatus === historyFilter;
  });

  // All redemptions filtered (fallback)
  const filteredRedemptions = filteredActiveOrders;

  const countPendingAction = (data.redemptions || []).filter(r => 
    ['ORDER PLACED', 'ACCEPTED', 'PROCESSING'].includes(r.deliveryStatus)
  ).length;

  const countPacked = (data.redemptions || []).filter(r => r.deliveryStatus === 'PACKED').length;
  const countOutForDelivery = (data.redemptions || []).filter(r => r.deliveryStatus === 'OUT FOR DELIVERY').length;
  const countDelivered = (data.redemptions || []).filter(r => r.deliveryStatus === 'DELIVERED').length;
  const countComplaints = (data.redemptions || []).filter(r => r.hasComplaint).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Municipal Rewards Fulfillment & Inventory
            </span>
            <span className="text-xs text-slate-400">• Eco-Points Store</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Rewards & Points Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept resident redemption orders, pack & assign sector drivers, monitor live deliveries, and manage the municipal gifts catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchRewards}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-xs"
            title="Refresh Rewards"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00B074] hover:bg-[#009e67] text-white font-bold text-xs transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add New Gift / Reward
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Fulfillment</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700 font-mono">{countPendingAction}</div>
            <span className="text-[11px] text-amber-600 font-semibold">Orders to Accept / Pack</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In-Transit Deliveries</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700 font-mono">{countOutForDelivery + countPacked}</div>
            <span className="text-[11px] text-blue-600 font-semibold">{countPacked} Packed • {countOutForDelivery} Out for Delivery</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivered & Verified</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 font-mono">{countDelivered}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Completed Handover</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points Redeemed</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-700 font-mono">
              {data.stats.totalPointsRedeemed.toLocaleString()} <span className="text-xs font-bold">PTS</span>
            </div>
            <span className="text-[11px] text-purple-600 font-semibold">
              ≈ ₹{(data.stats.totalPointsRedeemed * 0.5).toFixed(2)} Municipal Value
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Reward Gift Catalog & Stock</span>
          <span className="text-[11px] text-slate-400 font-mono">({data.gifts?.length || 0})</span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Resident Orders</span>
          {countPendingAction > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
              {countPendingAction} Action
            </span>
          )}
          {countComplaints > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> {countComplaints}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Order History</span>
          <span className="text-[11px] text-slate-400 font-mono">({historyOrders.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('points_config')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'points_config'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Point Value Change</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: RESIDENT ORDERS & FULFILLMENT                     */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Resident Claim Orders Ledger</h3>
              <p className="text-xs text-slate-400">
                Workflow: <strong>Accept Order</strong> ➔ <strong>Pack & Assign Driver</strong> ➔ Driver Picks Up (Out for Delivery) ➔ Driver Scans Resident QR (Delivered).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {[
                { id: 'ALL', label: 'All Active Orders' },
                { id: 'PENDING_ACTION', label: 'Action Required', badge: countPendingAction },
                { id: 'ORDER PLACED', label: 'Order Placed' },
                { id: 'ACCEPTED', label: 'Accepted' },
                { id: 'PACKED', label: 'Packed' },
                { id: 'OUT FOR DELIVERY', label: 'Out for Delivery' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setDeliveryFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    deliveryFilter === st.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-amber-950 font-black">
                      {st.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Resident, Sector, Item or Driver..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-emerald-500 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order / Claim #</th>
                  <th className="py-3 px-4">Resident & Sector Address</th>
                  <th className="py-3 px-4">Claimed Item & Size</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActiveOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No active pending orders requiring fulfillment. All resident orders are fulfilled! Check Order History.
                    </td>
                  </tr>
                ) : (
                  filteredActiveOrders.map(red => {
                    const st = (red.deliveryStatus || 'ORDER PLACED').toUpperCase();
                    const isPlaced = st === 'ORDER PLACED' || st === 'PROCESSING';
                    const isAccepted = st === 'ACCEPTED';
                    const isPacked = st === 'PACKED';
                    const isOutForDelivery = st === 'OUT FOR DELIVERY' || st === 'DISPATCHED';
                    const isDelivered = st === 'DELIVERED' || st === 'COMPLETED';

                    return (
                      <tr key={red._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{red.customId || 'RED-ORD'}</span>
                            {red.isExchange && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-0.5">
                                🔄 Exchange
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                            {red.redemptionCode}
                          </div>
                          {red.originalOrderCustomId && (
                            <div className="text-[10px] text-purple-700 font-mono font-medium">
                              Orig: #{red.originalOrderCustomId}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {red.createdAt ? new Date(red.createdAt).toLocaleDateString() : 'Today'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A]">{red.residentName}</div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{red.sector || 'Sector Area'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {red.deliveryAddress || 'Registered Address'}
                          </div>
                          {red.residentPhone && (
                            <div className="text-[10px] text-slate-400">
                              Tel: {red.residentPhone}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{red.rewardTitle}</div>
                          {red.size && (
                            <span className="inline-block px-2 py-0.5 mt-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                              {red.size}
                            </span>
                          )}
                          {red.hasComplaint && (
                            <div className="mt-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10px] space-y-0.5">
                              <div className="font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Order Complaint Filed:
                              </div>
                              <p className="italic text-rose-700 font-medium">"{red.complaintText}"</p>
                              <div className="font-semibold text-[9px] text-rose-600">
                                Status: {red.complaintStatus || 'Under Review'}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-emerald-700">
                          {red.isExchange ? (
                            <span className="text-purple-700 text-xs font-bold block">0 PTS (Replacement)</span>
                          ) : (
                            `-${red.pointsRedeemed} PTS`
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {red.assignedDriverName ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-blue-600" />
                                {red.assignedDriverName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {red.assignedVehicle || 'Assigned Truck'}
                              </div>
                              {red.assignedDriverPhone && (
                                <div className="text-[10px] text-slate-400">
                                  {red.assignedDriverPhone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Not Assigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isOutForDelivery
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                              : isPacked
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isAccepted
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {isOutForDelivery && <Truck className="w-3 h-3 text-blue-600" />}
                            {isPacked && <Package className="w-3 h-3 text-purple-600" />}
                            {isAccepted && <Clock className="w-3 h-3 text-amber-600" />}
                            {isPlaced && <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>}
                            {st}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPlaced && (
                              <button
                                onClick={() => handleAcceptOrder(red._id)}
                                disabled={acceptingId === red._id}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                              >
                                {acceptingId === red._id ? (
                                  <Clock className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Accept Order
                              </button>
                            )}

                            {isAccepted && (
                              <button
                                onClick={() => handleOpenPackModal(red)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Pack & Assign Driver
                              </button>
                            )}

                            {isPacked && (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
                                Ready for Driver Pickup
                              </span>
                            )}

                            {isOutForDelivery && (
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Driver En Route
                              </span>
                            )}

                            {isDelivered && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Handed Over
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ORDER HISTORY & ARCHIVE                           */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">Resident Claim Order History & Archive</h3>
              <p className="text-xs text-slate-400">
                Completed distributions, successfully scanned QR handovers, and resolved or refunded claim records.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {[
                { id: 'ALL', label: 'All History' },
                { id: 'DELIVERED', label: 'Delivered' },
                { id: 'CANCELLED', label: 'Cancelled' },
                { id: 'REFUNDED', label: 'Refunded' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setHistoryFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    historyFilter === st.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Resident, Item, or Driver..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-emerald-500 transition"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Resident & Sector</th>
                  <th className="py-3 px-4">Claimed Item</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Delivery Driver</th>
                  <th className="py-3 px-4">Handover Verification</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistoryOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No historical orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredHistoryOrders.map(order => (
                    <tr key={order._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {order.customId || 'ORD-000'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{order.residentName || 'Resident'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{order.deliveryAddress || order.sector || 'Greater Noida'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{order.rewardTitle}</div>
                        <div className="text-[11px] text-slate-400">{order.rewardSize || order.size || 'Standard'}</div>
                        {order.hasComplaint && !order.isRefunded && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-1">
                            <span>⚠️ Complaint: {order.complaintStatus || 'Under Review'}</span>
                          </div>
                        )}
                        {order.isRefunded && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-1">
                            <span>💰 Refund Approved: +{order.refundedPoints || order.pointsRedeemed} PTS</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {order.pointsRedeemed} PTS
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          <span>{order.assignedDriverName || 'Designated Driver'}</span>
                        </div>
                        {order.assignedVehicle && (
                          <div className="text-[10px] text-slate-400 font-mono">{order.assignedVehicle}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>QR Verified ({order.redemptionCode || 'OK'})</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          order.deliveryStatus === 'CANCELLED' || order.deliveryStatus === 'REFUNDED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {order.deliveryStatus || 'DELIVERED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: POINT VALUE CHANGE & WASTE RATES CONFIGURATION    */}
      {/* ======================================================== */}
      {activeTab === 'points_config' && (
        <form onSubmit={handleSavePointRules} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-600" /> Point Valuation & Conversion Rules
                </span>
                <span className="text-xs text-slate-400">• Municipal Standards</span>
              </div>
              <h2 className="text-xl font-black text-[#0F172A] tracking-tight">Point Value Change & Weight Rates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set how much 1 Garbage Point is worth in Rupees, and configure the points awarded to residents per KG of segregated waste collected.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPointRules(defaultPointRules)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="submit"
                disabled={savingRules}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingRules ? 'Saving Changes...' : 'Save & Apply Point Rules'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section A: Point Valuation in INR */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">Garbage Point Monetary Value (₹)</h3>
                  <p className="text-[11px] text-slate-400">Conversion value when residents redeem points for bill discounts.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Point Value in Rupees (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      max="10"
                      value={pointRules.pointValueInr}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setPointRules({
                          ...pointRules,
                          pointValueInr: val,
                          pointsPerRupee: val > 0 ? Number((1 / val).toFixed(2)) : pointRules.pointsPerRupee
                        });
                      }}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold text-slate-900 focus:outline-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    1 Garbage Point = <strong>₹{pointRules.pointValueInr.toFixed(2)}</strong> (e.g. 100 PTS = ₹{(100 * pointRules.pointValueInr).toFixed(2)})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Points Needed for ₹1 Discount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={pointRules.pointsPerRupee}
                      onChange={e => {
                        const pts = parseFloat(e.target.value) || 0;
                        setPointRules({
                          ...pointRules,
                          pointsPerRupee: pts,
                          pointValueInr: pts > 0 ? Number((1 / pts).toFixed(2)) : pointRules.pointValueInr
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold text-slate-900 focus:outline-emerald-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Resident must redeem <strong>{pointRules.pointsPerRupee} PTS</strong> to get ₹1 discount
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Minimum Points to Redeem</label>
                  <input
                    type="number"
                    min="0"
                    value={pointRules.minRedemptionPoints}
                    onChange={e => setPointRules({ ...pointRules, minRedemptionPoints: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">Minimum account balance before resident can redeem</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Max Bill Discount Cap (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={pointRules.maxBillDiscountPercent}
                      onChange={e => setPointRules({ ...pointRules, maxBillDiscountPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold font-mono"
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Maximum bill portion that can be paid using points</span>
                </div>
              </div>
            </div>

            {/* Section B: Points per KG by Waste Type */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F172A]">Points Awarded per KG</h3>
                  <p className="text-[11px] text-slate-400">Waste-to-points reward formula applied on daily driver pickup weigh-ins.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'Recyclable', label: 'Recyclable Waste', desc: 'Plastic bottles, aluminum cans, clean paper & cardboard', color: 'emerald' },
                  { key: 'Organic', label: 'Organic / Wet Waste', desc: 'Food scraps, kitchen vegetable waste, horticultural compostables', color: 'teal' },
                  { key: 'E-Waste', label: 'E-Waste', desc: 'Smartphones, cables, circuit boards, batteries, appliances', color: 'blue' },
                  { key: 'Hazardous', label: 'Hazardous Waste', desc: 'Paints, chemical bottles, lamps, aerosol cans, biomedical items', color: 'amber' },
                  { key: 'General Waste', label: 'General / Mixed Waste', desc: 'Non-recyclable residue, mixed inert curbside trash', color: 'slate' }
                ].map(item => (
                  <div key={item.key} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0F172A]">{item.label}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200/60 text-slate-600 font-bold font-mono">
                          per KG
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={pointRules.ratesPerKg?.[item.key] ?? 10}
                        onChange={e => {
                          const val = Number(e.target.value) || 0;
                          setPointRules({
                            ...pointRules,
                            ratesPerKg: {
                              ...pointRules.ratesPerKg,
                              [item.key]: val
                            }
                          });
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 text-right focus:outline-emerald-500"
                      />
                      <span className="text-[11px] font-bold text-slate-500">PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section C: Live Impact Simulator */}
          <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 p-6 rounded-3xl border border-emerald-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-sm text-[#0F172A]">Live Points Yield & Monetary Value Simulator</h4>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Test how resident waste deposits will translate into rewards under the current configuration:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Recyclable (KG)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simWeight.Recyclable}
                  onChange={e => setSimWeight({ ...simWeight, Recyclable: Number(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold font-mono"
                />
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Organic (KG)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simWeight.Organic}
                  onChange={e => setSimWeight({ ...simWeight, Organic: Number(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold font-mono"
                />
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">E-Waste (KG)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simWeight['E-Waste']}
                  onChange={e => setSimWeight({ ...simWeight, 'E-Waste': Number(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold font-mono"
                />
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Estimated Resident Reward</span>
                <div className="text-xl font-extrabold font-mono text-white">
                  {Math.round(
                    (simWeight.Recyclable * (pointRules.ratesPerKg?.Recyclable || 15) +
                     simWeight.Organic * (pointRules.ratesPerKg?.Organic || 10) +
                     simWeight['E-Waste'] * (pointRules.ratesPerKg?.['E-Waste'] || 50)) *
                    (pointRules.bonusMultiplier || 1.0)
                  )} <span className="text-xs font-semibold text-slate-300">PTS</span>
                </div>
                <div className="text-[11px] text-emerald-300 font-bold">
                  ≈ ₹{(
                    Math.round(
                      (simWeight.Recyclable * (pointRules.ratesPerKg?.Recyclable || 15) +
                       simWeight.Organic * (pointRules.ratesPerKg?.Organic || 10) +
                       simWeight['E-Waste'] * (pointRules.ratesPerKg?.['E-Waste'] || 50)) *
                      (pointRules.bonusMultiplier || 1.0)
                    ) * pointRules.pointValueInr
                  ).toFixed(2)} Bill Discount
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 4: REWARD CATALOG & STOCK MANAGEMENT                 */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          {/* Table Filters */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Gift Name, Size (10L, 30L, 120L...), or Category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-emerald-500 transition"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs">
              {['ALL', 'Garbage Bags', 'Trash Bins', 'Eco Tools & Accessories', 'Bill Discount & Vouchers'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] ${
                    categoryFilter === cat
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? 'All Gifts' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Item #</th>
                  <th className="py-3 px-4">Gift Title & Category</th>
                  <th className="py-3 px-4">Size / Capacity Specification</th>
                  <th className="py-3 px-4">Points Required</th>
                  <th className="py-3 px-4">Stock Inventory</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGifts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      No gifts found matching your filters. Click "Add New Gift" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredGifts.map(gift => {
                    const isOutOfStock = gift.stock === 0 || gift.status === 'Out of Stock';

                    return (
                      <tr key={gift._id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {gift.customId}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F172A] flex items-center gap-2">
                            <span>{gift.title}</span>
                            {gift.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {gift.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{gift.category}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                            {gift.size || 'Standard'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {gift.pointsRequired} PTS
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-slate-700'}`}>
                              {gift.stock} in stock
                            </span>
                            <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleUpdateStockDelta(gift._id, 10)}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold cursor-pointer"
                                title="Quick Add +10 units"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStockDelta(gift._id, 50)}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold cursor-pointer"
                                title="Quick Add +50 units"
                              >
                                +50
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOutOfStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            {isOutOfStock ? 'Out of Stock' : 'Active'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(gift)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs"
                              title="Edit Gift Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGift(gift._id, gift.title)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-2xs"
                              title="Delete Gift"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PACK & ASSIGN DRIVER MODAL                               */}
      {/* ======================================================== */}
      {selectedOrderForPack && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Pack Order & Assign Sector Driver</h3>
                  <p className="text-xs text-slate-400">Order #{selectedOrderForPack.customId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrderForPack(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Details Brief */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Resident Name:</span>
                <strong className="text-slate-800">{selectedOrderForPack.residentName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Sector:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {selectedOrderForPack.sector || 'Area Sector'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <strong className="text-slate-800 text-right line-clamp-1">{selectedOrderForPack.deliveryAddress}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-500">Reward Item:</span>
                <strong className="text-emerald-700 font-semibold">{selectedOrderForPack.rewardTitle} ({selectedOrderForPack.size})</strong>
              </div>
            </div>

            {/* Driver Selection */}
            <form onSubmit={handleConfirmPackAndAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-2">
                  Select Municipal Driver for this Sector:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(data.drivers || []).length === 0 ? (
                    <p className="text-slate-400 italic">No registered drivers found in database.</p>
                  ) : (
                    (data.drivers || []).map(driver => {
                      const isSectorMatch = (driver.activeSector || '').toLowerCase().includes((selectedOrderForPack.sector || '').toLowerCase());
                      const isSelected = selectedDriverId === driver._id;

                      return (
                        <label
                          key={driver._id}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="driverSelect"
                              value={driver._id}
                              checked={isSelected}
                              onChange={() => setSelectedDriverId(driver._id)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{driver.name}</span>
                                {isSectorMatch && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Sector Match
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                Sector: {driver.activeSector || 'General'} • Vehicle: {driver.assignedVehicle || 'Truck'}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            driver.isOnDuty ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {driver.isOnDuty ? '🟢 On Duty' : 'Standby'}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Once packed, the driver can pick up the parcel from the depot. When picked up, a Delivery QR Code will be activated on the resident's portal!
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPack(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={packingLoading || !selectedDriverId}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {packingLoading ? 'Assigning...' : 'Pack & Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT GIFT MODAL                                    */}
      {/* ======================================================== */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">
                    {editingGiftId ? 'Edit Reward Gift' : 'Add New Reward Gift to Store'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure garbage bags, trash bins, or eco items</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGiftModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGift} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Gift Title / Item Name *</label>
                <input
                  type="text"
                  required
                  value={giftForm.title}
                  onChange={e => setGiftForm({ ...giftForm, title: e.target.value })}
                  placeholder="e.g. Heavy-Duty Garbage Bags Roll (Large - 60L)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={giftForm.category}
                    onChange={e => setGiftForm({ ...giftForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium"
                  >
                    <option value="Garbage Bags">Garbage Bags (Diff Sizes)</option>
                    <option value="Trash Bins">Trash Bins (Diff Sizes)</option>
                    <option value="Eco Tools & Accessories">Eco Tools & Accessories</option>
                    <option value="Bill Discount & Vouchers">Bill Discount & Vouchers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Size / Capacity Specification *
                  </label>
                  <input
                    type="text"
                    required
                    value={giftForm.size}
                    onChange={e => setGiftForm({ ...giftForm, size: e.target.value })}
                    placeholder="e.g. Small (10L), Large (60L), 20L Dual Bin"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Points Required *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={giftForm.pointsRequired}
                    onChange={e => setGiftForm({ ...giftForm, pointsRequired: Number(e.target.value) })}
                    placeholder="e.g. 90"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-bold font-mono text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={giftForm.stock}
                    onChange={e => setGiftForm({ ...giftForm, stock: Number(e.target.value) })}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge</label>
                  <input
                    type="text"
                    value={giftForm.badge}
                    onChange={e => setGiftForm({ ...giftForm, badge: e.target.value })}
                    placeholder="Popular, Best Value"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Description / Packaging Details</label>
                <textarea
                  rows="2"
                  value={giftForm.description}
                  onChange={e => setGiftForm({ ...giftForm, description: e.target.value })}
                  placeholder="e.g. Certified biodegradable, fits standard 30L curbside bin."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#00B074] hover:bg-[#009e67] disabled:opacity-50 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : editingGiftId ? 'Update Gift' : 'Add Gift to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
