import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Helper to obtain the appropriate auth token depending on target API resource and active view
const getPortalSpecificToken = (resource) => {
  const url = typeof resource === 'string' ? resource : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  if (url.startsWith('/api/driver')) {
    return localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
  }
  if (url.startsWith('/api/resident')) {
    return localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
  }
  if (url.startsWith('/api/admin')) {
    return localStorage.getItem('tmt_admin_token') || localStorage.getItem('tmt_token');
  }

  // Generic or auth routes (e.g. /api/auth/me) - infer from active page
  if (path.includes('/driver')) {
    return localStorage.getItem('tmt_driver_token') || localStorage.getItem('tmt_token');
  }
  if (path.includes('/resident')) {
    return localStorage.getItem('tmt_resident_token') || localStorage.getItem('tmt_token');
  }
  if (path.includes('/admin')) {
    return localStorage.getItem('tmt_admin_token') || localStorage.getItem('tmt_token');
  }

  return localStorage.getItem('tmt_token') || 
         localStorage.getItem('tmt_driver_token') || 
         localStorage.getItem('tmt_resident_token') || 
         localStorage.getItem('tmt_admin_token');
};

// Global fetch interceptor to inject JWT Authorization per portal and handle session expiry safely
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  config = config || {};
  config.headers = config.headers || {};

  const token = getPortalSpecificToken(resource);
  if (token) {
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      if (!config.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!config.headers['Authorization'] && !config.headers['authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const response = await originalFetch(resource, config);

  // Handle true session expiry (401 Unauthorized) only when no valid token exists for the current portal
  if (response.status === 401 && typeof resource === 'string' && resource.startsWith('/api/') && !resource.includes('/api/auth/login') && !resource.includes('/api/auth/demo-login')) {
    const currentPath = window.location.pathname;
    const isDriverPage = currentPath.includes('/driver');
    const isResidentPage = currentPath.includes('/resident');
    const isAdminPage = currentPath.includes('/admin');

    // Only redirect if the 401 corresponds to the active page portal
    const relevantApi = (isDriverPage && resource.startsWith('/api/driver')) ||
                        (isResidentPage && resource.startsWith('/api/resident')) ||
                        (isAdminPage && resource.startsWith('/api/admin')) ||
                        resource.startsWith('/api/auth/me');

    if (relevantApi) {
      const portal = isDriverPage ? 'driver' : (isAdminPage ? 'admin' : 'resident');
      localStorage.removeItem(`tmt_${portal}_token`);
      localStorage.removeItem(`tmt_${portal}_user`);
      if (!currentPath.startsWith('/login')) {
        window.location.href = `/login?portal=${portal}`;
      }
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
