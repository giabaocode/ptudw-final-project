import { Router } from "express";
import {
  register,
  login,
  getMe,
  verifyOtp,
} from "../controllers/auth.controller"; // Import thêm verifyOtp
import { authenticateToken } from "../utils/auth";

const router = Router();

// /api/auth/register
router.post("/register", register);

// /api/auth/login
router.post("/login", login);

router.post("/verify", verifyOtp);

// /api/auth/me (Yêu cầu xác thực)
router.get("/me", authenticateToken, getMe);

export default router;
