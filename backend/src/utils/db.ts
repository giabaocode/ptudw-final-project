import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE,

  ssl: { rejectUnauthorized: false },

  max: 5,

  idleTimeoutMillis: 10000,

  connectionTimeoutMillis: 2000,
});

pool.on("error", (err, client) => {
  console.error(
    "⚠️ Lỗi kết nối Database đột ngột (Idle client error):",
    err.message
  );
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected successfully!");
    client.release();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
})();

export default pool;
