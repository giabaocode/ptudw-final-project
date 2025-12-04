import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/email"; // Import mới

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

  // Sinh OTP 6 số
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Hết hạn sau 15 phút
  const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

    /// INSERT kèm OTP và is_verified = FALSE
    await client.query(
      `INSERT INTO Users 
       (full_name, email, password_hash, address, user_type, is_verified, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3, $4, $5, FALSE, $6, $7)`,
      [
        full_name,
        email,
        password_hash,
        address,
        finalUserType,
        otpCode,
        otpExpiresAt,
      ]
    );
    // Gửi email (bất đồng bộ, không cần await để trả response nhanh)
    sendVerificationEmail(email, otpCode);
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

  // --- KIỂM TRA XÁC THỰC ---
  if (!user.is_verified) {
    throw new Error(
      "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để lấy mã OTP."
    );
  }
  // --------------------------

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

// 3. Hàm xác thực OTP (Mới)
export const verifyEmail = async (email: string, otp: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM Users WHERE email = $1", [
      email,
    ]);
    if (res.rows.length === 0) throw new Error("Email không tồn tại.");
    const user = res.rows[0];

    if (user.is_verified)
      return { message: "Tài khoản đã được xác thực trước đó." };

    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác.");

    if (new Date() > new Date(user.otp_expires_at)) {
      throw new Error(
        "Mã OTP đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại mã."
      );
    }

    // Kích hoạt tài khoản & Xóa OTP
    await client.query(
      "UPDATE Users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1",
      [user.id]
    );

    return {
      message: "Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.",
    };
  } finally {
    client.release();
  }
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
