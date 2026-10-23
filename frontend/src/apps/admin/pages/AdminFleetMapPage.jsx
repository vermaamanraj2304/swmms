import React from 'react';
import AdminFleetLiveMap from '../components/AdminFleetLiveMap';

export default function AdminFleetMapPage({ data, driverLocations }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">REAL-TIME TELEMETRY</span>
        <h2 className="text-2xl font-bold text-[#0F172A]">Live Fleet GPS Tracking Map</h2>
        <p className="text-xs text-slate-500">
          Monitor municipal collection vehicles and residential properties in real-time.
        </p>
      </div>

      <AdminFleetLiveMap data={data} driverLocations={driverLocations} height="600px" />
    </div>
  );
}

