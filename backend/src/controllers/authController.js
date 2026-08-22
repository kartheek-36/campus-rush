import { authService } from '../services/authService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !email?.trim() || !emailPattern.test(email) || !password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Name, valid email, and a password of at least 8 characters are required.' });
    }
    const user = await authService.signup({ name, email, password });
    if (!user) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return res.status(201).json({ success: true, message: 'Account created successfully', data: { user } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !emailPattern.test(email) || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const result = await authService.login(email, password);
    if (!result) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) { return next(error); }
};

export const currentUser = async (req, res, next) => {
  try {
    const user = await authService.getSafeUser(req.user.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return res.json({ success: true, data: { user } });
  } catch (error) { return next(error); }
};