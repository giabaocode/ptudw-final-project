import { Router } from "express";
// Import thêm verifyResetOtp
import {
  register,
  login,
  getMe,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
} from "../controllers/auth.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// /api/auth/register
router.post("/register", register);

// /api/auth/login
router.post("/login", login);

router.post("/verify", verifyOtp);
// --- ROUTE MỚI ---
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp); // <--- Route Mới
router.post("/reset-password", resetPassword);
// ----------------

// /api/auth/me (Yêu cầu xác thực)
router.get("/me", authenticateToken, getMe);
router.post("/resend-otp", resendOtp);
export default router;
