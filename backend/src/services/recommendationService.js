import { crowdService } from './crowdService.js';
import { expectedCrowdService } from './expectedCrowdService.js';
import { locationService } from './locationService.js';
import { bestTimeService } from './bestTimeService.js';

const categories = ['FOOD', 'STUDY', 'LAB', 'PHOTOCOPY'];
const weights = { crowd: 0.40, freshness: 0.15, distance: 0.15, walking: 0.10, history: 0.10, confidence: 0.10 };
const crowdScore = { EMPTY: 100, LOW: 85, MEDIUM: 60, HIGH: 30, VERY_HIGH: 5, UNKNOWN: 45 };
const confidenceScore = { HIGH: 100, MEDIUM: 65, LOW: 35, UNKNOWN: 0 };
const levelValue = { EMPTY: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 };
const trendScore = { INCREASING: 25, DECREASING: 100, STABLE: 65, UNKNOWN: 50 };

const trendFor = (reports) => {
  if (reports.length < 3) return 'UNKNOWN';
  const ordered = [...reports].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const first = levelValue[ordered[0].crowdLevel];
  const last = levelValue[ordered[ordered.length - 1].crowdLevel];
  if (last > first) return 'INCREASING';
  if (last < first) return 'DECREASING';
  return 'STABLE';
};

const confidenceFor = (reports, estimate) => {
  if (!reports.length) return 'UNKNOWN';
  const distinct = new Set(reports.map((report) => report.crowdLevel)).size;
  if (reports.length >= 4 && distinct === 1) return 'HIGH';
  if (reports.length >= 2) return 'MEDIUM';
  return estimate?.confidence === 'HIGH' ? 'HIGH' : 'LOW';
};

export const recommendationService = {
  supportsCategory(category) { return categories.includes(category); },

  async getRecommendations(request = {}) {
    const candidates = locationService.list(request.category);
    let origin = null;
    if (request.currentLocationId) {
      origin = locationService.getById(request.currentLocationId);
      if (!origin) return [];
    } else if (Number.isFinite(request.latitude) && Number.isFinite(request.longitude)) {
      origin = { latitude: request.latitude, longitude: request.longitude };
    }
    const now = Date.now();
    const recommendations = await Promise.all(candidates.map(async (location) => {
      const recentReports = await crowdService.getRecentReports(location.id);
      const history = await crowdService.getHistoricalReports(location.id);
      const estimate = await crowdService.getEstimate(location.id);
      const expected = estimate?.expected || await expectedCrowdService.getExpected(location.id);
      const current = estimate?.crowdLevel || 'UNKNOWN';
      const latest = estimate?.lastReportAt || recentReports[0]?.createdAt || null;
      const ageMinutes = latest ? Math.max(0, (now - new Date(latest).getTime()) / 60000) : null;
      const confidence = confidenceFor(recentReports, estimate);
      const trend = trendFor(recentReports);
      const betterTime = await this.getBestTime(location.id);
      const distanceMeters = origin ? Math.round(locationService.distanceBetween(origin.latitude, origin.longitude, location.latitude, location.longitude)) : null;
      const walkingMinutes = distanceMeters === null ? null : locationService.walkingMinutes(distanceMeters);
      const freshness = ageMinutes === null ? 0 : Math.max(0, 100 - ageMinutes / 30 * 100);
      const distance = distanceMeters === null ? 50 : Math.max(0, 100 - distanceMeters / 10);
      const walking = walkingMinutes === null ? 50 : Math.max(0, 100 - walkingMinutes * 10);
      const score = weights.crowd * crowdScore[current] + weights.freshness * freshness + weights.distance * distance + weights.walking * walking + weights.history * trendScore[trend] + weights.confidence * confidenceScore[confidence];
      let reason = recentReports.length ? 'Lower current crowd than nearby options.' : 'Based on campus schedule because recent data is unavailable.';
      if (trend === 'DECREASING') reason = 'Current crowd is decreasing.';
      else if (recentReports.length && ageMinutes !== null && ageMinutes < 10) reason = 'More recent crowd data is available.';
      return { locationId: location.id, locationName: location.name, category: location.category, crowdLevel: current, expectedCrowd: expected.expectedCrowd, confidence, distanceMeters, walkingMinutes, trend, lastReportedAt: latest, source: recentReports.length ? 'RECENT_REPORTS' : 'CAMPUS_SCHEDULE', reason, betterTime, score };
    }));
    return recommendations.sort((a, b) => b.score - a.score || (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity)).map(({ score: _score, ...result }) => result);
  },

  async getBestTime(locationId) {
    return bestTimeService.getBestTime(locationId);
  },
};
