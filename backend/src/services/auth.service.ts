import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/email";

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

// 1. Đăng ký (Lưu vào Pending_Users)
export const registerUser = async (userData: any) => {
  const { full_name, email, password, address, user_type, recaptcha_token } = userData;

  // Check Captcha (Logic giả như đã chốt)
  if (!recaptcha_token) throw new Error("Vui lòng xác thực Captcha.");
  if (recaptcha_token !== "SKIP_CAPTCHA_TEST_MODE") {
      throw new Error("Token Captcha không hợp lệ (Test Mode Only).");
  }

  const client = await pool.connect(); 
  
  try {
    // Kiểm tra xem email đã tồn tại trong bảng chính USERS chưa
    const checkMain = await client.query("SELECT id FROM Users WHERE email = $1", [email]);
    if (checkMain.rows.length > 0) {
        throw new Error("Email này đã được sử dụng.");
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const finalUserType = user_type === "buyer" ? "bidder" : user_type;

    // Sinh OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Xóa các yêu cầu đăng ký cũ của email này trong Pending_Users (nếu có)
    await client.query("DELETE FROM Pending_Users WHERE email = $1", [email]);

    // INSERT vào bảng PENDING_USERS
    await client.query(
      `INSERT INTO Pending_Users 
       (full_name, email, password_hash, address, user_type, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [full_name, email, password_hash, address, finalUserType, otpCode, otpExpiresAt]
    );

    // Gửi email
    sendVerificationEmail(email, otpCode);

  } catch (error: any) {
    throw error; 
  } finally {
    client.release();
  }
};

// 2. Xác thực OTP (Chuyển từ Pending sang Users)
export const verifyEmail = async (email: string, otp: string) => {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM Pending_Users WHERE email = $1 ORDER BY created_at DESC LIMIT 1", [email]);
        
        if (res.rows.length === 0) {
            const checkUser = await client.query("SELECT id FROM Users WHERE email = $1", [email]);
            if (checkUser.rows.length > 0) {
                return { message: "Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập." };
            }
            throw new Error("Yêu cầu đăng ký không tồn tại hoặc đã hết hạn.");
        }

        const pendingUser = res.rows[0];

        if (pendingUser.otp_code !== otp) throw new Error("Mã OTP không chính xác.");
        if (new Date() > new Date(pendingUser.otp_expires_at)) throw new Error("Mã OTP đã hết hạn.");

        await client.query("BEGIN");

        // Insert vào bảng Users chính thức
        await client.query(
            `INSERT INTO Users (full_name, email, password_hash, address, user_type, is_verified)
             VALUES ($1, $2, $3, $4, $5, TRUE)`,
            [pendingUser.full_name, pendingUser.email, pendingUser.password_hash, pendingUser.address, pendingUser.user_type]
        );

        await client.query("DELETE FROM Pending_Users WHERE email = $1", [email]);
        await client.query("COMMIT");

        return { message: "Xác thực thành công! Tài khoản đã được tạo." };
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
};

// 3. Đăng nhập
export const loginUser = async (email: string, password: string) => {
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
  
  if (result.rows.length === 0) throw new Error("Email hoặc mật khẩu không đúng.");
  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error("Email hoặc mật khẩu không đúng.");

  const payload = { id: user.id, user_type: user.user_type };
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

// 4. Lấy thông tin User
export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT id, full_name, email, user_type, address FROM Users WHERE id = $1",
    [id]
  );
  if (result.rows.length === 0) throw new Error("Không tìm thấy người dùng.");
  return result.rows[0];
};

// =========================================================
// TÍNH NĂNG TỪ NHÁNH TEST-2 (Quản lý Profile)
// =========================================================

// Cập nhật thông tin cá nhân
export const updateProfile = async (userId: number, data: { full_name?: string; email?: string; address?: string }) => {
  const client = await pool.connect();
  try {
    const { full_name, email, address } = data;

    // Nếu đổi email, phải kiểm tra trùng lặp
    if (email) {
      const checkEmail = await client.query(
        "SELECT id FROM Users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (checkEmail.rows.length > 0) {
        throw new Error("Email này đã được sử dụng bởi tài khoản khác.");
      }
    }

    await client.query(
      `UPDATE Users 
       SET full_name = COALESCE($1, full_name), 
           email = COALESCE($2, email),
           address = COALESCE($3, address)
       WHERE id = $4`,
      [full_name, email, address, userId]
    );

    // Trả về thông tin user mới nhất
    const userRes = await client.query("SELECT id, full_name, email, user_type, address FROM Users WHERE id = $1", [userId]);
    return userRes.rows[0];
  } finally {
    client.release();
  }
};

// Đổi mật khẩu
export const changePassword = async (userId: number, oldPass: string, newPass: string) => {
  const client = await pool.connect();
  try {
    const userRes = await client.query("SELECT password_hash FROM Users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) throw new Error("User không tồn tại");

    const currentHash = userRes.rows[0].password_hash;
    const isMatch = await bcrypt.compare(oldPass, currentHash);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác.");

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    await client.query("UPDATE Users SET password_hash = $1 WHERE id = $2", [newHash, userId]);
    
    return { success: true, message: "Đổi mật khẩu thành công." };
  } finally {
    client.release();
  }
};

// Xem đánh giá của mình
export const getMyFeedback = async (userId: number) => {
  const res = await pool.query(`
    SELECT r.score, r.comment, r.created_at,
           u.full_name as rater_name
    FROM Ratings r
    JOIN Users u ON r.rater_id = u.id
    WHERE r.rated_user_id = $1
    ORDER BY r.created_at DESC
  `, [userId]);

  return res.rows;
};

// =========================================================
// TÍNH NĂNG TỪ NHÁNH PAGINATION (OTP & Forgot Password)
// =========================================================

// Gửi lại OTP
export const resendOtp = async (email: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id FROM Pending_Users WHERE email = $1", [email]);

    if (res.rows.length === 0) {
      const userCheck = await client.query("SELECT id FROM Users WHERE email = $1", [email]);
      if (userCheck.rows.length > 0) {
        throw new Error("Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập.");
      }
      throw new Error("Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await client.query(
      "UPDATE Pending_Users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3",
      [otpCode, otpExpiresAt, email]
    );

    sendVerificationEmail(email, otpCode);

    return { message: "Đã gửi lại mã OTP mới thành công." };
  } finally {
    client.release();
  }
};

// Yêu cầu quên mật khẩu
export const requestPasswordReset = async (email: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id FROM Users WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      throw new Error("Email không tồn tại trong hệ thống.");
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await client.query(
      "UPDATE Users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3",
      [otpCode, otpExpiresAt, email]
    );

    sendResetPasswordEmail(email, otpCode);

    return { message: "Mã xác thực đã được gửi đến email của bạn." };
  } finally {
    client.release();
  }
};

// Đặt lại mật khẩu (khi quên)
export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM Users WHERE email = $1", [email]);
    if (res.rows.length === 0) throw new Error("Email không tồn tại.");
    const user = res.rows[0];

    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác.");
    if (new Date() > new Date(user.otp_expires_at)) throw new Error("Mã OTP đã hết hạn.");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await client.query(
      "UPDATE Users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL WHERE id = $2",
      [passwordHash, user.id]
    );

    return { message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại." };
  } finally {
    client.release();
  }
};

// Kiểm tra OTP quên mật khẩu
export const verifyResetOtp = async (email: string, otp: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM Users WHERE email = $1", [email]);
    if (res.rows.length === 0) throw new Error("Email không tồn tại.");
    const user = res.rows[0];

    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác.");
    if (new Date() > new Date(user.otp_expires_at)) throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");

    return { valid: true };
  } finally {
    client.release();
  }
};