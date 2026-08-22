import { Router } from 'express';
import { adminBookings, cancelBooking, cancelSlot, closeSlot, createSlot, updateSlot, verifyAdminBooking, verifyCheckin } from '../controllers/bookingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { facilityAdminMiddleware } from '../middleware/facilityAdminMiddleware.js';

const router = Router();
router.post('/facilities/:facilityId/slots', authMiddleware, facilityAdminMiddleware, createSlot);
router.get('/facilities/:facilityId/bookings', authMiddleware, facilityAdminMiddleware, adminBookings);
router.patch('/slots/:slotId', authMiddleware, facilityAdminMiddleware, updateSlot);
router.patch('/slots/:slotId/close', authMiddleware, facilityAdminMiddleware, closeSlot);
router.patch('/slots/:slotId/cancel', authMiddleware, facilityAdminMiddleware, cancelSlot);
router.patch('/bookings/:id/cancel', authMiddleware, facilityAdminMiddleware, cancelBooking);
router.post('/checkin/verify', authMiddleware, facilityAdminMiddleware, verifyCheckin);
export default router;