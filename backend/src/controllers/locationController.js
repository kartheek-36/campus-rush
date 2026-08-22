import { locationService, LOCATION_CATEGORIES } from '../services/locationService.js';
import { crowdService } from '../services/crowdService.js';

export const getCrowdMap = async (_req, res, next) => {
  try { return res.json({ success: true, data: await crowdService.getCrowdMap() }); } catch (error) { return next(error); }
};

export const listLocations = (req, res) => {
  if (req.query.category && !LOCATION_CATEGORIES.includes(req.query.category)) {
    return res.status(400).json({ success: false, message: 'Unknown location category.' });
  }
  res.json({ data: locationService.list(req.query.category) });
};

export const listNearbyLocations = (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const { category } = req.query;

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({ success: false, message: 'Latitude must be a number between -90 and 90.' });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, message: 'Longitude must be a number between -180 and 180.' });
  }
  if (category && !LOCATION_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, message: 'Unknown location category.' });
  }

  return res.json({ data: locationService.listNearby(latitude, longitude, category) });
};

export const resolveCurrentLocation = (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body || {};
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({ success: false, message: 'Latitude must be a number between -90 and 90.' });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, message: 'Longitude must be a number between -180 and 180.' });
  }
  if (accuracy !== undefined && (!Number.isFinite(accuracy) || accuracy < 0)) {
    return res.status(400).json({ success: false, message: 'Accuracy must be a non-negative number.' });
  }
  if (timestamp !== undefined && typeof timestamp !== 'string') {
    return res.status(400).json({ success: false, message: 'Timestamp must be a string.' });
  }
  return res.json({
    success: true,
    data: {
      ...locationService.resolveCampusLocation(latitude, longitude),
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
      timestamp: timestamp || new Date().toISOString(),
    },
  });
};

export const getLocation = (req, res) => {
  const location = locationService.getById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  return res.json({ data: location });
};
