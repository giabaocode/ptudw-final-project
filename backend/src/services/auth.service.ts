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

// 2. ĐỔI MẬT KHẨU (Yêu cầu mật khẩu cũ)
export const changePassword = async (userId: number, oldPass: string, newPass: string) => {
  const client = await pool.connect();
  try {
    // Lấy mật khẩu hash hiện tại
    const userRes = await client.query("SELECT password_hash FROM Users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) throw new Error("User không tồn tại");

    const currentHash = userRes.rows[0].password_hash;

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPass, currentHash);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác.");

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    // Cập nhật
    await client.query("UPDATE Users SET password_hash = $1 WHERE id = $2", [newHash, userId]);
    
    return { success: true, message: "Đổi mật khẩu thành công." };
  } finally {
    client.release();
  }
};

// 3. XEM ĐÁNH GIÁ MÌNH NHẬN ĐƯỢC
export const getMyFeedback = async (userId: number) => {
  // Lấy các đánh giá mà người khác viết về mình (rated_user_id = userId)
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
