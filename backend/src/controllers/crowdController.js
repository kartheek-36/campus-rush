import { crowdService } from '../services/crowdService.js';
import { expectedCrowdService } from '../services/expectedCrowdService.js';
import { locationService } from '../services/locationService.js';

export const getBestTime = async (req, res, next) => {
  try {
    if (!req.params.locationId) return res.status(400).json({ success: false, message: 'Location is required.' });
    if (!locationService.getById(req.params.locationId)) return res.status(404).json({ success: false, message: 'Location not found.' });
    const result = await expectedCrowdService.getBestTime(req.params.locationId);
    return res.json({ success: true, data: result });
  } catch (error) { return next(error); }
};

export const getCrowdEstimate = async (req, res, next) => {
  try {
    const estimate = await crowdService.getEstimate(req.params.locationId);
    if (!estimate) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  return res.json({ success: true, data: estimate });
  } catch (error) { return next(error); }
};

export const createCrowdReport = async (req, res, next) => {
  try {
  const report = await crowdService.createReport({ ...(req.body || {}), userId: req.user?.id || null });
  if (!report) {
    return res.status(400).json({ success: false, message: 'Invalid crowd report' });
  }
  return res.status(201).json({
    success: true,
    message: 'Crowd report submitted successfully',
    data: report,
  });
  } catch (error) { return next(error); }
};

export const createAdminCrowdReport = async (req, res, next) => {
  try {
    const report = await crowdService.createReport({ locationId: req.params.locationId, crowdLevel: req.body?.crowdLevel, userId: req.user.id });
    if (!report) return res.status(400).json({ success: false, message: 'Invalid crowd report' });
    return res.status(201).json({ success: true, message: 'Crowd status updated', data: report });
  } catch (error) { return next(error); }
};

export const getCrowdReports = async (_req, res, next) => {
  try { res.json({ success: true, data: await crowdService.getReports() }); } catch (error) { next(error); }
};

export const getAdminMetrics = async (_req, res, next) => {
  try { return res.json({ success: true, data: await crowdService.getAdminMetrics() }); } catch (error) { return next(error); }
};

export const getRecentCrowdReports = async (req, res, next) => {
  try {
    if (!locationService.getById(req.params.locationId)) return res.status(404).json({ success: false, message: 'Location not found.' });
    return res.json({ success: true, data: await crowdService.getRecentReports(req.params.locationId) });
  } catch (error) { return next(error); }
};

export const getCrowdHistory = async (req, res, next) => {
  try {
    if (!locationService.getById(req.params.locationId)) return res.status(404).json({ success: false, message: 'Location not found.' });
    const reports = await crowdService.getHistory(req.params.locationId);
    return res.json({
      success: true,
      data: reports.map((report) => ({ crowdLevel: report.crowdLevel, reportedAt: report.createdAt })),
    });
  } catch (error) { return next(error); }
};
