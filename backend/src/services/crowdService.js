import { randomUUID } from 'node:crypto';
import { CrowdReport, CROWD_LEVELS } from '../models/CrowdReport.js';
import { locationService } from './locationService.js';
import { pool } from '../db/connection.js';
import { expectedCrowdService } from './expectedCrowdService.js';

const reports = [];

export const crowdService = {
  async getCrowdMap() {
    const campusLocations = locationService.list();
    return Promise.all(campusLocations.map(async (location) => {
      const estimate = await this.getEstimate(location.id);
      return {
        locationId: location.id,
        locationName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        crowdLevel: estimate?.crowdLevel || 'UNKNOWN',
        lastUpdated: estimate?.lastUpdated || null,
      };
    }));
  },

  async getAdminMetrics() {
    if (!pool) {
      const allLocations = locationService.list();
      const recentReports = reports.filter((report) => new Date(report.createdAt).getTime() >= Date.now() - 60 * 60 * 1000);
      const currentReports = reports.filter((report) => new Date(report.createdAt).getTime() >= Date.now() - 30 * 60 * 1000);
      const currentByLocation = new Set(currentReports.map((report) => report.locationId));
      const rushLocations = allLocations.filter((location) => {
        const locationReports = currentReports.filter((report) => report.locationId === location.id);
        if (!locationReports.length) return false;
        const average = locationReports.reduce((sum, report) => sum + { EMPTY: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 }[report.crowdLevel], 0) / locationReports.length;
        return average >= 3;
      }).length;
      return { totalLocations: allLocations.length, reportsPastHour: recentReports.length, unknownCount: allLocations.length - currentByLocation.size, rushCount: rushLocations, recentReports: recentReports.slice(0, 8) };
    }

    const result = await pool.query(`
      WITH current_estimates AS (
        SELECT location_id,
          AVG(CASE crowd_level WHEN 'EMPTY' THEN 0 WHEN 'LOW' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'HIGH' THEN 3 WHEN 'VERY_HIGH' THEN 4 END) AS average_level
        FROM crowd_reports
        WHERE created_at >= NOW() - INTERVAL '30 minutes'
        GROUP BY location_id
      ), recent AS (
        SELECT id, user_id, location_id, crowd_level, created_at
        FROM crowd_reports
        WHERE created_at >= NOW() - INTERVAL '60 minutes'
        ORDER BY created_at DESC
        LIMIT 8
      )
      SELECT
        (SELECT COUNT(*)::int FROM locations) AS total_locations,
        (SELECT COUNT(*)::int FROM crowd_reports WHERE created_at >= NOW() - INTERVAL '60 minutes') AS reports_past_hour,
        (SELECT COUNT(*)::int FROM locations l LEFT JOIN current_estimates e ON e.location_id = l.id WHERE e.location_id IS NULL) AS unknown_count,
        (SELECT COUNT(*)::int FROM current_estimates WHERE average_level >= 3) AS rush_count,
        COALESCE((SELECT json_agg(recent ORDER BY recent.created_at DESC) FROM recent), '[]'::json) AS recent_reports
    `);
    const row = result.rows[0];
    return {
      totalLocations: row.total_locations,
      reportsPastHour: row.reports_past_hour,
      unknownCount: row.unknown_count,
      rushCount: row.rush_count,
      recentReports: row.recent_reports.map((report) => ({ id: report.id, userId: report.user_id, locationId: report.location_id, crowdLevel: report.crowd_level, createdAt: report.created_at })),
    };
  },

  async getEstimate(locationId) {
    if (!locationService.getById(locationId)) return null;

    if (pool) {
      const result = await pool.query(
        `SELECT id, location_id, crowd_level, created_at
         FROM crowd_reports
         WHERE location_id = $1 AND created_at >= NOW() - INTERVAL '30 minutes'
         ORDER BY created_at DESC`,
        [locationId]
      );
      const latestResult = await pool.query('SELECT created_at FROM crowd_reports WHERE location_id = $1 ORDER BY created_at DESC LIMIT 1', [locationId]);
      const estimate = calculateEstimate(locationId, result.rows.map((report) => ({
        id: report.id,
        locationId: report.location_id,
        crowdLevel: report.crowd_level,
        createdAt: report.created_at.toISOString(),
      })));
      return { ...estimate, lastReportAt: latestResult.rows[0]?.created_at?.toISOString() || null, expected: await expectedCrowdService.getExpected(locationId) };
    }

    const windowStart = Date.now() - 30 * 60 * 1000;
    const recentReports = reports.filter(
      (report) => new Date(report.createdAt).getTime() >= windowStart
    );
    const locationReports = recentReports.filter((report) => report.locationId === locationId);

    const latestReport = reports.filter((report) => report.locationId === locationId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return { ...calculateEstimate(locationId, locationReports), lastReportAt: latestReport?.createdAt || null, expected: await expectedCrowdService.getExpected(locationId) };
  },

  async createReport({ locationId, crowdLevel, userId = null }) {
    if (!locationId || !crowdLevel || !CROWD_LEVELS.includes(crowdLevel) || !locationService.getById(locationId)) {
      return null;
    }

    const report = new CrowdReport({
      id: randomUUID(),
      locationId,
      crowdLevel,
      createdAt: new Date().toISOString(),
    });
    if (pool) {
      const result = await pool.query(
        'INSERT INTO crowd_reports (id, user_id, location_id, crowd_level) VALUES ($1, $2, $3, $4) RETURNING id, user_id, location_id, crowd_level, created_at',
        [report.id, userId, report.locationId, report.crowdLevel]
      );
      const saved = result.rows[0];
      return { id: saved.id, userId: saved.user_id, locationId: saved.location_id, crowdLevel: saved.crowd_level, createdAt: saved.created_at.toISOString() };
    }
    reports.unshift(report);
    return report;
  },

  async getReports() {
    if (pool) {
      const result = await pool.query('SELECT id, user_id, location_id, crowd_level, created_at FROM crowd_reports ORDER BY created_at DESC LIMIT 100');
      return result.rows.map((report) => ({ id: report.id, userId: report.user_id, locationId: report.location_id, crowdLevel: report.crowd_level, createdAt: report.created_at.toISOString() }));
    }
    return [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getRecentReports(locationId) {
    if (pool) {
      const result = await pool.query(`SELECT id, location_id, crowd_level, created_at
        FROM crowd_reports WHERE location_id = $1 AND created_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY created_at DESC`, [locationId]);
      return result.rows.map((report) => ({ id: report.id, locationId: report.location_id, crowdLevel: report.crowd_level, createdAt: report.created_at.toISOString() }));
    }
    const windowStart = Date.now() - 30 * 60 * 1000;
    return reports.filter((report) => report.locationId === locationId && new Date(report.createdAt).getTime() >= windowStart)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getHistoricalReports(locationId) {
    if (pool) {
      const result = await pool.query(`SELECT id, location_id, crowd_level, created_at
        FROM crowd_reports WHERE location_id = $1 ORDER BY created_at DESC`, [locationId]);
      return result.rows.map((report) => ({ id: report.id, locationId: report.location_id, crowdLevel: report.crowd_level, createdAt: report.created_at.toISOString() }));
    }
    return reports.filter((report) => report.locationId === locationId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async getHistory(locationId) {
    return this.getHistoricalReports(locationId);
  },
};

function calculateEstimate(locationId, locationReports) {
  if (locationReports.length === 0) {
    return { locationId, crowdLevel: 'UNKNOWN', confidence: 'UNKNOWN', lastUpdated: null, reportCount: 0 };
  }

  const values = { EMPTY: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 };
  const average = locationReports.reduce((sum, report) => sum + values[report.crowdLevel], 0) / locationReports.length;
  // Thresholds map averages to the nearest level: [0,.5), [.5,1.5), ... [3.5,4].
  const crowdLevel = average < 0.5 ? 'EMPTY' : average < 1.5 ? 'LOW' : average < 2.5 ? 'MEDIUM' : average < 3.5 ? 'HIGH' : 'VERY_HIGH';
  const newestReport = locationReports.reduce((newest, report) => new Date(report.createdAt) > new Date(newest.createdAt) ? report : newest);
  const confidence = locationReports.length >= 4 ? 'HIGH' : locationReports.length >= 2 ? 'MODERATE' : 'LOW';
  return { locationId, crowdLevel, confidence, lastUpdated: newestReport.createdAt, reportCount: locationReports.length };
}
