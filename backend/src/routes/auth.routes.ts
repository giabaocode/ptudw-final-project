  import { Router } from "express";
  import {
    register,
    login,
    loginGoogle,
    getMe,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    verifyResetOtp,
    updateProfile,
    changePassword,
    getMyFeedback,
  } from "../controllers/auth.controller";
  import { authenticateToken } from "../utils/auth";

  const router = Router();

  router.post("/register", register);
  router.post("/google-login", loginGoogle); // Route mới
  router.post("/login", login);
  router.post("/verify", verifyOtp);
  router.post("/resend-otp", resendOtp);

  router.post("/forgot-password", forgotPassword);
  router.post("/verify-reset-otp", verifyResetOtp);
  router.post("/reset-password", resetPassword);

  router.get("/me", authenticateToken, getMe);

  router.put("/profile", authenticateToken, updateProfile);
  router.put("/change-password", authenticateToken, changePassword);
  router.get("/feedback", authenticateToken, getMyFeedback);

  export default router;
