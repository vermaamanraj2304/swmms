import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Tag, 
  ArrowUpRight,
  Filter,
  Trash2,
  Plus,
  Search,
  X,
  FileText,
  AlertTriangle,
  Send,
  Truck,
  Check,
  ShieldAlert,
  RotateCcw,
  Navigation,
  Compass,
  LocateFixed,
  Package,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import LocationPickerMap from '../../../components/LocationPickerMap';
import LocationPreviewModal from '../../../components/LocationPreviewModal';

export default function ComplaintManagementPage({ 
  complaints = [], 
  drivers = [], 
  vehicles = [],
  serviceAreas = [], 
  initialSection = 'history',
  onUpdateStatus, 
  onDeleteComplaint,
  onRefresh, 
  showToast 
}) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showRoadsideModal, setShowRoadsideModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);
  const [selectedComplaintForResolve, setSelectedComplaintForResolve] = useState(null);
  const [previewComplaint, setPreviewComplaint] = useState(null);
  const [selectedComplaintForAssign, setSelectedComplaintForAssign] = useState(null);
  const [manualAssignData, setManualAssignData] = useState({
    driverName: '',
    driverId: '',
    vehicleNumber: ''
  });
  const [assigningNearestId, setAssigningNearestId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('Resolved by sanitation operations crew. Site verified clean.');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Order Complaint Actions Modals State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [selectedOrderComplaint, setSelectedOrderComplaint] = useState(null);
  const [refundForm, setRefundForm] = useState({
    refundPoints: 0,
    adminNotes: 'Points credited back to resident account due to verified delivery issue.'
  });
  const [exchangeForm, setExchangeForm] = useState({
    replacementTitle: '',
    replacementSize: '',
    adminNotes: 'Exchange replacement order scheduled and dispatched to fulfillment queue.'
  });

  // Forms State
  const [roadsideForm, setRoadsideForm] = useState({
    complaintType: 'Roadside Garbage',
    title: 'Roadside Garbage Accumulation',
    category: 'Roadside Garbage',
    description: '',
    landmark: '',
    lat: 28.6139,
    lng: 77.2090,
    residentSector: 'Central Municipal Ward',
    priority: 'High',
    assignedDriver: 'Unassigned',
    assignedVehicle: ''
  });

  const [residentForm, setResidentForm] = useState({
    complaintType: 'Resident',
    title: 'Missed Household Waste Pickup',
    category: 'Missed Pickup',
    description: '',
    residentName: '',
    residentPhone: '',
    residentAddress: '',
    residentSector: 'Central Municipal Ward',
    priority: 'Medium',
    assignedDriver: 'Unassigned'
  });

  // Helper: determine if complaint is Order Complaint
  const isOrderComplaint = (comp) => {
    return (
      comp.complaintType === 'Order Complain' ||
      Boolean(comp.orderId) ||
      Boolean(comp.orderCustomId) ||
      (comp.category || '').toLowerCase().includes('order') ||
      (comp.title || '').toLowerCase().includes('order issue')
    );
  };

  // Helper: determine if complaint is Roadside Garbage
  const isRoadside = (comp) => {
    if (isOrderComplaint(comp)) return false;
    return (
      comp.complaintType === 'Roadside Garbage' ||
      (comp.category || '').toLowerCase().includes('roadside') ||
      (comp.title || '').toLowerCase().includes('roadside') ||
      (comp.type || '').toLowerCase().includes('roadside') ||
      (comp.customId || '').startsWith('#SPOT') ||
      (comp.ticketNumber || '').startsWith('#SPOT') ||
      (comp.category || '').toLowerCase().includes('spot') ||
      (comp.title || '').toLowerCase().includes('spot') ||
      (comp.type || '').toLowerCase().includes('spot')
    );
  };

  // Helper: determine if complaint is Resolved
  const isResolved = (comp) => {
    const st = (comp.status || '').toUpperCase();
    return st.includes('RESOLV');
  };

  // Helper: determine if complaint is Pending
  const isPending = (comp) => {
    return !isResolved(comp);
  };

  // Calculate isolated filtered pools - Order complaints are strictly ONLY in orderComplaints
  const orderComplaints = complaints.filter(c => isOrderComplaint(c));
  const residentComplaints = complaints.filter(c => !isRoadside(c) && !isOrderComplaint(c));
  const roadsideComplaints = complaints.filter(c => isRoadside(c) && !isOrderComplaint(c));
  const pendingComplaints = complaints.filter(c => isPending(c) && !isOrderComplaint(c));
  const resolvedComplaints = complaints.filter(c => isResolved(c) && !isOrderComplaint(c));
  const historyComplaints = complaints.filter(c => !isOrderComplaint(c));

  // Authentication headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('tmt_admin_token') || localStorage.getItem('tmt_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Handle open Refund Modal
  const handleOpenRefundModal = (comp) => {
    setSelectedOrderComplaint(comp);
    setRefundForm({
      refundPoints: comp.refundPoints || comp.pointsRedeemed || 90,
      adminNotes: `Refund authorized for order complaint ${comp.ticketNumber || comp.customId || ''}. Points credited back to citizen balance.`
    });
    setShowRefundModal(true);
  };

  // Submit Refund
  const handleConfirmRefund = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedOrderComplaint) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedOrderComplaint._id}/order-refund`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          refundPoints: Number(refundForm.refundPoints) || 0,
          adminNotes: refundForm.adminNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) showToast(data.message || 'Points refunded and complaint resolved!', 'success');
        setShowRefundModal(false);
        setSelectedOrderComplaint(null);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to refund points', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error processing points refund', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open Exchange Modal
  const handleOpenExchangeModal = (comp) => {
    setSelectedOrderComplaint(comp);
    let defaultTitle = comp.title ? comp.title.replace(/^Order Issue:\s*/i, '').trim() : 'Replacement Eco-Gift';
    setExchangeForm({
      replacementTitle: defaultTitle || 'Replacement Eco-Gift',
      replacementSize: 'Standard / Verified Size',
      adminNotes: `Exchange replacement order generated for complaint ${comp.ticketNumber || comp.customId || ''}. Scheduled for delivery.`
    });
    setShowExchangeModal(true);
  };

  // Submit Exchange
  const handleConfirmExchange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedOrderComplaint) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedOrderComplaint._id}/order-exchange`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          replacementTitle: exchangeForm.replacementTitle,
          replacementSize: exchangeForm.replacementSize,
          adminNotes: exchangeForm.adminNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) showToast(data.message || 'Exchange order created in Orders Queue!', 'success');
        setShowExchangeModal(false);
        setSelectedOrderComplaint(null);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(data.message || 'Failed to create exchange order', 'error');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error processing exchange order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle direct status change
  const handleStatusChange = async (complaintId, newStatus, customNotes = '') => {
    if (!onUpdateStatus) return;
    try {
      setUpdatingId(complaintId);
      await onUpdateStatus(complaintId, newStatus, customNotes);
      if (showToast) showToast(`Complaint status updated to ${newStatus}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Auto-detect GPS Coordinates helper
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRoadsideForm(prev => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          }));
          if (showToast) showToast('📍 Real GPS Coordinates captured!', 'success');
        },
        () => {
          const lat = Number((28.6139 + (Math.random() - 0.5) * 0.04).toFixed(6));
          const lng = Number((77.2090 + (Math.random() - 0.5) * 0.04).toFixed(6));
          setRoadsideForm(prev => ({ ...prev, lat, lng }));
          if (showToast) showToast('📍 Set to default municipal coordinates.', 'info');
        }
      );
    } else {
      setRoadsideForm(prev => ({ ...prev, lat: 28.6139, lng: 77.2090 }));
    }
  };

  // Submit Roadside Complaint
  const handleRoadsideSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...roadsideForm,
        lat: Number(roadsideForm.lat) || 28.6139,
        lng: Number(roadsideForm.lng) || 77.2090
      };
      const res = await fetch('/api/admin/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Roadside incident reported successfully!', 'success');
        setShowRoadsideModal(false);
        setRoadsideForm({
          complaintType: 'Roadside Garbage',
          title: 'Roadside Garbage Accumulation',
          category: 'Roadside Garbage',
          description: '',
          landmark: '',
          lat: 28.6139,
          lng: 77.2090,
          residentSector: 'Central Municipal Ward',
          priority: 'High',
          assignedDriver: 'Unassigned',
          assignedVehicle: ''
        });
        if (onRefresh) onRefresh();
        setActiveSection('roadside');
      } else {
        if (showToast) showToast(data.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error reporting roadside garbage', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-Assign Nearest Vehicle to Roadside Complaint
  const handleAssignNearest = async (comp) => {
    try {
      setAssigningNearestId(comp._id);
      const res = await fetch(`/api/admin/complaints/${comp._id}/assign-nearest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        if (showToast) showToast(result.message, 'success');
        if (onRefresh) onRefresh();
      } else if (result.manualRequired) {
        if (showToast) showToast(result.message, 'warning');
        setSelectedComplaintForAssign(comp);
        setManualAssignData({
          driverName: drivers[0]?.name || '',
          driverId: drivers[0]?._id || '',
          vehicleNumber: vehicles[0]?.vehicleNumber || drivers[0]?.assignedVehicle || 'Compactor Truck'
        });
        setShowManualAssignModal(true);
      } else {
        if (showToast) showToast(result.message || 'Failed to auto-assign nearest vehicle', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Failed to auto-assign nearest vehicle. Opening manual assign...', 'warning');
      setSelectedComplaintForAssign(comp);
      setManualAssignData({
        driverName: drivers[0]?.name || '',
        driverId: drivers[0]?._id || '',
        vehicleNumber: vehicles[0]?.vehicleNumber || drivers[0]?.assignedVehicle || 'Compactor Truck'
      });
      setShowManualAssignModal(true);
    } finally {
      setAssigningNearestId(null);
    }
  };

  // Manual Assign Vehicle Submit
  const handleManualAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintForAssign) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/complaints/${selectedComplaintForAssign._id}/manual-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: manualAssignData.driverName,
          driverId: manualAssignData.driverId,
          vehicleNumber: manualAssignData.vehicleNumber
        })
      });
      const result = await res.json();
      if (result.success) {
        if (showToast) showToast(result.message, 'success');
        setShowManualAssignModal(false);
        setSelectedComplaintForAssign(null);
        if (onRefresh) onRefresh();
      } else {
        if (showToast) showToast(result.message || 'Failed to manually assign vehicle', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error manually assigning vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Resident Complaint
  const handleResidentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (showToast) showToast(data.message || 'Resident complaint registered successfully!', 'success');
        setShowResidentModal(false);
        setResidentForm({
          complaintType: 'Resident',
          title: 'Missed Household Waste Pickup',
          category: 'Missed Pickup',
          description: '',
          residentName: '',
          residentPhone: '',
          residentAddress: '',
          residentSector: 'Central Municipal Ward',
          priority: 'Medium',
          assignedDriver: 'Unassigned'
        });
        if (onRefresh) onRefresh();
        setActiveSection('resident');
      } else {
        if (showToast) showToast(data.message || 'Failed to log complaint', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Error registering resident complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Resolve with Notes
  const handleConfirmResolve = async () => {
    if (!selectedComplaintForResolve) return;
    setSubmitting(true);
    try {
      await handleStatusChange(selectedComplaintForResolve._id, 'Resolved', resolutionNotes);
      setShowResolveModal(false);
      setSelectedComplaintForResolve(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (status = '') => {
    const st = status.toUpperCase();
    if (st.includes('RESOLV')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
        </span>
      );
    }
    if (st.includes('WAY')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 w-fit animate-pulse">
          <Truck className="w-3 h-3 text-amber-600 animate-bounce" /> On the Way
        </span>
      );
    }
    if (st.includes('INVESTIGAT') || st.includes('PROGRESS')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 w-fit">
          <Clock className="w-3 h-3 text-blue-600 animate-spin" /> In Progress
        </span>
      );
    }
    if (st.includes('REJECT')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 w-fit">
          <AlertCircle className="w-3 h-3 text-rose-600" /> Rejected
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Under Review
      </span>
    );
  };

  const getPriorityBadge = (p = 'Medium') => {
    switch ((p || '').toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical Priority</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High Priority</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Low Priority</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
    }
  };

  // Search filter for all sections
  const filterList = (list) => {
    return list.filter(comp => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (comp.customId || '').toLowerCase().includes(term) ||
        (comp.ticketNumber || '').toLowerCase().includes(term) ||
        (comp.title || '').toLowerCase().includes(term) ||
        (comp.description || '').toLowerCase().includes(term) ||
        (comp.residentName || '').toLowerCase().includes(term) ||
        (comp.residentAddress || '').toLowerCase().includes(term) ||
        (comp.landmark || '').toLowerCase().includes(term);

      const matchesCategory = categoryFilter === 'ALL' || (comp.category || comp.type) === categoryFilter;
      const matchesPriority = priorityFilter === 'ALL' || (comp.priority || 'Medium') === priorityFilter;
      const matchesStatus = statusFilter === 'ALL' || (
        statusFilter === 'RESOLVED' ? isResolved(comp) :
        statusFilter === 'PENDING' ? isPending(comp) :
        (comp.status || '').toUpperCase().includes(statusFilter)
      );

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  };

  // Render individual Complaint Card / Row
  const renderComplaintCard = (comp) => {
    const isCompOrder = isOrderComplaint(comp);
    const isCompRoadside = !isCompOrder && isRoadside(comp);
    const residentName = comp.residentName || comp.residentId?.name || (isCompRoadside ? 'Public / Inspector Report' : 'Resident');
    const location = isCompRoadside 
      ? (comp.landmark || comp.residentAddress || 'Public Roadside Point') 
      : (comp.residentAddress || comp.residentId?.address || 'Household Address');
    const currentStatus = comp.status || 'Under Review';
    const isUpdating = updatingId === comp._id;
    const compLat = comp.lat || comp.location?.lat || 28.6139;
    const compLng = comp.lng || comp.location?.lng || 77.2090;

    return (
      <div key={comp._id} className="p-6 hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-b-0">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          {/* Main Info */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                {comp.ticketNumber || comp.customId || '#CMP-TICKET'}
              </span>
              
              {isCompOrder ? (
                <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Package className="w-3 h-3 text-purple-600" /> Order Complaint
                </span>
              ) : isCompRoadside ? (
                <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Trash2 className="w-3 h-3 text-amber-600" /> Roadside Garbage
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-600" /> Resident Grievance
                </span>
              )}

              {comp.orderCustomId && (
                <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Package className="w-3 h-3 text-purple-600" /> Order: {comp.orderCustomId}
                </span>
              )}

              {comp.resolutionType === 'REFUND' && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                  <RotateCcw className="w-3 h-3 text-amber-700" /> Refunded: +{comp.refundPoints || 90} PTS
                </span>
              )}

              {comp.resolutionType === 'EXCHANGE' && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                  <Package className="w-3 h-3 text-purple-700" /> Exchange Order #{comp.exchangeOrderCustomId || 'EXC'} Dispatched
                </span>
              )}

              <span className="text-xs font-bold text-slate-800">
                {comp.title || 'Service Ticket'}
              </span>

              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                {comp.category || comp.type || 'General'}
              </span>

              {getPriorityBadge(comp.priority)}

              <span className="text-[11px] text-slate-400 font-mono ml-auto lg:ml-0 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString() : comp.date || 'Today'}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 leading-relaxed font-normal">
              {comp.description}
            </p>

            {/* Roadside Coordinates Badge */}
            {isCompRoadside && (
              <div className="flex flex-wrap items-center gap-2 text-xs bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 w-fit">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold text-amber-900 text-[11px]">Garbage Coordinates:</span>
                <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {compLat.toFixed(4)}° N, {compLng.toFixed(4)}° E
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewComplaint(comp)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>View on Leaflet Map</span>
                </button>
                <a 
                  href={`https://www.openstreetmap.org/?mlat=${compLat}&mlon=${compLng}#map=16/${compLat}/${compLng}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center gap-0.5 ml-1"
                >
                  OSM <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Details Grid */}
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                  isCompOrder ? 'bg-purple-100 text-purple-800' : isCompRoadside ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {residentName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Reporter</span>
                  <strong className="text-slate-800 text-xs truncate block font-semibold">{residentName}</strong>
                  {comp.residentPhone && (
                    <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">{comp.residentPhone}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Location / Ward</span>
                  <span className="text-slate-700 text-xs block truncate font-medium">{location}</span>
                  {comp.residentSector && (
                    <span className="text-[10px] text-emerald-600 font-semibold block leading-none mt-0.5">{comp.residentSector}</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Vehicle & Assigned Driver</span>
                  <span className="text-slate-800 text-xs block font-bold truncate">
                    {comp.assignedVehicle ? `${comp.assignedVehicle} • ` : ''}{comp.assignedDriver || 'Unassigned'}
                  </span>
                  {comp.assignedVehicle ? (
                    <span className="text-[10px] text-emerald-600 font-bold block leading-none mt-0.5">
                      Fleet Truck Assigned
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold block leading-none mt-0.5">
                      No Truck Assigned Yet
                    </span>
                  )}
                  {comp.resolvedAt && (
                    <span className="text-[10px] text-emerald-600 font-medium block leading-none mt-0.5">
                      Resolved: {new Date(comp.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resolution notes if resolved */}
            {(comp.resolutionNotes || comp.adminNotes || comp.clearedWeightKg) && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold block text-[10px] uppercase text-emerald-700">Official Resolution Details:</span>
                    {comp.clearedWeightKg ? (
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                        ⚖️ Cleared: {comp.clearedWeightKg} kg
                      </span>
                    ) : null}
                  </div>
                  <span>{comp.resolutionNotes || comp.adminNotes}</span>
                  {comp.resolvedAt && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Resolved At: {new Date(comp.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0 pt-1">
            {/* Status Dropdown */}
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Update Status
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={currentStatus}
                  disabled={isUpdating}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Resolved') {
                      setSelectedComplaintForResolve(comp);
                      setShowResolveModal(true);
                    } else {
                      handleStatusChange(comp._id, val);
                    }
                  }}
                  className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition cursor-pointer outline-hidden shadow-2xs ${
                    currentStatus.toUpperCase().includes('RESOLV')
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : currentStatus === 'On the Way'
                      ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse font-extrabold'
                      : currentStatus.toUpperCase().includes('PROGRESS')
                      ? 'bg-blue-50 text-blue-800 border-blue-300 font-bold'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <option value="Under Review">🟡 Under Review</option>
                  <option value="Investigating">🔵 Investigating</option>
                  <option value="In Progress">⚡ In Progress</option>
                  <option value="On the Way">🚚 On the Way (Driver En Route)</option>
                  <option value="Resolved">✅ Resolved (Site Cleared)</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
                {isUpdating && <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
              </div>
            </div>

            {/* Roadside Vehicle Assignment Buttons */}
            {isCompRoadside && !isResolved(comp) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleAssignNearest(comp)}
                  disabled={assigningNearestId === comp._id}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  {assigningNearestId === comp._id ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Locating Nearest...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      Assign Nearest Vehicle
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedComplaintForAssign(comp);
                    setManualAssignData({
                      driverName: drivers[0]?.name || '',
                      driverId: drivers[0]?._id || '',
                      vehicleNumber: vehicles[0]?.vehicleNumber || drivers[0]?.assignedVehicle || 'Compactor Truck'
                    });
                    setShowManualAssignModal(true);
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  Manual Assign
                </button>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {isCompOrder ? (
                <>
                  <button
                    onClick={() => handleOpenExchangeModal(comp)}
                    disabled={isUpdating}
                    className="text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    title="Create exchange replacement delivery order"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {comp.resolutionType === 'EXCHANGE' ? 'New Exchange Order' : 'Create Exchange Order'}
                  </button>

                  {comp.resolutionType !== 'REFUND' && (
                    <button
                      onClick={() => handleOpenRefundModal(comp)}
                      disabled={isUpdating}
                      className="text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Credit points back to resident profile"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund Points
                    </button>
                  )}

                  {!isResolved(comp) ? (
                    <button
                      onClick={() => {
                        setSelectedComplaintForResolve(comp);
                        setShowResolveModal(true);
                      }}
                      disabled={isUpdating}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      title="Resolve with custom notes"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Resolve Other
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(comp._id, 'Under Review')}
                      disabled={isUpdating}
                      className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-open Ticket
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!isResolved(comp) ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedComplaintForResolve(comp);
                          setShowResolveModal(true);
                        }}
                        disabled={isUpdating}
                        className="text-xs bg-[#00B074] hover:bg-[#009663] disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve Ticket
                      </button>

                      {currentStatus !== 'Investigating' && (
                        <button
                          onClick={() => handleStatusChange(comp._id, 'Investigating')}
                          disabled={isUpdating}
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-xl transition"
                        >
                          Investigate
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(comp._id, 'Under Review')}
                      disabled={isUpdating}
                      className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Re-open Ticket
                    </button>
                  )}
                </>
              )}

              {onDeleteComplaint && (
                <button
                  onClick={() => onDeleteComplaint(comp._id)}
                  disabled={isUpdating}
                  title="Delete Ticket"
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* SECTION 1: RESIDENT COMPLAINTS */}
      {/* ========================================================= */}
      {activeSection === 'resident' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> CITIZEN HOUSEHOLD TICKETS
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Resident Complaints</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Service grievances, missed morning pickups, damaged bins, and collection delays filed by registered households.
              </p>
            </div>

            <button
              onClick={() => setShowResidentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Log Resident Grievance
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TOTAL RESIDENT COMPLAINTS</span>
              <h3 className="text-2xl font-bold text-[#0F172A]">{residentComplaints.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Citizen tickets logged</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">AWAITING REVIEW</span>
              <h3 className="text-2xl font-bold text-amber-600">
                {residentComplaints.filter(c => (c.status || '').toUpperCase() === 'UNDER REVIEW').length}
              </h3>
              <span className="text-xs text-amber-600/80 mt-1 inline-block">Pending inspection</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">UNDER INVESTIGATION</span>
              <h3 className="text-2xl font-bold text-blue-600">
                {residentComplaints.filter(c => (c.status || '').toUpperCase().includes('INVESTIGAT')).length}
              </h3>
              <span className="text-xs text-blue-600/80 mt-1 inline-block">Crew dispatched</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">RESOLVED HOUSEHOLDS</span>
              <h3 className="text-2xl font-bold text-emerald-600">
                {residentComplaints.filter(c => isResolved(c)).length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Successfully closed</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by ticket #, resident name, address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-blue-500 font-medium"
              />
            </div>

            <div className="text-xs text-slate-500 font-bold">
              Showing {filterList(residentComplaints).length} Resident Tickets
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(residentComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 opacity-50" />
                <p className="font-semibold text-slate-700">No resident complaints found</p>
                <p className="text-[11px] text-slate-400">All household collections are running smoothly.</p>
              </div>
            ) : (
              <div>{filterList(residentComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: ROADSIDE GARBAGE COMPLAINT */}
      {/* ========================================================= */}
      {activeSection === 'roadside' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-amber-600" /> PUBLIC ENVIRONMENT & STREET SANITATION
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Roadside Garbage Complaints</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reports of illegal open dumping, public street trash piles, overflowing highway bins, and roadside litter spots.
              </p>
            </div>

            <button
              onClick={() => setShowRoadsideModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Report Roadside Dump Spot
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TOTAL ROADSIDE SPOTS</span>
              <h3 className="text-2xl font-bold text-[#0F172A]">{roadsideComplaints.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Public dump points</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CRITICAL & URGENT</span>
              <h3 className="text-2xl font-bold text-rose-600">
                {roadsideComplaints.filter(c => (c.priority || '').toLowerCase() === 'critical').length}
              </h3>
              <span className="text-xs text-rose-600/80 mt-1 inline-block">Immediate cleanup needed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">IN PROGRESS</span>
              <h3 className="text-2xl font-bold text-blue-600">
                {roadsideComplaints.filter(c => (c.status || '').toUpperCase().includes('INVESTIGAT')).length}
              </h3>
              <span className="text-xs text-blue-600/80 mt-1 inline-block">Truck deployed to site</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CLEARED & RESOLVED</span>
              <h3 className="text-2xl font-bold text-emerald-600">
                {roadsideComplaints.filter(c => isResolved(c)).length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Cleared and restored</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search roadside dumps by landmark, sector, ticket #..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-amber-500 font-medium"
              />
            </div>

            <div className="text-xs text-slate-500 font-bold">
              Showing {filterList(roadsideComplaints).length} Roadside Incidents
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(roadsideComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <Trash2 className="w-8 h-8 mx-auto text-slate-300 opacity-50" />
                <p className="font-semibold text-slate-700">No roadside garbage complaints reported</p>
                <p className="text-[11px] text-slate-400">All municipal roads and public areas are clean.</p>
              </div>
            ) : (
              <div>{filterList(roadsideComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION: ORDER COMPLAINTS                                 */}
      {/* ========================================================= */}
      {activeSection === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-600" /> REWARD REDEMPTIONS & ECO-GIFT ISSUES
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Reward Order Complaints</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Grievances filed by residents regarding reward gift deliveries, wrong size bags, damaged bins, or missing orders.
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">TOTAL ORDER COMPLAINTS</span>
              <h3 className="text-2xl font-bold text-[#0F172A]">{orderComplaints.length}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Reported by residents</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">AWAITING REVIEW</span>
              <h3 className="text-2xl font-bold text-amber-600">
                {orderComplaints.filter(c => (c.status || '').toUpperCase() === 'UNDER REVIEW').length}
              </h3>
              <span className="text-xs text-amber-600/80 mt-1 inline-block">Needs admin action</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">INVESTIGATING / DRIVER</span>
              <h3 className="text-2xl font-bold text-blue-600">
                {orderComplaints.filter(c => (c.status || '').toUpperCase().includes('INVESTIGAT') || (c.status || '').toUpperCase().includes('PROGRESS')).length}
              </h3>
              <span className="text-xs text-blue-600/80 mt-1 inline-block">Driver assigned</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">RESOLVED ORDERS</span>
              <h3 className="text-2xl font-bold text-emerald-600">
                {orderComplaints.filter(c => isResolved(c)).length}
              </h3>
              <span className="text-xs text-emerald-600/80 mt-1 inline-block">Replaced / Closed</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by ticket #, order ID, resident name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-purple-500 font-medium"
              />
            </div>

            <div className="text-xs text-slate-500 font-bold">
              Showing {filterList(orderComplaints).length} Order Complaints
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(orderComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <Package className="w-8 h-8 mx-auto text-slate-300 opacity-50" />
                <p className="font-semibold text-slate-700">No order complaints found</p>
                <p className="text-[11px] text-slate-400">All reward redemptions and eco-gift deliveries are satisfactory.</p>
              </div>
            ) : (
              <div>{filterList(orderComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: PENDING COMPLAINTS */}
      {/* ========================================================= */}
      {activeSection === 'pending' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> PRIORITY ACTION QUEUE
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Pending Complaints Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complaints currently under review, undergoing field investigation, or awaiting cleanup crew dispatch.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                {pendingComplaints.length} Tickets Awaiting Resolution
              </span>
            </div>
          </div>

          {/* Alert if critical */}
          {pendingComplaints.some(c => (c.priority || '').toLowerCase() === 'critical') && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block font-bold">Critical Urgency Attention Required</strong>
                <span>One or more open tickets are flagged with critical priority. Please dispatch nearest sanitation vehicle immediately.</span>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(pendingComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="font-bold text-slate-800 text-sm">All Complaints Resolved!</p>
                <p className="text-[11px] text-slate-400">Zero pending tickets in the municipal queue.</p>
              </div>
            ) : (
              <div>{filterList(pendingComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: RESOLVED COMPLAINTS */}
      {/* ========================================================= */}
      {activeSection === 'resolved' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> RESOLUTION ARCHIVE
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">Resolved Complaints</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chronological archive of successfully resolved household grievances, cleared dumps, and verified actions.
              </p>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              {resolvedComplaints.length} Total Resolved Tickets
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(resolvedComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <Clock className="w-8 h-8 mx-auto text-slate-300 opacity-50" />
                <p className="font-semibold text-slate-700">No resolved complaints recorded yet</p>
              </div>
            ) : (
              <div>{filterList(resolvedComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: ALL COMPLAIN HISTORY (Master Audit Log) */}
      {/* ========================================================= */}
      {activeSection === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" /> MASTER AUDIT TRAIL
              </span>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mt-1">All Complaint History</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete historical record of all citizen grievances, roadside dumps, inspection notes, and resolution times.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRoadsideModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Roadside Dump
              </button>
              <button
                onClick={() => setShowResidentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Resident Ticket
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search tickets, names, locations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-slate-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status:
              </span>
              {['ALL', 'PENDING', 'RESOLVED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === st ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-400 mx-1">|</span>

              <span className="text-xs font-bold text-slate-400 mr-1">Priority:</span>
              {['ALL', 'Critical', 'High', 'Medium'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    priorityFilter === p ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Master List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filterList(historyComplaints).length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 opacity-50" />
                <p className="font-semibold text-slate-700">No complaints matching filter criteria</p>
              </div>
            ) : (
              <div>{filterList(historyComplaints).map(renderComplaintCard)}</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: REPORT ROADSIDE GARBAGE DUMP SPOT */}
      {/* ========================================================= */}
      {showRoadsideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Report Roadside Garbage Spot</h3>
                  <p className="text-xs text-slate-400">File a public waste dump incident for municipal dispatch</p>
                </div>
              </div>
              <button onClick={() => setShowRoadsideModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoadsideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Large construction debris dump on Outer Ring Road"
                  value={roadsideForm.title}
                  onChange={e => setRoadsideForm({ ...roadsideForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark / Exact Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Metro Pillar 128, Service Lane"
                  value={roadsideForm.landmark}
                  onChange={e => setRoadsideForm({ ...roadsideForm, landmark: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                />
              </div>

              {/* Interactive Leaflet Garbage Location Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Pinpoint Incident on Leaflet Map *
                </label>
                <LocationPickerMap
                  lat={Number(roadsideForm.lat) || 28.6139}
                  lng={Number(roadsideForm.lng) || 77.2090}
                  onChange={({ lat, lng }) => setRoadsideForm(prev => ({ ...prev, lat, lng }))}
                  height="200px"
                  label={roadsideForm.landmark || 'Garbage Incident'}
                  pinType="garbage"
                  priority={roadsideForm.priority}
                  showGpsButton={true}
                />
              </div>

              {/* GPS Coordinates Section */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    Garbage Location GPS Coordinates *
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-[11px] font-bold text-amber-800 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    Auto-Fill GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roadsideForm.lat}
                      onChange={e => setRoadsideForm({ ...roadsideForm, lat: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={roadsideForm.lng}
                      onChange={e => setRoadsideForm({ ...roadsideForm, lng: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-amber-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-700">
                  Click or drag pin on the Leaflet map above or type exact GPS coordinates.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Municipal Sector</label>
                  <select
                    value={roadsideForm.residentSector}
                    onChange={e => setRoadsideForm({ ...roadsideForm, residentSector: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500 font-medium text-slate-800"
                  >
                    <option value="Central Municipal Ward">Central Municipal Ward</option>
                    {serviceAreas.map(area => (
                      <option key={area._id || area.name} value={area.displayName || area.name}>
                        {area.displayName || area.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={roadsideForm.priority}
                    onChange={e => setRoadsideForm({ ...roadsideForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500 font-semibold text-slate-800"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical (Hazardous / Road Blocker)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Cleanup Driver (Optional)</label>
                <select
                  value={roadsideForm.assignedDriver}
                  onChange={e => setRoadsideForm({ ...roadsideForm, assignedDriver: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500 font-medium text-slate-800"
                >
                  <option value="Unassigned">-- Unassigned (Dispatch Later) --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d.name}>{d.name} ({d.customId || 'Driver'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the waste dump: volume in tons, mixed plastic, wet garbage, open drain blockage..."
                  value={roadsideForm.description}
                  onChange={e => setRoadsideForm({ ...roadsideForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoadsideModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'File Roadside Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LOG RESIDENT COMPLAINT */}
      {/* ========================================================= */}
      {showResidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A]">Log Citizen Resident Complaint</h3>
                  <p className="text-xs text-slate-400">Record a household collection grievance on behalf of a resident</p>
                </div>
              </div>
              <button onClick={() => setShowResidentModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResidentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resident Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar or Ananya Das"
                  value={residentForm.residentName}
                  onChange={e => setResidentForm({ ...residentForm, residentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={residentForm.residentPhone}
                    onChange={e => setResidentForm({ ...residentForm, residentPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grievance Category</label>
                  <select
                    value={residentForm.category}
                    onChange={e => setResidentForm({ ...residentForm, category: e.target.value, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500 font-medium text-slate-800"
                  >
                    <option value="Missed Pickup">Missed Morning Pickup</option>
                    <option value="Damaged Bin">Damaged Household Bin</option>
                    <option value="Delayed Collection">Delayed Collection Route</option>
                    <option value="Improper Segregation">Improper Waste Handling</option>
                    <option value="Driver Misconduct">Driver Misconduct</option>
                    <option value="General Service">General Service Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Household Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Palm Heights, Sector 7"
                  value={residentForm.residentAddress}
                  onChange={e => setResidentForm({ ...residentForm, residentAddress: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Complaint Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Provide detailed description of the citizen's complaint..."
                  value={residentForm.description}
                  onChange={e => setResidentForm({ ...residentForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResidentModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Log Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RESOLVE TICKET WITH NOTES */}
      {/* ========================================================= */}
      {showResolveModal && selectedComplaintForResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Resolve Ticket</h3>
                  <p className="text-xs text-slate-400">
                    {selectedComplaintForResolve.ticketNumber || selectedComplaintForResolve.customId}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-slate-800 block">
                {selectedComplaintForResolve.title || 'Service Ticket'}
              </span>
              <p className="text-slate-500 line-clamp-2">{selectedComplaintForResolve.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Official Resolution Notes *</label>
              <textarea
                rows="3"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="e.g. Compactor crew dispatched; bin emptied; citizen satisfied."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Resolving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: MANUAL ASSIGN VEHICLE & DRIVER MODAL */}
      {/* ========================================================= */}
      {showManualAssignModal && selectedComplaintForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Manual Vehicle Assignment</h3>
                  <p className="text-xs text-slate-400">
                    Pair an active garbage truck & driver to {selectedComplaintForAssign.ticketNumber || selectedComplaintForAssign.customId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowManualAssignModal(false);
                  setSelectedComplaintForAssign(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Complaint Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 block text-sm">
                {selectedComplaintForAssign.title || 'Roadside Waste Incident'}
              </span>
              <p className="text-slate-600 line-clamp-2">{selectedComplaintForAssign.description}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-amber-800">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {selectedComplaintForAssign.landmark || selectedComplaintForAssign.residentAddress || 'Designated Point'}
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {(selectedComplaintForAssign.lat || selectedComplaintForAssign.location?.lat || 28.6139).toFixed(4)}° N, {(selectedComplaintForAssign.lng || selectedComplaintForAssign.location?.lng || 77.2090).toFixed(4)}° E
                </span>
              </div>
            </div>

            <form onSubmit={handleManualAssignSubmit} className="space-y-4">
              {/* Select Garbage Truck */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Garbage Vehicle *</label>
                <select
                  required
                  value={manualAssignData.vehicleNumber}
                  onChange={(e) => {
                    const selVehicleNum = e.target.value;
                    const matchedVehicle = vehicles.find(v => v.vehicleNumber === selVehicleNum);
                    let matchedDriver = drivers.find(d => 
                      d.name === matchedVehicle?.assignedDriverName || 
                      d._id === matchedVehicle?.assignedDriverId ||
                      d.assignedVehicle === selVehicleNum
                    );
                    setManualAssignData(prev => ({
                      ...prev,
                      vehicleNumber: selVehicleNum,
                      driverName: matchedDriver ? matchedDriver.name : prev.driverName,
                      driverId: matchedDriver ? matchedDriver._id : prev.driverId
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500 font-semibold text-slate-800"
                >
                  <option value="">-- Choose Garbage Truck --</option>
                  {vehicles.length === 0 ? (
                    <option value="Compactor Truck #GFT-01">Compactor Truck #GFT-01 (Municipal Fleet)</option>
                  ) : (
                    vehicles.map(v => (
                      <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                        {v.vehicleNumber} ({v.vehicleType || 'Truck'} • {v.fuelType || 'CNG'} • Driver: {v.assignedDriverName || 'No Driver'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Select Fleet Driver */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Assigned Driver *</label>
                <select
                  required
                  value={manualAssignData.driverId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const d = drivers.find(drv => drv._id === selId);
                    setManualAssignData(prev => ({
                      ...prev,
                      driverId: selId,
                      driverName: d ? d.name : 'Municipal Operator',
                      vehicleNumber: (d?.assignedVehicle && d.assignedVehicle !== 'Vehicle Pending Assignment') 
                        ? d.assignedVehicle 
                        : prev.vehicleNumber
                    }));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-indigo-500 font-semibold text-slate-800"
                >
                  <option value="">-- Choose Operator Driver --</option>
                  {drivers.length === 0 ? (
                    <option value="" disabled>No drivers currently enrolled in database</option>
                  ) : (
                    drivers.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.customId || 'Driver'} • Sector: {d.activeSector || 'General'} • Vehicle: {d.assignedVehicle || 'Unassigned'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualAssignModal(false);
                    setSelectedComplaintForAssign(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !manualAssignData.vehicleNumber}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Confirm & Dispatch Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: REFUND POINTS MODAL (ORDER COMPLAINTS)            */}
      {/* ========================================================= */}
      {showRefundModal && selectedOrderComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Refund Eco-Reward Points</h3>
                  <p className="text-xs text-slate-400">
                    Order {selectedOrderComplaint.orderCustomId || selectedOrderComplaint.ticketNumber || 'RED-ORD'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedOrderComplaint(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident & Order Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  {selectedOrderComplaint.title || 'Reward Order Grievance'}
                </span>
                {selectedOrderComplaint.orderCustomId && (
                  <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-purple-700">
                    Order: #{selectedOrderComplaint.orderCustomId}
                  </span>
                )}
              </div>
              <p className="text-slate-600 line-clamp-2 italic">
                "{selectedOrderComplaint.description}"
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedOrderComplaint.residentName || selectedOrderComplaint.residentId?.name || 'Resident'}
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedOrderComplaint.residentSector || selectedOrderComplaint.residentAddress || 'Sector Area'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-4">
              {/* Points to refund */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eco-Points to Refund to Resident *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    required
                    value={refundForm.refundPoints}
                    onChange={(e) => setRefundForm({ ...refundForm, refundPoints: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-amber-900 focus:bg-white focus:outline-amber-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-amber-700">PTS</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Original points will be credited back to the citizen profile in real time.
                </span>
              </div>

              {/* Admin Resolution Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution & Audit Notes *
                </label>
                <textarea
                  rows="3"
                  required
                  value={refundForm.adminNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, adminNotes: e.target.value })}
                  placeholder="e.g. Verified defective item. Full points credited back to resident account."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-amber-500 font-medium"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Confirming will credit <strong>+{refundForm.refundPoints} PTS</strong> to the resident and mark this ticket <strong>Resolved (REFUND)</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedOrderComplaint(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !refundForm.refundPoints}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Crediting Points...' : 'Confirm Refund & Close Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CREATE EXCHANGE ORDER MODAL (ORDER COMPLAINTS)    */}
      {/* ========================================================= */}
      {showExchangeModal && selectedOrderComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Create Exchange Order</h3>
                  <p className="text-xs text-slate-400">
                    Replace item for Order {selectedOrderComplaint.orderCustomId || selectedOrderComplaint.ticketNumber || 'RED-ORD'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowExchangeModal(false);
                  setSelectedOrderComplaint(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident & Order Summary */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-950 text-sm">
                  {selectedOrderComplaint.title || 'Exchange Request'}
                </span>
                {selectedOrderComplaint.orderCustomId && (
                  <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-800">
                    Original Order: #{selectedOrderComplaint.orderCustomId}
                  </span>
                )}
              </div>
              <p className="text-purple-900 line-clamp-2 italic">
                "{selectedOrderComplaint.description}"
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-purple-700">
                <span className="font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  {selectedOrderComplaint.residentName || selectedOrderComplaint.residentId?.name || 'Resident'}
                </span>
                <span className="font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" />
                  {selectedOrderComplaint.residentSector || selectedOrderComplaint.residentAddress || 'Sector Area'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmExchange} className="space-y-4">
              {/* Replacement Item Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Replacement Gift / Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={exchangeForm.replacementTitle}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, replacementTitle: e.target.value })}
                  placeholder="e.g. Dual Kitchen Segregation Trash Can (Medium - 20L)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-purple-500"
                />
              </div>

              {/* Replacement Size / Spec */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Replacement Size / Options *
                </label>
                <input
                  type="text"
                  required
                  value={exchangeForm.replacementSize}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, replacementSize: e.target.value })}
                  placeholder="e.g. Large (30L / 2x15L Compartments)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:bg-white focus:outline-purple-500"
                />
              </div>

              {/* Exchange Dispatch Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exchange Fulfillment Notes *
                </label>
                <textarea
                  rows="3"
                  required
                  value={exchangeForm.adminNotes}
                  onChange={(e) => setExchangeForm({ ...exchangeForm, adminNotes: e.target.value })}
                  placeholder="e.g. Defective bin exchanged for replacement unit. Dispatched to Sector Hub for driver pickup."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-purple-500 font-medium"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  What happens next?
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  A brand-new order tagged <strong>[EXCHANGE]</strong> (0 PTS) will be placed in the <strong>Rewards Fulfillment Queue</strong>. You can pack and assign it to the sector driver immediately. The driver will deliver it and scan the resident's new exchange QR code at handover.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExchangeModal(false);
                    setSelectedOrderComplaint(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !exchangeForm.replacementTitle}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Generating Order...' : 'Create Exchange Order & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Leaflet Location Preview Modal */}
      {previewComplaint && (
        <LocationPreviewModal
          isOpen={Boolean(previewComplaint)}
          onClose={() => setPreviewComplaint(null)}
          title={previewComplaint.title || 'Incident Location'}
          customId={previewComplaint.customId || previewComplaint.ticketNumber || '#CMP'}
          lat={previewComplaint.lat || previewComplaint.location?.lat}
          lng={previewComplaint.lng || previewComplaint.location?.lng}
          landmark={previewComplaint.landmark}
          address={previewComplaint.residentAddress || previewComplaint.location?.address}
          status={previewComplaint.status}
          priority={previewComplaint.priority}
          complaintType={previewComplaint.complaintType}
          assignedDriver={previewComplaint.assignedDriver}
          assignedVehicle={previewComplaint.assignedVehicle}
        />
      )}

    </div>
  );
}
