import { Router } from 'express';
import { listLocations, listNearbyLocations, getCrowdMap, getLocation, resolveCurrentLocation } from '../controllers/locationController.js';

const router = Router();

router.post('/current', resolveCurrentLocation);
router.get('/crowd-map', getCrowdMap);
router.get('/nearby', listNearbyLocations);
router.get('/', listLocations);
router.get('/:id', getLocation);

export default router;
