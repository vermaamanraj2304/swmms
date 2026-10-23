import React, { useState } from 'react';
import { 
  Settings, 
  Sun, 
  Moon, 
  Volume2, 
  Radio, 
  ShieldCheck, 
  Database, 
  Check, 
  RefreshCw, 
  Bell, 
  Sparkles,
  Building2,
  Eye,
  Zap,
  Server,
  Activity
} from 'lucide-react';
import { soundManager } from '../../../utils/audioAlerts';

export default function AdminSettingsPage({
  theme = 'light',
  setTheme,
  data,
  showToast
}) {
  const [telemetrySyncSec, setTelemetrySyncSec] = useState(() => {
    try {
      return Number(localStorage.getItem('tmt_admin_sync_rate')) || 6;
    } catch {
      return 6;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('tmt_admin_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('tmt_admin_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
    if (showToast) {
      showToast(newTheme === 'dark' ? '🌙 Dark Mode Activated (HQ Night Command)' : '☀️ Light Mode Activated (Day Shift)', 'success');
    }
  };

  const handleSyncRateChange = (val) => {
    setTelemetrySyncSec(val);
    try {
      localStorage.setItem('tmt_admin_sync_rate', String(val));
    } catch {}
    if (showToast) showToast(`Fleet radar refresh interval set to ${val}s`, 'info');
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('tmt_admin_sound', String(next));
    } catch {}
    if (showToast) showToast(next ? 'HQ audio alerts enabled' : 'HQ audio muted', 'info');
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('tmt_admin_notifications');
      if (showToast) showToast('Admin terminal cache cleared successfully', 'success');
    } catch {
      if (showToast) showToast('Failed to clear cache', 'error');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-emerald-400 flex items-center justify-center shadow-md shrink-0 border border-slate-800">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Municipal Command Settings</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                HQ Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure command console theme, fleet radar polling rates, emergency audio chimes, and system diagnostics.
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Command Server Active
          </span>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE & THEME (Dark Mode) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">Theme & Display Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose between crisp day office mode or high-contrast midnight radar mode.</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isDark 
              ? 'bg-slate-950 text-amber-300 border-slate-700' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isDark ? '🌙 Dark Mode Active' : '☀️ Light Mode Active'}
          </span>
        </div>

        {/* Theme Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Light Theme Card */}
          <div 
            onClick={() => handleThemeChange('light')}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
              !isDark 
                ? 'border-[#00B074] bg-emerald-50/20 shadow-md ring-2 ring-[#00B074]/20' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-700 bg-white dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A] dark:text-slate-100">Day Command (Light)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High-contrast bright daylight theme</p>
                </div>
              </div>
              {!isDark && (
                <div className="w-6 h-6 rounded-full bg-[#00B074] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Preview Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="h-2 w-20 rounded-full bg-slate-300 dark:bg-slate-600"></div>
              <div className="h-2 w-12 rounded-full bg-slate-200 dark:bg-slate-700 ml-auto"></div>
            </div>
          </div>

          {/* Dark Theme Card */}
          <div 
            onClick={() => handleThemeChange('dark')}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
              isDark 
                ? 'border-[#00B074] bg-slate-950 text-white shadow-md ring-2 ring-[#00B074]/30' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-900 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 text-amber-400 flex items-center justify-center shrink-0 border border-indigo-800 shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Night Command (Dark)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Deep obsidian palette for 24/7 command consoles</p>
                </div>
              </div>
              {isDark && (
                <div className="w-6 h-6 rounded-full bg-[#00B074] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Preview Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <div className="h-2 w-20 rounded-full bg-slate-700"></div>
              <div className="h-2 w-12 rounded-full bg-slate-800 ml-auto"></div>
            </div>
          </div>
        </div>

        {/* Benefits Note */}
        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
          <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <strong className="text-slate-800 dark:text-white">Admin Tip:</strong> Dark Mode provides an immersive command center experience for monitoring real-time vehicle telemetry, roadside incidents, and SOS alerts across multi-screen setups.
          </div>
        </div>
      </div>

      {/* SECTION 2: AUDIO & DISPATCH ALERTS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">HQ Incident Audio Alerts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Audible notification chimes for resident grievances and urgent emergency dispatches.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSoundToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              soundEnabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? '🔔 Chimes On' : '🔕 Muted'}
          </button>
        </div>

        {/* Audio Test Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.playNotificationPing();
              if (showToast) showToast('Playing Notification Ping', 'info');
            }}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">Notification Ping</span>
              <span className="text-[10px] text-slate-400">New complaint ticket</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playDutyStartChime();
              if (showToast) showToast('Playing Driver Shift Chime', 'info');
            }}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">Shift Start Chime</span>
              <span className="text-[10px] text-slate-400">Driver logged on duty</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playEmergencyAlertChime();
              if (showToast) showToast('Playing Emergency SOS Alarm', 'info');
            }}
            className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-rose-800 dark:text-rose-300 block">Emergency SOS Siren</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400">High priority dispatch</span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3: FLEET RADAR TELEMETRY FREQUENCY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">Fleet Live Radar Refresh Rate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Background polling interval for driver GPS positions and curbside clearance status.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Current: {telemetrySyncSec}s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { sec: 4, label: 'High Precision (4s)', desc: 'Near real-time vehicle positions' },
            { sec: 6, label: 'Optimal Standard (6s)', desc: 'Recommended balance of data & sync' },
            { sec: 12, label: 'Low Bandwidth (12s)', desc: 'Reduced server requests' }
          ].map(opt => (
            <button
              key={opt.sec}
              type="button"
              onClick={() => handleSyncRateChange(opt.sec)}
              className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                telemetrySyncSec === opt.sec
                  ? 'border-[#00B074] bg-emerald-50/20 dark:bg-emerald-950/30 text-[#0F172A] dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{opt.label}</span>
                {telemetrySyncSec === opt.sec && <Check className="w-3.5 h-3.5 text-[#00B074]" />}
              </div>
              <span className="text-[10px] text-slate-400">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 4: DIAGNOSTICS & SYSTEM INFO */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A] dark:text-white">System Diagnostics & Storage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Municipal hub version and local telemetry cache management.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Local Cache
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">HQ Release</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">v2.4.0 (Build 2026.10)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Database</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">MongoDB Atlas Cluster</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sync Protocol</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">REST + WebSocket Dual</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Online & Synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
