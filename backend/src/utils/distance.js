const EARTH_RADIUS_METERS = 6371000;
export const WALKING_SPEED_MPS = Number(process.env.WALKING_SPEED_MPS || 1.4);

export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lon2 - lon1);
  const latitude1 = toRadians(lat1);
  const latitude2 = toRadians(lat2);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function calculateWalkingMinutes(distanceMeters) {
  return Math.max(0, Math.round(distanceMeters / WALKING_SPEED_MPS / 60));
}