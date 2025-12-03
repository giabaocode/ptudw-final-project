import pool from "../utils/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

// Task: API Đăng ký
export const registerUser = async (userData: any) => {
  const { full_name, email, password, address, user_type } = userData;

  // 1. Hash mật khẩu
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const finalUserType = user_type === "buyer" ? "bidder" : user_type;

  // 2. Dùng pool.connect() để kiểm soát kết nối tốt hơn
  const client = await pool.connect(); 
  
  try {
    // 3. Kiểm tra email trước (để tránh lỗi DB crash)
    const checkRes = await client.query("SELECT id FROM Users WHERE email = $1", [email]);
    if (checkRes.rows.length > 0) {
        throw new Error("Email này đã được sử dụng. Vui lòng chọn email khác.");
    }

    // 4. Insert
    await client.query(
      "INSERT INTO Users (full_name, email, password_hash, address, user_type) VALUES ($1, $2, $3, $4, $5)",
      [full_name, email, password_hash, address, finalUserType]
    );

  } catch (error: any) {
    // Ném lỗi ra Controller xử lý
    throw error; 
  } finally {
    // 5. QUAN TRỌNG NHẤT: Trả kết nối về hồ chứa
    client.release();
  }
};

// Task: API Đăng nhập
export const loginUser = async (email: string, password: string) => {
  // Dùng pool.query cho các lệnh đơn giản (nó tự release connection)
  const result = await pool.query("SELECT * FROM Users WHERE email = $1", [email]);
  
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