import { Driver } from '../models/Driver.js';
import { User } from '../models/User.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';

// In-memory driver cache to optimize high-frequency 1-second GPS stream
const driverCache = new Map();

export const handleSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket Client Connected: ${socket.id}`);

    // Real-time live GPS broadcast from driver -> persist to DB & broadcast to Resident and Admin immediately every second
    socket.on('update-location', async (data) => {
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      try {
        const cacheKey = data.driverMongoId ? String(data.driverMongoId) : (data.driverId || data.driverName);
        let existingDriver = cacheKey ? driverCache.get(cacheKey) : null;

        if (!existingDriver) {
          const query = data.driverMongoId 
            ? { _id: data.driverMongoId }
            : { $or: [{ customId: data.driverId }, { name: data.driverName }].filter(Boolean) };

          if (!query || (query.$or && query.$or.length === 0)) return;

          existingDriver = await Driver.findOne(query);
          if (!existingDriver) {
            // Driver deleted or not enrolled in DB - ignore ghost broadcast
            return;
          }
          if (cacheKey) {
            driverCache.set(cacheKey, existingDriver);
            if (existingDriver._id) driverCache.set(String(existingDriver._id), existingDriver);
            if (existingDriver.customId) driverCache.set(existingDriver.customId, existingDriver);
          }
        }

        const payload = {
          driverId: existingDriver.customId || data.driverId,
          driverMongoId: existingDriver._id,
          driverName: existingDriver.name,
          sector: existingDriver.activeSector || data.sector || 'Municipal Route',
          vehicle: existingDriver.assignedVehicle || data.vehicle || 'Collection Truck',
          isOnDuty: data.isOnDuty !== undefined ? Boolean(data.isOnDuty) : Boolean(existingDriver.isOnDuty),
          lat,
          lng,
          speedKm: data.speedKm || 20,
          heading: data.heading || 'In-Transit',
          location: {
            lat,
            lng,
            speedKm: data.speedKm || 20,
            heading: data.heading || 'In-Transit',
            lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        };

        // 1. Immediately broadcast to ALL sockets (Resident, Admin, and Driver) without delay
        io.emit('driver-location-update', payload);

        // 2. Persist verified driver's latest GPS coordinates in MongoDB database every second
        await Driver.updateOne({ _id: existingDriver._id }, {
          $set: {
            isOnDuty: payload.isOnDuty,
            isBroadcastingGPS: payload.isOnDuty,
            liveLocation: payload.location
          }
        });

        const userSyncQuery = {
          $or: [
            ...(existingDriver._id ? [{ _id: existingDriver._id }] : []),
            ...(existingDriver.customId ? [{ customId: existingDriver.customId }] : []),
            ...(existingDriver.email ? [{ email: existingDriver.email }] : [])
          ]
        };

        await User.updateMany(userSyncQuery, {
          $set: {
            isOnDuty: payload.isOnDuty,
            isBroadcastingGPS: payload.isOnDuty,
            liveLocation: payload.location
          }
        }).catch(() => null);

        // Also update any active emergency response in progress for this driver
        EmergencyRequest.updateMany(
          { assignedDriverId: existingDriver._id, status: { $in: ['DISPATCHED', 'ON THE WAY'] } },
          { $set: { driverLiveLocation: payload.location } }
        ).catch(() => null);

      } catch (err) {
        console.warn('Socket update-location verification notice:', err.message);
      }
    });

    socket.on('duty-change', async (data) => {
      try {
        const query = data.driverMongoId 
          ? { _id: data.driverMongoId }
          : { $or: [{ customId: data.driverId }, { name: data.driverName }].filter(Boolean) };
        if (!query || (query.$or && query.$or.length === 0)) return;

        const existingDriver = await Driver.findOne(query);
        if (!existingDriver) return;

        // Invalidate cached status
        if (data.driverMongoId) driverCache.delete(String(data.driverMongoId));
        if (existingDriver.customId) driverCache.delete(existingDriver.customId);
        if (existingDriver._id) driverCache.delete(String(existingDriver._id));

        const isOnDuty = Boolean(data.isOnDuty);

        // Update database with duty status
        await Driver.updateOne({ _id: existingDriver._id }, {
          $set: {
            isOnDuty,
            isBroadcastingGPS: isOnDuty
          }
        });

        const userSyncQuery = {
          $or: [
            ...(existingDriver._id ? [{ _id: existingDriver._id }] : []),
            ...(existingDriver.customId ? [{ customId: existingDriver.customId }] : []),
            ...(existingDriver.email ? [{ email: existingDriver.email }] : [])
          ]
        };

        await User.updateMany(userSyncQuery, {
          $set: {
            isOnDuty,
            isBroadcastingGPS: isOnDuty
          }
        }).catch(() => null);

        io.emit('driver-duty-changed', {
          driverId: existingDriver.customId,
          driverMongoId: existingDriver._id,
          driverName: existingDriver.name,
          vehicle: existingDriver.assignedVehicle,
          sector: existingDriver.activeSector,
          isOnDuty,
          liveLocation: isOnDuty ? (data.liveLocation || existingDriver.liveLocation) : null,
          registeredLocation: existingDriver.registeredLocation || null
        });
      } catch (err) {
        console.warn('Socket duty-change verification notice:', err.message);
      }
    });

    socket.on('new-emergency', (data) => {
      io.emit('emergency-created', data);
    });

    socket.on('disconnect', () => {
      console.log(`❌ WebSocket Client Disconnected: ${socket.id}`);
    });
  });
};
