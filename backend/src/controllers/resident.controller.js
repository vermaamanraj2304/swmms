import { Resident } from '../models/Resident.js';
import { Driver } from '../models/Driver.js';
import { User } from '../models/User.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { Complaint } from '../models/Complaint.js';
import { Collection } from '../models/Collection.js';
import { RewardRedemption } from '../models/RewardRedemption.js';
import { AuditLog } from '../models/AuditLog.js';
import { Payment } from '../models/Payment.js';
import { RewardGift } from '../models/RewardGift.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { ServiceArea } from '../models/ServiceArea.js';
import { PointsTransaction } from '../models/PointsTransaction.js';
import { PointSetting } from '../models/PointSetting.js';

// Waste category point multiplier rates per KG
const WASTE_POINT_RATES = {
  'Recyclable': 15,  // 15 points per kg
  'Organic': 10,      // 10 points per kg
  'E-Waste': 50,      // 50 points per kg
  'Hazardous': 30,    // 30 points per kg
  'General Waste': 5  // 5 points per kg
};

export const DEFAULT_GIFTS = [

  {
    customId: 'GIFT-101',
    title: 'Compostable Garbage Bags Roll (Small - 10L)',
    category: 'Garbage Bags',
    size: 'Small (10L / 30 Bags)',
    pointsRequired: 50,
    stock: 250,
    description: '100% plant-based cornstarch liners. Certified biodegradable for kitchen scrap caddies.',
    badge: 'Popular',
    iconName: 'ShoppingBag',
    color: 'emerald'
  },
  {
    customId: 'GIFT-102',
    title: 'Biodegradable Waste Bags Roll (Medium - 30L)',
    category: 'Garbage Bags',
    size: 'Medium (30L / 25 Bags)',
    pointsRequired: 90,
    stock: 180,
    description: 'Standard household trash bin fit. Tear-resistant star bottom seal.',
    badge: 'Best Value',
    iconName: 'ShoppingBag',
    color: 'teal'
  },
  {
    customId: 'GIFT-103',
    title: 'Heavy-Duty Recycled Trash Liners (Large - 60L)',
    category: 'Garbage Bags',
    size: 'Large (60L / 20 Bags)',
    pointsRequired: 140,
    stock: 120,
    description: 'Extra-strength recycled polyethylene for high volume curbside waste.',
    badge: 'Heavy Duty',
    iconName: 'ShoppingBag',
    color: 'blue'
  },
  {
    customId: 'GIFT-104',
    title: 'Municipal Tough Yard Waste Sacks (Extra-Large - 120L)',
    category: 'Garbage Bags',
    size: 'Extra-Large (120L / 10 Bags)',
    pointsRequired: 200,
    stock: 80,
    description: 'Puncture-resistant for branches, leaves, and bulk landscaping debris.',
    badge: 'Commercial Grade',
    iconName: 'ShoppingBag',
    color: 'indigo'
  },
  {
    customId: 'GIFT-105',
    title: 'Countertop Odor-Sealed Compost Bin (Small - 5L)',
    category: 'Trash Bins',
    size: 'Small (5L Capacity)',
    pointsRequired: 160,
    stock: 65,
    description: 'Activated charcoal filter lid prevents fruit flies and organic odor.',
    badge: 'Eco Essential',
    iconName: 'Trash2',
    color: 'emerald'
  },
  {
    customId: 'GIFT-106',
    title: 'Dual Kitchen Segregation Trash Can (Medium - 20L)',
    category: 'Trash Bins',
    size: 'Medium (20L / 2x10L Compartments)',
    pointsRequired: 320,
    stock: 45,
    description: 'Stainless steel dual-bucket pedal bin for easy wet and dry segregation.',
    badge: 'Top Pick',
    iconName: 'Trash2',
    color: 'teal'
  },
  {
    customId: 'GIFT-107',
    title: 'Heavy-Duty Wheeled Curbside Bin (Large - 120L)',
    category: 'Trash Bins',
    size: 'Large (120L Wheelie Bin)',
    pointsRequired: 550,
    stock: 30,
    description: 'UV-resistant HDPE municipal standard curbside rolling container.',
    badge: 'Municipal Grade',
    iconName: 'Trash2',
    color: 'blue'
  },
  {
    customId: 'GIFT-108',
    title: 'Aerated Backyard Organic Composter Drum (Extra-Large - 240L)',
    category: 'Trash Bins',
    size: 'Extra-Large (240L Rotating Drum)',
    pointsRequired: 800,
    stock: 15,
    description: 'Dual-chamber tumbling composter for fast nutrient-rich soil generation.',
    badge: 'Zero Waste Champion',
    iconName: 'Trash2',
    color: 'amber'
  },
  {
    customId: 'GIFT-109',
    title: 'Recycled Rubber Heavy Sorting Gloves (Pair)',
    category: 'Eco Tools & Accessories',
    size: 'Medium / Large',
    pointsRequired: 60,
    stock: 140,
    description: 'Grip-textured, puncture-proof protection for glass and metal sorting.',
    badge: 'Safety First',
    iconName: 'Shield',
    color: 'emerald'
  },
  {
    customId: 'GIFT-110',
    title: '$5.00 Municipal Bill Reduction Voucher',
    category: 'Bill Discount & Vouchers',
    size: 'Direct Bill Credit',
    pointsRequired: 100,
    stock: 999,
    description: 'Applies an immediate $5.00 rebate to your current monthly municipal invoice.',
    badge: 'Instant Credit',
    iconName: 'CreditCard',
    color: 'purple'
  }
];

export async function ensureGiftsSeeded() {
  try {
    const count = await RewardGift.countDocuments();
    if (count === 0) {
      await RewardGift.insertMany(DEFAULT_GIFTS);
    }
  } catch (err) {
    console.warn('ensureGiftsSeeded notice:', err.message);
  }
}

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

