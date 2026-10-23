import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Truck, 
  Phone, 
  Search, 
  Filter, 
  RefreshCw, 
  Send, 
  Plus, 
  Trash2, 
  Compass, 
  ShieldAlert, 
  Sparkles, 
  User, 
  FileText, 
  Check, 
  X, 
  Download, 
  Navigation,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function EmergencyManagementPage({
  activeSubTab = 'active',
  emergencies = [],
  drivers = [],
  onDispatch,
  onDelete,
  onRefresh,
  onNavigateSubTab,
  showToast
}) {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'active');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal: Log Emergency Call (Admin manual entry)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    residentName: '',
    address: '',
    phone: '',
    reason: '',
    garbageType: 'General Organic',
    estimatedQuantityKg: 10,
    priority: 'High'
  });

  // Modal: Confirm manual resolve
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingEmergency, setResolvingEmergency] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  // Sync prop changes to state
  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setSearchTerm('');
    if (onNavigateSubTab) {
      onNavigateSubTab(tab);
    }
  };

  // Group emergencies
  const { activeList, inProgressList, historyList } = useMemo(() => {
    const active = [];
    const inProgress = [];
    const history = [];

    emergencies.forEach((em) => {
      const status = (em.status || '').toUpperCase();
      if (status === 'RESOLVED' || status === 'PICKED_UP' || status === 'CANCELLED') {
        history.push(em);
      } else if (status === 'DISPATCHED' || status === 'ON THE WAY') {
        inProgress.push(em);
      } else {
        // NEW, PENDING_DISPATCH, PENDING, or unassigned
        active.push(em);
      }
    });

    return { activeList: active, inProgressList: inProgress, historyList: history };
  }, [emergencies]);

  // Overall metrics
  const totalVolume = emergencies.length;
  const criticalCount = emergencies.filter(e => e.priority === 'Critical' && e.status !== 'RESOLVED' && e.status !== 'PICKED_UP').length;
  const totalResolvedKg = historyList.reduce((acc, curr) => acc + (Number(curr.estimatedQuantityKg) || 0), 0);

  // Filtered active list
  const filteredActive = useMemo(() => {
    return activeList.filter((em) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        (em.customId && em.customId.toLowerCase().includes(q)) ||
        (em.reqId && em.reqId.toLowerCase().includes(q)) ||
        (em.residentName && em.residentName.toLowerCase().includes(q)) ||
        (em.address && em.address.toLowerCase().includes(q)) ||
        (em.reason && em.reason.toLowerCase().includes(q));

      const matchPriority = priorityFilter === 'ALL' || (em.priority || 'High').toUpperCase() === priorityFilter.toUpperCase();
      const matchType = typeFilter === 'ALL' || (em.garbageType || em.type || '').toUpperCase() === typeFilter.toUpperCase();

      return matchSearch && matchPriority && matchType;
    });
  }, [activeList, searchTerm, priorityFilter, typeFilter]);

  // Filtered in-progress list
  const filteredInProgress = useMemo(() => {
    return inProgressList.filter((em) => {
      const q = searchTerm.toLowerCase();
      const driverName = em.assignedDriverName || em.assignedDriver?.name || '';
      return (
        !searchTerm ||
        (em.customId && em.customId.toLowerCase().includes(q)) ||
        (em.reqId && em.reqId.toLowerCase().includes(q)) ||
        (em.residentName && em.residentName.toLowerCase().includes(q)) ||
        (em.address && em.address.toLowerCase().includes(q)) ||
        (driverName && driverName.toLowerCase().includes(q))
      );
    });
  }, [inProgressList, searchTerm]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return historyList.filter((em) => {
      const q = searchTerm.toLowerCase();
      const driverName = em.assignedDriverName || em.assignedDriver?.name || '';
      const matchSearch =
        !searchTerm ||
        (em.customId && em.customId.toLowerCase().includes(q)) ||
        (em.reqId && em.reqId.toLowerCase().includes(q)) ||
        (em.residentName && em.residentName.toLowerCase().includes(q)) ||
        (em.address && em.address.toLowerCase().includes(q)) ||
        (driverName && driverName.toLowerCase().includes(q));

      const status = (em.status || '').toUpperCase();
      const matchStatus = 
        historyStatusFilter === 'ALL' || 
        (historyStatusFilter === 'RESOLVED' && (status === 'RESOLVED' || status === 'PICKED_UP')) ||
        (historyStatusFilter === 'CANCELLED' && status === 'CANCELLED');

      return matchSearch && matchStatus;
    });
  }, [historyList, searchTerm, historyStatusFilter]);

  // Handle manual trigger refresh
  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Submit new emergency call by Admin
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.residentName.trim() || !createForm.address.trim()) {
      if (showToast) showToast('Please enter resident name and pickup address', 'error');
      return;
    }
    setCreateLoading(true);
    try {
      const token = localStorage.getItem('tmt_admin_token') || localStorage.getItem('token');
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (showToast) showToast(json.message || 'Emergency SOS call registered successfully!');
        setShowCreateModal(false);
        setCreateForm({
          residentName: '',
          address: '',
          phone: '',
          reason: '',
          garbageType: 'General Organic',
          estimatedQuantityKg: 10,
          priority: 'High'
        });
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(json.message || 'Failed to log emergency', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error registering emergency', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Mark emergency as resolved manually by Admin
  const handleConfirmResolve = async () => {
    if (!resolvingEmergency) return;
    setResolveLoading(true);
    try {
      const token = localStorage.getItem('tmt_admin_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/resolve-emergency/${resolvingEmergency._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (showToast) showToast(json.message || 'Emergency marked as resolved!');
        setShowResolveModal(false);
        setResolvingEmergency(null);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(json.message || 'Failed to resolve emergency', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error resolving emergency', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  // Export history to CSV
  const handleExportCSV = () => {
    if (historyList.length === 0) {
      if (showToast) showToast('No emergency records to export', 'info');
      return;
    }
    const headers = ['Request ID', 'Resident', 'Address', 'Type', 'Estimated KG', 'Priority', 'Driver', 'Status', 'Date Resolved'];
    const rows = historyList.map(em => [
      `"${em.customId || em.reqId || ''}"`,
      `"${em.residentName || ''}"`,
      `"${(em.address || '').replace(/"/g, '""')}"`,
      `"${em.garbageType || em.type || ''}"`,
      `"${em.estimatedQuantityKg || 0}"`,
      `"${em.priority || 'High'}"`,
      `"${em.assignedDriverName || 'Unassigned'}"`,
      `"${em.status || ''}"`,
      `"${em.pickedUpAt ? new Date(em.pickedUpAt).toLocaleString() : em.updatedAt ? new Date(em.updatedAt).toLocaleString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `emergency_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('Emergency history CSV downloaded');
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & KPI METRICS CARDS                     */}
      {/* ==================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Emergency Management (SOS)
                {activeList.length > 0 && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {activeList.length} ACTION REQUIRED
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500">
                Centralized dispatch command for rapid garbage clearance, urgent resident SOS, and driver coordination
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerRefresh}
            className={`p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs ${
              isRefreshing ? 'animate-spin text-rose-500' : ''
            }`}
            title="Refresh Emergency Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Emergency */}
        <div 
          onClick={() => handleTabChange('active')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'active' 
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Emergency</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{activeList.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Needs Dispatch</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Critical alerts: <strong className="text-rose-600 font-bold">{criticalCount}</strong></span>
            <span className="text-rose-600 font-bold flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Emergency Status (En Route) */}
        <div 
          onClick={() => handleTabChange('status')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'status' 
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Status</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{inProgressList.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Drivers Dispatched</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Live GPS active: <strong className="text-amber-600 font-bold">{inProgressList.length}</strong></span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              Track <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Emergency History */}
        <div 
          onClick={() => handleTabChange('history')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            currentTab === 'history' 
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs' 
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency History</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{historyList.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Total Resolved</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Waste cleared: <strong className="text-emerald-700 font-bold">{totalResolvedKg} KG</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              Archive <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Total Volume */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Emergency Volume</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalVolume}</span>
            <span className="text-[11px] font-semibold text-slate-400">Lifetime SOS</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Response: <strong className="text-blue-600 font-bold">&lt; 15 mins</strong></span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">99.2% SLA</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. THREE-SECTION TAB NAVIGATION BAR                  */}
      {/* ==================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('active')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'active'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Active Emergency</span>
          {activeList.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'active' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'
            }`}>
              {activeList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('status')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'status'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Emergency Status</span>
          {inProgressList.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              currentTab === 'status' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {inProgressList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            currentTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Emergency History</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            currentTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {historyList.length}
          </span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 3. SECTION 1: ACTIVE EMERGENCY                       */}
      {/* ==================================================== */}
      {currentTab === 'active' && (
        <div className="space-y-4">
          {/* Active Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search active emergencies by ID, resident name, address, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">Waste Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="GENERAL ORGANIC">General Organic</option>
                  <option value="HAZARDOUS">Hazardous</option>
                  <option value="GARBAGE">Garbage</option>
                  <option value="BULK RECYCLABLES">Bulk Recyclables</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Emergencies List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Pending Emergency Dispatch Queue
                </h3>
                <p className="text-xs text-slate-400">
                  SOS requests that need immediate driver assignment and route dispatching
                </p>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {filteredActive.length} Pending
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredActive.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Active Emergencies in Queue</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    All emergency pickup requests have been dispatched or fulfilled. Control room is currently clear.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Incoming Call
                  </button>
                </div>
              ) : (
                filteredActive.map((em) => {
                  const priority = (em.priority || 'High').toUpperCase();
                  const isCritical = priority === 'CRITICAL';
                  const isHigh = priority === 'HIGH';

                  return (
                    <div 
                      key={em._id || em.customId} 
                      className={`p-5 transition hover:bg-slate-50/60 ${
                        isCritical ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Emergency Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {em.customId || em.reqId || '#REQ-SOS'}
                            </span>

                            {/* Priority Badge */}
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> CRITICAL SOS
                              </span>
                            ) : isHigh ? (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                High Priority
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                {em.priority || 'Standard'}
                              </span>
                            )}

                            {/* Waste Type Badge */}
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              {em.garbageType || em.type || 'General Waste'}
                            </span>

                            {/* Status */}
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/80">
                              Pending Allocation
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {em.createdAt ? new Date(em.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : em.date || 'Today'}
                            </span>
                          </div>

                          {/* Reason */}
                          <p className="text-sm font-bold text-slate-900">
                            {em.reason || 'Urgent pickup requested'}
                          </p>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 text-slate-800 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {em.residentName}
                            </span>

                            <span className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate max-w-xs">{em.address}</span>
                            </span>

                            <span className="font-semibold text-slate-700">
                              Est: <strong className="text-slate-900">{em.estimatedQuantityKg || 10} KG</strong>
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => onDispatch && onDispatch(em)}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00B074] hover:bg-[#009e67] text-white shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch Driver</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResolvingEmergency(em);
                              setShowResolveModal(true);
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition"
                            title="Mark resolved manually"
                          >
                            Resolve
                          </button>

                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(em._id, em.customId || em.reqId)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                              title="Dismiss / Cancel emergency"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. SECTION 2: EMERGENCY STATUS (Live Tracking)       */}
      {/* ==================================================== */}
      {currentTab === 'status' && (
        <div className="space-y-4">
          {/* Status Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search dispatched emergencies by ID, driver, resident..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                {inProgressList.length} In-Transit Telematics Active
              </span>
            </div>
          </div>

          {/* Cards for in-progress emergencies */}
          {filteredInProgress.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Dispatches Currently En Route</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                There are currently no active driver vehicles navigating to emergency pickup locations.
              </p>
              {activeList.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('active')}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
                >
                  View {activeList.length} Pending SOS to Dispatch
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInProgress.map((em) => {
                const isOnTheWay = (em.status || '').toUpperCase() === 'ON THE WAY';
                const isDispatched = (em.status || '').toUpperCase() === 'DISPATCHED';
                const driverName = em.assignedDriverName || em.assignedDriver?.name || 'Assigned Driver';
                const driverPhone = em.assignedDriverPhone || em.assignedDriver?.phone || '';
                const driverVehicle = em.assignedDriverVehicle || em.assignedDriver?.assignedVehicle || 'Sanitation Truck';
                const liveLoc = em.driverLiveLocation || {};
                const speed = liveLoc.speedKm || 28;
                const eta = em.etaMinutes || 8;

                return (
                  <div 
                    key={em._id || em.customId}
                    className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden"
                  >
                    {/* Header bar */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {em.customId || em.reqId || '#REQ-SOS'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{em.reason}</h4>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          {em.garbageType || em.type || 'Garbage'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOnTheWay ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                            ON THE WAY (~{eta} mins ETA)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <Clock className="w-3 h-3" /> DISPATCHED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Pickup Location & Resident */}
                      <div className="space-y-3 lg:border-r border-slate-100 lg:pr-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Pickup Destination
                        </span>
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{em.address}</span>
                          </p>
                          <p className="text-xs text-slate-600 pl-5">
                            Resident: <strong className="text-slate-800">{em.residentName}</strong>
                          </p>
                          <p className="text-xs text-slate-600 pl-5">
                            Est. Quantity: <strong className="text-slate-800">{em.estimatedQuantityKg || 10} KG</strong>
                          </p>
                        </div>

                        {/* Workflow Stepper */}
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Dispatch Lifecycle
                          </span>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>1. SOS Request Logged</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>2. Driver Assigned & Dispatched</span>
                            </div>
                            <div className={`flex items-center gap-2 ${isOnTheWay ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>
                              <Navigation className={`w-3.5 h-3.5 shrink-0 ${isOnTheWay ? 'text-amber-600 animate-bounce' : ''}`} />
                              <span>3. En Route to Resident (~{eta}m ETA)</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                              </div>
                              <span>4. Clearance & Disposal Complete</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Driver Telematics */}
                      <div className="space-y-3 lg:border-r border-slate-100 lg:pr-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Assigned Field Operator
                        </span>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-900">{driverName}</h5>
                                <p className="text-[11px] text-slate-500">{driverVehicle}</p>
                              </div>
                            </div>

                            {driverPhone && (
                              <a
                                href={`tel:${driverPhone}`}
                                className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-xs"
                                title="Call Driver"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Cruising Speed:</span>
                              <strong className="text-slate-800 font-bold">{speed} km/h</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Telemetry Heading:</span>
                              <strong className="text-slate-800 font-bold">{liveLoc.heading || 'Navigating Route'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Last GPS Telemetry: {liveLoc.lastUpdated || 'Real-time broadcast active'}</span>
                        </div>
                      </div>

                      {/* Right: Controller Actions */}
                      <div className="flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Command Override
                          </span>
                          <p className="text-xs text-slate-500">
                            If the driver has completed collection offline or needs re-routing, execute actions below.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingEmergency(em);
                              setShowResolveModal(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark as Resolved / Cleared</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDispatch && onDispatch(em)}
                            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Re-assign Other Driver</span>
                          </button>

                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(em._id, em.customId || em.reqId)}
                              className="w-full py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition text-center"
                            >
                              Cancel Dispatch Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. SECTION 3: EMERGENCY HISTORY                      */}
      {/* ==================================================== */}
      {currentTab === 'history' && (
        <div className="space-y-4">
          {/* History Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history by request ID, resident, driver, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500">Outcome:</span>
                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="RESOLVED">Resolved / Picked Up</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Historical Emergency Archives
                </h3>
                <p className="text-xs text-slate-400">
                  Full log of resolved, fulfilled, and closed emergency pickup operations
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {filteredHistory.length} Records
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Emergency Records Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    No historical emergency requests match the current search filters.
                  </p>
                </div>
              ) : (
                filteredHistory.map((em) => {
                  const status = (em.status || '').toUpperCase();
                  const isResolved = status === 'RESOLVED' || status === 'PICKED_UP';
                  const driverName = em.assignedDriverName || em.assignedDriver?.name || 'Municipal Team';

                  return (
                    <div 
                      key={em._id || em.customId}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {em.customId || em.reqId || '#REQ-HIST'}
                          </span>

                          <h4 className="font-bold text-sm text-slate-900">{em.reason}</h4>

                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {em.garbageType || em.type || 'Garbage'}
                          </span>

                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> FULFILLED & RESOLVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                              CANCELLED
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {em.address}
                          </span>
                          <span>•</span>
                          <span>Resident: <strong className="text-slate-800">{em.residentName}</strong></span>
                          <span>•</span>
                          <span>Waste: <strong className="text-slate-700">{em.estimatedQuantityKg || 10} KG</strong></span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Fitted by {driverName}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">
                            {em.pickedUpAt ? `Completed: ${new Date(em.pickedUpAt).toLocaleString()}` : em.updatedAt ? `Updated: ${new Date(em.updatedAt).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(em._id, em.customId || em.reqId)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                            title="Delete archived record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: LOG EMERGENCY SOS CALL (Manual Entry)          */}
      {/* ==================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Log Emergency SOS Call</h3>
                  <p className="text-xs text-slate-400">Record a resident phone call or control room alert</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resident Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={createForm.residentName}
                  onChange={(e) => setCreateForm({ ...createForm, residentName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup Address / Landmark <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House #42, Sector 14, Near City Park"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resident Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urgency Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="Critical">Critical (Immediate Hazard)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Waste Category
                  </label>
                  <select
                    value={createForm.garbageType}
                    onChange={(e) => setCreateForm({ ...createForm, garbageType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="General Organic">General Organic</option>
                    <option value="Hazardous">Hazardous Waste</option>
                    <option value="Garbage">General Garbage</option>
                    <option value="Bulk Waste">Bulk Waste</option>
                    <option value="Medical / Chemical">Medical / Chemical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Weight (KG)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={createForm.estimatedQuantityKg}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedQuantityKg: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Situation Description
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Garbage overflowing on entrance, foul smell, urgent removal requested."
                  value={createForm.reason}
                  onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {createLoading ? 'Registering...' : 'Log & Place in Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: MANUAL RESOLVE CONFIRMATION                   */}
      {/* ==================================================== */}
      {showResolveModal && resolvingEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 text-center">
              Confirm Emergency Resolution
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1">
              Mark request <strong className="text-slate-800">{resolvingEmergency.customId || resolvingEmergency.reqId}</strong> as fully fulfilled and cleared?
            </p>

            <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Resident:</span>
                <span className="font-semibold text-slate-800">{resolvingEmergency.residentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{resolvingEmergency.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waste:</span>
                <span className="font-semibold text-slate-800">{resolvingEmergency.estimatedQuantityKg || 10} KG</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowResolveModal(false);
                  setResolvingEmergency(null);
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={resolveLoading}
                onClick={handleConfirmResolve}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {resolveLoading ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
