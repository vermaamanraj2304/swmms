import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  Home, 
  Shield 
} from 'lucide-react';

export default function AuthApp({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [role, setRole] = useState(searchParams.get('role') || 'resident');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { name, email, password, role, phone, address };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('tmt_token', data.token);
        localStorage.setItem('tmt_user', JSON.stringify(data));
        setSuccessMsg(isLogin ? 'Login successful! Redirecting...' : 'Account registered successfully!');

        setTimeout(() => {
          const targetRole = data.role || role;
          if (targetRole === 'driver') navigate('/driver');
          else if (targetRole === 'cityadmin' || targetRole === 'admin') navigate('/admin');
          else navigate('/resident');
        }, 1000);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: demoRole })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('tmt_token', data.token);
        localStorage.setItem('tmt_user', JSON.stringify(data));
        setSuccessMsg(`Logged in as Demo ${demoRole.toUpperCase()}!`);
        setTimeout(() => {
          if (demoRole === 'driver') navigate('/driver');
          else if (demoRole === 'cityadmin') navigate('/admin');
          else navigate('/resident');
        }, 800);
      } else {
        setError(data.message || 'Demo login failed');
      }
    } catch (err) {
      setError('Server error during demo login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#F8FAFC] flex items-center justify-center p-6 antialiased">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Left Informational Hero Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-[#00B074]/20 blur-3xl"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00B074] rounded-2xl flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base leading-tight">SWM&MS</h2>
                <span className="text-[10px] font-bold text-[#00B074] tracking-wider uppercase block">Smart Municipal System</span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h3 className="text-xl font-bold leading-snug">AI-Powered Municipal Waste Management</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect residents, fleet drivers, and municipal administrators on a unified smart sanitation network.
              </p>
            </div>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#00B074]" />
                <span>Earn Garbage Points for clean recycling</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#00B074]" />
                <span>Real-time driver GPS telemetry map</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-[#00B074]" />
                <span>Computer Vision AI Waste Scanner</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Buttons */}
          <div className="pt-8 border-t border-slate-800 space-y-2 relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">⚡ ONE-CLICK DEMO ACCESS</span>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleDemoLogin('resident')}
                className="bg-slate-800/80 hover:bg-[#00B074] text-white p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition"
              >
                <Home className="w-4 h-4" /> Resident
              </button>

              <button 
                onClick={() => handleDemoLogin('driver')}
                className="bg-slate-800/80 hover:bg-[#00B074] text-white p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition"
              >
                <Truck className="w-4 h-4" /> Driver
              </button>

              <button 
                onClick={() => handleDemoLogin('cityadmin')}
                className="bg-slate-800/80 hover:bg-[#00B074] text-white p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition"
              >
                <Shield className="w-4 h-4" /> Municipal
              </button>
            </div>
          </div>
        </div>

        {/* Right Auth Form */}
        <div className="md:col-span-7 p-8 space-y-6 flex flex-col justify-between">
          
          {/* Top Toggle Pills */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <span className="px-5 py-2 rounded-xl bg-white text-[#00B074] shadow-xs">
                Sign In
              </span>
            </div>

            <span className="text-xs text-slate-400 font-mono">CleanCity OS 2026</span>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-[#E6F7F2] border border-[#00B074]/30 text-[#00B074] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Role Picker for Registration */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Account Type / Portal Role</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('resident')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      role === 'resident' 
                        ? 'border-[#00B074] bg-[#E6F7F2] text-[#00B074]' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" /> Resident
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('driver')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      role === 'driver' 
                        ? 'border-[#00B074] bg-[#E6F7F2] text-[#00B074]' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" /> Driver
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('cityadmin')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      role === 'cityadmin' 
                        ? 'border-[#00B074] bg-[#E6F7F2] text-[#00B074]' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" /> Admin
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00B074]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@cleancty.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00B074]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00B074]"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2831"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00B074]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="House #42, Greenfield"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00B074]"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00B074] hover:bg-[#009663] text-white py-3 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
