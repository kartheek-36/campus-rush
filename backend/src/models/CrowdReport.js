export const CROWD_LEVELS = ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export class CrowdReport {
  constructor({ id, locationId, crowdLevel, createdAt }) {
    if (!locationId || !CROWD_LEVELS.includes(crowdLevel)) {
      throw new Error('Invalid crowd report');
    }

    this.id = id;
    this.locationId = locationId;
    this.crowdLevel = crowdLevel;
    this.createdAt = createdAt;
  }
}
