import React from 'react';
import { Users, Truck, Recycle, AlertTriangle, ChevronRight } from 'lucide-react';

export default function AdminKpiGrid({ stats = {}, onViewEmergencies }) {
  const activeCount = stats.openEmergencies !== undefined 
    ? stats.openEmergencies 
    : (stats.activeEmergencies !== undefined ? stats.activeEmergencies : 0);

  const kpis = [
    {
      id: 'residents',
      title: 'TOTAL RESIDENTS',
      value: stats.totalResidents || 0,
      suffix: '',
      subtitle: 'Registered households',
      subColor: 'text-slate-500',
      dotColor: 'bg-emerald-500',
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600',
      valColor: 'text-slate-900'
    },
    {
      id: 'drivers',
      title: 'ACTIVE DRIVERS',
      value: stats.activeDrivers || 0,
      suffix: '',
      subtitle: 'Broadcasting on-duty GPS',
      subColor: stats.activeDrivers > 0 ? 'text-blue-600 font-medium' : 'text-slate-500',
      dotColor: stats.activeDrivers > 0 ? 'bg-blue-500' : 'bg-slate-300',
      icon: Truck,
      iconBg: 'bg-blue-50 text-blue-600',
      valColor: 'text-slate-900'
    },
    {
      id: 'recycling',
      title: 'MUNICIPAL RECYCLING',
      value: stats.totalDivertedKg || 0,
      suffix: 'KG',
      subtitle: 'Diverted from landfill',
      subColor: 'text-slate-500',
      dotColor: 'bg-teal-500',
      icon: Recycle,
      iconBg: 'bg-teal-50 text-teal-600',
      valColor: 'text-slate-900'
    },
    {
      id: 'sos',
      title: 'EMERGENCY SOS',
      value: activeCount,
      suffix: '',
      subtitle: activeCount > 0 ? `${activeCount} requests pending` : 'No active alert',
      subColor: activeCount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500',
      dotColor: activeCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500',
      icon: AlertTriangle,
      iconBg: activeCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-500',
      valColor: activeCount > 0 ? 'text-rose-600' : 'text-slate-900',
      onClick: onViewEmergencies
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        const isInteractive = Boolean(kpi.onClick);
        const hasAlert = kpi.id === 'sos' && activeCount > 0;

        return (
          <div
            key={kpi.id}
            onClick={kpi.onClick}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onKeyDown={(e) => {
              if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                kpi.onClick();
              }
            }}
            className={`group bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-200 relative flex flex-col justify-between ${
              hasAlert
                ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300 shadow-2xs hover:shadow-xs'
                : 'border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            } ${isInteractive ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {kpi.title}
              </span>
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
            </div>

            {/* Metric Value & Subtitle */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${kpi.valColor}`}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-IN') : kpi.value}
                </h3>
                {kpi.suffix && (
                  <span className="text-xs sm:text-sm font-bold text-slate-400">
                    {kpi.suffix}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${kpi.dotColor}`} />
                <span className={`text-[11px] sm:text-xs font-medium truncate ${kpi.subColor}`}>
                  {kpi.subtitle}
                </span>

                {isInteractive && (
                  <span className="ml-auto text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 group-hover:text-rose-600 transition-colors">
                    <span>View</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition-colors" />
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
