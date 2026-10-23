import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Volume2, 
  Truck, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  MessageSquare, 
  Info,
  Clock,
  RotateCcw,
  ChevronRight
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

function getNotificationVisual(type) {
  switch (type) {
    case 'doorstep':
    case 'siren':
      return {
        icon: Volume2,
        bg: 'bg-rose-100 text-rose-600 border-rose-200',
        badge: '🚨 DOORSTEP',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200'
      };
    case 'nearby':
    case 'proximity':
      return {
        icon: Bell,
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badge: '🔔 NEARBY',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    case 'pickup':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badge: '✅ PICKED UP',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
      };
    case 'points':
      return {
        icon: Sparkles,
        bg: 'bg-amber-100 text-amber-700 border-amber-200',
        badge: '🎉 POINTS',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
      };
    case 'refund':
      return {
        icon: RotateCcw,
        bg: 'bg-amber-100 text-amber-800 border-amber-300',
        badge: '💰 REFUND',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    case 'duty':
      return {
        icon: Truck,
        bg: 'bg-blue-100 text-blue-700 border-blue-200',
        badge: '🚚 SHIFT',
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    case 'emergency':
      return {
        icon: AlertTriangle,
        bg: 'bg-orange-100 text-orange-700 border-orange-200',
        badge: '⚠️ EMERGENCY',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    case 'complaint':
      return {
        icon: MessageSquare,
        bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        badge: '📢 TICKET',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      };
    default:
      return {
        icon: Info,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        badge: 'ℹ️ NOTICE',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}

export default function ResidentNotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onClearAll,
  onNotificationClick
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
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
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`relative p-2.5 rounded-2xl border transition flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-[#00B074]/15 border-[#00B074] text-[#00B074]'
            : 'bg-white border-slate-200 text-slate-600 hover:text-[#00B074] hover:bg-slate-50 shadow-xs'
        }`}
        title="View Notifications"
        aria-label="View notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-[#00B074]' : ''}`} />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-50">
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
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00B074]/15 text-[#00B074] flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A] leading-tight flex items-center gap-2">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00B074] text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    type="button"
                    onClick={() => onMarkAllRead()}
                    className="p-1.5 text-xs text-[#00B074] hover:bg-emerald-50 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="text-[11px] hidden sm:inline">Mark read</span>
                  </button>
                )}
                {notifications.length > 0 && onClearAll && (
                  <button
                    type="button"
                    onClick={() => onClearAll()}
                    className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full font-bold transition shrink-0 cursor-pointer ${
                    filter === 'all'
                      ? 'bg-[#00B074] text-white shadow-xs'
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
                      ? 'bg-[#00B074] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            )}

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const visual = getNotificationVisual(item.type || item.category);
                  const IconComponent = visual.icon;
                  const isUnread = !item.read;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onNotificationClick) onNotificationClick(item.id);
                        setIsOpen(false);
                      }}
                      className={`p-3.5 sm:p-4 transition cursor-pointer flex items-start gap-3 hover:bg-slate-50/90 group ${
                        isUnread ? 'bg-emerald-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Visual Icon Badge */}
                      <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${visual.bg}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${visual.badgeBg}`}>
                            {visual.badge}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span>{formatNotificationTime(item.createdAt || item.timestamp)}</span>
                          </span>
                        </div>

                        <h4 className={`text-xs font-bold leading-tight ${isUnread ? 'text-[#0F172A]' : 'text-slate-800'}`}>
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 leading-relaxed font-normal line-clamp-2">
                          {item.message}
                        </p>

                        {item.actionTab && (
                          <div className="pt-0.5 flex items-center gap-1 text-[10px] font-bold text-[#00B074] group-hover:text-emerald-700">
                            <span>View Details</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator dot */}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#00B074] shrink-0 mt-1.5 shadow-xs" title="Unread" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700">No Notifications</h4>
                  <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                    {filter === 'unread'
                      ? 'All notifications have been read.'
                      : 'Real-time driver updates, approach sirens, and pickup points will appear here.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                <span className="font-medium">SWM&MS Live Dispatch</span>
                {unreadCount > 0 && onMarkAllRead ? (
                  <button
                    type="button"
                    onClick={() => onMarkAllRead()}
                    className="font-bold text-[#00B074] hover:underline cursor-pointer"
                  >
                    Mark all as read
                  </button>
                ) : (
                  <span className="font-bold text-slate-600">{notifications.length} Total</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
