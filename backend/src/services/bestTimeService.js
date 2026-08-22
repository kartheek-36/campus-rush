import { crowdService } from './crowdService.js';
import { expectedCrowdService } from './expectedCrowdService.js';

const LEVELS = ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];
const LEVEL_VALUE = { EMPTY: 0, LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4, UNKNOWN: null };
const WINDOW_MINUTES = Number(process.env.BEST_TIME_WINDOW_MINUTES || 15);
const HORIZON_MINUTES = Number(process.env.BEST_TIME_HORIZON_MINUTES || 180);
const MIN_HISTORICAL_REPORTS = 3;

const trendFor = (reports) => {
  if (reports.length < 3) return 'UNKNOWN';
  const ordered = [...reports].sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
  const first = LEVEL_VALUE[ordered[0].crowdLevel];
  const last = LEVEL_VALUE[ordered[ordered.length - 1].crowdLevel];
  if (last > first) return 'INCREASING';
  if (last < first) return 'DECREASING';
  return 'STABLE';
};

const confidenceFor = (source, recentReports, historicalReports) => {
  if (source === 'RECENT_REPORTS_AND_HISTORICAL_DATA') return 'HIGH';
  if (source === 'HISTORICAL_DATA') return 'MEDIUM';
  if (source === 'RECENT_REPORTS_AND_SCHEDULE') return recentReports.length >= 2 ? 'MEDIUM' : 'LOW';
  return 'LOW';
};

const roundToNextWindow = (date) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  rounded.setMinutes(minutes + (WINDOW_MINUTES - (minutes % WINDOW_MINUTES)));
  if (rounded <= date) rounded.setMinutes(rounded.getMinutes() + WINDOW_MINUTES);
  return rounded;
};

const historicalFor = (reports, candidate) => {
  const candidateMinutes = candidate.getHours() * 60 + candidate.getMinutes();
  const candidateBucket = Math.floor(candidateMinutes / WINDOW_MINUTES) * WINDOW_MINUTES;
  const matching = reports.filter((report) => {
    const reportedAt = new Date(report.createdAt);
    if (reportedAt.getDay() !== candidate.getDay()) return false;
    const minutes = reportedAt.getHours() * 60 + reportedAt.getMinutes();
    return Math.floor(minutes / WINDOW_MINUTES) * WINDOW_MINUTES === candidateBucket;
  });
  if (matching.length < MIN_HISTORICAL_REPORTS) return null;
  const average = matching.reduce((sum, report) => sum + LEVEL_VALUE[report.crowdLevel], 0) / matching.length;
  return { crowd: LEVELS[Math.round(average)], reports: matching };
};

export const bestTimeService = {
  async getBestTime(locationId, currentTime = new Date()) {
    const historical = await crowdService.getHistoricalReports(locationId);
    const recent = await crowdService.getRecentReports(locationId);
    const estimate = await crowdService.getEstimate(locationId);
    const currentCrowd = estimate?.crowdLevel || 'UNKNOWN';
    const reportedAt = estimate?.lastReportAt || recent[0]?.createdAt || null;
    const reportTime = recent[0]?.createdAt ? new Date(recent[0].createdAt) : null;
    const base = reportTime && reportTime > currentTime ? reportTime : currentTime;
    const trend = trendFor(recent);

    const response = { locationId, currentCrowd, reportedAt, trend };
    if (currentCrowd === 'LOW' || currentCrowd === 'EMPTY') {
      return { ...response, recommendedTime: 'NOW', expectedCrowd: currentCrowd, source: 'RECENT_REPORTS', confidence: recent.length >= 2 ? 'MEDIUM' : 'LOW', reason: 'Recent report indicates low crowd.' };
    }

    const baseline = currentCrowd === 'UNKNOWN'
      ? (await expectedCrowdService.getExpected(locationId, base)).expectedCrowd
      : currentCrowd;
    const candidates = [];
    const start = roundToNextWindow(base);
    for (let offset = 0; offset <= HORIZON_MINUTES; offset += WINDOW_MINUTES) {
      const candidate = new Date(start.getTime() + offset * 60000);
      const historicalEstimate = historicalFor(historical, candidate);
      const scheduleEstimate = await expectedCrowdService.getExpected(locationId, candidate);
      const expectedCrowd = historicalEstimate?.crowd || scheduleEstimate.expectedCrowd;
      const source = historicalEstimate ? 'HISTORICAL_DATA' : 'CAMPUS_SCHEDULE';
      candidates.push({ candidate, expectedCrowd, source, historicalReports: historicalEstimate?.reports || [] });
    }

    const threshold = LEVEL_VALUE[currentCrowd] === null ? LEVEL_VALUE[baseline] : LEVEL_VALUE[currentCrowd];
    const better = candidates.find((candidate) => LEVEL_VALUE[candidate.expectedCrowd] !== null && LEVEL_VALUE[candidate.expectedCrowd] < threshold);
    if (!better) {
      return { ...response, recommendedTime: null, expectedCrowd: 'UNKNOWN', source: 'INSUFFICIENT_DATA', confidence: 'LOW', reason: candidates.length ? 'No significantly lower-crowd period identified.' : 'Not enough data to suggest a better time.' };
    }

    const combinedSource = recent.length && better.source === 'HISTORICAL_DATA'
      ? 'RECENT_REPORTS_AND_HISTORICAL_DATA'
      : recent.length
        ? 'RECENT_REPORTS_AND_SCHEDULE'
        : better.source;
    const reason = trend === 'INCREASING'
      ? 'Recent reports show increasing crowd, so a later lower-crowd period is suggested.'
      : trend === 'DECREASING'
        ? 'Recent reports show crowd is decreasing.'
        : better.source === 'HISTORICAL_DATA'
          ? 'Historical reports indicate lower crowd around this time.'
          : 'Lower crowd is expected after the current busy period.';
    return {
      ...response,
      recommendedTime: better.candidate.toTimeString().slice(0, 5),
      expectedCrowd: better.expectedCrowd,
      source: combinedSource,
      confidence: confidenceFor(combinedSource, recent, historical),
      reason,
    };
  },
};
