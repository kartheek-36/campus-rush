import { Router } from 'express';
import { getBestTime, getRecommendations } from '../controllers/recommendationController.js';

const router = Router();

router.get('/', getRecommendations);
router.post('/', getRecommendations);
router.get('/best-time/:locationId', getBestTime);

export default router;
