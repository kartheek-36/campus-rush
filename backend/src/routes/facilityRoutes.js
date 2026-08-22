import { Router } from 'express';
import { getFacility, getSlots, listFacilities } from '../controllers/bookingController.js';

const router = Router();
router.get('/', listFacilities);
router.get('/:id/slots', getSlots);
router.get('/:id', getFacility);
export default router;