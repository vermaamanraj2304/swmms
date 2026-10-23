import io from 'socket.io-client';

// Determine Socket.io server URL:
// 1. If VITE_SOCKET_URL is set, connect directly to that dedicated WebSocket server (e.g. Render / Railway).
// 2. If VITE_API_BASE_URL is set, use that server origin.
// 3. In local Vite development mode (import.meta.env.DEV), default to 'http://localhost:5001'.
// 4. In production, default to window.location.origin.
const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:5001';
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
};

const socketUrl = getSocketUrl();

if (typeof window !== 'undefined' && socketUrl.includes('vercel.app')) {
  console.warn(
    `[Socket.io Deployment Note] Target socket URL is hosted on Vercel (${socketUrl}). ` +
    'Vercel Serverless Functions do not support persistent WebSockets. ' +
    'To enable real-time fleet GPS tracking and instant alerts, host the backend on Render/Railway and configure VITE_SOCKET_URL.'
  );
}

export const socket = io(socketUrl, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 2500,
  timeout: 10000,
});

if (typeof window !== 'undefined') {
  socket.on('connect', () => {
    console.log('⚡ [Socket.io] Connected successfully:', socket.id);
  });
  socket.on('connect_error', (error) => {
    console.warn('⚠️ [Socket.io] Connection notice:', error.message);
  });
}

export default socket;
