import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index'; // Import file router tổng

// 1. Tải các biến môi trường từ file .env
dotenv.config();

// 2. Khởi tạo app Express
const app = express();
const PORT = process.env.PORT || 8000;

// 3. Cấu hình Middleware
app.use(cors()); // Cho phép Frontend gọi (quan trọng!)
app.use(express.json()); // Cho phép đọc req.body (quan trọng!)

// 4. Định tuyến (Routing)
// Gắn router tổng vào đường dẫn /api
app.use('/api', apiRoutes);

// 5. Khởi động Server
app.listen(PORT, () => {
  console.log(`✅ Backend server đang chạy tại http://localhost:${PORT}`);
});