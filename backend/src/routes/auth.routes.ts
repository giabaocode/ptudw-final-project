import { Router } from 'express';
import { 
    // Các hàm cơ bản
    register, 
    login, 
    getMe,
    
    // Các hàm xác thực (Từ nhánh pagination)
    verifyOtp, 
    resendOtp, 
    forgotPassword, 
    resetPassword, 
    verifyResetOtp,

    // Các hàm quản lý profile (Từ nhánh test-2)
    updateProfile,
    changePassword,
    getMyFeedback
} from '../controllers/auth.controller';
import { authenticateToken } from '../utils/auth';

const router = Router();

// --- AUTHENTICATION FLOW ---
router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyOtp);
router.post('/resend-otp', resendOtp);

// --- PASSWORD RESET FLOW ---
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// --- PROTECTED ROUTES (Yêu cầu đăng nhập) ---
router.get('/me', authenticateToken, getMe);

// Quản lý Profile (Từ nhánh test-2)
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.get('/feedback', authenticateToken, getMyFeedback);

export default router;