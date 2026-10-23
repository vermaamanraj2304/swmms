import { Driver } from '../models/Driver.js';
import { User } from '../models/User.js';

export const handleSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket Client Connected: ${socket.id}`);

    // Real-time live GPS broadcast from driver -> verify against database before broadcasting
    socket.on('update-location', async (data) => {
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      try {
        const query = data.driverMongoId 
          ? { _id: data.driverMongoId }
          : { $or: [{ customId: data.driverId }, { name: data.driverName }].filter(Boolean) };

        if (!query || (query.$or && query.$or.length === 0)) return;

        const existingDriver = await Driver.findOne(query);
        if (!existingDriver) {
          // Driver deleted or not enrolled in DB - ignore ghost broadcast
          return;
        }

        const payload = {
          driverId: existingDriver.customId || data.driverId,
          driverMongoId: existingDriver._id,
          driverName: existingDriver.name,
          sector: existingDriver.activeSector || data.sector || 'Municipal Route',
          vehicle: existingDriver.assignedVehicle || data.vehicle || 'Collection Truck',
          isOnDuty: data.isOnDuty !== undefined ? Boolean(data.isOnDuty) : true,
          lat,
          lng,
          location: {
            lat,
            lng,
            speedKm: data.speedKm || 20,
            heading: data.heading || 'In-Transit',
            lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        };

        // Persist verified driver's latest GPS coords in MongoDB
        await Driver.updateOne({ _id: existingDriver._id }, {
          $set: {
            isOnDuty: payload.isOnDuty,
            isBroadcastingGPS: true,
            liveLocation: payload.location
          }
        });
        await User.updateOne({ _id: existingDriver._id }, {
          $set: {
            isOnDuty: payload.isOnDuty,
            isBroadcastingGPS: true,
            liveLocation: payload.location
          }
        }).catch(() => null);

        // Broadcast to ALL sockets (Resident, Admin, and Driver)
        io.emit('driver-location-update', payload);
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

        io.emit('driver-duty-changed', {
          driverId: existingDriver.customId,
          driverMongoId: existingDriver._id,
          driverName: existingDriver.name,
          vehicle: existingDriver.assignedVehicle,
          sector: existingDriver.activeSector,
          isOnDuty: Boolean(data.isOnDuty),
          liveLocation: data.isOnDuty ? (data.liveLocation || existingDriver.liveLocation) : null,
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
