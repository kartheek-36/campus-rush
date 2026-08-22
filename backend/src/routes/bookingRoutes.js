import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { cancelBooking, createBooking, createCheckinQr, getMyBookings } from '../controllers/bookingController.js';

const router = Router();
router.use(authMiddleware);
router.post('/', createBooking);
router.get('/my', getMyBookings);
router.post('/:bookingId/checkin-qr', createCheckinQr);
router.patch('/:id/cancel', cancelBooking);
export default router;