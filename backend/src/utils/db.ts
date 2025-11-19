// File: backend/src/utils/db.ts
// Sử dụng 'pg' thay vì 'mysql2'
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE,
});

// Kiểm tra kết nối
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    client.release(); // Trả kết nối về pool
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

export default pool;