import io from 'socket.io-client';

// Determine Socket.io server URL:
// 1. If VITE_SOCKET_URL or VITE_API_BASE_URL is set, connect to that remote server.
// 2. In local Vite development mode (import.meta.env.DEV), default to 'http://localhost:5001'.
// 3. In production, default to window.location.origin for same-origin or reverse-proxied deployments.
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
  return window.location.origin;
};

export const socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

export default socket;
