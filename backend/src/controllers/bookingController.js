import { bookingService } from '../services/bookingService.js';

const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return parsed.toISOString().slice(0, 10) === value;
};

export const listFacilities = async (_req, res, next) => {
  try { res.json({ success: true, data: await bookingService.listFacilities() }); } catch (error) { next(error); }
};

export const getFacility = async (req, res, next) => {
  try {
    const facility = await bookingService.getFacility(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });
    return res.json({ success: true, data: facility });
  } catch (error) { return next(error); }
};

export const getSlots = async (req, res, next) => {
  try {
    const facility = await bookingService.getFacility(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });
    if (req.query.date && !validDate(req.query.date)) return res.status(400).json({ success: false, message: 'Date must use YYYY-MM-DD.' });
    return res.json({ success: true, data: await bookingService.listSlots(req.params.id, req.query.date) });
  } catch (error) { return next(error); }
};

export const createBooking = async (req, res, next) => {
  try {
    const { facilityId, slotId } = req.body || {};
    if (!facilityId || !slotId) return res.status(400).json({ success: false, message: 'Facility and slot are required.' });
    const result = await bookingService.book(req.user.id, facilityId, slotId);
    return res.status(201).json({ success: true, message: 'Booking confirmed', data: result });
  } catch (error) { return next(error); }
};

export const getMyBookings = async (req, res, next) => {
  try { res.json({ success: true, data: await bookingService.myBookings(req.user.id) }); } catch (error) { next(error); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancel(req.user.id, req.params.id, Boolean(req.user.facilityId || req.user.canManageAllFacilities));
    return res.json({ success: true, message: 'Booking cancelled', data: result });
  } catch (error) { return next(error); }
};

export const createSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime, capacity } = req.body || {};
    const facility = await bookingService.getFacility(req.params.facilityId);
    if (!facility) return res.status(404).json({ success: false, message: 'Facility not found.' });
    if (!validDate(date) || !/^\d{2}:\d{2}$/.test(startTime || '') || !/^\d{2}:\d{2}$/.test(endTime || '') || !Number.isInteger(capacity) || capacity <= 0 || startTime >= endTime) {
      return res.status(400).json({ success: false, message: 'Valid date, time range, and positive capacity are required.' });
    }
    return res.status(201).json({ success: true, message: 'Slot created', data: await bookingService.createSlot(req.params.facilityId, { date, startTime, endTime, capacity }) });
  } catch (error) { return next(error); }
};

export const adminBookings = async (req, res, next) => {
  try {
    const result = await bookingService.adminBookings(req.params.facilityId);
    return res.json({ success: true, data: result });
  } catch (error) { return next(error); }
};

export const updateSlot = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Slot updated', data: await bookingService.updateSlot(req.params.slotId, req.body || {}) }); } catch (error) { return next(error); }
};

export const closeSlot = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Slot closed', data: await bookingService.updateSlot(req.params.slotId, { status: 'CLOSED' }) }); } catch (error) { return next(error); }
};

export const cancelSlot = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Slot cancelled', data: await bookingService.cancelSlot(req.params.slotId) }); } catch (error) { return next(error); }
};

export const verifyBooking = async (req, res, next) => {
  try { return res.json({ success: true, message: 'Booking verified', data: await bookingService.verify(req.user.id, req.params.id, req.body?.verificationToken) }); } catch (error) { return next(error); }
};

export const verifyAdminBooking = async (req, res, next) => {
  try {
      return res.json({ success: true, message: 'Student arrival verified', data: await bookingService.verifyByAdmin(req.user.facilityId, req.params.id, req.body?.verificationToken) });
  } catch (error) { return next(error); }
};

export const verifyAdminBookingToken = async (req, res, next) => {
  try {
    return res.json({ success: true, message: 'Student arrival verified', data: await bookingService.verifyByAdminToken(req.user.facilityId, req.body?.verificationToken) });
  } catch (error) { return next(error); }
};

export const createCheckinQr = async (req, res, next) => {
  try {
    const data = await bookingService.createCheckinQr(req.user.id, req.params.bookingId);
    return res.status(201).json({ success: true, message: 'Check-in QR generated', data });
  } catch (error) { return next(error); }
};

export const verifyCheckin = async (req, res, next) => {
  try {
    const data = await bookingService.verifyCheckin(req.user.id, req.user.facilityId, req.body?.qrToken);
    return res.json({ success: true, message: 'Check-in successful', data });
  } catch (error) { return next(error); }
};