import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../services/authService.js';

export const authMiddleware = (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload !== 'object' || !payload.userId || !payload.role) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = { id: payload.userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) return res.status(403).json({ success: false, message: 'Access denied.' });
  return next();
};

export const optionalAuthMiddleware = (req, _res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, getJwtSecret());
      if (typeof payload === 'object' && payload.userId && payload.role) {
        req.user = { id: payload.userId, role: payload.role };
      }
    } catch {
      // Public callers may submit reports without an account.
    }
  }
  next();
};