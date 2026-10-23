import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
  getResidentDashboard, 
  submitEmergencyRequest, 
  deleteEmergencyRequest,
  submitComplaint, 
  deleteComplaint,
  confirmPickup,
  switchPlan,
  redeemGarbagePoints,
  getResidentBilling,
  payResidentBill,
  getResidentRewards,
  getResidentOrders,
  submitOrderComplaint,
  getResidentPointsHistory,
  getResidentProfile,
  updateResidentProfile
} from '../controllers/resident.controller.js';

const router = express.Router();

// Enforce authentication & resident role authorization
router.use(protect, authorize('resident'));

router.get('/dashboard', getResidentDashboard);
router.post('/emergency-request', submitEmergencyRequest);
router.post('/emergency-pickup', submitEmergencyRequest);
router.post('/submit-emergency', submitEmergencyRequest);
router.delete('/emergency-request/:id', deleteEmergencyRequest);
router.post('/delete-emergency-request/:id', deleteEmergencyRequest);
router.delete('/emergency/:id', deleteEmergencyRequest);
router.post('/delete-emergency/:id', deleteEmergencyRequest);
router.post('/complaint', submitComplaint);
router.post('/submit-complaint', submitComplaint);
router.delete('/complaint/:id', deleteComplaint);
router.post('/delete-complaint/:id', deleteComplaint);
router.delete('/complaints/:id', deleteComplaint);
router.post('/confirm-pickup/:id', confirmPickup);
router.post('/switch-plan', switchPlan);
router.post('/redeem-points', redeemGarbagePoints);

// Billing & Rewards Endpoints
router.get('/billing', getResidentBilling);
router.post('/pay-bill', payResidentBill);
router.get('/rewards', getResidentRewards);
router.post('/redeem-gift', redeemGarbagePoints);

// Resident Reward Orders & QR Code Endpoints
router.get('/orders', getResidentOrders);
router.post('/orders/complaint', submitOrderComplaint);
router.post('/order-complaint', submitOrderComplaint);

// Resident Points Transaction History / Ledger
router.get('/points-history', getResidentPointsHistory);
router.get('/points-transactions', getResidentPointsHistory);

// Resident Profile Endpoints
router.get('/profile', getResidentProfile);
router.put('/profile', updateResidentProfile);
router.post('/profile', updateResidentProfile);

export default router;
