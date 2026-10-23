import { Resident } from '../models/Resident.js';
import { Driver } from '../models/Driver.js';
import { AdminStaff } from '../models/AdminStaff.js';
import { User } from '../models/User.js';
import { EmergencyRequest } from '../models/EmergencyRequest.js';
import { Complaint } from '../models/Complaint.js';
import { Route } from '../models/Route.js';
import { Role, Staff } from '../models/RolePermission.js';
import { ServiceArea } from '../models/ServiceArea.js';
import { Vehicle } from '../models/Vehicle.js';
import { AuditLog } from '../models/AuditLog.js';
import { Payment } from '../models/Payment.js';
import { RewardGift } from '../models/RewardGift.js';
import { RewardRedemption } from '../models/RewardRedemption.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { PointsTransaction } from '../models/PointsTransaction.js';
import { PointSetting } from '../models/PointSetting.js';
import { DEFAULT_GIFTS } from './resident.controller.js';

export const DEFAULT_PRICING_PLANS = [
  {
    customId: 'plan_standard',
    name: 'Standard Municipal Collection',
    price: 149,
    billingCycle: 'Monthly',
    coverage: '60 Gallon Bin / Weekly Pickup',
    badge: 'Base Municipal',
    color: 'emerald',
    features: [
      '60 Gallon Bin Weekly Pickup',
      'Standard Municipal Route Dispatch',
      'Bi-weekly Recycling Collection',
      'Online Billing & Points Accumulation'
    ]
  },
  {
    customId: 'plan_eco',
    name: 'Eco-Green Residential Plus',
    price: 299,
    billingCycle: 'Monthly',
    coverage: '120 Gal + Composting & Recycling',
    badge: 'Most Popular',
    color: 'teal',
    features: [
      '120 Gallon Bin Weekly Pickup',
      'Dedicated Organic & Composting Sacks',
      'Bio-Degradable Municipal Garbage Bags',
      '2x Garbage Points Earning Rate',
      'Express Emergency SOS Clearances'
    ]
  },
  {
    customId: 'plan_commercial',
    name: 'Commercial Bulk Waste Tier',
    price: 899,
    billingCycle: 'Monthly',
    coverage: 'High Capacity Roll-off / 3x Weekly',
    badge: 'Enterprise Bulk',
    color: 'blue',
    features: [
      'High Capacity Roll-Off Container',
      '3x Weekly Fleet Collection',
      'Special Clearance & Yard Surcharges Waived',
      'Dedicated Fleet Support Desk'
    ]
  },
  {
    customId: 'plan_emergency',
    name: 'Emergency SOS Clearance',
    price: 99,
    billingCycle: 'Per Dispatch',
    coverage: 'Express < 60 Min Dedicated Pickup',
    badge: 'On-Demand',
    color: 'amber',
    features: [
      'Dedicated Priority Truck Dispatch',
      '< 60 Minutes Response Time',
      'Direct Vehicle-to-House GPS Route',
      'Hazardous & Overflow Clearance'
    ]
  }
];

export async function ensurePricingPlansSeeded() {
  try {
    const count = await PricingPlan.countDocuments();
    if (count === 0) {
      await PricingPlan.insertMany(DEFAULT_PRICING_PLANS);
    }
  } catch (err) {
    console.warn('ensurePricingPlansSeeded notice:', err.message);
  }
}

