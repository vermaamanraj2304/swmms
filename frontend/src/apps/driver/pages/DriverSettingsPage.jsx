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
  Smartphone,
  Eye,
  Zap,
  BatteryCharging
} from 'lucide-react';
import { soundManager } from '../../../utils/audioAlerts';

export default function DriverSettingsPage({
  theme = 'light',
  setTheme,
  isOnDuty = false,
  onToggleDuty,
  data,
  showToast
}) {
  const [gpsIntervalSec, setGpsIntervalSec] = useState(() => {
    try {
      return Number(localStorage.getItem('tmt_driver_gps_interval')) || 5;
    } catch {
      return 5;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('tmt_driver_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [highAccuracy, setHighAccuracy] = useState(() => {
    try {
      return localStorage.getItem('tmt_driver_high_accuracy') !== 'false';
    } catch {
      return true;
    }
  });

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('tmt_driver_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
    if (showToast) {
      showToast(newTheme === 'dark' ? '🌙 Dark Mode Activated (Night Shift Vision)' : '☀️ Light Mode Activated (Day Shift Vision)', 'success');
    }
  };

  const handleGpsIntervalChange = (val) => {
    setGpsIntervalSec(val);
    try {
      localStorage.setItem('tmt_driver_gps_interval', String(val));
    } catch {}
    if (showToast) showToast(`GPS broadcast interval set to ${val}s`, 'info');
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      localStorage.setItem('tmt_driver_sound', String(next));
    } catch {}
    if (showToast) showToast(next ? 'Sound alerts enabled' : 'Sound alerts muted', 'info');
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('tmt_driver_notifications');
      if (showToast) showToast('Terminal cache cleared successfully', 'success');
    } catch {
      if (showToast) showToast('Failed to clear cache', 'error');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B074] to-[#008f5d] text-white flex items-center justify-center shadow-md shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0F172A]">Terminal Settings</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Driver OS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize terminal theme, audible dispatches, GPS telemetry rates, and system diagnostics.
            </p>
          </div>
        </div>

        {/* Quick Shift Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
          <span className="text-xs font-bold text-slate-700">
            {isOnDuty ? 'Shift Active' : 'Off Duty'}
          </span>
        </div>
      </div>

      {/* SECTION 1: APPEARANCE & THEME (Dark Mode) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              {isDark ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">Theme & Appearance</h3>
              <p className="text-xs text-slate-500">Select display mode tailored for sunlight day drives or night vision shifts.</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isDark 
              ? 'bg-slate-900 text-amber-300 border-slate-700' 
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
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0F172A]">Day Shift (Light)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">High-contrast bright daylight mode</p>
                </div>
              </div>
              {!isDark && (
                <div className="w-6 h-6 rounded-full bg-[#00B074] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Preview Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="h-2 w-20 rounded-full bg-slate-300"></div>
              <div className="h-2 w-12 rounded-full bg-slate-200 ml-auto"></div>
            </div>
          </div>

          {/* Dark Theme Card */}
          <div 
            onClick={() => handleThemeChange('dark')}
            className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
              isDark 
                ? 'border-[#00B074] bg-slate-900 text-white shadow-md ring-2 ring-[#00B074]/30' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-900 text-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 text-amber-400 flex items-center justify-center shrink-0 border border-indigo-800 shadow-2xs">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Night Shift (Dark)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Reduces eye glare & saves OLED battery</p>
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
        <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/80 flex items-start gap-3">
          <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <strong className="text-slate-800">Pro Tip for Drivers:</strong> Switching to <strong>Dark Theme</strong> during evening shifts reduces dashboard glare on your windshield, improves navigation map legibility in low light, and extends mobile battery life.
          </div>
        </div>
      </div>

      {/* SECTION 2: AUDIO & DISPATCH ALERTS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">Audible Dispatch & Chimes</h3>
              <p className="text-xs text-slate-500">Audio feedback for curbside check-ins, doorstep alerts, and urgent SOS jobs.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSoundToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              soundEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {soundEnabled ? '🔔 Sound On' : '🔕 Muted'}
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
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 block">Notification Ping</span>
              <span className="text-[10px] text-slate-400">Order & Task arrival</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playPointsCreditedChime();
              if (showToast) showToast('Playing Waste Collection Chime', 'info');
            }}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-800 block">Collection Chime</span>
              <span className="text-[10px] text-slate-400">Weight & Points verified</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playEmergencyAlertChime();
              if (showToast) showToast('Playing Emergency SOS Alert', 'info');
            }}
            className="p-3.5 rounded-2xl border border-rose-200 hover:border-rose-300 hover:bg-rose-50/50 transition text-left cursor-pointer flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-rose-800 block">Emergency SOS</span>
              <span className="text-[10px] text-rose-600">Urgent pickup chime</span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 3: GPS TELEMETRY & HARDWARE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">GPS Telemetry Frequency</h3>
              <p className="text-xs text-slate-500">Configure how often your vehicle coordinates broadcast to residents and Admin HQ.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Current: {gpsIntervalSec}s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { sec: 3, label: 'Ultra High (3s)', desc: 'Instant precision tracking', icon: Zap },
            { sec: 5, label: 'Recommended (5s)', desc: 'Balanced telemetry rate', icon: Radio },
            { sec: 10, label: 'Battery Saver (10s)', desc: 'Reduced battery & mobile data', icon: BatteryCharging }
          ].map(opt => (
            <button
              key={opt.sec}
              type="button"
              onClick={() => handleGpsIntervalChange(opt.sec)}
              className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                gpsIntervalSec === opt.sec
                  ? 'border-[#00B074] bg-emerald-50/20 text-[#0F172A]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{opt.label}</span>
                {gpsIntervalSec === opt.sec && <Check className="w-3.5 h-3.5 text-[#00B074]" />}
              </div>
              <span className="text-[10px] text-slate-400">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Live GPS Coordinates Info */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Broadcast Coordinates:</span>
            <span className="font-mono font-bold text-slate-800">
              {data?.liveLocation?.lat ? `${Number(data.liveLocation.lat).toFixed(6)}, ${Number(data.liveLocation.lng).toFixed(6)}` : '28.613900, 77.209000 (Depot)'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
            HTTP + WebSocket Dual Stream
          </span>
        </div>
      </div>

      {/* SECTION 4: DIAGNOSTICS & SYSTEM INFO */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0F172A]">Terminal Diagnostics & Cache</h3>
              <p className="text-xs text-slate-500">View client version and manage local trip data storage.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Local Cache
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Version</span>
            <span className="font-bold text-slate-800">v2.4.0 (2026.10)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Framework</span>
            <span className="font-bold text-slate-800">React + Leaflet</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Protocol</span>
            <span className="font-bold text-slate-800">REST + WSS</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Connection</span>
            <span className="font-bold text-emerald-600">Hub Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
