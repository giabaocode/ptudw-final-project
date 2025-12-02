import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

// Task: API Đăng ký
export const registerUser = async (userData: any) => {
  // 1. Lấy thêm user_type từ userData
  const { full_name, email, password, address, user_type } = userData;

  // 2. Hash mật khẩu
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // 3. Chuẩn hóa user_type (Frontend gửi 'buyer' nhưng DB có thể cần 'bidder')
  // Nếu frontend gửi 'buyer', ta đổi thành 'bidder', ngược lại giữ nguyên (vd: 'seller')
  // Lưu ý: Đảm bảo DB enum của bạn hỗ trợ giá trị này
  const finalUserType = user_type === "buyer" ? "bidder" : user_type;

  // 4. Lưu vào DB (Cú pháp query của Postgres)
  try {
    // Sửa câu Query: Thay 'bidder' cứng bằng tham số $5
    await pool.query(
      "INSERT INTO Users (full_name, email, password_hash, address, user_type) VALUES ($1, $2, $3, $4, $5)",
      [full_name, email, password_hash, address, finalUserType] // Truyền biến vào đây
    );
    // (Trong dự án thật, bạn sẽ gửi email OTP ở đây)
  } catch (dbError: any) {
    // Mã lỗi 'unique_violation' của Postgres
    if (dbError.code === "23505") {
      throw new Error("Email này đã được sử dụng.");
    }
    console.error("Register Error:", dbError);
    throw new Error("Lỗi khi đăng ký tài khoản.");
  }
};

// Task: API Đăng nhập
export const loginUser = async (email: string, password: string) => {
  // 1. Tìm user (Cách đọc kết quả của 'pg')
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [
    email,
  ]);
  if (result.rows.length === 0) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }
  const user = result.rows[0];

  // 2. So sánh mật khẩu
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  // 3. Tạo Token JWT
  const payload = {
    id: user.id,
    user_type: user.user_type,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  // 4. Trả về token và thông tin user (đúng như Hợp đồng API)
  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      user_type: user.user_type,
    },
  };
};

// Task: API Lấy thông tin User
export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT id, full_name, email, user_type FROM Users WHERE id = $1",
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Không tìm thấy người dùng.");
  }
  return result.rows[0];
};
