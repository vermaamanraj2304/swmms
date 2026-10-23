import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [status, setStatus] = useState('checking'); // 'checking', 'authorized', 'unauthorized', 'forbidden'
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const verifyAuth = async () => {
      let token = null;
      let userStr = null;
      let portalKey = 'resident';

      if (allowedRoles.includes('driver')) {
        portalKey = 'driver';
        token = localStorage.getItem('tmt_driver_token');
        userStr = localStorage.getItem('tmt_driver_user');
        if (!token) {
          const fallbackUser = localStorage.getItem('tmt_user');
          try {
            const u = JSON.parse(fallbackUser || '{}');
            if ((u.role || '').toLowerCase() === 'driver') {
              token = localStorage.getItem('tmt_token');
              userStr = fallbackUser;
            }
          } catch {}
        }
      } else if (allowedRoles.includes('resident')) {
        portalKey = 'resident';
        token = localStorage.getItem('tmt_resident_token');
        userStr = localStorage.getItem('tmt_resident_user');
        if (!token) {
          const fallbackUser = localStorage.getItem('tmt_user');
          try {
            const u = JSON.parse(fallbackUser || '{}');
            if ((u.role || '').toLowerCase() === 'resident') {
              token = localStorage.getItem('tmt_token');
              userStr = fallbackUser;
            }
          } catch {}
        }
      } else if (allowedRoles.some(r => ['admin', 'cityadmin', 'superadmin', 'staff'].includes(r.toLowerCase()))) {
        portalKey = 'admin';
        token = localStorage.getItem('tmt_admin_token');
        userStr = localStorage.getItem('tmt_admin_user');
        if (!token) {
          const fallbackUser = localStorage.getItem('tmt_user');
          try {
            const u = JSON.parse(fallbackUser || '{}');
            if (['admin', 'cityadmin', 'superadmin', 'staff'].includes((u.role || '').toLowerCase())) {
              token = localStorage.getItem('tmt_token');
              userStr = fallbackUser;
            }
          } catch {}
        }
      } else {
        token = localStorage.getItem('tmt_token') || 
                localStorage.getItem('tmt_admin_token') || 
                localStorage.getItem('tmt_driver_token') || 
                localStorage.getItem('tmt_resident_token');
        userStr = localStorage.getItem('tmt_user') || 
                  localStorage.getItem('tmt_admin_user') || 
                  localStorage.getItem('tmt_driver_user') || 
                  localStorage.getItem('tmt_resident_user');
      }

      if (!token || !userStr) {
        if (isMounted) setStatus('unauthorized');
        return;
      }

      try {
        const localUser = JSON.parse(userStr);
        const userRole = (localUser.role || '').toLowerCase();
        
        // Check role eligibility
        const isRoleAllowed = allowedRoles.length === 0 || allowedRoles.some(r => {
          const expected = r.toLowerCase();
          if (expected === 'admin') {
            return userRole === 'admin' || userRole === 'cityadmin' || userRole === 'superadmin' || userRole === 'staff';
          }
          return userRole === expected;
        });

        // Verify with backend that account is valid & token hasn't been revoked
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        if (res.ok) {
          const freshUser = await res.json();
          const mergedUser = { ...localUser, ...freshUser, token };
          const mergedStr = JSON.stringify(mergedUser);

          if (!isRoleAllowed) {
            localStorage.removeItem(`tmt_${portalKey}_user`);
            localStorage.removeItem(`tmt_${portalKey}_token`);
            if (isMounted) {
              setAuthenticatedUser(mergedUser);
              setStatus('forbidden');
            }
          } else {
            localStorage.setItem(`tmt_${portalKey}_user`, mergedStr);
            localStorage.setItem(`tmt_${portalKey}_token`, token);
            localStorage.setItem('tmt_user', mergedStr);
            localStorage.setItem('tmt_token', token);

            if (isMounted) {
              setAuthenticatedUser(mergedUser);
              setStatus('authorized');
            }
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(`tmt_${portalKey}_token`);
          localStorage.removeItem(`tmt_${portalKey}_user`);
          if (isMounted) setStatus('unauthorized');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        // Network or parsing failure
        if (isMounted) setStatus('unauthorized');
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [location.pathname, (allowedRoles || []).join(',')]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <h3 className="text-sm font-bold text-slate-800">Verifying Municipal Accreditation...</h3>
        <p className="text-xs text-slate-400 mt-1">Authenticating session directly with municipal database.</p>
      </div>
    );
  }

  if (status === 'unauthorized') {
    const portal = allowedRoles.includes('admin') 
      ? 'admin' 
      : (allowedRoles.includes('driver') ? 'driver' : 'resident');
    return <Navigate to={`/login?portal=${portal}`} state={{ from: location }} replace />;
  }

  if (status === 'forbidden') {
    const currentRole = (authenticatedUser?.role || 'user').toLowerCase();
    const targetDashboard = currentRole === 'driver' ? '/driver' : (['admin', 'cityadmin', 'superadmin', 'staff'].includes(currentRole) ? '/admin' : '/resident');
    const requiredRoleLabel = allowedRoles.includes('admin') ? 'Municipal Administrator' : (allowedRoles.includes('driver') ? 'Fleet Driver' : 'Household Resident');

    const handleSwitchAccount = () => {
      localStorage.clear();
      const loginPortal = allowedRoles.includes('admin') ? 'admin' : (allowedRoles.includes('driver') ? 'driver' : 'resident');
      navigate(`/login?portal=${loginPortal}`, { replace: true });
    };

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
            <ShieldX className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              HTTP 403 • Role Authorization Required
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are authenticated as <strong className="text-slate-800 font-bold">{authenticatedUser?.name || 'Authorized User'}</strong> with the role <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">{currentRole}</span>.
            </p>
            <p className="text-xs text-slate-500">
              Access to this portal section requires <strong className="text-slate-700">{requiredRoleLabel}</strong> accreditation.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => navigate(targetDashboard, { replace: true })}
              className="w-full py-3 px-4 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Return to My Dashboard ({currentRole.toUpperCase()})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign In with Another Role</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
