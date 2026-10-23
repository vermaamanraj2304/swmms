import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, ArrowRight, Home, Truck, ShieldAlert, KeyRound } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
          <MapPinOff className="w-10 h-10 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block">
            HTTP 404 • Route Unresolved
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Municipal Route Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            The page, telemetry address, or service path you attempted to access does not exist or has been relocated within the municipal operations network.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Select an authorized municipal portal destination:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs">
            <Link
              to="/resident"
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <strong className="block font-bold text-slate-800 group-hover:text-emerald-700">Resident Portal</strong>
                <span className="text-[10px] text-slate-400">Track pickups & rewards</span>
              </div>
            </Link>

            <Link
              to="/driver"
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <strong className="block font-bold text-slate-800 group-hover:text-blue-700">Driver Radar</strong>
                <span className="text-[10px] text-slate-400">Route stops & dispatches</span>
              </div>
            </Link>

            <Link
              to="/admin"
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-teal-50/60 hover:border-teal-300 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <strong className="block font-bold text-slate-800 group-hover:text-teal-700">City Operations</strong>
                <span className="text-[10px] text-slate-400">Admin command center</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            to="/login?portal=resident"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 px-3 rounded-lg hover:bg-slate-100"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Go to Portal Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
