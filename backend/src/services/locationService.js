import { calculateDistanceMeters, calculateWalkingMinutes } from '../utils/distance.js';
import { pool } from '../db/connection.js';

const MATCH_RADIUS_METERS = 50;
export const LOCATION_CATEGORIES = ['ENTRANCE', 'STUDY', 'EVENTS', 'SPORTS', 'FOOD', 'SHOPPING', 'RECREATION', 'FITNESS', 'LAB', 'PHOTOCOPY'];

const locations = [
  { id: 'first-gate', name: 'First Gate', category: 'ENTRANCE', latitude: 16.542800, longitude: 81.495704, description: 'Campus entrance.', availability: 'UNKNOWN' },
  { id: 'second-gate', name: 'Second Gate', category: 'ENTRANCE', latitude: 16.542296, longitude: 81.497089, description: 'Campus entrance.', availability: 'UNKNOWN' },
  { id: 'third-gate', name: 'Third Gate', category: 'ENTRANCE', latitude: 16.545310, longitude: 81.495254, description: 'Campus entrance.', availability: 'UNKNOWN' },
  { id: 'library', name: 'Library', category: 'STUDY', latitude: 16.543220, longitude: 81.495805, description: 'Campus study facility.', availability: 'UNKNOWN' },
  { id: 'open-auditorium', name: 'Open Auditorium', category: 'EVENTS', latitude: 16.543460, longitude: 81.496468, description: 'Campus events venue.', availability: 'UNKNOWN' },
  { id: 'auditorium', name: 'Auditorium', category: 'EVENTS', latitude: 16.544907, longitude: 81.495630, description: 'Campus events venue.', availability: 'UNKNOWN' },
  { id: 'ground', name: 'Ground', category: 'SPORTS', latitude: 16.544774, longitude: 81.496776, description: 'Campus sports area.', availability: 'UNKNOWN' },
  { id: 'cafeteria', name: 'Cafeteria', category: 'FOOD', latitude: 16.545356, longitude: 81.495719, description: 'Campus food facility.', availability: 'UNKNOWN' },
  { id: 'food-court', name: 'Food Court', category: 'FOOD', latitude: 16.545545, longitude: 81.495708, description: 'Campus food facility.', availability: 'UNKNOWN' },
  { id: 'store', name: 'Store', category: 'SHOPPING', latitude: 16.545247, longitude: 81.495276, description: 'Campus shopping facility.', availability: 'UNKNOWN' },
  { id: 'srujana-vatika', name: 'Srujana Vatika', category: 'RECREATION', latitude: 16.545939, longitude: 81.496250, description: 'Campus recreation area.', availability: 'UNKNOWN' },
  { id: 'volleyball-court', name: 'Volleyball Court', category: 'SPORTS', latitude: 16.545172, longitude: 81.497080, description: 'Campus sports area.', availability: 'UNKNOWN' },
  // TODO: Verify Open Gym coordinate if it is physically separate from Volleyball Court.
  { id: 'open-gym', name: 'Open Gym', category: 'FITNESS', latitude: 16.545172, longitude: 81.497080, description: 'Campus fitness area.', availability: 'UNKNOWN' },
  { id: 'gym', name: 'Gym', category: 'FITNESS', latitude: 16.545232, longitude: 81.496707, description: 'Campus fitness facility.', availability: 'UNKNOWN' },
];

const mapLocation = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  latitude: row.latitude,
  longitude: row.longitude,
  availability: row.availability,
});

export const locationService = {
  async initialize() {
    if (!pool) return;
    const result = await pool.query('SELECT id, name, category, description, latitude, longitude, availability FROM locations ORDER BY name');
    locations.splice(0, locations.length, ...result.rows.map(mapLocation));
  },
  list(category) {
    if (!category) return locations;
    return locations.filter((location) => location.category === category);
  },
  listNearby(latitude, longitude, category) {
    return this.list(category)
      .map((location) => {
        const distanceMeters = Math.round(calculateDistanceMeters(
          latitude,
          longitude,
          location.latitude,
          location.longitude
        ));
        return {
          locationId: location.id,
          name: location.name,
          category: location.category,
          distanceMeters,
          walkingMinutes: calculateWalkingMinutes(distanceMeters),
        };
      })
      .sort((first, second) => first.distanceMeters - second.distanceMeters);
  },
  getById(id) {
    return locations.find((location) => location.id === id) || null;
  },
  distanceBetween(latitude, longitude, targetLatitude, targetLongitude) {
    return calculateDistanceMeters(latitude, longitude, targetLatitude, targetLongitude);
  },
  walkingMinutes(distanceMeters) {
    return calculateWalkingMinutes(distanceMeters);
  },

  resolveCampusLocation(latitude, longitude) {
    const nearest = locations.reduce((closest, location) => {
      const distanceMeters = calculateDistanceMeters(latitude, longitude, location.latitude, location.longitude);
      return !closest || distanceMeters < closest.distanceMeters
        ? { location, distanceMeters }
        : closest;
    }, null);

    if (!nearest || nearest.distanceMeters > MATCH_RADIUS_METERS) {
      return {
        matched: false,
        locationId: null,
        locationName: null,
        latitude: null,
        longitude: null,
        distanceMeters: null,
        message: 'You are outside the configured campus location range.',
      };
    }

    return {
      matched: true,
      locationId: nearest.location.id,
      locationName: nearest.location.name,
      latitude: nearest.location.latitude,
      longitude: nearest.location.longitude,
      distanceMeters: Math.round(nearest.distanceMeters),
      message: 'Location detected successfully.',
    };
  },
};
