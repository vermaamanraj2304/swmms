import express from 'express';
import authRoutes from './auth.routes.js';
import residentRoutes from './resident.routes.js';
import driverRoutes from './driver.routes.js';
import adminRoutes from './admin.routes.js';
import superadminRoutes from './superadmin.routes.js';
import aiRoutes from './ai.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/resident', residentRoutes);
router.use('/driver', driverRoutes);
router.use('/admin', adminRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/ai', aiRoutes);

export default router;
