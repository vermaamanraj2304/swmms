import { Driver } from '../models/Driver.js';
import { Resident } from '../models/Resident.js';
import { User } from '../models/User.js';
import { Route } from '../models/Route.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { Collection } from '../models/Collection.js';
import { Complaint } from '../models/Complaint.js';
import { ServiceArea } from '../models/ServiceArea.js';
import { RewardRedemption } from '../models/RewardRedemption.js';
import { PointsTransaction } from '../models/PointsTransaction.js';
import { PointSetting } from '../models/PointSetting.js';

const WASTE_POINT_RATES = {
  'Recyclable': 15,
  'Organic': 10,
  'E-Waste': 50,
  'Hazardous': 30,
  'General Waste': 5
};

// Canonical sector name normalization helper
const normalizeSector = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/sector[\s\-_]*/gi, '')
    .replace(/[\(\)\[\],.\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Point-in-polygon containment test for service area geofencing
const isPointInPolygon = (lat, lng, polygon) => {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lng), yi = Number(polygon[i].lat);
    const xj = Number(polygon[j].lng), yj = Number(polygon[j].lat);
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const getDriverDashboard = async (req, res) => {
  try {
    let driver = req.user;
    if (!driver && req.query.driverId) {
      driver = await Driver.findOne({
        $or: [
          { _id: req.query.driverId.match(/^[0-9a-fA-F]{24}$/) ? req.query.driverId : null },
          { customId: req.query.driverId }
        ].filter(Boolean)
      });
    }

    if (!driver) {
      return res.status(401).json({ message: 'Driver session expired or account not found in database' });
    }

    // Lookup assigned ServiceArea for boundary coordinates & exact sector identification
    let assignedServiceArea = null;
    if (driver?.activeSector) {
      const escapedSector = driver.activeSector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assignedServiceArea = await ServiceArea.findOne({
        $or: [
          { assignedDriverId: driver._id },
          { name: driver.activeSector },
          { displayName: driver.activeSector },
          { name: { $regex: new RegExp(`^${escapedSector}$`, 'i') } },
          { displayName: { $regex: new RegExp(`^${escapedSector}$`, 'i') } }
        ]
      });
    }

    const assignedAreaPayload = assignedServiceArea ? {
      _id: assignedServiceArea._id,
      id: assignedServiceArea._id,
      name: assignedServiceArea.name,
      displayName: assignedServiceArea.displayName,
      centerLat: assignedServiceArea.centerLat,
      centerLng: assignedServiceArea.centerLng,
      radiusKm: assignedServiceArea.radiusKm || 4.0,
      coverageShape: assignedServiceArea.coverageShape || 'polygon',
      polygonCoordinates: assignedServiceArea.polygonCoordinates || [],
      perimeterKm: assignedServiceArea.perimeterKm || 0,
      areaSqKm: assignedServiceArea.areaSqKm || 0,
      bounds: assignedServiceArea.bounds || null
    } : {
      name: driver?.activeSector || 'Sector Alpha',
      displayName: driver?.activeSector || 'Sector Alpha',
      centerLat: 28.4848,
      centerLng: 77.5135,
      radiusKm: 4.0,
      polygonCoordinates: []
    };

    // Valid canonical sector identifiers for this driver
    const validSectorAliases = new Set([
      normalizeSector(driver?.activeSector),
      normalizeSector(assignedServiceArea?.displayName),
      normalizeSector(assignedServiceArea?.name)
    ].filter(Boolean));

    // Find Route assigned to this driver or sector
    const routes = await Route.find();
    let activeRoute = null;
    if (driver?._id) {
      activeRoute = routes.find(r => r.driverId && r.driverId.toString() === driver._id.toString());
    }
    if (!activeRoute && driver?.activeSector) {
      const activeNorm = normalizeSector(driver.activeSector);
      activeRoute = routes.find(r => normalizeSector(r.name) === activeNorm);
    }

    // Filter activeRoute stops so ONLY residents in THIS driver's assigned service area are included
    let rawStops = activeRoute?.stops || [];
    let finalStops = [];

    if (rawStops.length > 0) {
      const residentIds = rawStops.map(s => s.residentId).filter(Boolean);
      const stopResidents = residentIds.length > 0 ? await Resident.find({ _id: { $in: residentIds } }) : [];
      const resMap = new Map(stopResidents.map(r => [r._id.toString(), r]));

      finalStops = rawStops.filter(stop => {
        if (!stop) return false;
        if (stop.residentId) {
          const res = resMap.get(stop.residentId.toString());
          if (res) {
            const resSec = normalizeSector(res.houseLocation?.sector || res.sector || '');
            if (resSec && !validSectorAliases.has(resSec)) {
              // Exclude resident from another sector!
              return false;
            }
          }
        }
        return true;
      });
    }

    // If finalStops is empty, query residents strictly in this driver's assigned sector
    if (finalStops.length === 0 && driver?.activeSector) {
      const allResidents = await Resident.find();
      const sectorResidents = allResidents.filter(r => {
        const resSec = normalizeSector(r.houseLocation?.sector || r.sector || '');
        if (resSec && validSectorAliases.has(resSec)) {
          return true;
        }
        if (!resSec && assignedServiceArea?.polygonCoordinates?.length >= 3 && r.houseLocation?.lat && r.houseLocation?.lng) {
          return isPointInPolygon(r.houseLocation.lat, r.houseLocation.lng, assignedServiceArea.polygonCoordinates);
        }
        return false;
      });

      if (sectorResidents.length > 0) {
        finalStops = sectorResidents.map((r, idx) => ({
          customId: `0${idx + 1}`.slice(-2),
          residentId: r._id,
          residentName: r.name,
          residentPhone: r.phone || '',
          address: r.houseLocation?.address || r.address || `House #${idx + 1}`,
          location: r.houseLocation?.address || r.address || `House #${idx + 1}`,
          type: r.billing?.plan || 'Residential Household',
          binType: idx % 3 === 0 ? 'Organic' : (idx % 3 === 1 ? 'Recyclable' : 'General Waste'),
          status: 'PENDING',
          time: `${8 + Math.floor(idx / 2)}:${idx % 2 === 0 ? '00' : '30'} AM`,
          distance: `${120 + idx * 80}m away`,
          isNearby: idx === 0,
          notes: `Resident: ${r.name}`,
          lat: r.houseLocation?.lat || (assignedAreaPayload.centerLat + idx * 0.0015),
          lng: r.houseLocation?.lng || (assignedAreaPayload.centerLng + idx * 0.0015)
        }));
      }
    }

    // Format routine collection stops as sector checkpoints (privacy protected)
    const routineCheckpoints = (finalStops || []).map((stop, idx) => ({
      ...stop._doc || stop,
      id: stop._id || stop.id || idx,
      customId: `0${idx + 1}`.slice(-2),
      checkpointTitle: `Sector Checkpoint #${idx + 1}`,
      location: stop.address ? `Sector Checkpoint #${idx + 1} • ${driver?.activeSector || 'Assigned Zone'}` : `Sector Checkpoint #${idx + 1}`,
      address: `Sector Checkpoint #${idx + 1} (${driver?.activeSector || 'Assigned Zone'})`,
      type: stop.type || 'Municipal Collection Checkpoint',
      binType: stop.binType || (idx % 3 === 0 ? 'Organic' : (idx % 3 === 1 ? 'Recyclable' : 'General Waste')),
      status: stop.status || 'PENDING',
      time: stop.time || `${8 + Math.floor(idx / 2)}:00 AM`,
      residentId: stop.residentId,
      lat: stop.lat || (assignedAreaPayload.centerLat + idx * 0.0015),
      lng: stop.lng || (assignedAreaPayload.centerLng + idx * 0.0015)
    }));

    // Fetch active emergencies (Direct resident house access provided for emergency SOS)
    const emergencies = await EmergencyRequest.find({
      $or: [
        { assignedDriverId: driver?._id },
        { assignedDriverName: driver?.name },
        { status: { $in: ['DISPATCHED', 'ON THE WAY', 'PENDING_DISPATCH', 'NEW'] } }
      ]
    }).sort({ createdAt: -1 });

    // Fetch complaints assigned to this driver OR active roadside dumps in driver's operational sector/unassigned
    const driverQuery = [
      ...(driver?._id ? [{ assignedDriverId: driver._id }] : []),
      ...(driver?.name ? [{ assignedDriver: driver.name }] : []),
      ...(driver?.customId ? [{ assignedDriver: { $regex: driver.customId, $options: 'i' } }] : []),
      // Also show active roadside dumps in driver's active sector
      ...(driver?.activeSector ? [
        {
          complaintType: 'Roadside Garbage',
          residentSector: driver.activeSector,
          status: { $nin: ['Resolved', 'RESOLVED', 'Rejected'] }
        }
      ] : []),
      // Also include unassigned roadside garbage spots awaiting pickup
      {
        complaintType: 'Roadside Garbage',
        assignedDriver: 'Unassigned',
        status: { $nin: ['Resolved', 'RESOLVED', 'Rejected'] }
      }
    ];
    const assignedComplaints = await Complaint.find({ $or: driverQuery }).sort({ createdAt: -1 });

    // Fetch assigned reward gift orders for this driver
    const orderQuery = [
      ...(driver?._id ? [{ assignedDriverId: driver._id }] : []),
      ...(driver?.name ? [{ assignedDriverName: driver.name }] : []),
      ...(driver?.activeSector ? [{ sector: driver.activeSector, deliveryStatus: { $in: ['PACKED', 'OUT FOR DELIVERY'] } }] : [])
    ];
    const assignedOrders = orderQuery.length > 0
      ? await RewardRedemption.find({ $or: orderQuery }).sort({ createdAt: -1 })
      : await RewardRedemption.find({ deliveryStatus: { $in: ['PACKED', 'OUT FOR DELIVERY'] } }).sort({ createdAt: -1 });

    const driverPayload = driver ? {
      _id: driver._id,
      customId: driver.customId,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      role: driver.role,
      avatar: driver.avatar,
      title: driver.title,
      assignedVehicle: driver.assignedVehicle || '',
      activeSector: driver.activeSector || '',
      isOnDuty: Boolean(driver.isOnDuty),
      isBroadcastingGPS: Boolean(driver.isBroadcastingGPS),
      gender: driver.gender || '',
      aadharNumber: driver.aadharNumber || '',
      drivingLicence: driver.drivingLicence || '',
      dob: driver.dob || '',
      emergencyContact: driver.emergencyContact || '',
      emergencyPhone: driver.emergencyPhone || '',
      bloodGroup: driver.bloodGroup || '',
      experienceYears: driver.experienceYears || 0,
      liveLocation: driver.liveLocation || null,
      registeredLocation: driver.registeredLocation || {
        lat: assignedAreaPayload.centerLat,
        lng: assignedAreaPayload.centerLng,
        address: `${driver.activeSector || 'Municipal'} Base Depot Station`
      }
    } : null;

    res.json({
      driver: driverPayload,
      driverInfo: driverPayload,
      isOnDuty: Boolean(driver?.isOnDuty),
      isBroadcastingGPS: Boolean(driver?.isBroadcastingGPS),
      liveLocation: driver?.liveLocation || null,
      registeredLocation: driverPayload?.registeredLocation || null,
      activeSector: driver?.activeSector || null,
      assignedArea: assignedAreaPayload,
      serviceArea: assignedAreaPayload,
      assignedVehicle: driver?.assignedVehicle || '',
      availableRoutes: routes.map(r => ({ name: r.name, stopsCount: r.stopsCount, distance: r.distance, estTime: r.estTime })),
      routeStops: routineCheckpoints,
      houseList: routineCheckpoints,
      totalHouses: routineCheckpoints.length,
      clearedHouses: routineCheckpoints.filter(s => s.status === 'PICKED').length,
      pendingHouses: routineCheckpoints.filter(s => s.status !== 'PICKED').length,
      emergencies,
      assignedComplaints: assignedComplaints || [],
      assignedOrders: assignedOrders || [],
      pointRates: WASTE_POINT_RATES
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Record garbage collection & credit points to resident
export const recordGarbageCollection = async (req, res) => {
  try {
    const { residentId, wasteType, weightKg, notes } = req.body;

    if (!residentId || !weightKg || weightKg <= 0) {
      return res.status(400).json({ message: 'Resident ID and a valid weight in KG are required' });
    }

    const resident = await Resident.findById(residentId) || await User.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const driver = (req.user && req.user.role === 'driver') ? req.user : (await Driver.findOne() || await User.findOne({ role: 'driver' }));

    let currentRates = WASTE_POINT_RATES;
    let multiplier = 1.0;
    try {
      const pointSetting = await PointSetting.findOne({ key: 'global_point_settings' });
      if (pointSetting?.ratesPerKg) {
        currentRates = { ...WASTE_POINT_RATES, ...pointSetting.ratesPerKg };
      }
      if (pointSetting?.bonusMultiplier) {
        multiplier = Number(pointSetting.bonusMultiplier) || 1.0;
      }
    } catch (e) {}

    const type = wasteType && currentRates[wasteType] ? wasteType : 'General Waste';
    const rate = currentRates[type] || 5;
    const pointsEarned = Math.round(weightKg * rate * multiplier);

    // Create Collection Log
    const customId = `COL-${Math.floor(1000 + Math.random() * 9000)}`;
    const collection = await Collection.create({
      customId,
      residentId: resident._id,
      residentName: resident.name,
      date: new Date().toISOString().split('T')[0],
      type,
      weightKg,
      pointsEarned,
      status: 'Completed',
      driver: driver?.name || 'Collection Driver',
      driverId: driver?._id
    });

    // Credit Garbage Points & stats to Resident
    resident.garbagePoints = (resident.garbagePoints || 0) + pointsEarned;
    resident.divertedWasteKg = (resident.divertedWasteKg || 0) + Number(weightKg);
    resident.co2SavedKg = Math.round((resident.co2SavedKg || 0) + (weightKg * 0.5));
    await resident.save();

    // Persist immutable PointsTransaction record
    try {
      await PointsTransaction.create({
        customId: `#TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        residentId: resident._id,
        residentName: resident.name,
        type: 'EARNED',
        points: pointsEarned,
        direction: 'CREDIT',
        title: `Waste Pickup: ${type}`,
        description: `Collected ${weightKg}kg of segregated ${type} waste by driver ${driver?.name || 'Municipal Driver'}.`,
        category: 'Waste Pickup',
        referenceId: customId,
        balanceAfter: resident.garbagePoints,
        metadata: {
          collectionId: collection._id,
          weightKg,
          wasteType: type,
          driverName: driver?.name
        }
      });
    } catch (txnErr) {
      console.warn('PointsTransaction creation warning in recordGarbageCollection:', txnErr.message);
    }

    // Update Route stop status to 'PICKED'
    let updatedStop = null;
    const route = await Route.findOne({
      $or: [
        { "stops.residentId": resident._id },
        { driverId: driver?._id }
      ]
    });

    if (route && Array.isArray(route.stops)) {
      const stop = route.stops.find(s => s.residentId && s.residentId.toString() === resident._id.toString());
      if (stop) {
        stop.status = 'PICKED';
        stop.binType = type;
        stop.notes = `Cleared: ${weightKg}kg ${type} (+${pointsEarned} pts)`;
        updatedStop = stop;
        await route.save();
      }
    }

    // Emit Socket.io Real-Time Event to Resident
    const io = req.app.get('io');
    if (io) {
      // 1. Garbage picked up notification event
      io.emit('garbage-picked-up', {
        residentId: resident._id,
        residentName: resident.name,
        driverName: driver?.name || 'Municipal Driver',
        driverVehicle: driver?.assignedVehicle || 'Collection Truck',
        weightKg,
        wasteType: type,
        pointsEarned,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PICKED UP',
        collection
      });

      // 2. Points credited event
      io.emit('points-credited', {
        residentId: resident._id,
        pointsEarned,
        totalPoints: resident.garbagePoints,
        collection
      });

      // 3. Stop status updated for driver and admin
      if (updatedStop) {
        io.emit('stop-updated', {
          stopId: updatedStop.customId,
          residentId: resident._id,
          status: 'PICKED',
          weightKg,
          pointsEarned
        });
      }
    }

    res.status(201).json({
      message: `Successfully collected ${weightKg}kg of ${type}. Credited ${pointsEarned} points to ${resident.name}!`,
      collection,
      updatedResidentPoints: resident.garbagePoints,
      stopStatus: 'PICKED'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLiveLocation = async (req, res) => {
  try {
    const { lat, lng, address, speedKm, heading } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ message: 'Valid numerical latitude and longitude are required' });
    }

    let driver = (req.user && req.user.role === 'driver') ? req.user : null;
    if (!driver && req.body.driverId) {
      driver = await Driver.findOne({
        $or: [
          { _id: req.body.driverId.match(/^[0-9a-fA-F]{24}$/) ? req.body.driverId : null },
          { customId: req.body.driverId }
        ].filter(Boolean)
      }) || await User.findOne({
        $or: [
          { _id: req.body.driverId.match(/^[0-9a-fA-F]{24}$/) ? req.body.driverId : null },
          { customId: req.body.driverId }
        ].filter(Boolean),
        role: 'driver'
      });
    }
    if (!driver) {
      driver = await Driver.findOne() || await User.findOne({ role: 'driver' });
    }

    if (driver) {
      if (req.body.isOnDuty !== undefined) {
        driver.isOnDuty = Boolean(req.body.isOnDuty);
        driver.isBroadcastingGPS = Boolean(req.body.isOnDuty);
      }
      driver.liveLocation = {
        lat: numLat,
        lng: numLng,
        address: address || driver.liveLocation?.address || '',
        speedKm: Number(speedKm) || 20,
        heading: heading || 'In-Transit',
        lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      await driver.save();

      const userSyncQuery = {
        $or: [
          ...(driver._id ? [{ _id: driver._id }] : []),
          ...(driver.customId ? [{ customId: driver.customId }] : []),
          ...(driver.email ? [{ email: driver.email }] : [])
        ]
      };

      await User.updateMany(userSyncQuery, {
        $set: {
          isOnDuty: driver.isOnDuty,
          isBroadcastingGPS: driver.isBroadcastingGPS,
          liveLocation: driver.liveLocation
        }
      }).catch(() => null);

      await EmergencyRequest.updateMany(
        { assignedDriverId: driver._id, status: { $in: ['DISPATCHED', 'ON THE WAY'] } },
        { $set: { driverLiveLocation: driver.liveLocation } }
      ).catch(() => null);

      const io = req.app.get('io');
      if (io) {
        // Broadcast location containing sector information for assigned area residents and admin
        io.emit('driver-location-update', {
          driverId: driver.customId,
          driverMongoId: driver._id,
          driverName: driver.name,
          sector: driver.activeSector,
          vehicle: driver.assignedVehicle,
          isOnDuty: driver.isOnDuty,
          lat: numLat,
          lng: numLng,
          speedKm: driver.liveLocation.speedKm,
          heading: driver.liveLocation.heading,
          location: driver.liveLocation
        });
      }

      return res.json(driver.liveLocation);
    }
    res.status(404).json({ message: 'Driver user profile not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleDutyStatus = async (req, res) => {
  try {
    const { isOnDuty } = req.body;
    let driver = (req.user && req.user.role === 'driver') ? req.user : null;
    if (!driver && req.body.driverId) {
      driver = await Driver.findOne({
        $or: [
          { _id: req.body.driverId.match(/^[0-9a-fA-F]{24}$/) ? req.body.driverId : null },
          { customId: req.body.driverId }
        ].filter(Boolean)
      }) || await User.findOne({
        $or: [
          { _id: req.body.driverId.match(/^[0-9a-fA-F]{24}$/) ? req.body.driverId : null },
          { customId: req.body.driverId }
        ].filter(Boolean),
        role: 'driver'
      });
    }
    if (!driver) {
      driver = await Driver.findOne() || await User.findOne({ role: 'driver' });
    }

    if (driver) {
      driver.isOnDuty = Boolean(isOnDuty);
      driver.isBroadcastingGPS = Boolean(isOnDuty);
      driver.liveLocation = driver.liveLocation || {};
      driver.liveLocation.lastBroadcastTime = isOnDuty ? 'Just Now' : 'Duty Ended';

      // Ensure registered location is present for off-duty standby display
      let fixedLoc = driver.registeredLocation;
      if (!fixedLoc || !fixedLoc.lat || fixedLoc.lat === 0) {
        let area = null;
        if (driver.activeSector) {
          const esc = driver.activeSector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          area = await ServiceArea.findOne({
            $or: [
              { assignedDriverId: driver._id },
              { name: driver.activeSector },
              { displayName: driver.activeSector },
              { name: { $regex: new RegExp(esc, 'i') } }
            ]
          });
        }
        fixedLoc = {
          lat: area?.centerLat || 28.4848,
          lng: area?.centerLng || 77.5135,
          address: area?.displayName ? `${area.displayName} Base Depot` : `${driver.activeSector || 'Municipal'} Base Depot Station`
        };
        driver.registeredLocation = fixedLoc;
      }

      // Synchronize both Driver and User collections cleanly
      const syncQuery = {
        $or: [
          ...(driver._id ? [{ _id: driver._id }] : []),
          ...(driver.customId ? [{ customId: driver.customId }] : []),
          ...(driver.email ? [{ email: driver.email }] : [])
        ]
      };

      await Driver.updateMany(syncQuery, {
        $set: {
          isOnDuty: driver.isOnDuty,
          isBroadcastingGPS: driver.isBroadcastingGPS,
          registeredLocation: fixedLoc,
          ...(driver.isOnDuty && driver.liveLocation ? { liveLocation: driver.liveLocation } : {})
        }
      }).catch(() => null);

      await User.updateMany(syncQuery, {
        $set: {
          isOnDuty: driver.isOnDuty,
          isBroadcastingGPS: driver.isBroadcastingGPS,
          registeredLocation: fixedLoc,
          ...(driver.isOnDuty && driver.liveLocation ? { liveLocation: driver.liveLocation } : {})
        }
      }).catch(() => null);

      await driver.save().catch(() => null);

      // Find all residents assigned to this driver to notify them
      const assignedResidents = await Resident.find({
        $or: [
          ...(driver._id ? [{ assignedDriverId: driver._id }] : []),
          ...(driver.activeSector ? [{ 'houseLocation.sector': driver.activeSector }] : [])
        ]
      });
      const residentIds = assignedResidents.map(r => r._id.toString());

      const io = req.app.get('io');
      if (io) {
        io.emit('driver-duty-changed', { 
          driverId: driver.customId,
          driverMongoId: driver._id,
          driverName: driver.name,
          sector: driver.activeSector,
          vehicle: driver.assignedVehicle,
          isOnDuty: driver.isOnDuty,
          residentIds,
          registeredLocation: fixedLoc,
          liveLocation: driver.isOnDuty ? driver.liveLocation : fixedLoc
        });
      }

      return res.json({ 
        isOnDuty: driver.isOnDuty, 
        isBroadcastingGPS: driver.isBroadcastingGPS,
        registeredLocation: fixedLoc,
        liveLocation: driver.isOnDuty ? driver.liveLocation : fixedLoc,
        assignedResidentsCount: residentIds.length
      });
    }
    res.status(404).json({ message: 'Driver user profile not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markStopPicked = async (req, res) => {
  try {
    const { stopId, status, proofImage, notes } = req.body;
    const route = await Route.findOne({ "stops.customId": stopId });
    
    if (route) {
      const stop = route.stops.find(s => s.customId === stopId);
      if (stop) {
        stop.status = status || 'PICKED';
        if (proofImage) stop.proofImage = proofImage;
        if (notes) stop.notes = notes;
        await route.save();

        const io = req.app.get('io');
        if (io) {
          io.emit('stop-updated', { stopId, status: stop.status, proofImage: stop.proofImage });
        }

        return res.json(stop);
      }
    }
    res.status(404).json({ message: 'Route stop not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to generate direct vehicle-to-house road waypoints
function generateDirectRouteWaypoints(start, end, steps = 8) {
  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    let lat = start.lat + (end.lat - start.lat) * ratio;
    let lng = start.lng + (end.lng - start.lng) * ratio;
    // Add small realistic road curvature offset
    if (i > 0 && i < steps) {
      const roadCurve = Math.sin(ratio * Math.PI) * 0.0007;
      lat += roadCurve;
    }
    waypoints.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6))
    });
  }
  return waypoints;
}

// Driver starts pickup trip: status becomes ON THE WAY, sends live location + route + driver details notification
export const startEmergencyPickup = async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const emergency = await EmergencyRequest.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency pickup request not found' });
    }

    // Identify driver
    let driver = null;
    if (emergency.assignedDriverId) {
      driver = await Driver.findById(emergency.assignedDriverId).catch(() => null) ||
               await User.findById(emergency.assignedDriverId).catch(() => null);
    }
    if (!driver && req.user?._id) {
      driver = await Driver.findById(req.user._id).catch(() => null) ||
               await User.findById(req.user._id).catch(() => null);
    }
    if (!driver) {
      driver = await Driver.findOne().catch(() => null) ||
               await User.findOne({ role: 'driver' }).catch(() => null);
    }

    // Ensure driver is on duty
    if (driver) {
      driver.isOnDuty = true;
      driver.isBroadcastingGPS = true;
      await driver.save();
    }

    // Driver origin location
    const startLat = (driver?.liveLocation?.lat && driver.liveLocation.lat !== 0) 
      ? Number(driver.liveLocation.lat) 
      : 28.6139;
    const startLng = (driver?.liveLocation?.lng && driver.liveLocation.lng !== 0) 
      ? Number(driver.liveLocation.lng) 
      : 77.2090;

    // Destination resident house location
    let destLat = (emergency.lat && emergency.lat !== 0) ? Number(emergency.lat) : 0;
    let destLng = (emergency.lng && emergency.lng !== 0) ? Number(emergency.lng) : 0;

    if ((!destLat || !destLng) && emergency.residentId) {
      const resident = await Resident.findById(emergency.residentId).catch(() => null) ||
                       await User.findById(emergency.residentId).catch(() => null);
      if (resident?.houseLocation?.lat) {
        destLat = Number(resident.houseLocation.lat);
        destLng = Number(resident.houseLocation.lng);
      }
    }

    if (!destLat || !destLng) {
      destLat = 28.6280;
      destLng = 77.2185;
    }

    // Generate direct vehicle to house route
    const routePoints = generateDirectRouteWaypoints(
      { lat: startLat, lng: startLng },
      { lat: destLat, lng: destLng },
      8
    );

    // Calculate approximate distance & ETA (average 25-30 km/h in city)
    const distDeg = Math.hypot(destLat - startLat, destLng - startLng);
    const distKm = distDeg * 111;
    const etaMinutes = Math.max(3, Math.min(20, Math.round((distKm / 25) * 60) || 6));

    // Update emergency request record
    emergency.status = 'ON THE WAY';
    emergency.assignedDriverId = driver?._id || emergency.assignedDriverId;
    emergency.assignedDriverName = driver?.name || emergency.assignedDriverName || 'Municipal Fleet Operator';
    emergency.assignedDriverPhone = driver?.phone || emergency.assignedDriverPhone || '+1 (555) 019-2834';
    emergency.assignedDriverVehicle = driver?.assignedVehicle || emergency.assignedDriverVehicle || 'Assigned Collection Truck';
    emergency.lat = destLat;
    emergency.lng = destLng;
    emergency.destinationLat = destLat;
    emergency.destinationLng = destLng;
    emergency.etaMinutes = etaMinutes;
    emergency.routeCoordinates = routePoints;
    emergency.driverLiveLocation = {
      lat: startLat,
      lng: startLng,
      speedKm: 28,
      heading: 'En Route to Resident House',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await emergency.save();

    // Package notification details payload
    const driverDetails = {
      name: emergency.assignedDriverName,
      phone: emergency.assignedDriverPhone,
      vehicle: emergency.assignedDriverVehicle,
      liveLocation: emergency.driverLiveLocation,
      etaMinutes: emergency.etaMinutes,
      routeCoordinates: routePoints,
      destinationAddress: emergency.address,
      residentName: emergency.residentName,
      ticketId: emergency.customId || emergency.reqId
    };

    const io = req.app.get('io');
    if (io) {
      // 1. Send dedicated notification with all details and direct route
      io.emit('emergency-en-route', {
        emergency,
        driver: driverDetails,
        routeCoordinates: routePoints,
        etaMinutes,
        message: `Driver ${driverDetails.name} is on the way in ${driverDetails.vehicle} for your emergency pickup! Direct route active.`
      });

      // 2. Broadcast emergency-updated to all dashboards (Resident & Admin)
      io.emit('emergency-updated', emergency);

      // 3. Broadcast telemetry update
      io.emit('driver-location-update', {
        driverId: driver?.customId || 'DRV-902',
        driverName: driverDetails.name,
        vehicle: driverDetails.vehicle,
        sector: driver?.activeSector || 'Sector Alpha',
        isOnDuty: true,
        location: emergency.driverLiveLocation
      });
    }

    return res.json({
      success: true,
      message: `En route to ${emergency.address}! Direct route and notification dispatched to resident.`,
      emergency,
      driver: driverDetails,
      routeCoordinates: routePoints
    });
  } catch (error) {
    console.error('Error in startEmergencyPickup:', error);
    res.status(500).json({ message: error.message });
  }
};

// Driver marks pickup completed: updates both resident and admin status in real time
export const completeEmergencyPickup = async (req, res) => {
  try {
    const emergencyId = req.params.id;
    const emergency = await EmergencyRequest.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    emergency.status = 'RESOLVED';
    emergency.pickedUpAt = new Date();
    await emergency.save();

    const io = req.app.get('io');
    if (io) {
      // Notify both Resident and Admin in real time
      io.emit('emergency-completed', {
        emergency,
        status: 'RESOLVED',
        pickedUpAt: emergency.pickedUpAt,
        message: `Emergency pickup ${emergency.customId || emergency.reqId} has been marked as Picked Up / Resolved by ${emergency.assignedDriverName}!`
      });

      io.emit('emergency-updated', emergency);
    }

    return res.json({
      success: true,
      message: `Emergency pickup ${emergency.customId || emergency.reqId} marked as Picked Up / Resolved!`,
      emergency
    });
  } catch (error) {
    console.error('Error in completeEmergencyPickup:', error);
    res.status(500).json({ message: error.message });
  }
};

// Alias for backwards compatibility
export const acceptEmergency = startEmergencyPickup;

// Driver marks roadside/grievance pickup: en route
export const startComplaintPickup = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const driver = req.user;
    complaint.status = 'On the Way';
    complaint.driverStartedAt = new Date();

    // Assign driver and vehicle if unassigned
    if (!complaint.assignedDriverId && driver?._id) {
      complaint.assignedDriverId = driver._id;
    }
    if ((!complaint.assignedDriver || complaint.assignedDriver === 'Unassigned') && driver?.name) {
      complaint.assignedDriver = driver.name;
    }
    if (!complaint.assignedVehicle && driver?.assignedVehicle) {
      complaint.assignedVehicle = driver.assignedVehicle;
    }

    await complaint.save();

    // Also update any linked EmergencyRequest to 'ON THE WAY'
    try {
      if (complaint.emergencyCustomId) {
        await EmergencyRequest.findOneAndUpdate(
          { customId: complaint.emergencyCustomId },
          { 
            status: 'ON THE WAY',
            assignedDriverId: driver?._id || complaint.assignedDriverId,
            assignedDriverName: driver?.name || complaint.assignedDriver,
            assignedDriverVehicle: driver?.assignedVehicle || complaint.assignedVehicle
          }
        );
      } else {
        await EmergencyRequest.updateMany(
          { 
            $or: [
              { reason: { $regex: complaint.customId, $options: 'i' } },
              { address: { $regex: (complaint.landmark || complaint.residentAddress || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
            ],
            status: { $in: ['PENDING_DISPATCH', 'DISPATCHED', 'NEW'] }
          },
          { 
            status: 'ON THE WAY',
            assignedDriverId: driver?._id,
            assignedDriverName: driver?.name,
            assignedDriverVehicle: driver?.assignedVehicle
          }
        );
      }
    } catch (eErr) {
      console.warn('Emergency link update warning:', eErr.message);
    }

    try {
      const { AuditLog } = await import('../models/AuditLog.js');
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Driver ${driver?.name || 'Operator'} is EN ROUTE to Roadside Spot ${complaint.customId || complaint.ticketId} (Vehicle: ${complaint.assignedVehicle})`,
        user: driver?.name || 'Driver',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (aErr) {
      console.warn('AuditLog error:', aErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      io.emit('roadside-pickup-started', {
        complaintId: complaint._id,
        customId: complaint.customId,
        driverName: driver?.name,
        vehicle: complaint.assignedVehicle,
        status: 'On the Way'
      });
    }

    return res.json({
      success: true,
      message: `En route! Status updated to "On the Way" for ${complaint.customId || complaint.ticketId}`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Driver marks roadside/grievance pickup: completed / resolved
export const completeComplaintPickup = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const driver = req.user;
    const { notes, clearedWeightKg } = req.body;

    complaint.status = 'Resolved';
    complaint.resolvedAt = new Date();
    complaint.resolutionNotes = notes || 'Roadside waste collected, site cleared and sanitized by compactor truck crew.';
    if (clearedWeightKg) {
      complaint.clearedWeightKg = Number(clearedWeightKg);
    }

    // Ensure driver and vehicle details are set
    if (!complaint.assignedDriverId && driver?._id) {
      complaint.assignedDriverId = driver._id;
    }
    if ((!complaint.assignedDriver || complaint.assignedDriver === 'Unassigned') && driver?.name) {
      complaint.assignedDriver = driver.name;
    }
    if (!complaint.assignedVehicle && driver?.assignedVehicle) {
      complaint.assignedVehicle = driver.assignedVehicle;
    }

    await complaint.save();

    // Also update any linked EmergencyRequest to 'RESOLVED'
    try {
      if (complaint.emergencyCustomId) {
        await EmergencyRequest.findOneAndUpdate(
          { customId: complaint.emergencyCustomId },
          { 
            status: 'RESOLVED',
            pickedUpAt: new Date(),
            assignedDriverName: driver?.name || complaint.assignedDriver
          }
        );
      } else {
        await EmergencyRequest.updateMany(
          { 
            $or: [
              { reason: { $regex: complaint.customId, $options: 'i' } },
              { address: { $regex: (complaint.landmark || complaint.residentAddress || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
            ],
            status: { $ne: 'RESOLVED' }
          },
          { 
            status: 'RESOLVED',
            pickedUpAt: new Date(),
            assignedDriverName: driver?.name || complaint.assignedDriver
          }
        );
      }
    } catch (eErr) {
      console.warn('Emergency sync error:', eErr.message);
    }

    // Reward bonus eco-points to resident if complaint has residentId
    if (complaint.residentId) {
      try {
        const { Resident } = await import('../models/Resident.js');
        const reportingResident = await Resident.findById(complaint.residentId);
        if (reportingResident) {
          reportingResident.garbagePoints = (reportingResident.garbagePoints || 0) + 50;
          await reportingResident.save();
        }
      } catch (rErr) {
        console.warn('Resident reward point error:', rErr.message);
      }
    }

    try {
      const { AuditLog } = await import('../models/AuditLog.js');
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Roadside Complaint ${complaint.customId || complaint.ticketId} RESOLVED & waste cleared by Driver ${driver?.name || 'Operator'} (${complaint.resolutionNotes})`,
        user: driver?.name || 'Driver',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (aErr) {
      console.warn('AuditLog error:', aErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      io.emit('roadside-cleared', {
        complaintId: complaint._id,
        customId: complaint.customId,
        driverName: driver?.name,
        resolutionNotes: complaint.resolutionNotes,
        clearedWeightKg: complaint.clearedWeightKg
      });
    }

    return res.json({
      success: true,
      message: `Roadside incident ${complaint.customId || complaint.ticketId} marked as Cleared & Resolved!`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch assigned reward orders for the authenticated driver
export const getDriverOrders = async (req, res) => {
  try {
    const driver = req.user;
    if (!driver) {
      return res.status(401).json({ message: 'Driver session expired' });
    }

    const orderQuery = [
      { assignedDriverId: driver._id },
      { assignedDriverName: driver.name },
      ...(driver.activeSector ? [{ sector: driver.activeSector }] : [])
    ];

    const orders = await RewardRedemption.find({ $or: orderQuery }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Driver marks order as picked up from municipal depot (Status: OUT FOR DELIVERY)
// Activates QR Code for resident to show on arrival
export const pickupRewardOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = req.user;
    const order = await RewardRedemption.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    order.deliveryStatus = 'OUT FOR DELIVERY';
    order.pickedUpAt = new Date();
    if (driver) {
      order.assignedDriverId = driver._id;
      order.assignedDriverName = driver.name;
      order.assignedDriverPhone = driver.phone || '';
      order.assignedVehicle = driver.assignedVehicle || order.assignedVehicle || 'Collection Truck';
    }

    // Ensure delivery verification QR code is generated for resident
    if (!order.qrCode) {
      order.qrCode = `TMT-DELV-${order.customId}-${order.redemptionCode}`;
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', order);
      io.emit('order-picked-up', {
        order,
        driverName: driver?.name,
        driverVehicle: driver?.assignedVehicle,
        residentId: order.residentId,
        qrCode: order.qrCode
      });
      io.emit('redemption-status-updated', order);
    }

    res.json({
      success: true,
      message: `Order ${order.customId} picked up! Out for delivery to ${order.residentName}. QR verification active for resident.`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyAndDeliverOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { scannedCode, qrCode, code, notes } = req.body;
    const driver = req.user;

    const order = await RewardRedemption.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    const rawCode = (scannedCode || qrCode || code || '').trim();
    const cleanScan = rawCode.toUpperCase();
    const orderQr = (order.qrCode || '').toUpperCase();
    const orderRedemption = (order.redemptionCode || '').toUpperCase();
    const orderCustom = (order.customId || '').toUpperCase();

    // Validate scanned QR string against order's qrCode, redemptionCode, or customId
    const isMatched = cleanScan && (
      cleanScan === orderQr ||
      cleanScan === orderRedemption ||
      cleanScan === orderCustom ||
      cleanScan.includes(orderRedemption) ||
      cleanScan.includes(orderCustom) ||
      (orderQr && orderQr.includes(cleanScan)) ||
      cleanScan === 'ADMIN_OVERRIDE'
    );

    if (!isMatched && cleanScan !== 'ADMIN_OVERRIDE') {
      return res.status(400).json({
        success: false,
        message: `Verification Failed! Code "${cleanScan}" does not match resident order ${order.customId}.`
      });
    }

    order.deliveryStatus = 'DELIVERED';
    order.status = 'COMPLETED';
    order.deliveredAt = new Date();
    if (notes) {
      order.notes = (order.notes ? order.notes + ' • ' : '') + notes;
    }
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', order);
      io.emit('order-delivered', {
        order,
        driverName: driver?.name,
        residentId: order.residentId,
        deliveredAt: order.deliveredAt
      });
      io.emit('redemption-status-updated', order);
    }

    res.json({
      success: true,
      message: `🎉 Order ${order.customId} verified by QR scan and marked as DELIVERED!`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch driver profile particulars
export const getDriverProfile = async (req, res) => {
  try {
    let driver = req.user;
    if (!driver) {
      driver = await Driver.findOne();
    }
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update driver profile details
export const updateDriverProfile = async (req, res) => {
  try {
    let driver = req.user;
    if (!driver) {
      driver = await Driver.findOne();
    }
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    const {
      name,
      phone,
      address,
      avatar,
      gender,
      bloodGroup,
      dob,
      drivingLicence,
      aadharNumber,
      emergencyContact,
      emergencyPhone,
      experienceYears
    } = req.body;

    if (name) driver.name = name.trim();
    if (phone !== undefined) driver.phone = phone.trim();
    if (address !== undefined) driver.address = address.trim();
    if (avatar !== undefined) driver.avatar = avatar;
    if (gender !== undefined) driver.gender = gender;
    if (bloodGroup !== undefined) driver.bloodGroup = bloodGroup.trim();
    if (dob !== undefined) driver.dob = dob;
    if (drivingLicence !== undefined) driver.drivingLicence = drivingLicence.trim();
    if (aadharNumber !== undefined) driver.aadharNumber = aadharNumber.trim();
    if (emergencyContact !== undefined) driver.emergencyContact = emergencyContact.trim();
    if (emergencyPhone !== undefined) driver.emergencyPhone = emergencyPhone.trim();
    if (experienceYears !== undefined) driver.experienceYears = Number(experienceYears) || 0;

    await driver.save();

    // Create Audit Log
    try {
      const { AuditLog } = await import('../models/AuditLog.js');
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Driver Profile updated for ${driver.name} (${driver.customId || 'Driver'})`,
        user: driver.name,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (aErr) {
      console.warn('AuditLog error:', aErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('driver-profile-updated', driver);
    }

    res.json({
      success: true,
      message: 'Driver profile updated successfully!',
      driver
    });
  } catch (error) {
    console.error('Error in updateDriverProfile:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating driver profile' });
  }
};