export const getAdminDashboard = async (req, res) => {
  try {
    const allResidents = await Resident.find().sort({ createdAt: -1 });
    const allDrivers = await Driver.find().sort({ createdAt: -1 });

    const emergencies = await EmergencyRequest.find().sort({ createdAt: -1 });
    const complaints = await Complaint.find()
      .populate('residentId', 'name email address phone houseLocation customId')
      .sort({ createdAt: -1 });
    const routes = await Route.find();

    // Fetch exclusively admin-created service areas from database
    const serviceAreas = await ServiceArea.find().sort({ createdAt: -1 });

    // Fetch all municipal garbage vehicles
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });

    // Fetch system audit logs
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);

    res.json({
      stats: {
        totalResidents: allResidents.length,
        activeResidents: allResidents.length,
        totalDrivers: allDrivers.length,
        activeDrivers: allDrivers.filter(d => d.isOnDuty).length,
        totalVehicles: vehicles.length,
        activeVehicles: vehicles.filter(v => v.status === 'Operational' || v.status === 'In-Transit').length,
        totalServiceAreas: serviceAreas.length,
        openEmergencies: emergencies.filter(e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP').length,
        activeEmergencies: emergencies.filter(e => e.status !== 'RESOLVED' && e.status !== 'PICKED_UP').length,
        totalAuditLogs: auditLogs.length
      },
      residentsList: allResidents,
      driversList: allDrivers,
      vehiclesList: vehicles,
      serviceAreas,
      emergencies,
      complaints,
      routes,
      auditLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import { sendCredentialsNotification } from '../utils/notificationService.js';

export const addResident = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      address, 
      plan, 
      password,
      houseLocation,
      liveLocation
    } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const customId = `RES-${Math.floor(100 + Math.random() * 900)}`;
    const userPassword = password || 'Resident@123';

    // Store fixed house location and initial dynamic live location
    const fixedHouse = {
      address: address || houseLocation?.address || '',
      lat: houseLocation?.lat !== undefined ? Number(houseLocation.lat) : 28.6139,
      lng: houseLocation?.lng !== undefined ? Number(houseLocation.lng) : 77.2090,
      sector: houseLocation?.sector || 'Greenfield District'
    };

    const dynamicLive = {
      lat: liveLocation?.lat !== undefined ? Number(liveLocation.lat) : fixedHouse.lat,
      lng: liveLocation?.lng !== undefined ? Number(liveLocation.lng) : fixedHouse.lng,
      address: liveLocation?.address || address || '',
      speedKm: 0,
      heading: 'Static',
      lastBroadcastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Auto-link assigned driver if sector already has one allocated
    let areaDriver = null;
    const matchedArea = await ServiceArea.findOne({
      $or: [
        { name: fixedHouse.sector },
        { displayName: fixedHouse.sector }
      ]
    });
    if (matchedArea?.assignedDriverId) {
      areaDriver = await Driver.findById(matchedArea.assignedDriverId) || await User.findById(matchedArea.assignedDriverId);
    }
    if (!areaDriver && fixedHouse.sector) {
      areaDriver = await Driver.findOne({ activeSector: fixedHouse.sector });
    }

    const newResident = await Resident.create({
      customId,
      name,
      email,
      password: userPassword,
      role: 'resident',
      phone,
      address: fixedHouse.address,
      houseLocation: fixedHouse,
      liveLocation: dynamicLive,
      billing: plan ? { plan, status: 'Active' } : null,
      assignedDriverId: areaDriver?._id || null,
      assignedDriverName: areaDriver?.name || '',
      assignedDriverPhone: areaDriver?.phone || '',
      assignedVehicle: areaDriver?.assignedVehicle || matchedArea?.assignedVehicle || ''
    });

    // If driver found, append this new house stop to the driver's route
    if (areaDriver) {
      const route = await Route.findOne({
        $or: [
          { driverId: areaDriver._id },
          { name: fixedHouse.sector },
          ...(matchedArea ? [{ name: matchedArea.name }, { name: matchedArea.displayName }] : [])
        ]
      });

      if (route) {
        const nextIdx = (route.stops?.length || 0) + 1;
        route.stops.push({
          customId: `0${nextIdx}`.slice(-2),
          residentId: newResident._id,
          residentName: newResident.name,
          residentPhone: newResident.phone || '',
          address: fixedHouse.address,
          location: fixedHouse.address,
          type: plan || 'Residential Household',
          binType: 'Organic',
          status: 'PENDING',
          time: '08:30 AM',
          distance: `${150 + nextIdx * 60}m away`,
          isNearby: false,
          notes: `New resident: ${newResident.name}`,
          lat: fixedHouse.lat,
          lng: fixedHouse.lng
        });
        route.stopsCount = route.stops.length;
        await route.save();

        const io = req.app.get('io');
        if (io) {
          io.emit('house-list-updated', {
            driverId: areaDriver._id,
            sector: areaDriver.activeSector,
            stopsCount: route.stops.length,
            houseList: route.stops,
            routeStops: route.stops
          });
        }
      }
    }

    // Dispatch credentials to resident email and WhatsApp
    const dispatchResult = await sendCredentialsNotification({
      recipientType: 'resident',
      name,
      email,
      phone,
      customId,
      password: userPassword,
      details: { address: fixedHouse.address }
    });

    res.status(201).json({
      user: newResident,
      credentials: {
        customId,
        email,
        password: userPassword
      },
      dispatch: dispatchResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addDriver = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      vehicle, 
      sector, 
      password,
      gender,
      aadharNumber,
      drivingLicence,
      dob,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      experienceYears,
      address,
      liveLocation
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const customId = `DRV-${Math.floor(100 + Math.random() * 900)}`;
    const userPassword = password || 'Driver@123';

    // Driver has NO fixed location — only dynamic live GPS coordinates
    const dynamicLive = {
      lat: liveLocation?.lat !== undefined ? Number(liveLocation.lat) : 28.6139,
      lng: liveLocation?.lng !== undefined ? Number(liveLocation.lng) : 77.2090,
      address: liveLocation?.address || sector || 'Municipal Depot',
      speedKm: 0,
      heading: 'N/A',
      lastBroadcastTime: 'Standby'
    };

    const finalAssignedVehicle = (vehicle && vehicle !== 'None' && vehicle !== 'Unassigned') ? vehicle : '';

    const newDriver = await Driver.create({
      customId,
      name,
      email,
      password: userPassword,
      role: 'driver',
      phone: phone || '',
      address: address || '',
      assignedVehicle: finalAssignedVehicle,
      activeSector: sector || 'Unassigned',
      gender: gender || 'Male',
      aadharNumber: aadharNumber || '',
      drivingLicence: drivingLicence || '',
      dob: dob || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      bloodGroup: bloodGroup || '',
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      liveLocation: dynamicLive,
      isOnDuty: false,
      isBroadcastingGPS: false
    });

    // Also mirror into User model for cross-compatibility
    await User.create({
      customId,
      name,
      email,
      password: userPassword,
      role: 'driver',
      phone: phone || '',
      address: address || '',
      assignedVehicle: finalAssignedVehicle,
      activeSector: sector || 'Unassigned',
      gender: gender || 'Male',
      aadharNumber: aadharNumber || '',
      drivingLicence: drivingLicence || '',
      dob: dob || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      bloodGroup: bloodGroup || '',
      experienceYears: experienceYears ? Number(experienceYears) : 0,
      liveLocation: dynamicLive,
      isOnDuty: false,
      isBroadcastingGPS: false
    }).catch(err => console.warn('User mirror notice:', err.message));

    // If a vehicle was selected, assign it in the Vehicle registry
    if (finalAssignedVehicle) {
      await Vehicle.findOneAndUpdate(
        { vehicleNumber: finalAssignedVehicle },
        {
          assignedDriverId: newDriver._id,
          assignedDriverName: newDriver.name,
          assignedSector: sector || 'Unassigned',
          status: 'Operational'
        }
      );
    }

    // Dispatch credentials to driver email and WhatsApp
    const dispatchResult = await sendCredentialsNotification({
      recipientType: 'driver',
      name,
      email,
      phone,
      customId,
      password: userPassword,
      details: { 
        vehicle: finalAssignedVehicle || 'Vehicle Pending Assignment', 
        sector 
      }
    });

    res.status(201).json({
      user: newDriver,
      credentials: {
        customId,
        email,
        password: userPassword
      },
      dispatch: dispatchResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    let driver = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await Driver.findById(id).catch(() => null) || await User.findById(id).catch(() => null);
    }
    if (!driver) {
      driver = await Driver.findOne({ customId: id }) || await User.findOne({ customId: id, role: 'driver' });
    }

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const driverName = driver.name;
    const driverId = driver._id;
    const customId = driver.customId;
    const email = driver.email;

    // Delete from both Driver and User models
    await Driver.deleteMany({
      $or: [
        { _id: driverId },
        ...(customId ? [{ customId }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    await User.deleteMany({
      $or: [
        { _id: driverId },
        ...(customId ? [{ customId }] : []),
        ...(email ? [{ email }] : [])
      ],
      role: 'driver'
    });

    // Unassign driver from any service area
    await ServiceArea.updateMany(
      { $or: [{ assignedDriverId: driverId }, { assignedDriverName: driverName }, { assignedDriver: driverName }] },
      { $set: { assignedDriverId: null, assignedDriver: 'Unassigned', assignedDriverName: 'Unassigned' } }
    );

    // Unassign driver from any vehicle
    await Vehicle.updateMany(
      { $or: [{ assignedDriverId: driverId }, { assignedDriverName: driverName }] },
      { $set: { assignedDriverId: null, assignedDriverName: 'Unassigned', status: 'Available' } }
    );

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.emit('driver-deleted', { driverId, customId, driverName });
    }

    res.json({
      success: true,
      message: `Driver ${driverName} (${customId || 'Driver'}) removed from directory successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;
    let resident = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      resident = await Resident.findById(id).catch(() => null) || await User.findById(id).catch(() => null);
    }
    if (!resident) {
      resident = await Resident.findOne({ customId: id }) || await User.findOne({ customId: id, role: 'resident' });
    }

    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    const residentName = resident.name;
    const residentId = resident._id;
    const customId = resident.customId;
    const email = resident.email;

    // Delete from both Resident and User collections
    await Resident.deleteMany({
      $or: [
        { _id: residentId },
        ...(customId ? [{ customId }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    await User.deleteMany({
      $or: [
        { _id: residentId },
        ...(customId ? [{ customId }] : []),
        ...(email ? [{ email }] : [])
      ],
      role: 'resident'
    });

    // Remove resident stop from all routes
    await Route.updateMany(
      {},
      { $pull: { stops: { residentId: residentId } } }
    );

    // Delete or unbind complaints and emergency requests for this resident
    await Complaint.deleteMany({ residentId });
    await EmergencyRequest.deleteMany({ residentId });

    // Emit socket notification
    const io = req.app.get('io');
    if (io) {
      io.emit('resident-deleted', { residentId, customId, residentName });
    }

    res.json({
      success: true,
      message: `Resident ${residentName} (${customId || 'Resident'}) removed successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignDriverToEmergency = async (req, res) => {
  try {
    const { emergencyId, driverId, driverName } = req.body;

    const emergency = await EmergencyRequest.findById(emergencyId);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    let driver = null;
    if (driverId) {
      driver = await Driver.findById(driverId).catch(() => null) || 
               await Driver.findOne({ customId: driverId }).catch(() => null) ||
               await User.findById(driverId).catch(() => null) || 
               await User.findOne({ customId: driverId }).catch(() => null);
    }
    if (!driver && driverName) {
      driver = await Driver.findOne({ name: driverName }).catch(() => null) ||
               await User.findOne({ name: driverName, role: 'driver' }).catch(() => null);
    }
    if (!driver) {
      driver = await Driver.findOne().catch(() => null) ||
               await User.findOne({ role: 'driver' }).catch(() => null);
    }

    emergency.assignedDriverId = driver?._id || driverId;
    emergency.assignedDriverName = driver?.name || driverName || 'Municipal Driver';
    emergency.assignedDriverPhone = driver?.phone || '+1 (555) 019-2834';
    emergency.assignedDriverVehicle = driver?.assignedVehicle || 'Assigned Truck';

    if (driver?.liveLocation?.lat && driver.liveLocation.lat !== 0) {
      emergency.driverLiveLocation = {
        lat: Number(driver.liveLocation.lat),
        lng: Number(driver.liveLocation.lng),
        speedKm: Number(driver.liveLocation.speedKm || 20),
        heading: driver.liveLocation.heading || 'Dispatched',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      emergency.driverLiveLocation = {
        lat: 28.6139,
        lng: 77.2090,
        speedKm: 20,
        heading: 'Dispatched',
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    // Ensure emergency has coordinates if missing
    if ((!emergency.lat || emergency.lat === 0) && emergency.residentId) {
      const residentUser = await Resident.findById(emergency.residentId).catch(() => null) ||
                           await User.findById(emergency.residentId).catch(() => null);
      if (residentUser?.houseLocation?.lat) {
        emergency.lat = residentUser.houseLocation.lat;
        emergency.lng = residentUser.houseLocation.lng;
      }
    }
    if (!emergency.lat || emergency.lat === 0) {
      emergency.lat = 28.6280;
      emergency.lng = 77.2185;
    }

    emergency.status = 'DISPATCHED';
    await emergency.save();

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Emergency SOS ${emergency.customId || emergency.reqId} dispatched to driver "${emergency.assignedDriverName}" (${emergency.assignedDriverVehicle})`,
        user: req.user?.name || 'Municipal Dispatcher',
        severity: 'Warning',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog creation notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-assigned', emergency);
      io.emit('emergency-updated', emergency);
      io.emit('driver-emergency-assigned', { driverId: emergency.assignedDriverId, emergency });
    }

    return res.json(emergency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAdminComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).populate('residentId', 'name email address phone houseLocation customId');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminComplaint = async (req, res) => {
  try {
    const { 
      complaintType, 
      title, 
      category, 
      description, 
      residentName, 
      residentPhone, 
      residentAddress, 
      residentSector, 
      landmark, 
      priority, 
      assignedDriver,
      assignedDriverId,
      assignedVehicle,
      lat,
      lng
    } = req.body;

    const generatedId = `#CMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const numLat = Number(lat) || 28.6139;
    const numLng = Number(lng) || 77.2090;

    const complaint = await Complaint.create({
      customId: generatedId,
      ticketId: generatedId,
      ticketNumber: generatedId,
      complaintType: complaintType || 'Resident',
      title: title || (complaintType === 'Roadside Garbage' ? 'Roadside Waste Incident' : 'Resident Grievance'),
      category: category || (complaintType === 'Roadside Garbage' ? 'Roadside Garbage' : 'General Service'),
      type: category || (complaintType === 'Roadside Garbage' ? 'Roadside Garbage' : 'Service Complaint'),
      description: description || 'Reported waste issue',
      residentName: residentName || (complaintType === 'Roadside Garbage' ? 'Public / Inspector Report' : 'Resident Citizen'),
      residentPhone: residentPhone || '',
      residentAddress: residentAddress || landmark || 'Greenfield District',
      residentSector: residentSector || 'Central Municipal Ward',
      landmark: landmark || '',
      priority: priority || 'Medium',
      assignedDriver: assignedDriver || 'Unassigned',
      assignedDriverId: assignedDriverId || null,
      assignedVehicle: assignedVehicle || '',
      lat: numLat,
      lng: numLng,
      location: {
        lat: numLat,
        lng: numLng,
        address: residentAddress || landmark || ''
      },
      status: 'Under Review',
      date: new Date().toLocaleDateString()
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-created', complaint);
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `New ${complaint.complaintType} complaint ${complaint.customId} registered`,
        user: req.user?.name || 'Municipal Admin',
        severity: complaint.priority === 'High' || complaint.priority === 'Critical' ? 'Warning' : 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: `${complaint.complaintType} complaint ticket ${complaint.customId} created successfully!`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminNotes, resolutionNotes, assignedDriver, assignedDriverId, assignedVehicle } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    if (status) {
      complaint.status = status;
      if (status === 'Resolved' || status === 'RESOLVED') {
        complaint.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      complaint.adminNotes = adminNotes;
    }
    if (resolutionNotes !== undefined) {
      complaint.resolutionNotes = resolutionNotes;
    }
    if (assignedDriver !== undefined) {
      complaint.assignedDriver = assignedDriver;
    }
    if (assignedDriverId !== undefined) {
      complaint.assignedDriverId = assignedDriverId;
    }
    if (assignedVehicle !== undefined) {
      complaint.assignedVehicle = assignedVehicle;
    }

    await complaint.save();
    await complaint.populate('residentId', 'name email address phone houseLocation customId');

    // Sync status with linked EmergencyRequest if exists
    try {
      if (complaint.emergencyCustomId) {
        const emStatus = (complaint.status === 'Resolved' || complaint.status === 'RESOLVED') ? 'RESOLVED' :
                         (complaint.status === 'On the Way') ? 'ON THE WAY' :
                         (complaint.status === 'In Progress' || complaint.status === 'Investigating') ? 'DISPATCHED' : 'PENDING_DISPATCH';
        await EmergencyRequest.findOneAndUpdate(
          { customId: complaint.emergencyCustomId },
          { 
            status: emStatus, 
            ...(emStatus === 'RESOLVED' ? { pickedUpAt: new Date() } : {})
          }
        );
      }
    } catch (eErr) {
      console.warn('Emergency link status sync warning:', eErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Complaint ${complaint.customId || complaint.ticketId} status changed to "${complaint.status}"`,
        user: req.user?.name || 'Municipal Admin',
        severity: complaint.status === 'Resolved' ? 'Info' : 'Warning',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog error:', e.message);
    }

    res.json({
      success: true,
      message: `Complaint ticket ${complaint.customId || complaint.ticketId} status set to "${complaint.status}"`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignNearestVehicleToComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaintLat = complaint.lat || complaint.location?.lat || 28.6139;
    const complaintLng = complaint.lng || complaint.location?.lng || 77.2090;

    // Helper: Haversine distance in km
    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Number((R * c).toFixed(2));
    };

    // Find active on-duty drivers or all drivers with an assigned vehicle
    let drivers = await Driver.find({
      $or: [
        { isOnDuty: true },
        { assignedVehicle: { $exists: true, $ne: '' } }
      ]
    });

    if (drivers.length === 0) {
      drivers = await Driver.find();
    }

    if (drivers.length === 0) {
      return res.json({
        success: false,
        manualRequired: true,
        message: 'No fleet drivers currently registered in the system. Please manually assign a vehicle.'
      });
    }

    const vehicles = await Vehicle.find({ status: { $ne: 'Decommissioned' } });

    // Score candidates by real distance
    const candidateList = drivers.map(d => {
      const dLat = d.liveLocation?.lat || 28.6139;
      const dLng = d.liveLocation?.lng || 77.2090;
      const distKm = calcDistance(complaintLat, complaintLng, dLat, dLng);

      const matchedVehicle = vehicles.find(v => 
        (v.assignedDriverName && v.assignedDriverName === d.name) ||
        (v.assignedDriverId && v.assignedDriverId.toString() === d._id.toString()) ||
        (d.assignedVehicle && v.vehicleNumber === d.assignedVehicle)
      );

      return {
        driver: d,
        distKm,
        vehicleName: d.assignedVehicle || matchedVehicle?.vehicleNumber || 'Municipal Compactor Truck'
      };
    });

    candidateList.sort((a, b) => a.distKm - b.distKm);
    const nearest = candidateList[0];

    complaint.assignedDriver = nearest.driver.name;
    complaint.assignedDriverId = nearest.driver._id;
    complaint.assignedVehicle = nearest.vehicleName;
    complaint.status = 'In Progress';
    await complaint.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      io.emit('complaint-assigned-driver', {
        driverId: nearest.driver._id,
        driverName: nearest.driver.name,
        vehicleName: nearest.vehicleName,
        complaint
      });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Nearest vehicle "${nearest.vehicleName}" (Driver: ${nearest.driver.name}, ${nearest.distKm} km away) auto-assigned to Roadside Complaint ${complaint.customId || complaint.ticketId}`,
        user: req.user?.name || 'Automated Fleet Dispatcher',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog notice:', e.message);
    }

    return res.json({
      success: true,
      message: `Nearest vehicle "${nearest.vehicleName}" (Driver: ${nearest.driver.name}) successfully assigned! Located ${nearest.distKm} km from roadside coordinates.`,
      complaint,
      driverName: nearest.driver.name,
      vehicleName: nearest.vehicleName,
      distanceKm: nearest.distKm
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const manualAssignComplaintVehicle = async (req, res) => {
  try {
    const { driverName, driverId, vehicleNumber } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedDriver = driverName || 'Fleet Operator';
    if (driverId) complaint.assignedDriverId = driverId;
    complaint.assignedVehicle = vehicleNumber || 'Municipal Garbage Truck';
    complaint.status = 'In Progress';
    await complaint.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      io.emit('complaint-assigned-driver', {
        driverId: complaint.assignedDriverId,
        driverName: complaint.assignedDriver,
        vehicleName: complaint.assignedVehicle,
        complaint
      });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Vehicle "${complaint.assignedVehicle}" (Driver: ${complaint.assignedDriver}) manually assigned to Complaint ${complaint.customId || complaint.ticketId}`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog notice:', e.message);
    }

    res.json({
      success: true,
      message: `Vehicle "${complaint.assignedVehicle}" successfully assigned to ${complaint.customId || complaint.ticketId}`,
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveComplaint = async (req, res) => {
  try {
    req.body = { ...req.body, status: req.body?.status || 'Resolved' };
    return updateComplaintStatus(req, res);
  } catch (error) {
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
        event: `Complaint ticket ${ticketNumber} deleted by Municipal Admin`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Warning',
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

export const getAdminRBACData = async (req, res) => {
  try {
    const availablePermissions = [
      // 1. Complaint Management
      { 
        id: 'resolve_complaints', 
        name: 'Resolve Citizen, Roadside & Order Complaints', 
        category: 'Complaint Management',
        description: 'Resolve citizen grievances, roadside waste reports, and order complaints.'
      },
      // 2. Emergency Management
      { 
        id: 'dispatch_emergencies', 
        name: 'Dispatch SOS Emergencies & High-Priority Pickups', 
        category: 'Emergency Management',
        description: 'Authorize high-priority household SOS collection dispatches and emergency updates.'
      },
      // 3. Reward & Points
      { 
        id: 'rewards_management', 
        name: 'Manage Green Rewards, Orders & Point Values', 
        category: 'Reward & Points',
        description: 'Supervise eco-reward catalog items, citizen redemptions, and green point value rates.'
      },
      // 4. Vehicle Management
      { 
        id: 'manage_vehicles', 
        name: 'Manage Garbage Vehicles, Fuel & Maintenance', 
        category: 'Vehicle Management',
        description: 'Supervise garbage vehicles registry, driver assignments, fuel logs, and service records.'
      },
      // 5. Driver Management
      { 
        id: 'manage_drivers', 
        name: 'Manage Drivers Directory & Shift Onboarding', 
        category: 'Driver Management',
        description: 'Onboard fleet drivers, inspect driving licenses, and manage on-duty shifts.'
      },
      { 
        id: 'assign_driver_areas', 
        name: 'Assign Drivers to Service Areas & Sectors', 
        category: 'Driver Management',
        description: 'Assign and rotate fleet drivers across municipal wards and collection sectors.'
      },
      { 
        id: 'fleet_live_telemetry', 
        name: 'View Real-Time Live Driver GPS Radar', 
        category: 'Driver Management',
        description: 'Track real-time GPS locations and route telemetry of on-duty drivers on live radar.'
      },
      // 6. Resident Management
      { 
        id: 'manage_residents', 
        name: 'Manage Residents Directory & Household Plans', 
        category: 'Resident Management',
        description: 'Onboard households, verify geolocation addresses, and manage citizen subscription plans.'
      },
      // 7. Service Areas & Sectors
      { 
        id: 'manage_service_areas', 
        name: 'Create & Edit Service Boundaries & Wards', 
        category: 'Service Areas & Sectors',
        description: 'Define municipal service polygons, ward sectors, and collection boundaries.'
      },
      // 8. Finance Management
      { 
        id: 'manage_payments', 
        name: 'Review Subscriptions & Payment Records', 
        category: 'Finance Management',
        description: 'Audit revenue streams, approve citizen payment transactions, and update pricing tiers.'
      },
      // 9. Staff Management & RBAC
      { 
        id: 'rbac_management', 
        name: 'Manage Municipal Staff & RBAC Roles', 
        category: 'Staff Management & RBAC',
        description: 'Create municipal staff operator credentials and configure granular RBAC security roles.'
      },
      // 10. Logs & Audit Trail
      { 
        id: 'system_audit_logs', 
        name: 'Inspect System Security & Audit Trail Logs', 
        category: 'Logs & Audit Trail',
        description: 'Inspect administrative audit trails, security events, and compliance activity logs.'
      }
    ];

    // Standard sidebar-aligned municipal roles definition
    const standardRoles = [
      {
        customId: 'ROLE-COMPLAINT',
        name: 'Complaint Resolution Officer',
        scope: 'cityadmin',
        department: 'Complaint Management',
        description: 'Handles citizen grievances, roadside garbage alerts, and order dispute resolution.',
        permissions: ['resolve_complaints', 'manage_residents'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-EMERGENCY',
        name: 'Emergency Dispatch Coordinator',
        scope: 'cityadmin',
        department: 'Emergency Management',
        description: 'Directs rapid SOS emergency pickups, real-time routing, and status tracking.',
        permissions: ['dispatch_emergencies', 'fleet_live_telemetry'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-REWARDS',
        name: 'Reward & Points Manager',
        scope: 'cityadmin',
        department: 'Reward & Points',
        description: 'Manages eco-reward catalog, redemption orders, and green point value conversion rates.',
        permissions: ['rewards_management', 'manage_residents'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-VEHICLES',
        name: 'Vehicle & Fleet Superintendent',
        scope: 'cityadmin',
        department: 'Vehicle Management',
        description: 'Supervises garbage vehicle registrations, driver-vehicle assignment, fuel logs, and maintenance.',
        permissions: ['manage_vehicles', 'fleet_live_telemetry'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-DRIVERS',
        name: 'Driver Operations Supervisor',
        scope: 'cityadmin',
        department: 'Driver Management',
        description: 'Supervises driver roster, new driver onboarding, route/area assignment, and live GPS radar.',
        permissions: ['manage_drivers', 'assign_driver_areas', 'fleet_live_telemetry'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-RESIDENTS',
        name: 'Resident Accounts Officer',
        scope: 'cityadmin',
        department: 'Resident Management',
        description: 'Manages resident registrations, household verification, and citizen subscription tiers.',
        permissions: ['manage_residents', 'manage_payments'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-AREAS',
        name: 'Service Area & Ward Planner',
        scope: 'cityadmin',
        department: 'Service Areas & Sectors',
        description: 'Defines municipal service boundaries, sector polygons, and operational collection routes.',
        permissions: ['manage_service_areas', 'assign_driver_areas'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-FINANCE',
        name: 'Municipal Finance Officer',
        scope: 'cityadmin',
        department: 'Finance Management',
        description: 'Supervises waste management subscription revenue, payment receipts, and citizen billing.',
        permissions: ['manage_payments', 'rewards_management'],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-ADMIN',
        name: 'Chief Operations Administrator',
        scope: 'cityadmin',
        department: 'Staff Management & RBAC',
        description: 'Full administrative authority across all municipal divisions, staff onboarding, and RBAC policies.',
        permissions: [
          'manage_drivers',
          'assign_driver_areas',
          'fleet_live_telemetry',
          'manage_residents',
          'manage_service_areas',
          'manage_vehicles',
          'rbac_management',
          'manage_payments',
          'resolve_complaints',
          'dispatch_emergencies',
          'rewards_management',
          'system_audit_logs'
        ],
        isSystemDefault: true
      },
      {
        customId: 'ROLE-AUDIT',
        name: 'System Audit & Compliance Inspector',
        scope: 'cityadmin',
        department: 'Logs & Audit Trail',
        description: 'Inspects tamper-evident audit trail logs, security event histories, and staff access policies.',
        permissions: ['system_audit_logs', 'rbac_management'],
        isSystemDefault: true
      }
    ];

    // Ensure all 10 sidebar-aligned roles exist in the database
    for (const sr of standardRoles) {
      const existing = await Role.findOne({ name: sr.name });
      if (!existing) {
        await Role.create(sr);
      } else {
        let changed = false;
        if (!existing.department || existing.department !== sr.department) {
          existing.department = sr.department;
          changed = true;
        }
        if (!existing.isSystemDefault) {
          existing.isSystemDefault = true;
          changed = true;
        }
        if (changed) await existing.save();
      }
    }

    // Set appropriate departments for legacy seeded roles if missing
    await Role.updateOne({ name: 'Fleet Maintenance Engineer', department: { $in: ['', null, undefined] } }, { department: 'Vehicle Management' });
    await Role.updateOne({ name: 'Fleet Dispatcher', department: { $in: ['', null, undefined] } }, { department: 'Driver Management' });
    await Role.updateOne({ name: 'Citizen Helpdesk Officer', department: { $in: ['', null, undefined] } }, { department: 'Resident Management' });
    await Role.updateOne({ name: 'Resident Registration Officer', department: { $in: ['', null, undefined] } }, { department: 'Resident Management' });
    await Role.updateOne({ name: 'Sanitation Operations Director', department: { $in: ['', null, undefined] } }, { department: 'Staff Management & RBAC' });
    await Role.updateOne({ name: 'Grievance Helpdesk Officer', department: { $in: ['', null, undefined] } }, { department: 'Complaint Management' });

    let roles = await Role.find({ scope: 'cityadmin' }).sort({ createdAt: -1 });
    let staff = await Staff.find({ scope: 'cityadmin' }).sort({ createdAt: -1 });

    res.json({
      roles,
      staff,
      availablePermissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdminRole = async (req, res) => {
  try {
    const { name, description, permissions, department } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const customId = `ROLE-${Math.floor(100 + Math.random() * 900)}`;

    const role = await Role.create({
      customId,
      name,
      scope: 'cityadmin',
      department: department || 'Complaint Management',
      description: description || '',
      permissions: permissions || []
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, department } = req.body;

    const updatePayload = { name, description, permissions };
    if (department) updatePayload.department = department;

    const role = await Role.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Propagate updated permissions to all active staff under this role
    if (Array.isArray(permissions)) {
      await AdminStaff.updateMany(
        { $or: [{ roleId: role._id }, { roleName: role.name }] },
        { permissions, roleName: role.name }
      );
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const onboardAdminStaff = async (req, res) => {
  try {
    const { name, email, phone, department, roleName, city, password } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const customId = `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const staffPassword = password && password.trim() ? password.trim() : 'Staff@123';

    // Resolve Role and its granted RBAC permissions
    let roleDoc = null;
    if (roleName) {
      roleDoc = await Role.findOne({ name: roleName });
    }
    if (!roleDoc) {
      roleDoc = await Role.findOne({ scope: 'cityadmin' });
    }
    const assignedPermissions = roleDoc && Array.isArray(roleDoc.permissions) 
      ? roleDoc.permissions 
      : ['fleet_live_telemetry'];
    const resolvedRoleName = roleDoc ? roleDoc.name : (roleName || 'Fleet Dispatcher');

    // 1. Create municipal Staff record
    const staffMember = await Staff.create({
      customId,
      name,
      email,
      phone: phone || '',
      department: department || 'Complaint Management',
      roleId: roleDoc ? roleDoc._id : undefined,
      roleName: resolvedRoleName,
      scope: 'cityadmin',
      city: city || 'Central Municipal Ward',
      status: 'Active',
      password: staffPassword
    });

    // 2. Create or sync matching AdminStaff and User record with role='staff' and granular permissions
    let adminStaff = await AdminStaff.findOne({ email });
    if (!adminStaff) {
      adminStaff = await AdminStaff.create({
        customId,
        name,
        email,
        password: staffPassword,
        role: 'staff',
        scope: 'cityadmin',
        roleId: roleDoc ? roleDoc._id : undefined,
        roleName: resolvedRoleName,
        permissions: assignedPermissions,
        phone: phone || '',
        title: resolvedRoleName,
        department: department || 'Complaint Management',
        status: 'Active'
      });
    } else {
      adminStaff.password = staffPassword;
      adminStaff.role = 'staff';
      adminStaff.roleId = roleDoc ? roleDoc._id : adminStaff.roleId;
      adminStaff.roleName = resolvedRoleName;
      adminStaff.permissions = assignedPermissions;
      adminStaff.title = resolvedRoleName;
      adminStaff.department = department || adminStaff.department;
      if (!adminStaff.customId) adminStaff.customId = customId;
      await adminStaff.save();
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        customId,
        name,
        email,
        password: staffPassword,
        role: 'staff',
        phone: phone || '',
        title: resolvedRoleName,
        department: department || 'Complaint Management'
      });
    } else {
      user.password = staffPassword;
      user.role = 'staff';
      user.title = resolvedRoleName;
      if (!user.customId) user.customId = customId;
      await user.save();
    }

    // 3. Dispatch credentials notification
    const dispatchResult = await sendCredentialsNotification({
      recipientType: 'staff',
      name,
      email,
      phone,
      customId,
      password: staffPassword,
      details: { department: department || 'Complaint Management', roleName: resolvedRoleName }
    });

    res.status(201).json({
      staff: staffMember,
      user,
      credentials: {
        customId,
        email,
        password: staffPassword
      },
      dispatch: dispatchResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const staffMember = await Staff.findByIdAndUpdate(id, updateData, { new: true });
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff employee record not found' });
    }

    // Resolve role & permissions if roleName changed
    let assignedPermissions = [];
    if (staffMember.roleName) {
      const roleDoc = await Role.findOne({ name: staffMember.roleName });
      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        assignedPermissions = roleDoc.permissions;
        staffMember.roleId = roleDoc._id;
        await staffMember.save();
      }
    }

    // Sync matching AdminStaff and User records
    const adminStaff = await AdminStaff.findOne({ email: staffMember.email });
    if (adminStaff) {
      adminStaff.name = staffMember.name || adminStaff.name;
      adminStaff.phone = staffMember.phone || adminStaff.phone;
      adminStaff.department = staffMember.department || adminStaff.department;
      adminStaff.roleName = staffMember.roleName || adminStaff.roleName;
      adminStaff.title = staffMember.roleName || adminStaff.title;
      adminStaff.status = staffMember.status || adminStaff.status;
      if (assignedPermissions.length > 0) {
        adminStaff.permissions = assignedPermissions;
      }
      await adminStaff.save();
    }

    const user = await User.findOne({ email: staffMember.email });
    if (user) {
      user.name = staffMember.name || user.name;
      user.phone = staffMember.phone || user.phone;
      user.title = staffMember.roleName || user.title;
      await user.save();
    }

    res.json(staffMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staffMember = await Staff.findByIdAndDelete(id);
    if (!staffMember) {
      return res.status(404).json({ message: 'Staff employee record not found' });
    }

    // Delete matching AdminStaff and User records
    if (staffMember.email) {
      await AdminStaff.deleteMany({ email: staffMember.email });
      await User.deleteMany({ email: staffMember.email, role: 'staff' });
    }

    res.json({ message: 'Staff employee deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Geometric point-in-polygon helper for service area geofencing
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

// Haversine distance calculator in KM
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const assignDriverToArea = async (req, res) => {
  try {
    const { driverId, sector, vehicle, areaName, areaDisplayName, areaId } = req.body;

    if (!driverId || !sector) {
      return res.status(400).json({ message: 'Driver ID and target area/sector are required' });
    }

    // 1. Locate Driver
    let driver = null;
    if (typeof driverId === 'string' && driverId.match(/^[0-9a-fA-F]{24}$/)) {
      driver = await Driver.findById(driverId) || await User.findById(driverId);
    } else {
      driver = await Driver.findOne({ $or: [{ customId: driverId }, { email: driverId }] }) ||
               await User.findOne({ $or: [{ customId: driverId }, { email: driverId }] });
    }

    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // 2. Locate Service Area
    let serviceArea = null;
    if (areaId && typeof areaId === 'string' && areaId.match(/^[0-9a-fA-F]{24}$/)) {
      serviceArea = await ServiceArea.findById(areaId);
    }
    if (!serviceArea) {
      serviceArea = await ServiceArea.findOne({
        $or: [
          { name: sector },
          { displayName: sector },
          { customId: sector },
          ...(areaName ? [{ name: areaName }, { displayName: areaName }] : []),
          ...(areaDisplayName ? [{ name: areaDisplayName }, { displayName: areaDisplayName }] : [])
        ]
      });
    }
    if (!serviceArea && sector) {
      const escaped = sector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      serviceArea = await ServiceArea.findOne({
        $or: [
          { name: { $regex: new RegExp(escaped, 'i') } },
          { displayName: { $regex: new RegExp(escaped, 'i') } }
        ]
      });
    }

    const assignedVehicleNum = vehicle || driver.assignedVehicle || (serviceArea && serviceArea.assignedVehicle !== 'Truck #GFT-22' ? serviceArea.assignedVehicle : 'Unassigned');
    const finalSectorTitle = serviceArea?.displayName || serviceArea?.name || sector;

    // 3. Update ServiceArea Model
    if (serviceArea) {
      serviceArea.assignedDriverId = driver._id;
      serviceArea.assignedDriverName = driver.name;
      serviceArea.assignedVehicle = assignedVehicleNum;
      await serviceArea.save();

      // Free any other service area that had this driver assigned
      await ServiceArea.updateMany(
        { assignedDriverId: driver._id, _id: { $ne: serviceArea._id } },
        { $set: { assignedDriverId: null, assignedDriverName: 'Unassigned' } }
      ).catch(() => null);
    }

    // 4. Update Driver Record
    driver.activeSector = finalSectorTitle;
    if (assignedVehicleNum) driver.assignedVehicle = assignedVehicleNum;
    if (serviceArea) {
      driver.registeredLocation = {
        lat: serviceArea.centerLat || 28.4848,
        lng: serviceArea.centerLng || 77.5135,
        address: `${finalSectorTitle} Municipal Base Depot`
      };
    }
    await driver.save();

    // Also sync User collection for driver
    await User.updateOne(
      { $or: [{ _id: driver._id }, { customId: driver.customId }, { email: driver.email }] },
      { 
        $set: { 
          activeSector: finalSectorTitle, 
          ...(assignedVehicleNum ? { assignedVehicle: assignedVehicleNum } : {}),
          ...(driver.registeredLocation ? { registeredLocation: driver.registeredLocation } : {})
        } 
      }
    ).catch(() => null);

    // 5. Synchronize Vehicle Fleet Registry
    if (assignedVehicleNum) {
      // Free any vehicle previously assigned to this driver
      await Vehicle.updateMany(
        { assignedDriverId: driver._id, vehicleNumber: { $ne: assignedVehicleNum } },
        { assignedDriverId: null, assignedDriverName: 'Unassigned', assignedSector: 'Unassigned', status: 'Operational' }
      );

      // Assign the new vehicle to this driver and sector
      await Vehicle.findOneAndUpdate(
        { vehicleNumber: assignedVehicleNum },
        { 
          assignedDriverId: driver._id, 
          assignedDriverName: driver.name, 
          assignedSector: finalSectorTitle,
          status: driver.isOnDuty ? 'In-Transit' : 'Operational'
        }
      );
    }

    // 6. Find all Houses / Residents strictly in this Service Area
    const normalizeSector = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str
        .toLowerCase()
        .replace(/sector[\s\-_]*/gi, '')
        .replace(/[\(\)\[\],.\-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Candidate valid sector identifiers for THIS service area ONLY
    const targetAreaAliases = new Set([
      normalizeSector(finalSectorTitle),
      normalizeSector(sector),
      normalizeSector(serviceArea?.displayName),
      normalizeSector(serviceArea?.name),
      normalizeSector(areaName),
      normalizeSector(areaDisplayName)
    ].filter(Boolean));

    // Fetch all other registered service areas to ensure we never cross-assign residents of other designated sectors
    const otherAreas = await ServiceArea.find({ _id: { $ne: serviceArea?._id } });
    const otherAreaAliases = new Set();
    otherAreas.forEach(a => {
      if (a.displayName) otherAreaAliases.add(normalizeSector(a.displayName));
      if (a.name) otherAreaAliases.add(normalizeSector(a.name));
    });

    const hasPolygon = serviceArea?.polygonCoordinates && Array.isArray(serviceArea.polygonCoordinates) && serviceArea.polygonCoordinates.length >= 3;

    // Fetch all residents from Resident collection
    const rawResidents = await Resident.find();

    // Deduplicate residents by _id
    const residentMap = new Map();
    for (const r of rawResidents) {
      if (r && r._id) {
        residentMap.set(r._id.toString(), r);
      }
    }

    const matchedResidents = [];
    for (const resItem of residentMap.values()) {
      const resSector = normalizeSector(resItem.houseLocation?.sector || resItem.sector || '');
      const lat = Number(resItem.houseLocation?.lat);
      const lng = Number(resItem.houseLocation?.lng);
      const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

      let isMatch = false;

      // Rule 1: If resident has an explicit sector, it MUST match this target service area
      if (resSector) {
        if (targetAreaAliases.has(resSector)) {
          isMatch = true;
        }
      } else if (hasValidCoords && hasPolygon) {
        // Rule 2: If resident has no explicit sector, geofenced polygon boundary is the source of truth
        if (isPointInPolygon(lat, lng, serviceArea.polygonCoordinates)) {
          isMatch = true;
        }
      }

      if (isMatch) {
        matchedResidents.push(resItem);
      }
    }

    // 7. Update EVERY House / Resident in this Area with Assigned Driver Information
    const matchedResidentIds = matchedResidents.map(r => r._id);
    if (matchedResidentIds.length > 0) {
      const residentUpdatePayload = {
        assignedDriverId: driver._id,
        assignedDriverName: driver.name,
        assignedDriverPhone: driver.phone || '',
        assignedVehicle: assignedVehicleNum
      };

      await Resident.updateMany(
        { _id: { $in: matchedResidentIds } },
        { $set: residentUpdatePayload }
      ).catch(() => null);

      await User.updateMany(
        { role: 'resident', _id: { $in: matchedResidentIds } },
        { $set: residentUpdatePayload }
      ).catch(() => null);
    }

    // 7b. Detach driver from any residents who were previously linked to this driver but belong to another sector
    const staleResidents = await Resident.find({
      assignedDriverId: driver._id,
      _id: { $nin: matchedResidentIds }
    });

    if (staleResidents.length > 0) {
      for (const staleRes of staleResidents) {
        const staleResSector = normalizeSector(staleRes.houseLocation?.sector || staleRes.sector || '');
        const rightfulArea = otherAreas.find(a => 
          normalizeSector(a.displayName) === staleResSector || 
          normalizeSector(a.name) === staleResSector ||
          (a.polygonCoordinates?.length >= 3 && staleRes.houseLocation?.lat && isPointInPolygon(staleRes.houseLocation.lat, staleRes.houseLocation.lng, a.polygonCoordinates))
        );

        let rightfulDriver = null;
        if (rightfulArea?.assignedDriverId) {
          rightfulDriver = await Driver.findById(rightfulArea.assignedDriverId);
        }

        const replacementPayload = rightfulDriver ? {
          assignedDriverId: rightfulDriver._id,
          assignedDriverName: rightfulDriver.name,
          assignedDriverPhone: rightfulDriver.phone || '',
          assignedVehicle: rightfulDriver.assignedVehicle || rightfulArea.assignedVehicle || 'Unassigned'
        } : {
          assignedDriverId: null,
          assignedDriverName: 'Unassigned',
          assignedDriverPhone: '',
          assignedVehicle: 'Unassigned'
        };

        await Resident.updateOne({ _id: staleRes._id }, { $set: replacementPayload }).catch(() => null);
        await User.updateOne({ _id: staleRes._id }, { $set: replacementPayload }).catch(() => null);
      }
    }

    // 8. Build Complete House Collection List & Route Stops for the Driver (NO hardcoded fake houses)
    let stops = matchedResidents.map((resItem, idx) => {
      const fullAddr = resItem.houseLocation?.address || resItem.address || `House #${idx + 1}, ${finalSectorTitle}`;
      const stopLat = (resItem.houseLocation?.lat && resItem.houseLocation.lat !== 0)
        ? resItem.houseLocation.lat
        : (serviceArea ? serviceArea.centerLat + ((idx + 1) * 0.0015) : 28.6139 + ((idx + 1) * 0.0015));
      const stopLng = (resItem.houseLocation?.lng && resItem.houseLocation.lng !== 0)
        ? resItem.houseLocation.lng
        : (serviceArea ? serviceArea.centerLng + ((idx + 1) * 0.0015) : 77.2090 + ((idx + 1) * 0.0015));

      return {
        customId: `0${idx + 1}`.slice(-2),
        residentId: resItem._id,
        residentName: resItem.name,
        residentPhone: resItem.phone || '',
        address: fullAddr,
        location: fullAddr,
        type: resItem.billing?.plan || 'Residential Household',
        binType: idx % 3 === 0 ? 'Organic' : (idx % 3 === 1 ? 'Recyclable' : 'General Waste'),
        status: 'PENDING',
        time: `${8 + Math.floor(idx / 2)}:${idx % 2 === 0 ? '00' : '30'} AM`,
        distance: `${120 + idx * 80}m away`,
        isNearby: idx === 0,
        notes: `Household: ${resItem.name} (${resItem.customId || 'RES'})`,
        lat: Number(stopLat.toFixed(6)),
        lng: Number(stopLng.toFixed(6))
      };
    });

    // 9. Sync or Create Route Model (Strictly bound to finalSectorTitle)
    // Free driver from any other routes first
    await Route.updateMany(
      { driverId: driver._id, name: { $ne: finalSectorTitle } },
      { $set: { driverId: null } }
    ).catch(() => null);

    let route = await Route.findOne({
      $or: [
        { name: finalSectorTitle },
        ...(serviceArea ? [{ name: serviceArea.name }, { name: serviceArea.displayName }] : [])
      ]
    });

    const totalEstDistance = `${(stops.length * 1.5 + 2.5).toFixed(1)} km`;
    const totalEstTime = `${Math.floor(stops.length * 20 / 60)}h ${(stops.length * 20) % 60}m`;

    if (!route) {
      route = await Route.create({
        name: finalSectorTitle,
        driverId: driver._id,
        stopsCount: stops.length,
        distance: totalEstDistance,
        estTime: totalEstTime,
        stops
      });
    } else {
      route.name = finalSectorTitle;
      route.driverId = driver._id;
      route.stops = stops;
      route.stopsCount = stops.length;
      route.distance = totalEstDistance;
      route.estTime = totalEstTime;
      await route.save();
    }

    // 10. Real-Time WebSockets Synchronization
    const io = req.app.get('io');
    if (io) {
      // 10a. Emit to Driver: sector update with complete house collection stops list
      io.emit('driver-area-assigned', {
        driverId: driver._id,
        customId: driver.customId,
        driverName: driver.name,
        driverPhone: driver.phone || '',
        sector: finalSectorTitle,
        vehicle: assignedVehicleNum,
        stopsCount: stops.length,
        houseList: stops,
        routeStops: stops,
        area: serviceArea ? {
          id: serviceArea._id,
          name: serviceArea.name,
          displayName: serviceArea.displayName,
          centerLat: serviceArea.centerLat,
          centerLng: serviceArea.centerLng,
          polygonCoordinates: serviceArea.polygonCoordinates
        } : null
      });

      // 10b. Emit dedicated house list updated event
      io.emit('house-list-updated', {
        driverId: driver._id,
        sector: finalSectorTitle,
        stopsCount: stops.length,
        houseList: stops,
        routeStops: stops
      });

      // 10c. Emit to Residents in this Area: assigned driver information
      io.emit('resident-driver-assigned', {
        sector: finalSectorTitle,
        assignedDriver: {
          id: driver._id,
          customId: driver.customId,
          name: driver.name,
          phone: driver.phone || '',
          van: assignedVehicleNum,
          vehicle: assignedVehicleNum,
          route: finalSectorTitle,
          isOnDuty: Boolean(driver.isOnDuty),
          liveLocation: driver.liveLocation
        },
        residentIds: matchedResidentIds.map(id => id.toString())
      });

      // 10d. Emit service area update event
      if (serviceArea) {
        io.emit('service-area-updated', serviceArea);
      }
    }

    // 11. Create Audit Log
    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Driver ${driver.name} assigned to sector "${finalSectorTitle}" (${stops.length} households bound)`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {
      console.warn('AuditLog error:', e.message);
    }

    res.json({
      success: true,
      message: `Driver ${driver.name} successfully assigned to ${finalSectorTitle}! ${stops.length} household stops bound.`,
      driver,
      serviceArea,
      route,
      stopsCount: stops.length,
      houseList: stops,
      matchedResidentsCount: matchedResidents.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createServiceArea = async (req, res) => {
  try {
    const { 
      name, 
      displayName, 
      zone, 
      description, 
      coverageType, 
      centerLat, 
      centerLng, 
      radiusKm, 
      collectionFrequency, 
      targetHouseholds, 
      assignedVehicle,
      assignedDriverName,
      stopsCount 
    } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'Sector name and display title are required' });
    }

    const customId = `AREA-${Math.floor(100 + Math.random() * 900)}`;

    const newArea = await ServiceArea.create({
      customId,
      name,
      displayName,
      zone: zone || 'Zone 1',
      description: description || '',
      coverageType: coverageType || 'Residential',
      centerLat: centerLat !== undefined ? Number(centerLat) : 28.6139,
      centerLng: centerLng !== undefined ? Number(centerLng) : 77.2090,
      radiusKm: radiusKm ? Number(radiusKm) : 5.0,
      coverageShape: req.body.coverageShape || 'polygon',
      polygonCoordinates: Array.isArray(req.body.polygonCoordinates) ? req.body.polygonCoordinates : [],
      perimeterKm: req.body.perimeterKm !== undefined ? Number(req.body.perimeterKm) : 0,
      bounds: req.body.bounds || null,
      squareWidthKm: req.body.squareWidthKm !== undefined ? Number(req.body.squareWidthKm) : 4.0,
      squareHeightKm: req.body.squareHeightKm !== undefined ? Number(req.body.squareHeightKm) : 4.0,
      areaSqKm: req.body.areaSqKm !== undefined ? Number(req.body.areaSqKm) : 16.0,
      collectionFrequency: collectionFrequency || 'Daily Morning',
      targetHouseholds: targetHouseholds ? Number(targetHouseholds) : 250,
      assignedVehicle: assignedVehicle || 'Unassigned',
      assignedDriverName: assignedDriverName || 'Unassigned',
      stopsCount: stopsCount ? Number(stopsCount) : 4,
      status: req.body.status || 'Active'
    });

    res.status(201).json({
      message: `Service area ${newArea.name} created successfully!`,
      area: newArea
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const area = await ServiceArea.findByIdAndUpdate(id, updateData, { new: true });
    if (!area) {
      return res.status(404).json({ message: 'Service area not found' });
    }

    res.json({
      message: `Service area ${area.name} updated successfully!`,
      area
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await ServiceArea.findByIdAndDelete(id);
    if (!area) {
      return res.status(404).json({ message: 'Service area not found' });
    }
    res.json({ message: `Service area ${area.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// MUNICIPAL GARBAGE VEHICLE FLEET MANAGEMENT
// ==========================================

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnassignedVehicles = async (req, res) => {
  try {
    const unassignedVehicles = await Vehicle.find({
      status: { $ne: 'Decommissioned' },
      $or: [
        { assignedDriverId: null },
        { assignedDriverName: 'Unassigned' },
        { assignedDriverName: '' },
        { assignedDriverName: { $exists: false } }
      ]
    }).sort({ vehicleNumber: 1 });

    res.json({
      success: true,
      count: unassignedVehicles.length,
      vehicles: unassignedVehicles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      model,
      capacityKg,
      fuelType,
      status,
      assignedDriverName,
      assignedSector,
      odometerKm,
      gpsUnitId,
      remarks
    } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ message: 'Vehicle number/identifier is required' });
    }

    const existing = await Vehicle.findOne({ vehicleNumber: vehicleNumber.trim() });
    if (existing) {
      return res.status(400).json({ message: `Vehicle ${vehicleNumber} already exists in registry.` });
    }

    const newVehicle = await Vehicle.create({
      vehicleNumber: vehicleNumber.trim(),
      vehicleType: vehicleType || 'Compactor Truck',
      model: model || 'Tata 407 LPT',
      capacityKg: capacityKg ? Number(capacityKg) : 2500,
      fuelType: fuelType || 'CNG',
      status: status || 'Operational',
      assignedDriverName: assignedDriverName || 'Unassigned',
      assignedSector: assignedSector || 'Unassigned',
      odometerKm: odometerKm ? Number(odometerKm) : 0,
      gpsUnitId: gpsUnitId || `GPS-${Math.floor(1000 + Math.random() * 9000)}`,
      remarks: remarks || ''
    });

    res.status(201).json({
      message: `Vehicle ${newVehicle.vehicleNumber} registered successfully!`,
      vehicle: newVehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle record not found' });
    }

    res.json({
      message: `Vehicle ${vehicle.vehicleNumber} updated successfully!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle record not found' });
    }
    res.json({ message: `Vehicle ${vehicle.vehicleNumber} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign Driver to Vehicle
export const assignDriverToVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, driverName, sector } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!driverName || driverName === 'Unassigned') {
      if (vehicle.assignedDriverId) {
        await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { assignedVehicle: '' });
      }
      vehicle.assignedDriverId = null;
      vehicle.assignedDriverName = 'Unassigned';
      if (sector) vehicle.assignedSector = sector;
      await vehicle.save();
      return res.json({ message: `Vehicle ${vehicle.vehicleNumber} unassigned successfully!`, vehicle });
    }

    let targetDriver = null;
    if (driverId) {
      targetDriver = await Driver.findById(driverId);
    } else {
      targetDriver = await Driver.findOne({ name: driverName });
    }

    if (!targetDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Free any other vehicle previously assigned to this driver
    await Vehicle.updateMany(
      { assignedDriverId: targetDriver._id, _id: { $ne: vehicle._id } },
      { assignedDriverId: null, assignedDriverName: 'Unassigned' }
    );

    // Update vehicle
    vehicle.assignedDriverId = targetDriver._id;
    vehicle.assignedDriverName = targetDriver.name;
    if (sector) vehicle.assignedSector = sector;
    vehicle.status = targetDriver.isOnDuty ? 'In-Transit' : 'Operational';
    await vehicle.save();

    // Update driver
    targetDriver.assignedVehicle = vehicle.vehicleNumber;
    if (sector) targetDriver.activeSector = sector;
    await targetDriver.save();

    res.json({
      message: `Driver ${targetDriver.name} assigned to ${vehicle.vehicleNumber} successfully!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log Vehicle Fuel Entry
export const logVehicleFuel = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit, cost, station, odometerKm, loggedBy } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!quantity || !cost) {
      return res.status(400).json({ message: 'Quantity and cost are required' });
    }

    const fuelLog = {
      quantity: Number(quantity),
      unit: unit || (vehicle.fuelType === 'CNG' ? 'Kg' : vehicle.fuelType === 'Electric' ? 'kWh' : 'Liters'),
      cost: Number(cost),
      station: station || 'Municipal Depot Fuel Station',
      odometerKm: odometerKm ? Number(odometerKm) : vehicle.odometerKm,
      loggedBy: loggedBy || 'Fleet Manager',
      date: new Date()
    };

    vehicle.fuelLogs.unshift(fuelLog);
    if (odometerKm && Number(odometerKm) > vehicle.odometerKm) {
      vehicle.odometerKm = Number(odometerKm);
    }
    await vehicle.save();

    res.status(201).json({
      message: `Fuel entry logged for ${vehicle.vehicleNumber}!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log Vehicle Service Entry
export const logVehicleService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceType, cost, workshop, odometerKm, nextDue, notes, technician } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const nextDueDate = nextDue ? new Date(nextDue) : new Date(Date.now() + 90 * 86400000);

    const serviceLog = {
      serviceType: serviceType || 'Scheduled Inspection',
      cost: cost ? Number(cost) : 0,
      workshop: workshop || 'Municipal Central Workshop',
      odometerKm: odometerKm ? Number(odometerKm) : vehicle.odometerKm,
      nextDue: nextDueDate,
      notes: notes || '',
      technician: technician || 'Chief Fleet Mechanic',
      date: new Date()
    };

    vehicle.serviceLogs.unshift(serviceLog);
    vehicle.lastServiceDate = new Date();
    vehicle.nextServiceDue = nextDueDate;
    if (odometerKm && Number(odometerKm) > vehicle.odometerKm) {
      vehicle.odometerKm = Number(odometerKm);
    }
    await vehicle.save();

    res.status(201).json({
      message: `Maintenance service recorded for ${vehicle.vehicleNumber}!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Report Vehicle Issue / Complaint
export const reportVehicleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverName, driverPhone, category, severity, description } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!description) {
      return res.status(400).json({ message: 'Problem description is required' });
    }

    const customId = `TKT-${Math.floor(100 + Math.random() * 900)}`;

    const issue = {
      customId,
      driverName: driverName || vehicle.assignedDriverName || 'Fleet Operator',
      driverPhone: driverPhone || '',
      category: category || 'Mechanical',
      severity: severity || 'Medium',
      description,
      status: 'Reported',
      reportedDate: new Date()
    };

    vehicle.issues.unshift(issue);
    if (severity === 'High' || severity === 'Critical') {
      vehicle.status = 'Under Maintenance';
    }
    await vehicle.save();

    res.status(201).json({
      message: `Vehicle issue ticket #${customId} logged successfully!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Vehicle Issue Status
export const updateVehicleIssueStatus = async (req, res) => {
  try {
    const { id, issueId } = req.params;
    const { status, resolutionNotes } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const issue = vehicle.issues.id(issueId) || vehicle.issues.find(i => i.customId === issueId || i._id?.toString() === issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue ticket not found' });
    }

    if (status) issue.status = status;
    if (resolutionNotes) issue.resolutionNotes = resolutionNotes;
    if (status === 'Resolved') {
      issue.resolvedDate = new Date();
      const hasOtherOpenIssues = vehicle.issues.some(i => i._id.toString() !== issue._id.toString() && (i.status === 'Reported' || i.status === 'In Repair') && (i.severity === 'High' || i.severity === 'Critical'));
      if (!hasOtherOpenIssues && vehicle.status === 'Under Maintenance') {
        vehicle.status = 'Operational';
      }
    }

    await vehicle.save();

    res.json({
      message: `Issue ticket status updated to ${status}!`,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// PAYMENT & INVOICE MANAGEMENT CONTROLLER
// ==========================================

export const getAdminPayments = async (req, res) => {
  try {
    let payments = await Payment.find().sort({ createdAt: -1 });

    // Compute Financial Metrics
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const mrr = payments
      .filter(p => p.status === 'PAID' && p.serviceType === 'Monthly Subscription')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingRevenue = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const overdueRevenue = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const paidCount = payments.filter(p => p.status === 'PAID').length;
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;
    const overdueCount = payments.filter(p => p.status === 'OVERDUE').length;

    await ensurePricingPlansSeeded();
    const pricingPlans = await PricingPlan.find({ status: 'Active' });

    res.json({
      payments,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        pendingRevenue: Math.round(pendingRevenue * 100) / 100,
        overdueRevenue: Math.round(overdueRevenue * 100) / 100,
        paidCount,
        pendingCount,
        overdueCount,
        totalInvoices: payments.length
      },
      pricingPlans: pricingPlans.length > 0 ? pricingPlans : DEFAULT_PRICING_PLANS
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePricingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, name, billingCycle, coverage, badge, features, color } = req.body;

    await ensurePricingPlansSeeded();

    let plan = await PricingPlan.findById(id).catch(() => null) ||
               await PricingPlan.findOne({ customId: id }).catch(() => null);

    if (!plan) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }

    if (price !== undefined) plan.price = Number(price);
    if (name) plan.name = name.trim();
    if (billingCycle) plan.billingCycle = billingCycle;
    if (coverage !== undefined) plan.coverage = coverage;
    if (badge !== undefined) plan.badge = badge;
    if (color) plan.color = color;
    if (features && Array.isArray(features)) plan.features = features;

    await plan.save();

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Subscription plan "${plan.name}" price updated to ₹${plan.price} (${plan.billingCycle})`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog error:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('plan-updated', plan);
    }

    res.json({
      message: `Plan "${plan.name}" updated successfully to ₹${plan.price}!`,
      plan
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      residentId,
      residentName,
      residentEmail,
      residentPhone,
      address,
      plan,
      serviceType,
      amount,
      currency,
      status,
      paymentMethod,
      dueDate,
      billingPeriod,
      notes
    } = req.body;

    if (!residentName || !amount) {
      return res.status(400).json({ message: 'Resident name and payment amount are required.' });
    }

    const customId = `#INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await Payment.create({
      customId,
      residentId: residentId || null,
      residentName: residentName.trim(),
      residentEmail: residentEmail || '',
      residentPhone: residentPhone || '',
      address: address || 'Municipal Ward',
      plan: plan || 'Standard Municipal (₹149/Mo)',
      serviceType: serviceType || 'Monthly Subscription',
      amount: Number(amount),
      originalAmount: Number(amount),
      currency: currency || 'INR',
      status: status || 'PAID',
      paymentMethod: paymentMethod || 'Credit Card (•••• 4242)',
      transactionDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      billingPeriod: billingPeriod || `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      notes: notes || ''
    });

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Invoice ${payment.customId} issued for ${payment.residentName} (${payment.currency} ₹${payment.amount}) - ${payment.status}`,
        user: req.user?.name || 'Municipal Treasurer',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment-created', payment);
    }

    res.status(201).json({
      message: `Invoice ${payment.customId} recorded successfully!`,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, paymentMethod } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;

    const payment = await Payment.findByIdAndUpdate(id, updateFields, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Invoice / Payment record not found' });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Payment ${payment.customId} updated to status "${payment.status}"`,
        user: req.user?.name || 'Municipal Admin',
        severity: payment.status === 'PAID' ? 'Info' : 'Warning',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment-updated', payment);
    }

    res.json({
      message: `Payment status updated to ${payment.status}`,
      payment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Invoice ${payment.customId} (${payment.residentName}) was permanently deleted`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Critical',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment-deleted', { id, customId: payment.customId });
    }

    res.json({
      message: `Invoice ${payment.customId} deleted successfully.`,
      id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ECO-POINTS & REWARDS GIFT CATALOG CONTROLLER
// ==========================================

export const getAdminRewardsData = async (req, res) => {
  try {
    let gifts = await RewardGift.find().sort({ createdAt: -1 });

    if (gifts.length === 0) {
      await RewardGift.insertMany(DEFAULT_GIFTS);
      gifts = await RewardGift.find().sort({ createdAt: -1 });
    }

    const redemptions = await RewardRedemption.find().sort({ createdAt: -1 });

    const allRedemptions = await RewardRedemption.find().sort({ createdAt: -1 });
    const drivers = await Driver.find({}, 'customId name phone assignedVehicle activeSector isOnDuty status').sort({ name: 1 });

    const totalPointsRedeemed = allRedemptions.reduce((sum, r) => sum + (Number(r.pointsRedeemed) || 0), 0);
    const pendingDeliveries = allRedemptions.filter(r => r.deliveryStatus !== 'DELIVERED' && r.deliveryStatus !== 'COMPLETED').length;

    let pointRules = await PointSetting.findOne({ key: 'global_point_settings' });
    if (!pointRules) {
      pointRules = await PointSetting.create({
        key: 'global_point_settings',
        pointValueInr: 0.50,
        pointsPerRupee: 2,
        ratesPerKg: {
          Recyclable: 15,
          Organic: 10,
          'E-Waste': 50,
          Hazardous: 30,
          'General Waste': 5
        },
        minRedemptionPoints: 50,
        maxBillDiscountPercent: 50,
        bonusMultiplier: 1.0,
        updatedBy: 'Municipal Admin'
      });
    }

    res.json({
      gifts,
      redemptions: allRedemptions,
      drivers,
      pointRules,
      stats: {
        totalGifts: gifts.length,
        activeGifts: gifts.filter(g => g.status === 'Active').length,
        totalRedemptions: allRedemptions.length,
        pendingDeliveries,
        totalPointsRedeemed
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPointRules = async (req, res) => {
  try {
    let rules = await PointSetting.findOne({ key: 'global_point_settings' });
    if (!rules) {
      rules = await PointSetting.create({
        key: 'global_point_settings',
        pointValueInr: 0.50,
        pointsPerRupee: 2,
        ratesPerKg: {
          Recyclable: 15,
          Organic: 10,
          'E-Waste': 50,
          Hazardous: 30,
          'General Waste': 5
        },
        minRedemptionPoints: 50,
        maxBillDiscountPercent: 50,
        bonusMultiplier: 1.0,
        updatedBy: 'Municipal Admin'
      });
    }
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePointRules = async (req, res) => {
  try {
    const { pointValueInr, pointsPerRupee, ratesPerKg, minRedemptionPoints, maxBillDiscountPercent, bonusMultiplier } = req.body;
    let rules = await PointSetting.findOne({ key: 'global_point_settings' });
    if (!rules) {
      rules = new PointSetting({ key: 'global_point_settings' });
    }

    if (pointValueInr !== undefined && !isNaN(Number(pointValueInr))) {
      rules.pointValueInr = Math.max(0.01, Number(pointValueInr));
      if (Number(pointValueInr) > 0) {
        rules.pointsPerRupee = Number((1 / Number(pointValueInr)).toFixed(2));
      }
    }

    if (pointsPerRupee !== undefined && !isNaN(Number(pointsPerRupee)) && Number(pointsPerRupee) > 0) {
      rules.pointsPerRupee = Number(pointsPerRupee);
    }

    if (ratesPerKg && typeof ratesPerKg === 'object') {
      rules.ratesPerKg = {
        Recyclable: Number(ratesPerKg.Recyclable ?? rules.ratesPerKg?.Recyclable ?? 15),
        Organic: Number(ratesPerKg.Organic ?? rules.ratesPerKg?.Organic ?? 10),
        'E-Waste': Number(ratesPerKg['E-Waste'] ?? rules.ratesPerKg?.['E-Waste'] ?? 50),
        Hazardous: Number(ratesPerKg.Hazardous ?? rules.ratesPerKg?.Hazardous ?? 30),
        'General Waste': Number(ratesPerKg['General Waste'] ?? rules.ratesPerKg?.['General Waste'] ?? 5)
      };
    }

    if (minRedemptionPoints !== undefined && !isNaN(Number(minRedemptionPoints))) {
      rules.minRedemptionPoints = Math.max(0, Number(minRedemptionPoints));
    }

    if (maxBillDiscountPercent !== undefined && !isNaN(Number(maxBillDiscountPercent))) {
      rules.maxBillDiscountPercent = Math.min(100, Math.max(1, Number(maxBillDiscountPercent)));
    }

    if (bonusMultiplier !== undefined && !isNaN(Number(bonusMultiplier))) {
      rules.bonusMultiplier = Math.max(0.5, Number(bonusMultiplier));
    }

    rules.updatedBy = req.user?.name || 'Municipal Admin';
    await rules.save();

    try {
      await AuditLog.create({
        action: 'UPDATE_POINT_RULES',
        adminId: req.user?._id,
        adminName: req.user?.name || 'Municipal Admin',
        details: `Updated Garbage Points value to ₹${rules.pointValueInr}/pt and waste rates per kg.`,
        severity: 'Low'
      });
    } catch (e) {}

    const io = req.app.get('io');
    if (io) {
      io.emit('point-rules-updated', rules);
    }

    res.json({
      message: 'Point valuation and waste category rates successfully saved!',
      pointRules: rules
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdminGift = async (req, res) => {
  try {
    const { title, category, size, pointsRequired, stock, description, badge, color, iconName } = req.body;

    if (!title || !pointsRequired) {
      return res.status(400).json({ message: 'Gift title and points required are mandatory.' });
    }

    const customId = `GIFT-${Math.floor(100 + Math.random() * 900)}`;

    const newGift = await RewardGift.create({
      customId,
      title: title.trim(),
      category: category || 'Garbage Bags',
      size: size || 'Standard',
      pointsRequired: Number(pointsRequired),
      stock: stock !== undefined ? Number(stock) : 100,
      description: description || '',
      badge: badge || '',
      color: color || 'emerald',
      iconName: iconName || (category === 'Garbage Bags' ? 'ShoppingBag' : category === 'Trash Bins' ? 'Trash2' : 'Package'),
      status: 'Active'
    });

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `New reward gift added: "${newGift.title}" (${newGift.size}, ${newGift.pointsRequired} PTS)`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (auditErr) {
      console.warn('AuditLog notice:', auditErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gift-created', newGift);
    }

    res.status(201).json({
      message: `Gift "${newGift.title}" (${newGift.size}) created successfully!`,
      gift: newGift
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminGift = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const gift = await RewardGift.findByIdAndUpdate(id, updateData, { new: true });
    if (!gift) {
      return res.status(404).json({ message: 'Reward gift not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gift-updated', gift);
    }

    res.json({
      message: `Gift "${gift.title}" updated successfully!`,
      gift
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminGift = async (req, res) => {
  try {
    const { id } = req.params;
    const gift = await RewardGift.findByIdAndDelete(id);
    if (!gift) {
      return res.status(404).json({ message: 'Reward gift not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('gift-deleted', { id });
    }

    res.json({
      message: `Gift "${gift.title}" removed from catalog.`,
      id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRedemptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus, notes } = req.body;

    const updateFields = {};
    if (deliveryStatus) updateFields.deliveryStatus = deliveryStatus;
    if (notes !== undefined) updateFields.notes = notes;

    const redemption = await RewardRedemption.findByIdAndUpdate(id, updateFields, { new: true });
    if (!redemption) {
      return res.status(404).json({ message: 'Redemption record not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('redemption-status-updated', redemption);
    }

    res.json({
      message: `Delivery status updated to ${redemption.deliveryStatus}`,
      redemption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin accepts a pending reward redemption order
export const acceptRewardOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await RewardRedemption.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    order.deliveryStatus = 'ACCEPTED';
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', order);
      io.emit('order-accepted', order);
      io.emit('redemption-status-updated', order);
    }

    res.json({
      message: `Order ${order.customId} accepted! Proceed to pack and assign designated driver.`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin packs the order and assigns the designated area driver
export const packAndAssignRewardOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const order = await RewardRedemption.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    let driver = null;
    if (driverId) {
      driver = await Driver.findById(driverId).catch(() => null) ||
               await User.findById(driverId).catch(() => null);
    }

    // Auto-match driver assigned to this order's sector if none specifically passed
    if (!driver && order.sector) {
      driver = await Driver.findOne({ activeSector: order.sector });
    }
    if (!driver) {
      driver = await Driver.findOne({ status: { $ne: 'Suspended' } });
    }

    order.deliveryStatus = 'PACKED';
    order.packedAt = new Date();
    if (driver) {
      order.assignedDriverId = driver._id;
      order.assignedDriverName = driver.name;
      order.assignedDriverPhone = driver.phone || '';
      order.assignedVehicle = driver.assignedVehicle || 'Collection Truck';
      order.sector = order.sector || driver.activeSector || '';
    }

    // Ensure delivery verification QR payload exists
    if (!order.qrCode) {
      order.qrCode = `TMT-DELV-${order.customId}-${order.redemptionCode}`;
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-status-updated', order);
      io.emit('order-packed', order);
      io.emit('order-assigned-driver', {
        order,
        driverId: driver?._id,
        driverName: driver?.name
      });
      io.emit('redemption-status-updated', order);
    }

    res.json({
      message: `Order ${order.customId} packed! Assigned to driver ${driver?.name || 'Driver'} (${driver?.assignedVehicle || 'Vehicle'}).`,
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resolve Order Complaint via Points Refund
export const refundOrderComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundPoints: customPoints, notes, adminNotes } = req.body;
    const finalNotes = adminNotes || notes || '';

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    let order = null;
    if (complaint.orderId) {
      order = await RewardRedemption.findById(complaint.orderId);
    }
    if (!order && complaint.orderCustomId) {
      order = await RewardRedemption.findOne({ customId: complaint.orderCustomId });
    }

    let resident = null;
    if (complaint.residentId) {
      resident = await Resident.findById(complaint.residentId) || await User.findById(complaint.residentId);
    }
    if (!resident && order?.residentId) {
      resident = await Resident.findById(order.residentId) || await User.findById(order.residentId);
    }
    if (!resident && complaint.residentEmail) {
      resident = await Resident.findOne({ email: complaint.residentEmail }) || await User.findOne({ email: complaint.residentEmail });
    }
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }

    const pointsToRefund = Number(customPoints) || Number(order?.pointsRedeemed) || 0;

    // Credit points back to resident profile
    if (resident && pointsToRefund > 0) {
      resident.garbagePoints = (resident.garbagePoints || 0) + pointsToRefund;
      await resident.save();

      // If resident model updated, sync User document if present
      if (resident.email) {
        await User.updateOne({ email: resident.email }, { $set: { garbagePoints: resident.garbagePoints } }).catch(() => null);
      }
    }

    // Persist immutable PointsTransaction record
    let pointsTxn = null;
    if (resident && pointsToRefund > 0) {
      try {
        const orderIdentifier = order?.customId || complaint.orderCustomId || 'ORDER';
        const ticketIdentifier = complaint.ticketNumber || complaint.customId || `#CMP-${id.slice(-4)}`;
        pointsTxn = await PointsTransaction.create({
          customId: `#TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          residentId: resident._id,
          residentName: resident.name || complaint.residentName || 'Resident',
          type: 'REFUNDED',
          points: pointsToRefund,
          direction: 'CREDIT',
          title: `Refund: Order #${orderIdentifier}`,
          description: finalNotes || `Points refund for complaint ticket ${ticketIdentifier}. ${order?.rewardTitle ? `Item: ${order.rewardTitle}` : ''}`,
          category: 'Order Refund',
          referenceId: orderIdentifier,
          balanceAfter: resident.garbagePoints,
          metadata: {
            complaintId: complaint._id,
            orderId: order?._id,
            ticketNumber: ticketIdentifier,
            orderCustomId: orderIdentifier,
            reason: complaint.category || complaint.title || 'Order Issue'
          }
        });
      } catch (txnErr) {
        console.error('Failed to create PointsTransaction for refund:', txnErr);
      }
    }

    // Update Complaint
    complaint.status = 'Resolved';
    complaint.resolutionType = 'REFUND';
    complaint.refundPoints = pointsToRefund;
    complaint.resolutionNotes = finalNotes || `Full refund of ${pointsToRefund} Garbage Points credited back to resident account.`;
    complaint.resolvedAt = new Date();
    await complaint.save();

    // Update Order if present with refund details & money value
    if (order) {
      order.isRefunded = true;
      order.refundedPoints = pointsToRefund;
      order.refundedAmountInr = Number((pointsToRefund * 0.5).toFixed(2));
      order.refundedAt = new Date();
      order.refundTransactionId = pointsTxn?.customId || '';
      order.refundNotes = finalNotes || `Full refund of ${pointsToRefund} PTS credited back to resident account.`;
      order.complaintStatus = `Refunded (+${pointsToRefund} PTS / ₹${(pointsToRefund * 0.5).toFixed(2)})`;
      order.deliveryStatus = 'REFUNDED';
      order.status = 'REFUNDED';
      order.notes = (order.notes ? order.notes + ' • ' : '') + `Refunded ${pointsToRefund} PTS (₹${(pointsToRefund * 0.5).toFixed(2)}) to resident.`;
      await order.save();
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Refunded ${pointsToRefund} Garbage Points for order ${order?.customId || complaint.orderCustomId || ''} to resident ${complaint.residentName}`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch {}

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      if (order) io.emit('order-status-updated', order);
      if (resident) {
        const orderIdentifier = order?.customId || complaint.orderCustomId || '';
        const ticketIdentifier = complaint.ticketNumber || complaint.customId || '';

        io.emit('resident-points-updated', {
          residentId: resident._id,
          garbagePoints: resident.garbagePoints
        });
        io.emit('points-credited', {
          residentId: resident._id,
          pointsEarned: pointsToRefund,
          amountInr: Number((pointsToRefund * 0.5).toFixed(2)),
          newBalance: resident.garbagePoints,
          reason: `Order Refund (${orderIdentifier || 'Order'})`,
          orderCustomId: orderIdentifier,
          ticketNumber: ticketIdentifier,
          transactionId: pointsTxn?.customId
        });
        io.emit('order-refunded', {
          residentId: resident._id,
          residentName: resident.name,
          orderId: order?._id,
          orderCustomId: orderIdentifier,
          ticketNumber: ticketIdentifier,
          pointsRefunded: pointsToRefund,
          amountInr: Number((pointsToRefund * 0.5).toFixed(2)),
          newBalance: resident.garbagePoints,
          notes: finalNotes || complaint.resolutionNotes,
          transaction: pointsTxn
        });
      }
    }

    res.json({
      success: true,
      message: `Points refunded successfully! +${pointsToRefund} PTS credited back to ${complaint.residentName}.`,
      complaint,
      order,
      transaction: pointsTxn,
      refundedPoints: pointsToRefund,
      newBalance: resident?.garbagePoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resolve Order Complaint via Replacement / Exchange Order
export const exchangeOrderComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { replacementSize, replacementTitle, notes, adminNotes } = req.body;
    const finalNotes = adminNotes || notes || '';

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    let order = null;
    if (complaint.orderId) {
      order = await RewardRedemption.findById(complaint.orderId);
    }
    if (!order && complaint.orderCustomId) {
      order = await RewardRedemption.findOne({ customId: complaint.orderCustomId });
    }

    let resident = null;
    if (complaint.residentId) {
      resident = await Resident.findById(complaint.residentId) || await User.findById(complaint.residentId);
    }
    if (!resident && order?.residentId) {
      resident = await Resident.findById(order.residentId) || await User.findById(order.residentId);
    }
    if (!resident) {
      resident = await Resident.findOne() || await User.findOne({ role: 'resident' });
    }

    const residentId = resident?._id || order?.residentId || complaint.residentId;
    const customId = `EXC-${Math.floor(1000 + Math.random() * 9000)}`;
    const redemptionCode = `TMT-EXC-${Math.floor(100000 + Math.random() * 900000)}`;

    const chosenTitle = replacementTitle || order?.rewardTitle || complaint.orderTitle || 'Replacement Eco Gift';
    const chosenSize = replacementSize || order?.size || 'Standard Exchange';
    const sector = order?.sector || complaint.residentSector || resident?.sector || resident?.houseLocation?.sector || 'Central Municipal Ward';
    const deliveryAddress = order?.deliveryAddress || complaint.residentAddress || resident?.address || resident?.houseLocation?.address || 'Designated Household Address';

    // Create New Exchange Order in RewardRedemption (Free of points charge)
    const newExchangeOrder = await RewardRedemption.create({
      customId,
      residentId,
      residentName: resident?.name || order?.residentName || complaint.residentName || 'Resident',
      residentEmail: resident?.email || order?.residentEmail || complaint.residentEmail || '',
      residentPhone: resident?.phone || order?.residentPhone || complaint.residentPhone || '',
      deliveryAddress,
      sector,
      rewardId: order?.rewardId || null,
      rewardTitle: chosenTitle.startsWith('[EXCHANGE]') ? chosenTitle : `[EXCHANGE] ${chosenTitle}`,
      category: order?.category || 'Exchange / Replacement',
      size: chosenSize,
      pointsRedeemed: 0, // No extra points charged
      redemptionCode,
      deliveryStatus: 'ORDER PLACED',
      status: 'ACTIVE',
      isExchange: true,
      originalOrderId: order?._id || null,
      originalOrderCustomId: order?.customId || complaint.orderCustomId || '',
      complaintId: complaint._id,
      qrCode: `TMT-DELV-${customId}-${redemptionCode}`,
      notes: `Replacement/Exchange order generated for Complaint ${complaint.customId || complaint.ticketNumber || ''}. Original order: ${order?.customId || complaint.orderCustomId || ''}. ${finalNotes}`
    });

    // Update Complaint
    complaint.status = 'Resolved';
    complaint.resolutionType = 'EXCHANGE';
    complaint.exchangeOrderId = newExchangeOrder._id;
    complaint.exchangeOrderCustomId = newExchangeOrder.customId;
    complaint.resolutionNotes = finalNotes || `Exchange order #${newExchangeOrder.customId} generated and added to Orders fulfillment pipeline.`;
    complaint.resolvedAt = new Date();
    await complaint.save();

    // Update original order
    if (order) {
      order.complaintStatus = `Exchange Order Dispatched: #${newExchangeOrder.customId}`;
      await order.save();
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Created Replacement / Exchange Order #${newExchangeOrder.customId} for resident ${complaint.residentName} (Complaint ${complaint.customId})`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch {}

    const io = req.app.get('io');
    if (io) {
      io.emit('order-created', newExchangeOrder);
      io.emit('order-status-updated', newExchangeOrder);
      io.emit('complaint-status-updated', complaint);
      io.emit('complaint-updated', complaint);
      if (order) io.emit('order-status-updated', order);
    }

    res.status(201).json({
      success: true,
      message: `Exchange order #${newExchangeOrder.customId} created successfully! Added to orders fulfillment queue.`,
      complaint,
      exchangeOrder: newExchangeOrder,
      originalOrder: order
    });
  } catch (error) {
    console.error('Error in exchangeOrderComplaint:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createEmergencyRequest = async (req, res) => {
  try {
    const {
      residentName,
      residentId,
      address,
      reason,
      garbageType,
      type,
      estimatedQuantityKg,
      priority,
      lat,
      lng
    } = req.body;

    if (!residentName || !address) {
      return res.status(400).json({ success: false, message: 'Resident name and address are required' });
    }

    const generatedId = `#EMR-${Math.floor(1000 + Math.random() * 9000)}`;

    const emergency = await EmergencyRequest.create({
      customId: generatedId,
      reqId: generatedId,
      residentId: residentId || null,
      residentName: residentName.trim(),
      address: address.trim(),
      reason: reason || 'Urgent waste removal required',
      type: type || 'Garbage',
      garbageType: garbageType || 'General Organic',
      estimatedQuantityKg: Number(estimatedQuantityKg) || 10,
      priority: priority || 'High',
      date: 'Today',
      status: 'PENDING_DISPATCH',
      lat: Number(lat) || 28.6280,
      lng: Number(lng) || 77.2185
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-created', emergency);
      io.emit('emergency-updated', emergency);
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Admin logged new Emergency SOS: ${generatedId} for ${residentName}`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Warning',
        time: 'Just now'
      });
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: `Emergency SOS ${generatedId} registered successfully!`,
      emergency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body || {};
    const emergency = await EmergencyRequest.findById(id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency request not found' });
    }

    emergency.status = 'RESOLVED';
    emergency.pickedUpAt = new Date();
    await emergency.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-completed', {
        emergency,
        status: 'RESOLVED',
        pickedUpAt: emergency.pickedUpAt,
        message: `Emergency pickup ${emergency.customId || emergency.reqId} was resolved by Admin Control Room.`
      });
      io.emit('emergency-updated', emergency);
    }

    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Emergency SOS ${emergency.customId || emergency.reqId} marked as RESOLVED by Admin`,
        user: req.user?.name || 'Municipal Admin',
        severity: 'Info',
        time: 'Just now'
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `Emergency ${emergency.customId || emergency.reqId} marked as RESOLVED!`,
      emergency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const emergency = await EmergencyRequest.findById(id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency request not found' });
    }

    emergency.status = status;
    if (status === 'RESOLVED' || status === 'PICKED_UP') {
      emergency.pickedUpAt = new Date();
    }
    await emergency.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-updated', emergency);
    }

    return res.json({
      success: true,
      message: `Emergency status updated to ${status}`,
      emergency
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch current administrator profile and operational metrics
export const getAdminProfile = async (req, res) => {
  try {
    let admin = req.user;
    if (!admin || !admin._id) {
      admin = await AdminStaff.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } }) ||
              await User.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } });
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Administrator profile not found' });
    }

    // System stats for the admin profile overview
    const [totalResidents, totalDrivers, totalVehicles, totalServiceAreas, totalComplaints, totalEmergencies] = await Promise.all([
      Resident.countDocuments(),
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      ServiceArea.countDocuments(),
      Complaint.countDocuments(),
      EmergencyRequest.countDocuments()
    ]);

    res.json({
      success: true,
      admin,
      stats: {
        totalResidents,
        totalDrivers,
        totalVehicles,
        totalServiceAreas,
        totalComplaints,
        totalEmergencies
      }
    });
  } catch (error) {
    console.error('Error in getAdminProfile:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin profile' });
  }
};

// Update administrator profile details
export const updateAdminProfile = async (req, res) => {
  try {
    let admin = req.user;
    if (!admin || !admin._id) {
      admin = await AdminStaff.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } }) ||
              await User.findOne({ role: { $in: ['admin', 'cityadmin', 'superadmin'] } });
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Administrator profile not found' });
    }

    const {
      name,
      phone,
      department,
      title,
      roleName,
      officeLocation,
      city,
      avatar,
      emergencyPhone
    } = req.body;

    // Update in AdminStaff model if existing
    const adminStaff = await AdminStaff.findById(admin._id) || await AdminStaff.findOne({ email: admin.email });
    if (adminStaff) {
      if (name) adminStaff.name = name.trim();
      if (phone !== undefined) adminStaff.phone = phone.trim();
      if (department !== undefined) adminStaff.department = department.trim();
      if (title !== undefined) adminStaff.title = title.trim();
      if (roleName !== undefined) adminStaff.roleName = roleName.trim();
      if (officeLocation !== undefined) adminStaff.officeLocation = officeLocation.trim();
      if (city !== undefined) adminStaff.city = city.trim();
      if (avatar !== undefined) adminStaff.avatar = avatar;
      if (emergencyPhone !== undefined) adminStaff.emergencyPhone = emergencyPhone.trim();
      await adminStaff.save();
    }

    // Keep User model in sync
    const user = await User.findById(admin._id) || await User.findOne({ email: admin.email });
    if (user) {
      if (name) user.name = name.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (title !== undefined) user.title = title.trim();
      if (department !== undefined) user.department = department.trim();
      if (officeLocation !== undefined) user.officeLocation = officeLocation.trim();
      if (avatar !== undefined) user.avatar = avatar;
      await user.save();
    }

    // Keep Staff model in sync if present
    try {
      const staffMember = await Staff.findOne({ email: admin.email });
      if (staffMember) {
        if (name) staffMember.name = name.trim();
        if (phone !== undefined) staffMember.phone = phone.trim();
        if (department !== undefined) staffMember.department = department.trim();
        if (city !== undefined) staffMember.city = city.trim();
        await staffMember.save();
      }
    } catch (sErr) {}

    const updatedAdmin = adminStaff || user || admin;

    // Log in AuditLog
    try {
      await AuditLog.create({
        customId: `#LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        event: `Administrator Profile updated for ${updatedAdmin.name} (${updatedAdmin.customId || 'ADMIN'})`,
        user: updatedAdmin.name,
        severity: 'Info',
        time: 'Just now'
      });
    } catch (aErr) {
      console.warn('AuditLog error:', aErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('admin-profile-updated', updatedAdmin);
    }

    res.json({
      success: true,
      message: 'Administrator profile updated successfully!',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating administrator profile' });
  }
};




