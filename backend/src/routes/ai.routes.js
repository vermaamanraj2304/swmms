import express from 'express';
import { chatWithAI, analyzeGarbageImage, reportGarbageSpotAI } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Enforce authentication for AI analysis and chat endpoints
router.use(protect);

router.post('/chat', chatWithAI);
router.post('/analyze-image', analyzeGarbageImage);
router.post('/analyze-waste', analyzeGarbageImage);
router.post('/report-spot', reportGarbageSpotAI);
router.post('/spot-report', reportGarbageSpotAI);

export default router;
