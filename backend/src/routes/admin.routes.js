import express from 'express';
import { 
  getAdminDashboard, 
  addResident, 
  deleteResident,
  addDriver, 
  deleteDriver,
  assignDriverToEmergency, 
  resolveComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getAdminComplaints,
  createAdminComplaint,
  assignNearestVehicleToComplaint,
  manualAssignComplaintVehicle,
  assignDriverToArea,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicles,
  getUnassignedVehicles,
  assignDriverToVehicle,
  logVehicleFuel,
  logVehicleService,
  reportVehicleIssue,
  updateVehicleIssueStatus,
  getAdminRBACData,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  onboardAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminPayments,
  createPayment,
  updatePaymentStatus,
  deletePayment,
  getAdminRewardsData,
  createAdminGift,
  updateAdminGift,
  deleteAdminGift,
  updateRedemptionStatus,
  acceptRewardOrder,
  packAndAssignRewardOrder,
  updatePricingPlan,
  getAdminAuditLogs,
  refundOrderComplaint,
  exchangeOrderComplaint,
  getPointRules,
  updatePointRules,
  createEmergencyRequest,
  resolveEmergencyRequest,
  updateEmergencyStatus,
  getAdminProfile,
  updateAdminProfile
} from '../controllers/admin.controller.js';
import { deleteEmergencyRequest } from '../controllers/resident.controller.js';
import { protect, authorize, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();

// Enforce authentication & base admin/staff authorization
router.use(protect, authorize('admin', 'cityadmin', 'superadmin', 'staff'));

// Universal Overview & Profile
router.get('/dashboard', getAdminDashboard);
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.post('/profile', updateAdminProfile);

// Audit Logs
router.get('/audit-logs', requirePermission('system_audit_logs', 'rbac_management'), getAdminAuditLogs);

// Resident Management Routes
router.post('/add-resident', requirePermission('manage_residents'), addResident);
router.delete('/residents/:id', requirePermission('manage_residents'), deleteResident);
router.post('/delete-resident/:id', requirePermission('manage_residents'), deleteResident);

// Driver Management Routes
router.post('/add-driver', requirePermission('manage_drivers'), addDriver);
router.delete('/drivers/:id', requirePermission('manage_drivers'), deleteDriver);
router.post('/delete-driver/:id', requirePermission('manage_drivers'), deleteDriver);
router.post('/assign-driver-area', requirePermission('assign_driver_areas', 'manage_drivers'), assignDriverToArea);
router.post('/assign-area', requirePermission('assign_driver_areas', 'manage_drivers'), assignDriverToArea);

// Emergency SOS Dispatch & Lifecycle Routes
router.post('/assign-emergency', requirePermission('dispatch_emergencies'), assignDriverToEmergency);
router.post('/assign-emergency-driver', requirePermission('dispatch_emergencies'), assignDriverToEmergency);
router.post('/emergency', requirePermission('dispatch_emergencies'), createEmergencyRequest);
router.post('/resolve-emergency/:id', requirePermission('dispatch_emergencies'), resolveEmergencyRequest);
router.post('/update-emergency-status/:id', requirePermission('dispatch_emergencies'), updateEmergencyStatus);
router.put('/emergency/:id/status', requirePermission('dispatch_emergencies'), updateEmergencyStatus);
router.delete('/emergency/:id', requirePermission('dispatch_emergencies'), deleteEmergencyRequest);
router.post('/delete-emergency/:id', requirePermission('dispatch_emergencies'), deleteEmergencyRequest);

// Resident & Roadside Complaints Resolution Routes
router.get('/complaints', requirePermission('resolve_complaints'), getAdminComplaints);
router.post('/complaints', requirePermission('resolve_complaints'), createAdminComplaint);
router.post('/complaints/:id/assign-nearest', requirePermission('resolve_complaints'), assignNearestVehicleToComplaint);
router.post('/complaints/:id/manual-assign', requirePermission('resolve_complaints'), manualAssignComplaintVehicle);
router.post('/resolve-complaint/:id', requirePermission('resolve_complaints'), resolveComplaint);
router.post('/complaints/:id/order-refund', requirePermission('resolve_complaints'), refundOrderComplaint);
router.post('/complaints/:id/order-exchange', requirePermission('resolve_complaints'), exchangeOrderComplaint);
router.post('/update-complaint-status/:id', requirePermission('resolve_complaints'), updateComplaintStatus);
router.put('/complaints/:id/status', requirePermission('resolve_complaints'), updateComplaintStatus);
router.delete('/complaint/:id', requirePermission('resolve_complaints'), deleteComplaint);
router.post('/delete-complaint/:id', requirePermission('resolve_complaints'), deleteComplaint);
router.delete('/complaints/:id', requirePermission('resolve_complaints'), deleteComplaint);

// Service Area Routes
router.post('/service-areas', requirePermission('manage_service_areas'), createServiceArea);
router.put('/service-areas/:id', requirePermission('manage_service_areas'), updateServiceArea);
router.delete('/service-areas/:id', requirePermission('manage_service_areas'), deleteServiceArea);

// Garbage Vehicle Fleet Routes
router.get('/vehicles', getVehicles);
router.get('/unassigned-vehicles', getUnassignedVehicles);
router.post('/vehicles', requirePermission('manage_vehicles'), createVehicle);
router.put('/vehicles/:id', requirePermission('manage_vehicles'), updateVehicle);
router.delete('/vehicles/:id', requirePermission('manage_vehicles'), deleteVehicle);
router.post('/vehicles/:id/assign-driver', requirePermission('manage_vehicles'), assignDriverToVehicle);
router.post('/vehicles/:id/fuel', requirePermission('manage_vehicles'), logVehicleFuel);
router.post('/vehicles/:id/service', requirePermission('manage_vehicles'), logVehicleService);
router.post('/vehicles/:id/issues', requirePermission('manage_vehicles'), reportVehicleIssue);
router.put('/vehicles/:id/issues/:issueId/status', requirePermission('manage_vehicles'), updateVehicleIssueStatus);
router.post('/vehicles/:id/issues/:issueId/status', requirePermission('manage_vehicles'), updateVehicleIssueStatus);

// RBAC Endpoints (Roles & Staff Employees)
router.get('/rbac', requirePermission('rbac_management'), getAdminRBACData);
router.post('/roles', requirePermission('rbac_management'), createAdminRole);
router.put('/roles/:id', requirePermission('rbac_management'), updateAdminRole);
router.delete('/roles/:id', requirePermission('rbac_management'), deleteAdminRole);
router.post('/staff', requirePermission('rbac_management'), onboardAdminStaff);
router.put('/staff/:id', requirePermission('rbac_management'), updateAdminStaff);
router.delete('/staff/:id', requirePermission('rbac_management'), deleteAdminStaff);

// Payment & Invoice Management Routes
router.get('/payments', requirePermission('manage_payments'), getAdminPayments);
router.post('/payments', requirePermission('manage_payments'), createPayment);
router.put('/payments/:id/status', requirePermission('manage_payments'), updatePaymentStatus);
router.post('/update-payment-status/:id', requirePermission('manage_payments'), updatePaymentStatus);
router.delete('/payments/:id', requirePermission('manage_payments'), deletePayment);
router.post('/delete-payment/:id', requirePermission('manage_payments'), deletePayment);
router.put('/plans/:id', requirePermission('manage_payments'), updatePricingPlan);
router.post('/update-plan/:id', requirePermission('manage_payments'), updatePricingPlan);
router.put('/pricing-plans/:id', requirePermission('manage_payments'), updatePricingPlan);

// Eco-Points & Rewards Gift Catalog Routes
router.get('/rewards', requirePermission('rewards_management'), getAdminRewardsData);
router.post('/rewards/gifts', requirePermission('rewards_management'), createAdminGift);
router.put('/rewards/gifts/:id', requirePermission('rewards_management'), updateAdminGift);
router.post('/rewards/update-gift/:id', requirePermission('rewards_management'), updateAdminGift);
router.delete('/rewards/gifts/:id', requirePermission('rewards_management'), deleteAdminGift);
router.post('/rewards/delete-gift/:id', requirePermission('rewards_management'), deleteAdminGift);
router.put('/rewards/redemptions/:id/status', requirePermission('rewards_management'), updateRedemptionStatus);
router.post('/rewards/update-redemption-status/:id', requirePermission('rewards_management'), updateRedemptionStatus);
router.post('/orders/:id/accept', requirePermission('rewards_management'), acceptRewardOrder);
router.post('/rewards/orders/:id/accept', requirePermission('rewards_management'), acceptRewardOrder);
router.post('/orders/:id/pack-assign', requirePermission('rewards_management'), packAndAssignRewardOrder);
router.post('/rewards/orders/:id/pack-assign', requirePermission('rewards_management'), packAndAssignRewardOrder);

// Point Value & Weight Rules Configuration
router.get('/rewards/point-rules', requirePermission('rewards_management'), getPointRules);
router.put('/rewards/point-rules', requirePermission('rewards_management'), updatePointRules);
router.post('/rewards/point-rules', requirePermission('rewards_management'), updatePointRules);

export default router;
