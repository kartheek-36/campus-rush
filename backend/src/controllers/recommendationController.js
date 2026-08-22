import { recommendationService } from '../services/recommendationService.js';
import { locationService } from '../services/locationService.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const rawInput = req.method === 'GET' ? req.query : req.body || {};
    const input = {
      ...rawInput,
      latitude: rawInput.latitude === undefined ? undefined : Number(rawInput.latitude),
      longitude: rawInput.longitude === undefined ? undefined : Number(rawInput.longitude),
    };
    const { category, currentLocationId, latitude, longitude } = input;
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }
    if (!recommendationService.supportsCategory(category)) {
      return res.status(400).json({ success: false, message: 'Unsupported recommendation category.' });
    }
    if (currentLocationId && !locationService.getById(currentLocationId)) {
      return res.status(404).json({ success: false, message: 'Current location not found.' });
    }
    if (!currentLocationId && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      return res.status(400).json({ success: false, message: 'Current location is required.' });
    }
    if (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ success: false, message: 'Latitude must be a number between -90 and 90.' });
    }
    if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ success: false, message: 'Longitude must be a number between -180 and 180.' });
    }
    return res.json({ success: true, data: { recommendations: await recommendationService.getRecommendations(input) } });
  } catch (error) {
    next(error);
  }
};

export const getBestTime = async (req, res, next) => {
  try {
    if (!locationService.getById(req.params.locationId)) return res.status(404).json({ success: false, message: 'Location not found.' });
    return res.json({ success: true, data: await recommendationService.getBestTime(req.params.locationId) });
  } catch (error) { return next(error); }
};
