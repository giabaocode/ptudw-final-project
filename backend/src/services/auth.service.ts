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

export const updateProfile = async (userId: number, data: any) => {
    const { full_name, email, dob, address } = data;
    const client = await pool.connect();
    try {
        // Nếu đổi email, phải check trùng
        if (email) {
            const check = await client.query(`SELECT id FROM Users WHERE email = $1 AND id != $2`, [email, userId]);
            if (check.rows.length > 0) throw new Error("Email này đã được sử dụng bởi người khác.");
        }

        await client.query(
            `UPDATE Users SET full_name = COALESCE($1, full_name), 
                              email = COALESCE($2, email), 
                              dob = COALESCE($3, dob),
                              address = COALESCE($4, address) 
             WHERE id = $5`,
            [full_name, email, dob, address, userId]
        );
        return { success: true, message: "Cập nhật hồ sơ thành công" };
    } finally {
        client.release();
    }
};

// 2. Đổi mật khẩu (Check mật khẩu cũ)
export const changePassword = async (userId: number, oldPass: string, newPass: string) => {
    const userRes = await pool.query(`SELECT password_hash FROM Users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(oldPass, user.password_hash);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác.");

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPass, salt);

    await pool.query(`UPDATE Users SET password_hash = $1 WHERE id = $2`, [newHash, userId]);
    return { success: true, message: "Đổi mật khẩu thành công." };
};

// 3. Xem điểm đánh giá & nhận xét từ người khác
export const getMyRatings = async (userId: number) => {
    const res = await pool.query(`
        SELECT r.*, u.full_name as rater_name 
        FROM Ratings r
        JOIN Users u ON r.rater_id = u.id
        WHERE r.rated_user_id = $1
        ORDER BY r.created_at DESC
    `, [userId]);
    
    // Lấy tổng điểm
    const scoreRes = await pool.query(`SELECT rating_plus, rating_minus FROM Users WHERE id = $1`, [userId]);
    
    return {
        scores: scoreRes.rows[0],
        reviews: res.rows
    };
};