import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
  getDriverDashboard, 
  updateLiveLocation, 
  toggleDutyStatus, 
  markStopPicked, 
  acceptEmergency,
  startEmergencyPickup,
  completeEmergencyPickup,
  recordGarbageCollection,
  startComplaintPickup,
  completeComplaintPickup,
  getDriverOrders,
  pickupRewardOrder,
  verifyAndDeliverOrder,
  getDriverProfile,
  updateDriverProfile
} from '../controllers/driver.controller.js';

const router = express.Router();

// Enforce authentication & driver role authorization
router.use(protect, authorize('driver'));

router.get('/dashboard', getDriverDashboard);
router.post('/location-update', updateLiveLocation);
router.post('/toggle-duty', toggleDutyStatus);
router.post('/mark-stop', markStopPicked);
router.post('/accept-emergency/:id', acceptEmergency);
router.post('/start-emergency-pickup/:id', startEmergencyPickup);
router.post('/complete-emergency-pickup/:id', completeEmergencyPickup);
router.post('/record-collection', recordGarbageCollection);

// Driver Profile Endpoints
router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);
router.post('/profile', updateDriverProfile);

// Complaint & Roadside pickup progression routes
router.post('/complaints/:id/start-pickup', startComplaintPickup);
router.post('/complaints/:id/complete-pickup', completeComplaintPickup);

// Reward Orders & Delivery QR verification routes
router.get('/orders', getDriverOrders);
router.post('/orders/:id/pickup', pickupRewardOrder);
router.post('/orders/:id/deliver', verifyAndDeliverOrder);

export default router;

