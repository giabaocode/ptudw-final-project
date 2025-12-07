// backend/src/utils/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Lấy header
  const authHeader = req.headers["authorization"];
  console.log("🔹 [DEBUG] Auth Header nhận được:", authHeader);

  // 2. Tách token
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    console.log("❌ [DEBUG] Không tìm thấy Token trong header");
    return res.status(401).json({ message: "Không tìm thấy token" });
  }

  // 3. Kiểm tra biến môi trường (QUAN TRỌNG NHẤT)
  // Nếu dòng này in ra undefined -> Server không đọc được file .env
  console.log("🔹 [DEBUG] JWT_SECRET hiện tại:", process.env.JWT_SECRET); 

  if (!process.env.JWT_SECRET) {
    console.log("❌ [DEBUG] LỖI SERVER: Chưa cấu hình JWT_SECRET");
    return res.status(500).json({ message: "Lỗi cấu hình Server (Thiếu Secret)" });
  }

  // 4. Verify
  jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("❌ [DEBUG] Verify thất bại. Lý do:", err.message);
      // In ra token để xem có bị thừa dấu ngoặc kép không
      console.log("🔹 [DEBUG] Token bị lỗi là:", token); 
      return res.status(403).json({ message: "Token không hợp lệ: " + err.message });
    }

    console.log("✅ [DEBUG] Verify thành công! User ID:", user.id);
    (req as any).user = user;
    next();
  });
};