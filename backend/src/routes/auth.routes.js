import express from 'express';
import { login, demoLogin, register, getMe, getMunicipalInfo } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/municipal-info', getMunicipalInfo);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/register', register);
router.get('/me', protect, getMe);

export default router;
