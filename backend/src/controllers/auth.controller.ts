import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    // Controller nhận req.body và chuyển cho Service
    await authService.registerUser(req.body);
    // Lưu ý: Nếu bạn đang dùng logic OTP thì message nên là "Vui lòng kiểm tra email"
    // Nếu dùng logic cũ thì là "Vui lòng đăng nhập".
    // Tôi giữ nguyên theo file bạn gửi để an toàn.
    res
      .status(201)
      .json({ message: "Đăng ký thành công. Vui lòng kiểm tra email/đăng nhập." });
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

// =========================================================
// TÍNH NĂNG TỪ NHÁNH TEST-2 (Quản lý Profile)
// =========================================================

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // Lưu ý: Cần đảm bảo authService có hàm updateProfile
    const updatedUser = await authService.updateProfile(userId, req.body);
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const loginGoogle = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    const result = await authService.loginWithGoogle(accessToken);
    res.json(result);
  } catch (error: any) {
    console.error("❌ LỖI BACKEND GOOGLE LOGIN:", error); // THÊM DÒNG NÀY
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { oldPass, newPass } = req.body;
    // Lưu ý: Cần đảm bảo authService có hàm changePassword
    const result = await authService.changePassword(userId, oldPass, newPass);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // Lưu ý: Cần đảm bảo authService có hàm getMyFeedback
    const result = await authService.getMyFeedback(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// =========================================================
// TÍNH NĂNG TỪ NHÁNH PAGINATION (Xác thực & Quên mật khẩu)
// =========================================================

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmail(email, otp);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

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