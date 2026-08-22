import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { pool } from '../db/connection.js';

const facilities = [
  { id: 'library', name: 'Library', type: 'STUDY', locationId: 'library', status: 'ACTIVE' },
  { id: 'cafeteria', name: 'Cafeteria', type: 'FOOD', locationId: 'cafeteria', status: 'ACTIVE' },
  { id: 'volleyball-court', name: 'Volleyball Court', type: 'SPORTS', locationId: 'volleyball-court', status: 'ACTIVE' },
  { id: 'gym', name: 'Gym', type: 'FITNESS', locationId: 'gym', status: 'ACTIVE' },
];

const mapSlot = (row) => ({ slotId: row.id, date: row.date, startTime: row.start_time, endTime: row.end_time, capacity: row.capacity, availableCapacity: row.available_capacity, status: row.status });
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const serviceError = (message, status) => Object.assign(new Error(message), { status });

export const bookingService = {
  async listFacilities() {
    if (!pool) return facilities;
    const result = await pool.query(`SELECT f.id, f.name, f.type, f.location_id, f.status,
      s.id AS next_slot_id, s.date AS next_slot_date, s.start_time AS next_slot_start_time,
      s.end_time AS next_slot_end_time, s.available_capacity AS next_slot_available_capacity
      FROM facilities f
      LEFT JOIN LATERAL (
        SELECT id, date, start_time, end_time, available_capacity
        FROM facility_slots
        WHERE facility_id = f.id AND status = 'OPEN' AND available_capacity > 0 AND date >= CURRENT_DATE
        ORDER BY date, start_time LIMIT 1
      ) s ON true
      WHERE f.status = $1 ORDER BY f.name`, ['ACTIVE']);
    return result.rows.map((row) => ({
      id: row.id, name: row.name, type: row.type, locationId: row.location_id, status: row.status,
      nextAvailableSlot: row.next_slot_id ? { slotId: row.next_slot_id, date: row.next_slot_date, startTime: row.next_slot_start_time, endTime: row.next_slot_end_time, availableCapacity: row.next_slot_available_capacity } : null,
    }));
  },
  async getFacility(id) {
    if (!pool) return facilities.find((facility) => facility.id === id) || null;
    const result = await pool.query('SELECT id, name, type, location_id, status FROM facilities WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? { id: row.id, name: row.name, type: row.type, locationId: row.location_id, status: row.status } : null;
  },
  async listSlots(facilityId, date) {
    if (!pool) return [];
    const result = await pool.query('SELECT id, date, start_time, end_time, capacity, available_capacity, status FROM facility_slots WHERE facility_id = $1 AND ($2::date IS NULL OR date = $2::date) ORDER BY date, start_time', [facilityId, date || null]);
    return result.rows.map(mapSlot);
  },
  async createSlot(facilityId, { date, startTime, endTime, capacity }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const overlap = await client.query('SELECT 1 FROM facility_slots WHERE facility_id = $1 AND date = $2 AND start_time < $4 AND end_time > $3 LIMIT 1', [facilityId, date, startTime, endTime]);
      if (overlap.rowCount) throw Object.assign(new Error('This slot overlaps an existing slot.'), { status: 409 });
      const result = await client.query('INSERT INTO facility_slots (id, facility_id, date, start_time, end_time, capacity, available_capacity) VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id, date, start_time, end_time, capacity, available_capacity, status', [randomUUID(), facilityId, date, startTime, endTime, capacity]);
      await client.query('COMMIT');
      return mapSlot(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async updateSlot(slotId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currentResult = await client.query('SELECT * FROM facility_slots WHERE id = $1 FOR UPDATE', [slotId]);
      const current = currentResult.rows[0];
      if (!current) throw Object.assign(new Error('Slot not found.'), { status: 404 });
      const date = updates.date ?? current.date;
      const startTime = updates.startTime ?? current.start_time;
      const endTime = updates.endTime ?? current.end_time;
      const capacity = updates.capacity ?? current.capacity;
      if (startTime >= endTime || !Number.isInteger(capacity) || capacity <= 0) throw Object.assign(new Error('Slot time range or capacity is invalid.'), { status: 400 });
      const overlap = await client.query('SELECT 1 FROM facility_slots WHERE facility_id = $1 AND date = $2 AND id <> $3 AND start_time < $5 AND end_time > $4 LIMIT 1', [current.facility_id, date, slotId, startTime, endTime]);
      if (overlap.rowCount) throw Object.assign(new Error('This slot overlaps an existing slot.'), { status: 409 });
      const active = await client.query("SELECT COUNT(*)::int AS count FROM bookings WHERE slot_id = $1 AND status = 'CONFIRMED'", [slotId]);
      if (capacity < active.rows[0].count) throw Object.assign(new Error('Capacity cannot be lower than confirmed bookings.'), { status: 400 });
      const nextAvailable = capacity - active.rows[0].count;
      const status = updates.status ?? (nextAvailable === 0 ? 'FULL' : current.status === 'FULL' ? 'OPEN' : current.status);
      const result = await client.query('UPDATE facility_slots SET date = $1, start_time = $2, end_time = $3, capacity = $4, available_capacity = $5, status = $6, updated_at = NOW() WHERE id = $7 RETURNING id, date, start_time, end_time, capacity, available_capacity, status', [date, startTime, endTime, capacity, nextAvailable, status, slotId]);
      await client.query('COMMIT');
      return mapSlot(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async cancelSlot(slotId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const slotResult = await client.query('SELECT * FROM facility_slots WHERE id = $1 FOR UPDATE', [slotId]);
      const slot = slotResult.rows[0];
      if (!slot) throw Object.assign(new Error('Slot not found.'), { status: 404 });
      await client.query("UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE slot_id = $1 AND status = 'CONFIRMED'", [slotId]);
      const result = await client.query("UPDATE facility_slots SET available_capacity = capacity, status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING id, date, start_time, end_time, capacity, available_capacity, status", [slotId]);
      await client.query('COMMIT');
      return mapSlot(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async book(userId, facilityId, slotId) {
    await this.releaseExpiredBookings();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const slotResult = await client.query('SELECT fs.*, f.name AS facility_name FROM facility_slots fs JOIN facilities f ON f.id = fs.facility_id WHERE fs.id = $1 AND fs.facility_id = $2 FOR UPDATE', [slotId, facilityId]);
      const slot = slotResult.rows[0];
      if (!slot) throw Object.assign(new Error('Slot not found.'), { status: 404 });
      if (slot.status !== 'OPEN' || slot.available_capacity <= 0) throw Object.assign(new Error('This slot is full or unavailable.'), { status: 409 });
      const duplicate = await client.query('SELECT id FROM bookings WHERE user_id = $1 AND slot_id = $2 AND status = $3', [userId, slotId, 'CONFIRMED']);
      if (duplicate.rowCount) throw Object.assign(new Error('You already booked this slot.'), { status: 409 });
      const booking = await client.query('INSERT INTO bookings (id, user_id, facility_id, slot_id, booking_date) VALUES ($1, $2, $3, $4, $5) RETURNING id, booking_date, status, created_at', [randomUUID(), userId, facilityId, slotId, slot.date]);
      await client.query('UPDATE facility_slots SET available_capacity = available_capacity - 1, status = CASE WHEN available_capacity - 1 = 0 THEN \'FULL\' ELSE status END, updated_at = NOW() WHERE id = $1', [slotId]);
      await client.query('COMMIT');
      const record = booking.rows[0];
      const bookingExpiresAt = new Date(new Date(record.created_at).getTime() + 5 * 60 * 1000);
      return { bookingId: record.id, facility: slot.facility_name, date: record.booking_date, startTime: slot.start_time, endTime: slot.end_time, status: record.status, createdAt: record.created_at.toISOString(), bookingExpiresAt: bookingExpiresAt.toISOString() };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async myBookings(userId) {
    if (!pool) return [];
    await this.releaseExpiredBookings();
    const result = await pool.query('SELECT b.id, b.booking_date, b.status, b.created_at, f.name AS facility, fs.start_time, fs.end_time FROM bookings b JOIN facilities f ON f.id = b.facility_id JOIN facility_slots fs ON fs.id = b.slot_id WHERE b.user_id = $1 ORDER BY b.booking_date DESC, fs.start_time DESC', [userId]);
    return result.rows.map((row) => ({ bookingId: row.id, facility: row.facility, date: row.booking_date, startTime: row.start_time, endTime: row.end_time, status: row.status, createdAt: row.created_at.toISOString(), bookingExpiresAt: new Date(new Date(row.created_at).getTime() + 5 * 60 * 1000).toISOString() }));
  },
  async createCheckinQr(userId, bookingId) {
    await this.releaseExpiredBookings();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const bookingResult = await client.query("SELECT b.id, b.status, b.created_at FROM bookings b WHERE b.id = $1 AND b.user_id = $2 FOR UPDATE", [bookingId, userId]);
      const booking = bookingResult.rows[0];
      if (!booking) throw serviceError('Booking not found.', 404);
      if (booking.status === 'CANCELLED') throw serviceError('Booking has been cancelled.', 409);
      if (booking.status !== 'CONFIRMED') throw serviceError('This booking is not eligible for check-in.', 409);
      const bookingExpiresAt = new Date(new Date(booking.created_at).getTime() + 5 * 60 * 1000);
      if (bookingExpiresAt <= new Date()) throw serviceError('Booking has expired.', 409);
      await client.query("UPDATE booking_checkin_tokens SET status = 'EXPIRED' WHERE booking_id = $1 AND status = 'ACTIVE'", [bookingId]);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Math.min(Date.now() + 5 * 60 * 1000, bookingExpiresAt.getTime()));
      await client.query('INSERT INTO booking_checkin_tokens (id, booking_id, token_hash, expires_at, created_by) VALUES ($1, $2, $3, $4, $5)', [randomUUID(), bookingId, hashToken(token), expiresAt, userId]);
      await client.query('COMMIT');
      return { qrToken: token, expiresAt: expiresAt.toISOString(), validForSeconds: 300 };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async verifyCheckin(adminId, facilityId, qrToken) {
    if (!qrToken || typeof qrToken !== 'string') throw serviceError('Invalid check-in QR.', 400);
    const client = await pool.connect();
    let transactionFinished = false;
    try {
      await client.query('BEGIN');
      const tokenResult = await client.query(`SELECT t.id AS token_id, t.status AS token_status, t.expires_at,
        b.id AS booking_id, b.status AS booking_status, b.facility_id, b.checked_in_at,
        f.name AS facility, u.name AS student_name, b.booking_date, fs.start_time, fs.end_time
        FROM booking_checkin_tokens t JOIN bookings b ON b.id = t.booking_id
        JOIN facilities f ON f.id = b.facility_id JOIN users u ON u.id = b.user_id
        JOIN facility_slots fs ON fs.id = b.slot_id WHERE t.token_hash = $1 FOR UPDATE`, [hashToken(qrToken)]);
      const record = tokenResult.rows[0];
      if (!record) throw serviceError('Invalid check-in QR.', 400);
      if (facilityId && record.facility_id !== facilityId) throw serviceError('This booking belongs to another facility.', 403);
      if (record.booking_status === 'CANCELLED') throw serviceError('Booking has been cancelled.', 409);
      if (record.booking_status === 'CHECKED_IN' || record.checked_in_at) throw serviceError('Booking has already been checked in.', 409);
      if (record.token_status === 'USED') throw serviceError('This check-in QR has already been used.', 409);
      if (record.token_status === 'EXPIRED' || new Date(record.expires_at) <= new Date()) {
        await client.query("UPDATE booking_checkin_tokens SET status = 'EXPIRED' WHERE id = $1 AND status = 'ACTIVE'", [record.token_id]);
        await client.query('COMMIT');
        transactionFinished = true;
        throw serviceError('This check-in QR has expired.', 410);
      }
      if (record.token_status !== 'ACTIVE' || record.booking_status !== 'CONFIRMED') throw serviceError('Invalid check-in QR.', 400);
      const usedAt = new Date();
      await client.query("UPDATE booking_checkin_tokens SET status = 'USED', used_at = $1 WHERE id = $2 AND status = 'ACTIVE'", [usedAt, record.token_id]);
      await client.query("UPDATE bookings SET status = 'CHECKED_IN', checked_in_at = $1, checked_in_by = $2, updated_at = NOW() WHERE id = $3 AND status = 'CONFIRMED'", [usedAt, adminId, record.booking_id]);
      await client.query('COMMIT');
      return { bookingId: record.booking_id, facility: record.facility, studentName: record.student_name, date: record.booking_date, startTime: record.start_time, endTime: record.end_time, checkedInAt: usedAt.toISOString() };
    } catch (error) { if (!transactionFinished) await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
  async verify(userId, bookingId, verificationToken) {
    const result = await pool.query("UPDATE bookings SET verified_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'CONFIRMED' AND verification_token = $3 RETURNING id", [bookingId, userId, verificationToken]);
    if (!result.rowCount) throw Object.assign(new Error('Verification expired or invalid.'), { status: 400 });
    return { bookingId, verified: true };
  },
  async verifyByAdmin(facilityId, bookingId, verificationToken) {
    const result = await pool.query(
      "UPDATE bookings SET verified_at = NOW(), updated_at = NOW() WHERE id = $1 AND facility_id = $2 AND status = 'CONFIRMED' AND verification_token = $3 RETURNING id",
      [bookingId, facilityId, verificationToken]
    );
    if (!result.rowCount) throw Object.assign(new Error('QR verification expired, invalid, or outside your facility.'), { status: 400 });
    return { bookingId, verified: true };
  },
  async verifyByAdminToken(facilityId, verificationToken) {
    const result = await pool.query(
      "UPDATE bookings SET verified_at = NOW(), updated_at = NOW() WHERE ($1::text IS NULL OR facility_id = $1) AND status = 'CONFIRMED' AND verification_token = $2 RETURNING id",
      [facilityId, verificationToken]
    );
    if (!result.rowCount) throw Object.assign(new Error('QR verification expired, invalid, or outside your facility.'), { status: 400 });
    return { bookingId: result.rows[0].id, verified: true };
  },
  async releaseExpiredBookings() {
    await pool.query("WITH expired AS (UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE status = 'CONFIRMED' AND created_at < NOW() - INTERVAL '5 minutes' RETURNING id, slot_id), counts AS (SELECT slot_id, COUNT(*)::int AS total FROM expired GROUP BY slot_id) UPDATE facility_slots fs SET available_capacity = LEAST(fs.capacity, fs.available_capacity + counts.total), status = CASE WHEN fs.status = 'FULL' THEN 'OPEN' ELSE fs.status END, updated_at = NOW() FROM counts WHERE fs.id = counts.slot_id");
    await pool.query("UPDATE booking_checkin_tokens SET status = 'CANCELLED' WHERE status = 'ACTIVE' AND booking_id IN (SELECT id FROM bookings WHERE status = 'CANCELLED')");
    await pool.query("UPDATE booking_checkin_tokens SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at < NOW()");
  },
  async adminBookings(facilityId) {
    if (!pool) return [];
    const result = await pool.query('SELECT b.id, b.user_id, b.booking_date, b.status, f.name AS facility, fs.start_time, fs.end_time FROM bookings b JOIN facilities f ON f.id = b.facility_id JOIN facility_slots fs ON fs.id = b.slot_id WHERE b.facility_id = $1 ORDER BY b.booking_date DESC, fs.start_time DESC', [facilityId]);
    return result.rows.map((row) => ({ bookingId: row.id, userId: row.user_id, facility: row.facility, date: row.booking_date, startTime: row.start_time, endTime: row.end_time, status: row.status }));
  },
  async cancel(userId, bookingId, canManage = false) {
    await this.releaseExpiredBookings();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const query = canManage ? 'SELECT b.*, fs.capacity, fs.available_capacity FROM bookings b JOIN facility_slots fs ON fs.id = b.slot_id WHERE b.id = $1 FOR UPDATE' : 'SELECT b.*, fs.capacity, fs.available_capacity FROM bookings b JOIN facility_slots fs ON fs.id = b.slot_id WHERE b.id = $1 AND b.user_id = $2 FOR UPDATE';
      const result = await client.query(query, canManage ? [bookingId] : [bookingId, userId]);
      const booking = result.rows[0];
      if (!booking) throw Object.assign(new Error('Booking not found.'), { status: 404 });
      if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking is not active.'), { status: 409 });
      await client.query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', ['CANCELLED', bookingId]);
      await client.query("UPDATE booking_checkin_tokens SET status = 'CANCELLED' WHERE booking_id = $1 AND status = 'ACTIVE'", [bookingId]);
      await client.query("UPDATE facility_slots SET available_capacity = LEAST(capacity, available_capacity + 1), status = CASE WHEN status = 'FULL' THEN 'OPEN' ELSE status END, updated_at = NOW() WHERE id = $1", [booking.slot_id]);
      await client.query('COMMIT');
      return { bookingId, status: 'CANCELLED' };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  },
};