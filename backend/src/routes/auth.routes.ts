import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword, getMyFeedback } from '../controllers/auth.controller';
import { authenticateToken } from '../utils/auth';

const router = Router();

// /api/auth/register
router.post('/register', register);

// /api/auth/login
router.post('/login', login);

// /api/auth/me (Yêu cầu xác thực)
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.get('/feedback', authenticateToken, getMyFeedback);

export default router;