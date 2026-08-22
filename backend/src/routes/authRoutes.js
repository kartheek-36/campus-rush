import { Router } from 'express';
import { currentUser, login, signup } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, currentUser);

export default router;