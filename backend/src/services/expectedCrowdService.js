import { pool } from '../db/connection.js';

const defaultBreaks = [
  { start: '12:00', end: '13:30', type: 'LUNCH_BREAK' },
];

const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const levelFor = (locationId, minutes, breaks) => {
  const inBreak = breaks.some((item) => minutes >= toMinutes(item.start_time || item.start) && minutes < toMinutes(item.end_time || item.end));
  if (minutes >= 510 && minutes < 540 && ['first-gate', 'second-gate'].includes(locationId)) return { crowd: 'HIGH', reason: 'Expected morning student arrival' };
  if (minutes >= 795 && minutes < 810 && ['first-gate', 'second-gate'].includes(locationId)) return { crowd: 'HIGH', reason: 'Expected afternoon student movement' };
  if (inBreak && ['cafeteria', 'food-court'].includes(locationId)) return { crowd: 'HIGH', reason: 'Based on campus schedule' };
  if (inBreak && locationId === 'store') return { crowd: 'HIGH', reason: 'Based on campus schedule' };
  if (inBreak && locationId === 'library') return { crowd: 'MEDIUM', reason: 'Based on campus schedule' };
  if (minutes >= 540 && minutes < 720 && ['library', 'cafeteria', 'food-court', 'store'].includes(locationId)) return { crowd: 'MEDIUM', reason: 'Based on campus schedule' };
  if (minutes >= 810 && minutes < 990 && locationId === 'library') return { crowd: 'MEDIUM', reason: 'Based on campus schedule' };
  return { crowd: ['gym', 'volleyball-court', 'ground'].includes(locationId) ? 'LOW' : 'LOW', reason: 'Based on campus schedule' };
};

export const expectedCrowdService = {
  async getExpected(locationId, at = new Date()) {
    const minutes = at.getHours() * 60 + at.getMinutes();
    let breaks = defaultBreaks;
    if (pool) {
      const result = await pool.query('SELECT start_time, end_time FROM campus_breaks WHERE active = true AND (day_of_week IS NULL OR day_of_week = $1)', [at.getDay()]);
      if (result.rows.length) breaks = result.rows;
    }
    const result = levelFor(locationId, minutes, breaks);
    return { locationId, expectedCrowd: result.crowd, reason: result.reason, source: 'CAMPUS_SCHEDULE' };
  },
  async getBestTime(locationId, at = new Date()) {
    const start = new Date(at);
    if (start.getHours() * 60 + start.getMinutes() >= 990) {
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);
    }
    const startMinutes = Math.max(510, start.getHours() * 60 + start.getMinutes());
    start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    for (let offset = 0; offset <= 450; offset += 30) {
      const candidate = new Date(start.getTime() + offset * 60000);
      const candidateMinutes = candidate.getHours() * 60 + candidate.getMinutes();
      if (candidateMinutes > 990) break;
      const expected = await this.getExpected(locationId, candidate);
      if (expected.expectedCrowd === 'LOW' || expected.expectedCrowd === 'EMPTY') return { locationId, recommendedTime: candidate.toTimeString().slice(0, 5), expectedCrowd: expected.expectedCrowd, reason: 'Lower campus movement expected during this period.', source: 'CAMPUS_SCHEDULE' };
    }
    return { locationId, recommendedTime: null, expectedCrowd: 'UNKNOWN', reason: 'Insufficient schedule data.', source: 'CAMPUS_SCHEDULE' };
  },
};