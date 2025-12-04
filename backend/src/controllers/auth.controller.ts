import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    // Controller nhận req.body và chuyển cho Service
    await authService.registerUser(req.body);
    // (Chúng ta chưa làm OTP nên trả về 201 Created luôn)
    res
      .status(201)
      .json({ message: "Đăng ký thành công. Vui lòng đăng nhập." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // req.user được gắn từ middleware authenticateToken
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Token không hợp lệ." });
    }
    const user = await authService.getUserById(userId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmail(email, otp);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
// --- [THÊM MỚI] ---
export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Email là bắt buộc.");

    const result = await authService.resendOtp(email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
// ------------------
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Vui lòng nhập email.");

    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) throw new Error("Thiếu thông tin.");

    const result = await authService.resetPassword(email, otp, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new Error("Thiếu thông tin.");

    await authService.verifyResetOtp(email, otp);
    res.json({ message: "OTP hợp lệ." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