export const getResidentDashboard = async (req, res) => {
  try {
    const resident = req.user;
    if (!resident) {
      return res.status(401).json({ message: 'Resident session expired or account not found in database' });
    }

    // Identify resident's registered area/sector
    const residentSector = resident.houseLocation?.sector || resident.address || '';
    const residentSectorNorm = normalizeSector(residentSector);

    // 1. Resolve Service Area for this resident
    const allAreas = await ServiceArea.find();
    const matchedServiceArea = allAreas.find(a => {
      const aName = normalizeSector(a.name);
      const aDisp = normalizeSector(a.displayName);
      if (residentSectorNorm && (aDisp === residentSectorNorm || aName === residentSectorNorm)) {
        return true;
      }
      if (!residentSectorNorm && a.polygonCoordinates?.length >= 3 && resident.houseLocation?.lat && resident.houseLocation?.lng) {
        return isPointInPolygon(resident.houseLocation.lat, resident.houseLocation.lng, a.polygonCoordinates);
      }
      return false;
    });

    // 2. Direct assigned driver on resident record (validate sector compatibility)
    let driver = null;
    if (resident.assignedDriverId) {
      driver = await Driver.findById(resident.assignedDriverId);
      if (driver && driver.activeSector) {
        const driverSectorNorm = normalizeSector(driver.activeSector);
        const validNorms = new Set([
          residentSectorNorm,
          normalizeSector(matchedServiceArea?.name),
          normalizeSector(matchedServiceArea?.displayName)
        ].filter(Boolean));

        if (!validNorms.has(driverSectorNorm)) {
          // Driver active sector does not match this resident's sector/area! Invalidate to prevent cross-sector leak
          driver = null;
        }
      }
    }

    // 3. If no driver or mismatched driver, resolve from ServiceArea
    if (!driver && matchedServiceArea?.assignedDriverId) {
      driver = await Driver.findById(matchedServiceArea.assignedDriverId);
      if (driver) {
        // Self-heal resident document in DB so correct driver is assigned
        await Resident.updateOne(
          { _id: resident._id },
          {
            $set: {
              assignedDriverId: driver._id,
              assignedDriverName: driver.name,
              assignedDriverPhone: driver.phone || '',
              assignedVehicle: driver.assignedVehicle || matchedServiceArea.assignedVehicle || 'Unassigned'
            }
          }
        ).catch(() => null);
        await User.updateOne(
          { _id: resident._id },
          {
            $set: {
              assignedDriverId: driver._id,
              assignedDriverName: driver.name,
              assignedDriverPhone: driver.phone || '',
              assignedVehicle: driver.assignedVehicle || matchedServiceArea.assignedVehicle || 'Unassigned'
            }
          }
        ).catch(() => null);
      }
    }

    // 4. Fallback: match driver whose activeSector strictly equals resident's sector
    if (!driver && residentSectorNorm) {
      const allDrivers = await Driver.find();
      driver = allDrivers.find(d => normalizeSector(d.activeSector) === residentSectorNorm);
    }

    const emergencyRequests = await EmergencyRequest.find({ residentId: resident._id }).sort({ createdAt: -1 });
    const complaints = await Complaint.find({ residentId: resident._id }).sort({ createdAt: -1 });
    const collections = await Collection.find({ residentId: resident._id }).sort({ createdAt: -1 });
    const redemptions = await RewardRedemption.find({ residentId: resident._id }).sort({ createdAt: -1 });

    // Compute today's routine pickup status
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = collections.find(c => {
      const cDate = c.date || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '');
      return cDate === todayStr;
    });
    const lastPickupDoc = collections[0] || null;
    const todayPickupStatus = todayCollection ? 'PICKED UP' : 'PENDING PICKUP';

    // When on duty: share live GPS telemetry. When off duty: show fixed registered base depot location
    const isDriverOnDuty = Boolean(driver?.isOnDuty);
    const fixedRegisteredLocation = (driver?.registeredLocation?.lat && driver.registeredLocation.lat !== 0)
      ? driver.registeredLocation
      : {
          lat: matchedServiceArea?.centerLat || 28.4848,
          lng: matchedServiceArea?.centerLng || 77.5135,
          address: driver?.address || (matchedServiceArea?.displayName ? `${matchedServiceArea.displayName} Base Depot` : `${residentSector || 'Municipal'} Base Depot Station`)
        };

    const driverLiveLocation = isDriverOnDuty 
      ? (driver?.liveLocation || fixedRegisteredLocation) 
      : fixedRegisteredLocation;

    // Check for active emergency with assigned driver for this specific resident
    const activeEmergency = emergencyRequests.find(e => 
      (e.status === 'ON THE WAY' || e.status === 'DISPATCHED') &&
      ((e.residentId && e.residentId.toString() === resident._id.toString()) || 
       (e.residentName && resident.name && e.residentName.toLowerCase() === resident.name.toLowerCase()))
    );

    let assignedDriverData = null;
    if (activeEmergency && activeEmergency.assignedDriverName && activeEmergency.assignedDriverName !== 'Unassigned' && isDriverOnDuty) {
      assignedDriverData = {
        id: activeEmergency.assignedDriverId || driver?._id,
        customId: driver?.customId || 'DRV',
        name: activeEmergency.assignedDriverName,
        phone: activeEmergency.assignedDriverPhone || driver?.phone || '',
        route: 'Emergency Response • ' + (activeEmergency.address || ''),
        van: activeEmergency.assignedDriverVehicle || driver?.assignedVehicle || 'Collection Truck',
        vehicle: activeEmergency.assignedDriverVehicle || driver?.assignedVehicle || 'Collection Truck',
        avatar: driver?.avatar || null,
        isOnDuty: true,
        isBroadcastingGPS: true,
        liveLocation: activeEmergency.driverLiveLocation || driverLiveLocation,
        registeredLocation: fixedRegisteredLocation,
        routeCoordinates: activeEmergency.routeCoordinates || [],
        etaMinutes: activeEmergency.etaMinutes || 6,
        isEmergencyDispatch: true,
        emergencyStatus: activeEmergency.status,
        emergencyId: activeEmergency._id
      };
    } else if (driver) {
      assignedDriverData = {
        id: driver._id,
        customId: driver.customId,
        name: driver.name,
        phone: driver.phone || '',
        route: driver.activeSector || residentSector,
        van: driver.assignedVehicle || matchedServiceArea?.assignedVehicle || 'Collection Truck',
        vehicle: driver.assignedVehicle || matchedServiceArea?.assignedVehicle || 'Collection Truck',
        avatar: driver.avatar || null,
        isOnDuty: isDriverOnDuty,
        isBroadcastingGPS: Boolean(driver.isBroadcastingGPS),
        liveLocation: driverLiveLocation,
        registeredLocation: fixedRegisteredLocation,
        assignedSector: driver.activeSector || residentSector,
        isEmergencyDispatch: false
      };
    }

    await ensureGiftsSeeded();
    const dynamicRewards = await RewardGift.find({ status: 'Active' });

    res.json({
      resident: resident ? {
        id: resident._id,
        customId: resident.customId,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        role: resident.role,
        address: resident.address || resident.houseLocation?.address || '',
        sector: residentSector,
        city: resident.city,
        houseLocation: resident.houseLocation || null
      } : null,
      garbagePoints: resident?.garbagePoints || 0,
      ecoScore: resident?.ecoScore || 0,
      divertedWasteKg: resident?.divertedWasteKg || 0,
      recycledPercent: resident?.recycledPercent || 0,
      co2SavedKg: resident?.co2SavedKg || 0,
      houseLocation: resident?.houseLocation || null,
      liveLocation: resident?.liveLocation || null,
      billing: resident?.billing || null,
      assignedDriver: assignedDriverData,
      activeEmergency: activeEmergency || null,
      todayPickupStatus,
      todayCollection: todayCollection || null,
      lastPickup: lastPickupDoc ? {
        status: lastPickupDoc.status === 'Completed' ? 'PICKED UP' : lastPickupDoc.status,
        date: lastPickupDoc.date,
        time: lastPickupDoc.createdAt ? new Date(lastPickupDoc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        weightKg: lastPickupDoc.weightKg,
        pointsEarned: lastPickupDoc.pointsEarned,
        wasteType: lastPickupDoc.type,
        driver: lastPickupDoc.driver
      } : null,
      emergencyRequests,
      complaints,
      collections,
      redemptions,
      availableRewards: dynamicRewards.length > 0 ? dynamicRewards : DEFAULT_GIFTS,
      pointRates: WASTE_POINT_RATES
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Redeem points for a gift or reward
export const redeemGarbagePoints = async (req, res) => {
  try {
    const { rewardId, giftId, residentId, deliveryAddress, notes } = req.body;
    const targetId = giftId || rewardId;
    
    await ensureGiftsSeeded();

    // Check in RewardGift model first
    let gift = null;
    if (targetId) {
      gift = await RewardGift.findById(targetId).catch(() => null) ||
             await RewardGift.findOne({ customId: targetId }).catch(() => null);
    }

    let resident = residentId 
      ? (await Resident.findById(residentId) || await User.findById(residentId)) 
      : (req.user || await Resident.findOne() || await User.findOne({ role: 'resident' }));

    if (!resident) {
      return res.status(404).json({ message: 'Resident account not found' });
    }

    const title = gift?.title || 'Eco Reward Gift';
    const pointsRequired = gift ? gift.pointsRequired : 100;
    const category = gift ? gift.category : 'Eco Product';
    const size = gift?.size || 'Standard';

    if ((resident.garbagePoints || 0) < pointsRequired) {
      return res.status(400).json({ 
        message: `Insufficient garbage points. You have ${resident.garbagePoints || 0} PTS, but this gift requires ${pointsRequired} PTS.` 
      });
    }

    // Decrement gift stock if available
    if (gift && gift.stock > 0) {
      gift.stock -= 1;
      if (gift.stock === 0) gift.status = 'Out of Stock';
      await gift.save();
    }

    // Deduct points from resident
    resident.garbagePoints -= pointsRequired;
    await resident.save();

    // Create redemption record with delivery details
    const customId = `RED-${Math.floor(1000 + Math.random() * 9000)}`;
    const redemptionCode = `TMT-${category.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const residentSector = resident.houseLocation?.sector || resident.sector || '';

    const redemption = await RewardRedemption.create({
      customId,
      residentId: resident._id,
      residentName: resident.name || 'Resident',
      residentEmail: resident.email || '',
      residentPhone: resident.phone || '',
      deliveryAddress: deliveryAddress || resident.address || resident.houseLocation?.address || '',
      sector: residentSector,
      rewardId: gift?._id || null,
      rewardTitle: title,
      category,
      size,
      pointsRedeemed: pointsRequired,
      redemptionCode,
      deliveryStatus: 'ORDER PLACED',
      status: 'ACTIVE',
      qrCode: `TMT-DELV-${customId}-${redemptionCode}`,
      notes: notes || ''
    });

    try {
      await PointsTransaction.create({
        customId: `#TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        residentId: resident._id,
        residentName: resident.name,
        type: 'REDEEMED',
        points: -pointsRequired,
        direction: 'DEBIT',
        title: `Redeemed: ${title}`,
        description: `Claimed ${title} (${size}) for ${pointsRequired} PTS. Delivery Code: ${redemptionCode}`,
        category: 'Gift Claim',
        referenceId: customId,
        balanceAfter: resident.garbagePoints,
        metadata: {
          orderId: redemption._id,
          orderCustomId: customId,
          redemptionCode,
          rewardTitle: title,
          size
        }
      });
    } catch (txnErr) {
      console.warn('PointsTransaction creation warning in redeemGarbagePoints:', txnErr.message);
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Resident ${resident.name} claimed reward gift: "${title}" (${size}) using ${pointsRequired} PTS`,
        user: resident.name,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('reward-redeemed', redemption);
      io.emit('order-created', redemption);
      io.emit('order-status-updated', redemption);
      io.emit('resident-points-updated', {
        residentId: resident._id,
        garbagePoints: resident.garbagePoints
      });
    }

    res.status(201).json({
      message: `Congratulations! Successfully claimed ${title} (${size})!`,
      remainingPoints: resident.garbagePoints,
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitEmergencyRequest = async (req, res) => {
  try {
    const { reason, type, residentName: bodyName, garbageType, estimatedQuantityKg } = req.body;
    let address = req.body.address;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for emergency pickup is required' });
    }

    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }

    address = address || resident?.address || resident?.houseLocation?.address || '';
    const residentName = bodyName || resident?.name || 'Resident';
    const reqId = `#REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const lat = req.body.lat !== undefined && req.body.lat !== 0 
      ? Number(req.body.lat) 
      : (resident?.houseLocation?.lat && resident.houseLocation.lat !== 0 ? Number(resident.houseLocation.lat) : 28.6280);

    const lng = req.body.lng !== undefined && req.body.lng !== 0 
      ? Number(req.body.lng) 
      : (resident?.houseLocation?.lng && resident.houseLocation.lng !== 0 ? Number(resident.houseLocation.lng) : 77.2185);

    const wasteType = garbageType || type || 'General Organic';

    const emergency = await EmergencyRequest.create({
      customId: reqId,
      reqId,
      residentId: resident?._id,
      residentName,
      address,
      type: wasteType,
      garbageType: wasteType,
      estimatedQuantityKg: estimatedQuantityKg ? Number(estimatedQuantityKg) : 10,
      status: 'PENDING_DISPATCH',
      reason,
      lat,
      lng,
      destinationLat: lat,
      destinationLng: lng
    });

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `New Emergency SOS filed: ${reqId} for ${residentName} at ${address}`,
        user: residentName,
        severity: 'Critical',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog creation notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-created', emergency);
      io.emit('emergency-updated', emergency);
    }

    res.status(201).json({
      success: true,
      message: `Emergency pickup request ${reqId} dispatched successfully!`,
      emergency
    });
  } catch (error) {
    console.error('Error in submitEmergencyRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const submitComplaint = async (req, res) => {
  try {
    const { title, category, type, description } = req.body;
    let residentName = req.body.residentName;
    let residentId = req.body.residentId;
    
    if (!description || (!title && !category && !type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and details are required' 
      });
    }

    // Try to get resident from req.user (JWT) or fallback to resident in DB
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }

    if (resident) {
      residentName = residentName || resident.name;
      residentId = residentId || resident._id;
    } else {
      residentName = residentName || 'Resident';
    }

    const residentEmail = req.body.residentEmail || resident?.email || '';
    const residentAddress = req.body.residentAddress || resident?.address || resident?.houseLocation?.address || '';
    const residentSector = req.body.residentSector || resident?.houseLocation?.sector || resident?.sector || 'Sector Alpha';
    const residentPhone = req.body.residentPhone || resident?.phone || '';
    const residentCustomId = resident?.customId || '';

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `#CMP-${randomNum}`;
    const customId = ticketNumber;
    const ticketId = ticketNumber;
    const effectiveCategory = category || type || (req.body.complaintType === 'Roadside Garbage' ? 'Roadside Garbage' : 'Missed Scheduled Pickup');
    const effectiveTitle = title || effectiveCategory;
    const complaintType = req.body.complaintType || (effectiveCategory.toLowerCase().includes('roadside') ? 'Roadside Garbage' : 'Resident');
    const numLat = Number(req.body.lat) || (resident?.houseLocation?.lat) || 28.6139;
    const numLng = Number(req.body.lng) || (resident?.houseLocation?.lng) || 77.2090;
    const landmark = req.body.landmark || '';
    const priority = req.body.priority || 'Medium';
    const effectiveAddress = req.body.residentAddress || landmark || residentAddress;

    const complaint = await Complaint.create({
      customId,
      ticketId,
      ticketNumber,
      residentId,
      residentName,
      residentEmail,
      residentAddress: effectiveAddress,
      residentSector,
      residentPhone,
      residentCustomId,
      title: effectiveTitle,
      complaintType,
      category: effectiveCategory,
      type: effectiveCategory,
      description,
      landmark,
      priority,
      lat: numLat,
      lng: numLng,
      location: {
        lat: numLat,
        lng: numLng,
        address: landmark || effectiveAddress
      },
      status: 'Under Review',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-created', complaint);
    }

    // Optional audit log entry
    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Service Complaint ${ticketNumber} filed by ${residentName}: "${effectiveTitle}"`,
        user: residentName,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog creation warning:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      ticketNumber,
      customId: ticketNumber,
      message: `Complaint ticket ${ticketNumber} generated successfully!`,
      complaint
    });
  } catch (error) {
    console.error('Error in submitComplaint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    const ticketNumber = complaint.customId || complaint.ticketId || complaint.ticketNumber || id;
    await Complaint.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-deleted', { id, ticketNumber });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Complaint ticket ${ticketNumber} deleted by Resident`,
        user: req.user?.name || complaint.residentName || 'Resident',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog error:', e.message);
    }

    res.json({
      success: true,
      message: `Complaint ticket ${ticketNumber} deleted successfully!`,
      id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findByIdAndUpdate(
      id,
      { confirmedByResident: true },
      { new: true }
    );
    if (!collection) {
      return res.status(404).json({ message: 'Collection record not found' });
    }
    res.json({ message: 'Pickup confirmed successfully', collection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const switchPlan = async (req, res) => {
  try {
    const { planName, price } = req.body;
    let resident = await Resident.findOneAndUpdate(
      {},
      { billing: { plan: planName, price, status: 'Active' } },
      { new: true }
    );
    if (!resident) {
      resident = await User.findOneAndUpdate(
        { role: 'resident' },
        { billing: { plan: planName, price, status: 'Active' } },
        { new: true }
      );
    }
    res.json({ message: 'Subscription plan updated successfully', billing: resident?.billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const emergency = await EmergencyRequest.findById(id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency pickup request not found' });
    }

    // Disallow deletion if driver is currently actively navigating to pickup location (unless admin)
    const isAdmin = req.user && ['admin', 'cityadmin', 'superadmin'].includes(req.user.role);
    if (emergency.status === 'ON THE WAY' && !isAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete emergency request while driver is actively on the way. Please wait for pickup completion.' 
      });
    }

    const reqId = emergency.customId || emergency.reqId || id;
    await EmergencyRequest.findByIdAndDelete(id);

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-deleted', { id, emergencyId: id, customId: reqId, reqId });
      io.emit('emergency-updated', { _id: id, deleted: true });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Emergency Request ${reqId} deleted/dismissed by Resident`,
        user: req.user?.name || emergency.residentName || 'Resident',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog notice:', e.message);
    }

    res.json({
      success: true,
      message: `Emergency pickup request ${reqId} deleted successfully!`,
      id,
      customId: reqId
    });
  } catch (error) {
    console.error('Error in deleteEmergencyRequest:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// RESIDENT SUBSCRIPTION, BILLING & POINTS REDEMPTION
// ==========================================

export const getResidentBilling = async (req, res) => {
  try {
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }
    if (!resident) {
      return res.status(404).json({ message: 'Resident account not found' });
    }

    if (!resident.garbagePoints || resident.garbagePoints === 0) {
      resident.garbagePoints = 380;
      await resident.save();
    }

    // Find all invoices for this resident
    let invoices = await Payment.find({
      $or: [
        { residentId: resident._id },
        { residentEmail: resident.email },
        { residentName: resident.name }
      ]
    }).sort({ createdAt: -1 });

    const availablePlans = await PricingPlan.find({ status: 'Active' });
    const activePlansList = availablePlans.length > 0 ? availablePlans : [
      { customId: 'plan_standard', name: 'Standard Municipal Collection', price: 149, billingCycle: 'Monthly', badge: 'Base Municipal' },
      { customId: 'plan_eco', name: 'Eco-Green Residential Plus', price: 299, billingCycle: 'Monthly', badge: 'Most Popular' },
      { customId: 'plan_commercial', name: 'Commercial Bulk Waste Tier', price: 899, billingCycle: 'Monthly', badge: 'Enterprise Bulk' }
    ];

    // Clean up resident plan name if it had old dollar signs like "($15.00/Mo)"
    let cleanPlanName = (resident.billing?.plan || '').replace(/\s*\(\$[0-9.]+\/Mo\)/g, '').split('(')[0].trim();
    if (!cleanPlanName) cleanPlanName = 'Standard Municipal';

    // Match resident's plan or default to first plan
    const matchedPlan = activePlansList.find(p => 
      p.name.toLowerCase() === cleanPlanName.toLowerCase() ||
      (cleanPlanName && p.name.toLowerCase().includes(cleanPlanName.toLowerCase())) ||
      (cleanPlanName && cleanPlanName.toLowerCase().includes(p.name.toLowerCase()))
    ) || activePlansList[0];

    const currentPrice = (resident.billing?.price && resident.billing?.price > 50)
      ? resident.billing.price
      : (matchedPlan?.price || 149);

    if (resident.billing && (resident.billing.plan !== cleanPlanName || resident.billing.price !== currentPrice)) {
      resident.billing.plan = cleanPlanName;
      resident.billing.price = currentPrice;
      resident.billing.currency = 'INR';
      await resident.save();
    }

    res.json({
      resident: {
        id: resident._id,
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        address: resident.address,
        customId: resident.customId
      },
      currentSubscription: {
        plan: cleanPlanName || matchedPlan?.name || 'Standard Municipal',
        price: currentPrice,
        currency: 'INR',
        status: resident.billing?.status || 'Active',
        coverage: matchedPlan?.coverage || 'Includes weekly door-to-door curbside collection, segregated wet & dry clearance, and civic support.',
        nextRenewal: resident.billing?.nextRenewal || new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
        cardLast4: resident.billing?.cardLast4 || '4242',
        paymentMethod: 'UPI / NetBanking (•••• 4242)'
      },
      garbagePoints: resident.garbagePoints || 0,
      pointsConversionRate: {
        pointsPerRupee: (await PointSetting.findOne({ key: 'global_point_settings' }))?.pointsPerRupee || 2,
        rupeePerPoint: (await PointSetting.findOne({ key: 'global_point_settings' }))?.pointValueInr || 0.5
      },
      invoices,
      availablePlans: activePlansList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const payResidentBill = async (req, res) => {
  try {
    const { invoiceId, pointsToRedeem = 0, paymentMethod } = req.body;

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }
    if (!resident) {
      return res.status(404).json({ message: 'Resident account not found' });
    }

    const invoice = await Payment.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ message: 'This invoice has already been paid and settled.' });
    }

    const points = Number(pointsToRedeem) || 0;
    if (points > (resident.garbagePoints || 0)) {
      return res.status(400).json({ 
        message: `Insufficient points. You have ${resident.garbagePoints || 0} PTS, but tried to redeem ${points} PTS.` 
      });
    }

    // Conversion in Rupees using dynamic Point Settings
    let pointVal = 0.50;
    try {
      const ps = await PointSetting.findOne({ key: 'global_point_settings' });
      if (ps?.pointValueInr) pointVal = Number(ps.pointValueInr);
    } catch (e) {}

    const discountAmount = Math.min(invoice.amount, Math.round((points * pointVal) * 100) / 100);
    const netAmount = Math.max(0, Math.round((invoice.amount - discountAmount) * 100) / 100);

    // Deduct points from resident's balance
    if (points > 0) {
      resident.garbagePoints = Math.max(0, (resident.garbagePoints || 0) - points);
      await resident.save();

      try {
        await PointsTransaction.create({
          customId: `#TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          residentId: resident._id,
          residentName: resident.name,
          type: 'BILL_REBATE',
          points: -points,
          direction: 'DEBIT',
          title: `Bill Rebate: Invoice ${invoice.customId || invoice._id}`,
          description: `Applied ${points} Garbage Points for ₹${discountAmount.toFixed(2)} municipal bill discount.`,
          category: 'Bill Discount',
          referenceId: invoice.customId || `#INV-${invoice._id.toString().slice(-4)}`,
          balanceAfter: resident.garbagePoints,
          metadata: {
            invoiceId: invoice._id,
            discountAmount,
            netAmount
          }
        });
      } catch (txnErr) {
        console.warn('PointsTransaction creation warning in payResidentBill:', txnErr.message);
      }
    }

    // Update invoice record
    invoice.originalAmount = invoice.originalAmount || invoice.amount;
    invoice.pointsDiscount = discountAmount;
    invoice.pointsRedeemed = points;
    invoice.netAmountPaid = netAmount;
    invoice.status = 'PAID';
    invoice.currency = 'INR';
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    invoice.notes = points > 0 
      ? `Settled with ${points} Garbage Points (₹${discountAmount.toFixed(2)} discount applied). Net charged: ₹${netAmount.toFixed(2)}`
      : 'Settled in full via direct payment';
    await invoice.save();

    // Log to AuditLog
    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Resident ${resident.name} paid invoice ${invoice.customId}: Net ₹${netAmount.toFixed(2)} (Subtracted ₹${discountAmount.toFixed(2)} via ${points} Garbage Points)`,
        user: resident.name,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    // Emit live socket updates to both Admin and Resident
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-updated', invoice);
      io.emit('resident-points-updated', { 
        residentId: resident._id, 
        garbagePoints: resident.garbagePoints 
      });
    }

    res.json({
      message: points > 0 
        ? `Payment successful! ₹${discountAmount.toFixed(2)} discount subtracted from your bill using ${points} Garbage Points. Net charged: ₹${netAmount.toFixed(2)}.`
        : `Payment of ₹${netAmount.toFixed(2)} completed successfully!`,
      invoice,
      pointsRedeemed: points,
      pointsDiscount: discountAmount,
      netAmountPaid: netAmount,
      remainingGarbagePoints: resident.garbagePoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResidentRewards = async (req, res) => {
  try {
    await ensureGiftsSeeded();

    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }

    const gifts = await RewardGift.find({ status: 'Active' }).sort({ pointsRequired: 1 });
    const redemptions = resident 
      ? await RewardRedemption.find({ residentId: resident._id }).sort({ createdAt: -1 })
      : await RewardRedemption.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      gifts: gifts.length > 0 ? gifts : DEFAULT_GIFTS,
      garbagePoints: resident?.garbagePoints || 0,
      redemptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch resident's reward redemption orders
export const getResidentOrders = async (req, res) => {
  try {
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }
    if (!resident) {
      return res.status(401).json({ message: 'Resident session expired' });
    }

    const orders = await RewardRedemption.find({ residentId: resident._id }).sort({ createdAt: -1 });

    // Auto-heal & sync any order that had its complaint resolved as REFUND
    const updatedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      if (!orderObj.isRefunded && (
        orderObj.deliveryStatus === 'REFUNDED' || 
        orderObj.status === 'REFUNDED' || 
        orderObj.complaintStatus?.includes('Refund') || 
        orderObj.hasComplaint || 
        orderObj.notes?.includes('Refunded')
      )) {
        const complaint = await Complaint.findOne({
          $or: [
            { orderId: order._id },
            { orderCustomId: order.customId }
          ],
          resolutionType: 'REFUND'
        });
        
        let refPoints = complaint?.refundPoints;
        if (!refPoints && orderObj.notes) {
          const match = orderObj.notes.match(/Refunded\s+(\d+)\s*PTS/i);
          if (match) refPoints = parseInt(match[1]);
        }
        if (!refPoints) {
          refPoints = order.pointsRedeemed || 0;
        }

        const refInr = Number((refPoints * 0.5).toFixed(2));
        order.isRefunded = true;
        order.refundedPoints = refPoints;
        order.refundedAmountInr = refInr;
        order.refundedAt = complaint?.resolvedAt || complaint?.updatedAt || order.updatedAt || new Date();
        order.refundNotes = complaint?.resolutionNotes || order.notes || `Refunded ${refPoints} PTS to resident account.`;
        order.complaintStatus = `Refunded (+${refPoints} PTS / ₹${refInr})`;
        order.deliveryStatus = 'REFUNDED';
        order.status = 'REFUNDED';
        await order.save().catch(() => null);
        return order.toObject();
      }
      return orderObj;
    }));

    res.json({ orders: updatedOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resident reports an issue / files a complaint for a specific reward order
export const submitOrderComplaint = async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;
    if (!orderId || !description) {
      return res.status(400).json({ message: 'Order ID and issue description are required' });
    }

    const order = await RewardRedemption.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Reward order not found' });
    }

    let resident = req.user || await Resident.findById(order.residentId);

    const ticketNumber = `#CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const title = `Order Issue: ${order.rewardTitle} (${order.customId})`;

    const complaint = await Complaint.create({
      customId: ticketNumber,
      ticketId: ticketNumber,
      ticketNumber,
      residentId: resident?._id || order.residentId,
      residentName: resident?.name || order.residentName || 'Resident',
      residentEmail: resident?.email || order.residentEmail || '',
      residentPhone: resident?.phone || order.residentPhone || '',
      residentAddress: order.deliveryAddress || resident?.address || '',
      residentSector: order.sector || resident?.sector || 'Central Municipal Ward',
      complaintType: 'Order Complain',
      category: 'Reward Order Issue',
      type: reason || 'Defective/Missing Gift Item',
      title,
      description: `[Order ${order.customId} • ${order.rewardTitle}] ${description}`,
      orderId: order._id,
      orderCustomId: order.customId,
      orderTitle: order.rewardTitle,
      priority: 'High',
      assignedDriver: order.assignedDriverName || 'Unassigned',
      assignedDriverId: order.assignedDriverId || null,
      assignedVehicle: order.assignedVehicle || '',
      status: 'Under Review'
    });

    // Link complaint back to the reward redemption order
    order.hasComplaint = true;
    order.complaintId = complaint._id;
    order.complaintText = description;
    order.complaintStatus = 'Under Review';
    order.complaintDate = new Date();
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-created', complaint);
      io.emit('order-complaint-created', { complaint, order });
      io.emit('order-status-updated', order);
      io.emit('redemption-status-updated', order);
    }

    res.status(201).json({
      message: `Complaint ticket ${ticketNumber} logged for order ${order.customId}! Municipal Admin has been notified.`,
      complaint,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch resident points transaction history / ledger
export const getResidentPointsHistory = async (req, res) => {
  try {
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }
    if (!resident) {
      return res.status(401).json({ message: 'Resident session expired' });
    }

    const residentId = resident._id;

    // 1. Fetch explicit PointsTransactions
    const explicitTxns = await PointsTransaction.find({ residentId }).sort({ createdAt: -1 });
    const existingRefIds = new Set(explicitTxns.map(t => t.referenceId).filter(Boolean));

    // 2. Aggregate historical collections (waste pickups) if not recorded in PointsTransaction
    const collections = await Collection.find({ residentId }).sort({ createdAt: -1 });
    const collectionTxns = [];
    for (const c of collections) {
      const refId = c.customId || `COL-${c._id.toString().slice(-4)}`;
      if (!existingRefIds.has(refId) && (c.pointsEarned || 0) > 0) {
        collectionTxns.push({
          _id: c._id,
          customId: `#TXN-${c.customId || c._id.toString().slice(-6)}`,
          residentId,
          residentName: c.residentName || resident.name,
          type: 'EARNED',
          points: c.pointsEarned,
          direction: 'CREDIT',
          title: `Waste Pickup: ${c.type || 'Household Waste'}`,
          description: `Curbside collection cleared: ${c.weightKg || 0}kg collected by driver ${c.driver || 'Municipal Driver'}`,
          category: 'Waste Pickup',
          referenceId: refId,
          balanceAfter: null,
          createdAt: c.createdAt || (c.date ? new Date(c.date) : new Date()),
          metadata: { collectionId: c._id, weightKg: c.weightKg, type: c.type }
        });
      }
    }

    // 3. Aggregate historical reward redemptions (-PTS) if not in PointsTransaction
    const redemptions = await RewardRedemption.find({ 
      residentId, 
      isExchange: { $ne: true } 
    }).sort({ createdAt: -1 });
    const redemptionTxns = [];
    for (const r of redemptions) {
      const refId = r.customId || `RED-${r._id.toString().slice(-4)}`;
      if (!existingRefIds.has(refId) && (r.pointsRedeemed || 0) > 0) {
        redemptionTxns.push({
          _id: r._id,
          customId: `#TXN-${r.customId || r._id.toString().slice(-6)}`,
          residentId,
          residentName: r.residentName || resident.name,
          type: 'REDEEMED',
          points: -Math.abs(r.pointsRedeemed),
          direction: 'DEBIT',
          title: `Claimed Gift: ${r.rewardTitle || 'Eco Product'}`,
          description: `Claimed ${r.rewardTitle || 'Gift'} (${r.size || 'Standard'}). Delivery Status: ${r.deliveryStatus}`,
          category: 'Gift Claim',
          referenceId: refId,
          balanceAfter: null,
          createdAt: r.createdAt || new Date(),
          metadata: { orderId: r._id, redemptionCode: r.redemptionCode }
        });
      }
    }

    // 4. Aggregate historical refunds from complaints (+PTS) if not in PointsTransaction
    const refundedComplaints = await Complaint.find({ 
      residentId, 
      resolutionType: 'REFUND',
      refundPoints: { $gt: 0 } 
    }).sort({ createdAt: -1 });
    const refundTxns = [];
    for (const cmp of refundedComplaints) {
      const refId = cmp.orderCustomId || cmp.ticketNumber || cmp.customId || `#CMP-${cmp._id.toString().slice(-4)}`;
      if (!existingRefIds.has(refId) && !existingRefIds.has(cmp.customId) && !existingRefIds.has(cmp.orderCustomId)) {
        refundTxns.push({
          _id: cmp._id,
          customId: `#TXN-${cmp.ticketNumber?.replace('#', '') || cmp._id.toString().slice(-6)}`,
          residentId,
          residentName: cmp.residentName || resident.name,
          type: 'REFUNDED',
          points: cmp.refundPoints,
          direction: 'CREDIT',
          title: `Refund: Order #${cmp.orderCustomId || 'REFUND'}`,
          description: cmp.resolutionNotes || `Points refund for complaint ticket ${cmp.ticketNumber || cmp.customId}`,
          category: 'Order Refund',
          referenceId: refId,
          balanceAfter: null,
          createdAt: cmp.resolvedAt || cmp.updatedAt || cmp.createdAt || new Date(),
          metadata: { complaintId: cmp._id, orderCustomId: cmp.orderCustomId }
        });
      }
    }

    // 5. Aggregate historical bill discounts / rebates (-PTS) if not in PointsTransaction
    const billPayments = await Payment.find({
      $or: [
        { residentId },
        { residentEmail: resident.email },
        { residentName: resident.name }
      ],
      pointsRedeemed: { $gt: 0 }
    }).sort({ createdAt: -1 });
    const billTxns = [];
    for (const p of billPayments) {
      const refId = p.customId || `#INV-${p._id.toString().slice(-4)}`;
      if (!existingRefIds.has(refId)) {
        billTxns.push({
          _id: p._id,
          customId: `#TXN-${refId.replace('#', '')}`,
          residentId,
          residentName: resident.name,
          type: 'BILL_REBATE',
          points: -Math.abs(p.pointsRedeemed),
          direction: 'DEBIT',
          title: `Bill Rebate: Invoice ${refId}`,
          description: `Applied ${p.pointsRedeemed} Garbage Points for ₹${(p.pointsDiscount || (p.pointsRedeemed * 0.5)).toFixed(2)} municipal bill discount.`,
          category: 'Bill Discount',
          referenceId: refId,
          balanceAfter: null,
          createdAt: p.paidAt || p.createdAt || new Date(),
          metadata: { invoiceId: p._id, discount: p.pointsDiscount }
        });
      }
    }

    // Combine all and sort by date descending
    let allTransactions = [
      ...explicitTxns.map(t => (t.toObject ? t.toObject() : t)),
      ...collectionTxns,
      ...redemptionTxns,
      ...refundTxns,
      ...billTxns
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // If resident has a points balance but no transaction ledger records yet, seed an initial verified balance entry
    if (allTransactions.length === 0 && (resident.garbagePoints || 0) > 0) {
      const balance = Number(resident.garbagePoints || 0);
      const initialTxn = {
        customId: `#TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        residentId: resident._id,
        residentName: resident.name,
        type: 'EARNED',
        points: balance,
        direction: 'CREDIT',
        title: 'Household Segregation & Welcome Points',
        description: `Verified points balance for curbside waste segregation at ${resident.address || 'Household Property'}.`,
        category: 'Waste Pickup',
        referenceId: 'INIT-BALANCE',
        balanceAfter: balance,
        createdAt: resident.createdAt || new Date()
      };
      try {
        await PointsTransaction.create(initialTxn);
      } catch (e) {}
      allTransactions = [initialTxn];
    }

    let totalEarned = 0;
    let totalRefunded = 0;
    let totalRedeemed = 0;

    for (const txn of allTransactions) {
      if (txn.type === 'EARNED') totalEarned += Number(txn.points || 0);
      else if (txn.type === 'REFUNDED') totalRefunded += Number(txn.points || 0);
      else if (txn.type === 'REDEEMED' || txn.type === 'BILL_REBATE') totalRedeemed += Math.abs(Number(txn.points || 0));
    }

    res.json({
      success: true,
      currentBalance: resident.garbagePoints || 0,
      rebateValueInr: Number(((resident.garbagePoints || 0) * 0.5).toFixed(2)),
      totalEarned,
      totalRefunded,
      totalRedeemed,
      totalTransactions: allTransactions.length,
      transactions: allTransactions
    });
  } catch (error) {
    console.error('Error in getResidentPointsHistory:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fetch authenticated resident profile details
export const getResidentProfile = async (req, res) => {
  try {
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne();
    }
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident profile not found' });
    }
    res.json({ success: true, resident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update resident profile (name, phone, address, sector, city, avatar)
export const updateResidentProfile = async (req, res) => {
  try {
    let resident = req.user;
    if (!resident) {
      resident = await Resident.findOne();
    }
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident profile not found' });
    }

    const { name, phone, address, city, sector, avatar } = req.body;

    if (name) resident.name = name.trim();
    if (phone !== undefined) resident.phone = phone.trim();
    if (address !== undefined) {
      resident.address = address.trim();
      if (!resident.houseLocation) resident.houseLocation = {};
      resident.houseLocation.address = address.trim();
    }
    if (city !== undefined) resident.city = city.trim();
    if (sector !== undefined) {
      if (!resident.houseLocation) resident.houseLocation = {};
      resident.houseLocation.sector = sector.trim();
    }
    if (avatar !== undefined) resident.avatar = avatar;

    await resident.save();

    // Create Audit Log
    try {
      const { AuditLog } = await import('../models/AuditLog.js');
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Resident Profile updated for ${resident.name} (${resident.customId})`,
        user: resident.name,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (aErr) {
      console.warn('AuditLog error:', aErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('resident-profile-updated', resident);
    }

    res.json({
      success: true,
      message: 'Resident profile updated successfully!',
      resident
    });
  } catch (error) {
    console.error('Error updating resident profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
};



