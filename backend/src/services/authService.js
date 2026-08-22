import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/connection.js';

const developmentUsers = new Map();

const adminFacilityByRole = {
  LIBRARY_ADMIN: 'library',
  CAFETERIA_ADMIN: 'cafeteria',
  VOLLEYBALL_ADMIN: 'volleyball-court',
  GYM_ADMIN: 'gym',
};

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  adminFacilityId: adminFacilityByRole[user.role] || null,
});

export const authService = {
  async signup({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (existing.rowCount > 0) return null;
    } else if (developmentUsers.has(normalizedEmail)) {
      return null;
    }

    const user = { id: randomUUID(), name: name.trim(), email: normalizedEmail, role: 'STUDENT' };
    const passwordHash = await bcrypt.hash(password, 12);
    if (pool) {
      const result = await pool.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role`,
        [user.id, user.name, user.email, passwordHash, user.role]
      );
      return this.getSafeUser(result.rows[0].id);
    }
    developmentUsers.set(user.email, { ...user, passwordHash });
    return this.getSafeUser(user.id);
  },

  async login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    let user;
    if (pool) {
      const result = await pool.query(
        'SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      );
      user = result.rows[0];
      if (user) user = { ...user, passwordHash: user.password_hash };
    } else {
      user = developmentUsers.get(normalizedEmail);
    }
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    return { token: jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' }), user: await this.getSafeUser(user.id) };
  },

  async getSafeUser(userId) {
    if (pool) {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.created_at,
                COUNT(cr.id)::int AS reports_submitted
         FROM users u
         LEFT JOIN crowd_reports cr ON cr.user_id = u.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [userId]
      );
      if (!result.rows[0]) return null;
      const user = result.rows[0];
      return {
        ...safeUser(user),
        reportsSubmitted: user.reports_submitted,
        reputationPoints: user.reports_submitted * 20,
        joinedDate: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    }
    const user = [...developmentUsers.values()].find((candidate) => candidate.id === userId);
    return user ? { ...safeUser(user), reportsSubmitted: 0, reputationPoints: 0, joinedDate: 'Recently' } : null;
  },
};

export function getJwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return process.env.JWT_SECRET;
}