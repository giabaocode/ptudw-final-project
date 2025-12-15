import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  console.log("🔹 [DEBUG] Auth Header nhận được:", authHeader);

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ [DEBUG] Không tìm thấy Token trong header");
    return res.status(401).json({ message: "Không tìm thấy token" });
  }

  console.log("🔹 [DEBUG] JWT_SECRET hiện tại:", process.env.JWT_SECRET);

  if (!process.env.JWT_SECRET) {
    console.log("❌ [DEBUG] LỖI SERVER: Chưa cấu hình JWT_SECRET");
    return res
      .status(500)
      .json({ message: "Lỗi cấu hình Server (Thiếu Secret)" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("❌ [DEBUG] Verify thất bại. Lý do:", err.message);

      console.log("🔹 [DEBUG] Token bị lỗi là:", token);
      return res
        .status(403)
        .json({ message: "Token không hợp lệ: " + err.message });
    }

    console.log("✅ [DEBUG] Verify thành công! User ID:", user.id);
    (req as any).user = user;
    next();
  });
};
