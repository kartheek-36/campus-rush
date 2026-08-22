import { Router } from 'express';
import { createAdminCrowdReport, createCrowdReport, getAdminMetrics, getBestTime, getCrowdEstimate, getCrowdHistory, getCrowdReports, getRecentCrowdReports } from '../controllers/crowdController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { facilityAdminMiddleware } from '../middleware/facilityAdminMiddleware.js';

const router = Router();

router.post('/report', optionalAuthMiddleware, createCrowdReport);
router.post('/admin/:locationId', authMiddleware, facilityAdminMiddleware, createAdminCrowdReport);
router.get('/reports', getCrowdReports);
router.get('/admin/metrics', authMiddleware, (req, res, next) => {
	if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied.' });
	return getAdminMetrics(req, res, next);
});
router.get('/best-time/:locationId', getBestTime);
router.get('/:locationId/recent', getRecentCrowdReports);
router.get('/:locationId/history', getCrowdHistory);
router.get('/:locationId', getCrowdEstimate);

export default router;
