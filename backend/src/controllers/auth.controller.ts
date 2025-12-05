import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    // Controller nhận req.body và chuyển cho Service
    await authService.registerUser(req.body);
    // (Chúng ta chưa làm OTP nên trả về 201 Created luôn)
    res.status(201).json({ message: "Đăng ký thành công. Vui lòng đăng nhập." });
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

// backend/src/controllers/auth.controller.ts
// Thêm các hàm này:
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updatedUser = await authService.updateProfile(userId, req.body);
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { oldPass, newPass } = req.body;
    const result = await authService.changePassword(userId, oldPass, newPass);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await authService.getMyFeedback(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};