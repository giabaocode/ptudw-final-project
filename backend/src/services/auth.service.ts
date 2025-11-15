// File: backend/src/services/auth.service.ts
import pool from '../utils/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET';

// Task: API Đăng ký
export const registerUser = async (userData: any) => {
  const { full_name, email, password, address } = userData;

  // 1. Hash mật khẩu
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // 2. Lưu vào DB (Cú pháp query của Postgres)
  try {
    await pool.query(
      "INSERT INTO Users (full_name, email, password_hash, address, user_type) VALUES ($1, $2, $3, $4, 'bidder')",
      [full_name, email, password_hash, address]
    );
    // (Trong dự án thật, bạn sẽ gửi email OTP ở đây)
  } catch (dbError: any) {
    // Mã lỗi 'unique_violation' của Postgres
    if (dbError.code === '23505') { 
      throw new Error('Email này đã được sử dụng.');
    }
    throw new Error('Lỗi khi đăng ký tài khoản.');
  }
};

// Task: API Đăng nhập
export const loginUser = async (email: string, password: string) => {
  // 1. Tìm user (Cách đọc kết quả của 'pg')
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
  if (result.rows.length === 0) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }
  const user = result.rows[0];

  // 2. So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  // 3. Tạo Token JWT
  const payload = {
    id: user.id,
    user_type: user.user_type
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  // 4. Trả về token và thông tin user (đúng như Hợp đồng API)
  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      user_type: user.user_type
    }
  };
};

// Task: API Lấy thông tin User
export const getUserById = async (id: number) => {
  const result = await pool.query("SELECT id, full_name, email, user_type FROM Users WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    throw new Error('Không tìm thấy người dùng.');
  }
  return result.rows[0];
};