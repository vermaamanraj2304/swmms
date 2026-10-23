import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

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

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SWM&MS Production API & WebSocket Server Active',
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

// Start DB & HTTP Server
connectDB().then(async () => {
  await ensureSuperadminAccount();
  server.listen(PORT, () => {
    console.log(`🚀 SWM&MS Production Server running on http://localhost:${PORT}`);
  });
});

export { app, server, io };
