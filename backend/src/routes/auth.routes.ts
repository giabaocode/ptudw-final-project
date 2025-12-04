import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../utils/auth';
import { updateProfile, changePassword, getMyRatings } from '../controllers/auth.controller';

// ...

const router = Router();

// /api/auth/register
router.post('/register', register);

// /api/auth/login
router.post('/login', login);

// /api/auth/me (Yêu cầu xác thực)
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.get('/my-ratings', authenticateToken, getMyRatings);
export default router;