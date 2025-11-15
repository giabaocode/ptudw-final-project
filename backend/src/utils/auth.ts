import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET';

// Middleware (phần mềm trung gian) để kiểm tra token
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  // Token sẽ có dạng "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // 401 Unauthorized - Không có quyền
    return res.status(401).json({ message: "Token không được cung cấp." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // 403 Forbidden - Token không hợp lệ
      return res.status(403).json({ message: "Token không hợp lệ." });
    }
    
    // Gắn thông tin user (đã giải mã từ token) vào request
    req.user = user;
    next(); // Cho phép đi tiếp
  });
};