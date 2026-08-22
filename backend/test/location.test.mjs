import assert from 'node:assert/strict';
import { locationService } from '../src/services/locationService.js';
import { calculateDistanceMeters } from '../src/utils/distance.js';

const expected = {
  'First Gate': [16.542800, 81.495704],
  'Second Gate': [16.542296, 81.497089],
  'Third Gate': [16.545310, 81.495254],
  Library: [16.543220, 81.495805],
  'Open Auditorium': [16.543460, 81.496468],
  Auditorium: [16.544907, 81.495630],
  Ground: [16.544774, 81.496776],
  Cafeteria: [16.545356, 81.495719],
  'Food Court': [16.545545, 81.495708],
  Store: [16.545247, 81.495276],
  'Srujana Vatika': [16.545939, 81.496250],
  'Volleyball Court': [16.545172, 81.497080],
  'Open Gym': [16.545172, 81.497080],
  Gym: [16.545232, 81.496707],
};

const locations = locationService.list();
assert.equal(locations.length, 14);

for (const location of locations) {
  const [latitude, longitude] = expected[location.name];
  assert.equal(location.latitude, latitude, `Latitude mismatch: ${location.name}`);
  assert.equal(location.longitude, longitude, `Longitude mismatch: ${location.name}`);
}

for (const [name, [latitude, longitude]] of Object.entries(expected)) {
  const result = locationService.resolveCampusLocation(latitude, longitude);
  const sharedCoordinate = name === 'Volleyball Court' || name === 'Open Gym';
  if (sharedCoordinate) {
    continue;
  }
  if (
    !result.matched ||
    result.locationName !== name ||
    result.distanceMeters !== 0
  ) {
    throw new Error('Match failed: ' + name);
  }
}

const sharedCoordinateResult = locationService.resolveCampusLocation(16.545172, 81.497080);
if (
  !sharedCoordinateResult.matched ||
  !['Volleyball Court', 'Open Gym'].includes(sharedCoordinateResult.locationName) ||
  sharedCoordinateResult.distanceMeters !== 0
) {
  throw new Error('Shared Volleyball Court/Open Gym match failed');
}

const noMatch = locationService.resolveCampusLocation(16.54, 81.49);

if (
  noMatch.matched ||
  noMatch.locationId !== null
) {
  throw new Error('NO_MATCH failed');
}

if (
  calculateDistanceMeters(
    16.5428,
    81.495704,
    16.5428,
    81.495704
  ) !== 0
) {
  throw new Error('Haversine zero failed');
}

const nearbyFood = locationService.listNearby(16.542800, 81.495704, 'FOOD');
assert.deepEqual(nearbyFood.map((location) => location.name), ['Cafeteria', 'Food Court']);
assert.equal(nearbyFood[0].distanceMeters < nearbyFood[1].distanceMeters, true);
assert.equal(nearbyFood[0].walkingMinutes, Math.round(nearbyFood[0].distanceMeters / 1.4 / 60));

const nearbyAll = locationService.listNearby(16.542800, 81.495704);
assert.equal(nearbyAll.length, 14);
assert.equal(nearbyAll[0].name, 'First Gate');
assert.equal(nearbyAll.every((location, index) => index === 0 || location.distanceMeters >= nearbyAll[index - 1].distanceMeters), true);

console.log('backend location checks passed');