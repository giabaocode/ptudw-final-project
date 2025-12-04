import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import axios from "axios"; // Không cần axios nữa vì không gọi Google

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

export const registerUser = async (userData: any) => {
  const { full_name, email, password, address, user_type, recaptcha_token } =
    userData;

  // --- [LOGIC CAPTCHA GIẢ] ---
  // Chỉ cần kiểm tra có token gửi lên hay không
  if (!recaptcha_token) {
    throw new Error("Vui lòng xác thực Captcha.");
  }

  // Nếu đúng là token giả do Frontend gửi lên -> CHO QUA LUÔN (Bypass)
  if (recaptcha_token === "SKIP_CAPTCHA_TEST_MODE") {
    console.log(">>> [DEV MODE] Bypassing ReCAPTCHA check...");
  } else {
    // Trường hợp nếu sau này bạn muốn dùng thật thì viết logic gọi Google ở đây.
    // Hiện tại nếu token khác chuỗi trên thì báo lỗi luôn cho an toàn.
    throw new Error("Token Captcha không hợp lệ (Test Mode Only).");
  }
  // ---------------------------

  // 2. Logic đăng ký (Giữ nguyên)
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const finalUserType = user_type === "buyer" ? "bidder" : user_type;

  const client = await pool.connect();

  try {
    // Kiểm tra email trùng
    const checkRes = await client.query(
      "SELECT id FROM Users WHERE email = $1",
      [email]
    );
    if (checkRes.rows.length > 0) {
      throw new Error("Email này đã được sử dụng. Vui lòng chọn email khác.");
    }

    // Insert User mới
    await client.query(
      "INSERT INTO Users (full_name, email, password_hash, address, user_type) VALUES ($1, $2, $3, $4, $5)",
      [full_name, email, password_hash, address, finalUserType]
    );
  } catch (error: any) {
    throw error;
  } finally {
    client.release();
  }
};

// 2. Đăng nhập (Giữ nguyên)
export const loginUser = async (email: string, password: string) => {
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }
  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  const payload = {
    id: user.id,
    user_type: user.user_type,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

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

// 3. Lấy thông tin User (Giữ nguyên)
export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT id, full_name, email, user_type, address FROM Users WHERE id = $1",
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Không tìm thấy người dùng.");
  }
  return result.rows[0];
};
