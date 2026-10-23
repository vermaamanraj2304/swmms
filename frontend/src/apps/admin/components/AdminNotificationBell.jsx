import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  AlertTriangle, 
  MessageSquare, 
  Package, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  Info,
  Clock,
  ChevronRight,
  RotateCcw,
  Gift
} from 'lucide-react';

function formatNotificationTime(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return String(timestamp);
    
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently';
  }
}

function getAdminNotificationVisual(type) {
  switch (type) {
    case 'emergency':
    case 'sos':
      return {
        icon: AlertTriangle,
        bg: 'bg-rose-100 text-rose-700 border-rose-200',
        badge: '🚨 SOS ALERT',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      };
    case 'complaint':
    case 'ticket':
      return {
        icon: MessageSquare,
        bg: 'bg-amber-100 text-amber-700 border-amber-200',
        badge: '📢 GRIEVANCE',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      };
    case 'order':
    case 'reward':
      return {
        icon: Package,
        bg: 'bg-purple-100 text-purple-700 border-purple-200',
        badge: '🎁 REWARD ORDER',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200'
      };
    case 'refund':
      return {
        icon: RotateCcw,
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        badge: '💰 ORDER REFUND',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    case 'duty':
    case 'driver':
    case 'fleet':
      return {
        icon: Truck,
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        badge: '🚚 FLEET SHIFT',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'pickup':
    case 'collection':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badge: '♻️ WASTE CLEARED',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    case 'payment':
    case 'finance':
      return {
        icon: CreditCard,
        bg: 'bg-teal-100 text-teal-700 border-teal-200',
        badge: '💳 TREASURY',
        badgeBg: 'bg-teal-100 text-teal-800 border-teal-200'
      };
    default:
      return {
        icon: Info,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: 'ℹ️ MUNICIPAL',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}

export default function AdminNotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll,
  onNotificationClick
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'issues' | 'orders' | 'ops'
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'issues') return n.type === 'emergency' || n.type === 'sos' || n.type === 'complaint' || n.type === 'ticket';
    if (filter === 'orders') return n.type === 'order' || n.type === 'reward' || n.type === 'refund';
    if (filter === 'ops') return n.type === 'duty' || n.type === 'fleet' || n.type === 'pickup' || n.type === 'payment' || n.type === 'driver';
    return true;
  });

  const issueCount = notifications.filter(n => (n.type === 'emergency' || n.type === 'complaint') && !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2.5 rounded-2xl border transition flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
            : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 shadow-xs'
        }`}
        title="Municipal Command Notifications"
        aria-label="View notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-emerald-700' : ''}`} />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1.5 -right-1.5 text-white font-black text-[10px] min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-50 ${
            issueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-[#00B074]'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-2xs z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-x-3 top-[68px] sm:inset-x-auto sm:right-4 sm:top-[68px] sm:w-96 md:absolute md:right-0 md:top-full md:mt-2.5 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)] md:max-h-[34rem] animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Command HQ Alerts</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time incident & operational feed</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-white/10 transition flex items-center gap-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark all</span>
                  </button>
                )}
                {notifications.length > 0 && onClearAll && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition cursor-pointer"
                    title="Clear all alerts"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('issues')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'issues'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200'
                  }`}
                >
                  🚨 SOS / Issues
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('orders')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'orders'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                  }`}
                >
                  🎁 Orders
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('ops')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'ops'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                  }`}
                >
                  🚚 Ops
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700">No Notifications</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {filter === 'unread' 
                      ? 'All municipal alerts have been reviewed.'
                      : 'System is running smoothly. New incidents and operational events will notify here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const visual = getAdminNotificationVisual(notif.type);
                  const IconComponent = visual.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (onNotificationClick) {
                          onNotificationClick(notif.id);
                        }
                        setIsOpen(false);
                      }}
                      className={`p-3.5 sm:p-4 transition flex items-start gap-3 cursor-pointer group ${
                        notif.read ? 'bg-white hover:bg-slate-50/80' : 'bg-emerald-50/30 hover:bg-emerald-50/60'
                      }`}
                    >
                      {/* Visual Icon */}
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 shadow-2xs ${visual.bg}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${visual.badgeBg}`}>
                            {visual.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            {formatNotificationTime(notif.createdAt)}
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold leading-tight ${notif.read ? 'text-slate-800' : 'text-[#0F172A]'}`}>
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>

                        {notif.actionTab && (
                          <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-emerald-700 group-hover:text-emerald-800">
                            <span>View Details</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator dot */}
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 shadow-xs" title="Unread" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                <span className="font-medium">Municipal Command HQ</span>
                <span className="font-bold text-slate-700">{notifications.length} Total Alerts</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
