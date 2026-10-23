import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Truck, Building2, Sparkles, LogIn, LogOut, User } from 'lucide-react';

export default function PortalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('tmt_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {}
    } else {
      setCurrentUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('tmt_user');
    localStorage.removeItem('tmt_token');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="bg-slate-900 text-white text-xs font-semibold py-2 px-6 sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 shadow-md">
      <div className="flex items-center gap-3">
        <NavLink to="/resident" className="flex items-center gap-2 hover:opacity-90">
          <Sparkles className="w-4 h-4 text-[#00B074]" />
          <span className="font-extrabold tracking-wider text-slate-200 uppercase text-[11px]">SWM&MS System</span>
        </NavLink>
      </div>

      <nav className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
        <NavLink
          to="/resident"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
              isActive
                ? 'bg-[#00B074] text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`
          }
        >
          <Home className="w-3.5 h-3.5" />
          <span>Resident Portal</span>
        </NavLink>

        <NavLink
          to="/driver"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
              isActive
                ? 'bg-[#00B074] text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`
          }
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Driver Terminal</span>
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
              isActive
                ? 'bg-[#00B074] text-white font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`
          }
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Municipal Admin</span>
        </NavLink>
      </nav>

      {/* User Login State / Actions */}
      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-3 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
            <div className="w-6 h-6 rounded-full bg-[#00B074] text-white flex items-center justify-center font-bold text-[10px]">
              {currentUser.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-bold text-[11px] text-slate-200 block leading-tight">{currentUser.name}</span>
              <span className="text-[9px] text-[#00B074] uppercase font-mono block">{currentUser.role || 'Resident'}</span>
            </div>
            <button 
              onClick={handleLogout} 
              title="Logout"
              className="text-slate-400 hover:text-rose-400 transition pl-1 border-l border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <NavLink 
            to="/login"
            className="flex items-center gap-1.5 bg-[#00B074] hover:bg-[#009663] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </NavLink>
        )}
      </div>
    </div>
  );
}
