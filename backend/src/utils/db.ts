// File: backend/src/utils/db.ts
// Sử dụng 'pg' thay vì 'mysql2'
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE,

  // --- [QUAN TRỌNG: CẤU HÌNH LẠI ĐOẠN NÀY] ---
  ssl: { rejectUnauthorized: false },

  // Giảm max từ 20 xuống 5 (hoặc 3).
  // Lý do: Supabase Free chỉ chịu được ít kết nối trực tiếp.
  // Để 5 là đủ cho 1 người test.
  max: 5,

  // Thời gian tối đa giữ kết nối rảnh rỗi (giảm xuống 10s)
  idleTimeoutMillis: 10000,

  // Thời gian tối đa chờ để lấy được kết nối (giảm xuống 2s)
  connectionTimeoutMillis: 2000,
  // ---------------------------------------------
});
// --- [ĐOẠN CODE CỨU MẠNG] ---
// Bắt lỗi kết nối ngầm để tránh sập App (Crash)
pool.on("error", (err, client) => {
  console.error(
    "⚠️ Lỗi kết nối Database đột ngột (Idle client error):",
    err.message
  );
  // Không throw error ở đây để server vẫn sống
});

// Kiểm tra kết nối
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully!");
    client.release(); // Trả kết nối về pool
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
})();

export default pool;
