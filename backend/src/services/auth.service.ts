import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/email";

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

// 1. Đăng ký (Lưu vào Pending_Users)
export const registerUser = async (userData: any) => {
  const { full_name, email, password, address, user_type, recaptcha_token } =
    userData;

  // Check Captcha (Logic giả như đã chốt)
  if (!recaptcha_token) throw new Error("Vui lòng xác thực Captcha.");
  if (recaptcha_token !== "SKIP_CAPTCHA_TEST_MODE") {
    throw new Error("Token Captcha không hợp lệ (Test Mode Only).");
  }

  const client = await pool.connect();

  try {
    // Kiểm tra xem email đã tồn tại trong bảng chính USERS chưa
    const checkMain = await client.query(
      "SELECT id FROM Users WHERE email = $1",
      [email]
    );
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

    // Xóa các yêu cầu đăng ký cũ của email này trong Pending_Users (nếu có) để tránh rác
    await client.query("DELETE FROM Pending_Users WHERE email = $1", [email]);

    // INSERT vào bảng PENDING_USERS (Chưa vào Users chính)
    await client.query(
      `INSERT INTO Pending_Users 
       (full_name, email, password_hash, address, user_type, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
    // Tìm trong bảng PENDING
    const res = await client.query(
      "SELECT * FROM Pending_Users WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
      [email]
    );

    if (res.rows.length === 0) {
      // Nếu không thấy trong Pending, check xem đã có trong Users chưa (trường hợp user refresh trang verify)
      const checkUser = await client.query(
        "SELECT id FROM Users WHERE email = $1",
        [email]
      );
      if (checkUser.rows.length > 0) {
        return {
          message:
            "Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập.",
        };
      }
      throw new Error("Yêu cầu đăng ký không tồn tại hoặc đã hết hạn.");
    }

    const pendingUser = res.rows[0];

    // Kiểm tra OTP
    if (pendingUser.otp_code !== otp) {
      throw new Error("Mã OTP không chính xác.");
    }

    if (new Date() > new Date(pendingUser.otp_expires_at)) {
      throw new Error("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
    }

    // BẮT ĐẦU TRANSACTION: Chuyển dữ liệu
    await client.query("BEGIN");

    // 1. Insert vào bảng Users chính thức (Đã verified)
    await client.query(
      `INSERT INTO Users (full_name, email, password_hash, address, user_type, is_verified)
             VALUES ($1, $2, $3, $4, $5, TRUE)`,
      [
        pendingUser.full_name,
        pendingUser.email,
        pendingUser.password_hash,
        pendingUser.address,
        pendingUser.user_type,
      ]
    );

    // 2. Xóa khỏi bảng Pending
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

// 3. Đăng nhập (Giữ nguyên - chỉ bỏ check is_verified vì vào được bảng Users là đã verified rồi)
export const loginUser = async (email: string, password: string) => {
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0)
    throw new Error("Email hoặc mật khẩu không đúng.");
  const user = result.rows[0];

  // Nếu bạn muốn chắc chắn, có thể giữ dòng này, nhưng theo logic mới thì user trong bảng Users luôn là verified
  if (user.is_verified === false) {
    throw new Error("Tài khoản chưa được xác thực.");
  }

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

export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT id, full_name, email, user_type, address FROM Users WHERE id = $1",
    [id]
  );
  if (result.rows.length === 0) throw new Error("Không tìm thấy người dùng.");
  return result.rows[0];
};
// --- [THÊM MỚI] Gửi lại OTP ---
export const resendOtp = async (email: string) => {
  const client = await pool.connect();
  try {
    // 1. Kiểm tra trong bảng Pending (Đăng ký dở dang)
    const res = await client.query(
      "SELECT id FROM Pending_Users WHERE email = $1",
      [email]
    );

    if (res.rows.length === 0) {
      // Nếu không thấy trong Pending, check xem đã đăng ký thành công chưa
      const userCheck = await client.query(
        "SELECT id FROM Users WHERE email = $1",
        [email]
      );
      if (userCheck.rows.length > 0) {
        throw new Error(
          "Tài khoản này đã được xác thực trước đó. Vui lòng đăng nhập."
        );
      }
      throw new Error("Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.");
    }

    // 2. Sinh OTP mới
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút nữa

    // 3. Cập nhật vào DB
    await client.query(
      "UPDATE Pending_Users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3",
      [otpCode, otpExpiresAt, email]
    );

    // 4. Gửi email
    sendVerificationEmail(email, otpCode);

    return { message: "Đã gửi lại mã OTP mới thành công." };
  } finally {
    client.release();
  }
};
// ------------------------------

export const requestPasswordReset = async (email: string) => {
  const client = await pool.connect();
  try {
    // Kiểm tra email có tồn tại không
    const res = await client.query("SELECT id FROM Users WHERE email = $1", [
      email,
    ]);
    if (res.rows.length === 0) {
      throw new Error("Email không tồn tại trong hệ thống.");
    }

    // Sinh OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    // Cập nhật OTP vào bảng Users (cho user hiện tại)
    await client.query(
      "UPDATE Users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3",
      [otpCode, otpExpiresAt, email]
    );

    // Gửi mail
    sendResetPasswordEmail(email, otpCode);

    return { message: "Mã xác thực đã được gửi đến email của bạn." };
  } finally {
    client.release();
  }
};

// --- [THÊM MỚI] 2. Đặt lại mật khẩu ---
export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM Users WHERE email = $1", [
      email,
    ]);
    if (res.rows.length === 0) throw new Error("Email không tồn tại.");
    const user = res.rows[0];

    // Kiểm tra OTP
    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác.");
    if (new Date() > new Date(user.otp_expires_at))
      throw new Error("Mã OTP đã hết hạn.");

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa OTP
    await client.query(
      "UPDATE Users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL WHERE id = $2",
      [passwordHash, user.id]
    );

    return { message: "Đổi mật khẩu thành công! Vui lòng đăng nhập lại." };
  } finally {
    client.release();
  }
};
export const verifyResetOtp = async (email: string, otp: string) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM Users WHERE email = $1", [
      email,
    ]);
    if (res.rows.length === 0) throw new Error("Email không tồn tại.");
    const user = res.rows[0];

    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác.");
    if (new Date() > new Date(user.otp_expires_at))
      throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");

    return { valid: true };
  } finally {
    client.release();
  }
};
