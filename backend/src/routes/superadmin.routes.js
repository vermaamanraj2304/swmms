import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { 
  getSuperadminDashboard, 
  addCity, 
  toggleCityStatus, 
  deleteCity,
  getSuperadminRBACData,
  createSuperadminRole,
  deleteSuperadminRole,
  onboardSuperadminStaff
} from '../controllers/superadmin.controller.js';

const router = express.Router();

// Enforce authentication & superadmin role authorization for all routes
router.use(protect, authorize('superadmin'));

router.get('/dashboard', getSuperadminDashboard);
router.post('/add-city', addCity);
router.post('/toggle-city-status/:id', toggleCityStatus);
router.delete('/delete-city/:id', deleteCity);

// RBAC Endpoints
router.get('/rbac', getSuperadminRBACData);
router.post('/roles', createSuperadminRole);
router.delete('/roles/:id', deleteSuperadminRole);
router.post('/staff', onboardSuperadminStaff);

export default router;
