import { pool } from '../db/connection.js';

const facilityByRole = {
  LIBRARY_ADMIN: 'library',
  CAFETERIA_ADMIN: 'cafeteria',
  VOLLEYBALL_ADMIN: 'volleyball-court',
  GYM_ADMIN: 'gym',
  ADMIN: '*',
  SUPER_ADMIN: '*',
};
const facilityAliases = { volleyball: 'volleyball-court' };
const canonicalFacilityId = (facilityId) => facilityAliases[facilityId] || facilityId;
const canonicalRole = (role) => String(role || '').toUpperCase().replace(/-/g, '_');

export const facilityAdminMiddleware = async (req, res, next) => {
  try {
    const role = canonicalRole(req.user?.role);
    const facilityId = facilityByRole[role];
    if (!facilityId) return res.status(403).json({ success: false, message: 'Admin access required.' });
    let requestedFacility = req.params.facilityId;
    if (!requestedFacility && req.params.locationId) requestedFacility = req.params.locationId;
    if (!requestedFacility && req.params.slotId && pool) {
      const result = await pool.query('SELECT facility_id FROM facility_slots WHERE id = $1', [req.params.slotId]);
      requestedFacility = result.rows[0]?.facility_id;
    }
    if (!requestedFacility && req.params.id && pool) {
      const result = await pool.query('SELECT facility_id FROM bookings WHERE id = $1', [req.params.id]);
      requestedFacility = result.rows[0]?.facility_id;
    }
    if (facilityId !== '*' && requestedFacility && canonicalFacilityId(requestedFacility) !== facilityId) {
      console.warn(`Facility access denied for role ${role}: requested ${requestedFacility}, assigned ${facilityId}`);
      return res.status(403).json({ success: false, message: 'You cannot manage this facility.' });
    }
    req.user.facilityId = facilityId === '*' ? null : facilityId;
    req.user.canManageAllFacilities = facilityId === '*';
    return next();
  } catch (error) {
    return next(error);
  }
};