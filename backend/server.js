import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './src/config/db.js';
import './src/models/User.js';
import { ensureSuperadminAccount } from './src/controllers/auth.controller.js';
import apiRoutes from './src/routes/index.js';
import { handleSocketEvents } from './src/sockets/socket.handler.js';
import { errorHandler, notFound } from './src/middleware/error.middleware.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config(); // fallback

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Expose Socket.io instance to Express App
app.set('io', io);

// Ensure MongoDB is connected on incoming requests (vital for serverless cold starts)
let isSuperadminEnsured = false;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await connectDB();
      if (!isSuperadminEnsured) {
        isSuperadminEnsured = true;
        ensureSuperadminAccount().catch(e => console.warn('Superadmin init notice:', e.message));
      }
    } catch (err) {
      console.error('Database connection middleware warning:', err.message);
      return res.status(503).json({
        success: false,
        message: `Database Connection Failed: ${err.message}`
      });
    }
  }
  next();
});

// Provide immediate explicit response if socket.io is hit on Vercel serverless
if (process.env.VERCEL) {
  app.all('/socket.io*', (req, res) => {
    res.status(501).json({
      success: false,
      error: 'SOCKET_IO_UNSUPPORTED_ON_SERVERLESS',
      message: 'Vercel Serverless Functions do not support persistent WebSockets/Socket.io. Host the backend on Render, Railway, or a persistent Node.js server and set VITE_SOCKET_URL in your frontend.'
    });
  });
}

// Root Status Endpoint (or serve frontend if dist exists)
app.get('/', (req, res, next) => {
  const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    return next();
  }
  res.json({
    status: 'success',
    message: '🚀 SWM&MS Smart Waste Management API Server is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      resident: '/api/resident',
      driver: '/api/driver',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    status: isConnected ? 'OK' : 'DEGRADED',
    database: states[mongoose.connection.readyState] || 'Unknown',
    message: isConnected 
      ? 'SWM&MS Production API & WebSocket Server Active'
      : 'API active, but MongoDB is not connected. Check MONGODB_URI.',
    timestamp: new Date().toISOString()
  });
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// Socket.io Handlers
handleSocketEvents(io);

// Serve Built Frontend Static Files in Production (if dist exists)
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  });
}

// 404 & Global Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Start DB & HTTP Server (only in standalone Node / local environment, not inside Vercel serverless)
if (!process.env.VERCEL) {
  connectDB().then(async () => {
    try {
      await ensureSuperadminAccount();
    } catch (e) {
      console.warn('Superadmin initialization warning:', e.message);
    }
    server.listen(PORT, () => {
      console.log(`🚀 SWM&MS Production Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
export { app, server, io };
