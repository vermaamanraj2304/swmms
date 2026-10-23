import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useParams } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Dynamic Code-Splitting for Production Performance
const ResidentApp = lazy(() => import('./apps/resident/ResidentApp'));
const DriverApp = lazy(() => import('./apps/driver/DriverApp'));
const AdminApp = lazy(() => import('./apps/admin/AdminApp'));
const PortalLoginPage = lazy(() => import('./apps/PortalLoginPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));

// Production Portal Loading Fallback
function PortalLoadingFallback({ portalName = 'Municipal Portal' }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-4 shadow-xs"></div>
      <h3 className="text-sm font-bold text-slate-800">Loading {portalName}...</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">Initializing secure connection and municipal data stream.</p>
    </div>
  );
}

// Wrapper for query-param login: /login?portal=...
function PortalLoginWrapper() {
  const [searchParams] = useSearchParams();
  const portal = searchParams.get('portal') || 'resident';
  const validPortal = ['resident', 'driver', 'admin'].includes(portal) ? portal : (portal === 'superadmin' ? 'admin' : 'resident');
  return <PortalLoginPage portalType={validPortal} />;
}

// Wrapper for path-param login: /login/:portal
function PortalParamLoginWrapper() {
  const { portal } = useParams();
  const validPortal = ['resident', 'driver', 'admin'].includes(portal) ? portal : (portal === 'superadmin' ? 'admin' : 'resident');
  return <PortalLoginPage portalType={validPortal} />;
}

// Root destination redirector based on existing session accreditation
function RootRedirect() {
  try {
    const adminToken = localStorage.getItem('tmt_admin_token') || localStorage.getItem('tmt_token');
    const adminUser = localStorage.getItem('tmt_admin_user') || localStorage.getItem('tmt_user');
    if (adminToken && adminUser) {
      const u = JSON.parse(adminUser);
      if (['admin', 'cityadmin', 'superadmin', 'staff'].includes((u.role || '').toLowerCase())) {
        return <Navigate to="/admin" replace />;
      }
    }

    const driverToken = localStorage.getItem('tmt_driver_token');
    const driverUser = localStorage.getItem('tmt_driver_user');
    if (driverToken && driverUser) {
      const u = JSON.parse(driverUser);
      if ((u.role || '').toLowerCase() === 'driver') {
        return <Navigate to="/driver" replace />;
      }
    }

    const residentToken = localStorage.getItem('tmt_resident_token');
    const residentUser = localStorage.getItem('tmt_resident_user');
    if (residentToken && residentUser) {
      const u = JSON.parse(residentUser);
      if ((u.role || '').toLowerCase() === 'resident') {
        return <Navigate to="/resident" replace />;
      }
    }
  } catch {
    // ignore parse errors and proceed to login
  }

  return <Navigate to="/login?portal=resident" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
          <div className="flex-1">
            <Suspense fallback={<PortalLoadingFallback />}>
              <Routes>
                {/* Root Route Redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Authentication Routes */}
                <Route path="/login" element={<PortalLoginWrapper />} />
                <Route path="/login/:portal" element={<PortalParamLoginWrapper />} />

                {/* Resident Citizen Portal (Index + Deep-link Subroutes) */}
                <Route 
                  path="/resident" 
                  element={
                    <ProtectedRoute allowedRoles={['resident']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="Resident Portal" />}>
                        <ResidentApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/resident/:tab" 
                  element={
                    <ProtectedRoute allowedRoles={['resident']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="Resident Portal" />}>
                        <ResidentApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />

                {/* Fleet Driver Portal (Index + Deep-link Subroutes) */}
                <Route 
                  path="/driver" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="Driver Radar Terminal" />}>
                        <DriverApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/driver/:tab" 
                  element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="Driver Radar Terminal" />}>
                        <DriverApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />

                {/* Municipal Operations & City Admin Hub (Index + Deep-link Subroutes) */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'cityadmin', 'superadmin', 'staff']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="City Operations Admin Hub" />}>
                        <AdminApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/:tab" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'cityadmin', 'superadmin', 'staff']}>
                      <Suspense fallback={<PortalLoadingFallback portalName="City Operations Admin Hub" />}>
                        <AdminApp />
                      </Suspense>
                    </ProtectedRoute>
                  } 
                />

                {/* Production 404 Route Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
