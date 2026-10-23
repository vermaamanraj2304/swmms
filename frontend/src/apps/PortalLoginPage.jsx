import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Home, 
  Truck, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

export default function PortalLoginPage({ portalType = 'resident' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [municipalName, setMunicipalName] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tmt_admin_user')) || JSON.parse(localStorage.getItem('tmt_user'));
      if (saved && ['admin', 'cityadmin'].includes(saved.role) && saved.name) {
        return saved.name;
      }
    } catch {}
    return 'Greater Noida Municipal Authority';
  });

  const [municipalCity, setMunicipalCity] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('tmt_admin_user')) || JSON.parse(localStorage.getItem('tmt_user'));
      if (saved?.city) return saved.city;
    } catch {}
    return 'Greater Noida';
  });

  useEffect(() => {
    fetch('/api/auth/municipal-info')
      .then(res => res.json())
      .then(data => {
        if (data?.name) setMunicipalName(data.name);
        if (data?.city) setMunicipalCity(data.city);
      })
      .catch(() => {});
  }, []);

  const portalConfig = {
    resident: {
      title: 'Resident Citizen Portal',
      subtitle: 'Track your scheduled garbage pickup, green points, and route telemetry',
      badge: 'CITIZEN ACCESS',
      role: 'resident',
      color: 'emerald',
      bgGrad: 'from-emerald-950 via-slate-900 to-slate-950',
      icon: Home,
      targetPath: '/resident'
    },
    driver: {
      title: 'Fleet Driver Terminal',
      subtitle: 'Vehicle turn-by-turn navigation, digital weigh-in, and route stops',
      badge: 'OPERATOR ACCESS',
      role: 'driver',
      color: 'blue',
      bgGrad: 'from-blue-950 via-slate-900 to-slate-950',
      icon: Truck,
      targetPath: '/driver'
    },
    admin: {
      title: municipalName,
      subtitle: `${municipalCity} citywide live radar, driver area assignment, and citizen registry`,
      badge: `${municipalCity.toUpperCase()} MUNICIPALITY`,
      role: 'admin',
      color: 'slate',
      bgGrad: 'from-slate-950 via-slate-900 to-black',
      icon: Building2,
      targetPath: '/admin'
    }
  }[portalType === 'superadmin' ? 'admin' : portalType] || {};

  const IconComponent = portalConfig.icon || Home;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTargetDestination = () => {
    if (location.state?.from?.pathname) {
      return `${location.state.from.pathname}${location.state.from.search || ''}`;
    }
    return portalConfig.targetPath;
  };

  useEffect(() => {
    // If user is already authenticated for this portal, redirect to destination
    const existingToken = localStorage.getItem(`tmt_${portalType}_token`) || localStorage.getItem('tmt_token');
    const existingUser = localStorage.getItem(`tmt_${portalType}_user`) || localStorage.getItem('tmt_user');
    if (existingToken && existingUser) {
      try {
        const u = JSON.parse(existingUser);
        const userRole = (u.role || '').toLowerCase();
        const expected = (portalConfig.role || '').toLowerCase();
        const matches = (expected === 'admin' || expected === 'superadmin')
          ? ['admin', 'cityadmin', 'superadmin', 'staff'].includes(userRole)
          : userRole === expected;
        if (matches) {
          navigate(getTargetDestination(), { replace: true });
        }
      } catch {
        // Continue showing login if user JSON is corrupt
      }
    }
  }, [portalType, portalConfig.role, portalConfig.targetPath, navigate, location.state]);

  const savePortalAuth = (data, pType) => {
    if (!data) return;
    const token = data.token;
    const userJson = JSON.stringify(data);
    localStorage.setItem('tmt_token', token);
    localStorage.setItem('tmt_user', userJson);

    if (pType === 'driver') {
      localStorage.setItem('tmt_driver_token', token);
      localStorage.setItem('tmt_driver_user', userJson);
    } else if (pType === 'resident') {
      localStorage.setItem('tmt_resident_token', token);
      localStorage.setItem('tmt_resident_user', userJson);
    } else if (pType === 'admin' || pType === 'superadmin') {
      localStorage.setItem('tmt_admin_token', token);
      localStorage.setItem('tmt_admin_user', userJson);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginIdentifier: identifier,
          password,
          role: portalConfig.role
        })
      });

      const data = await res.json();

      if (res.ok) {
        savePortalAuth(data, portalType);
        navigate(getTargetDestination(), { replace: true });
      } else {
        setError(data.message || 'Invalid Login ID or Password');
      }
    } catch (err) {
      setError('Connection error with municipal server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${portalConfig.bgGrad} flex items-center justify-center p-4 antialiased text-white`}>
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Portal Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-inner">
            <IconComponent className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
            {portalConfig.badge}
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">{portalConfig.title}</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {portalConfig.subtitle}
          </p>
        </div>

        {/* Portal Switcher Nav */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => navigate('/login?portal=resident')}
            className={`py-2 rounded-xl transition ${portalType === 'resident' ? 'bg-[#00B074] text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
          >
            Resident
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?portal=driver')}
            className={`py-2 rounded-xl transition ${portalType === 'driver' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
          >
            Driver
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?portal=admin')}
            className={`py-2 rounded-xl transition ${portalType === 'admin' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
          >
            Admin HQ
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Email Address or Login ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Enter your email or ID"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#00B074] hover:bg-[#009663] text-white font-bold rounded-2xl text-xs transition shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Authenticating with Municipal DB...' : (portalType === 'admin' ? `Sign In to ${portalConfig.title}` : `Sign In to ${portalConfig.title.split(' ')[0]} Portal`)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
