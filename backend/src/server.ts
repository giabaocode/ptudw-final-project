import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/index";
import { startCronJobs } from "./cron";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

startCronJobs();

app.listen(PORT, () => {
  console.log(`✅ Backend server đang chạy tại http://localhost:${PORT}`);
});

import pool from "./utils/db";

const gracefulShutdown = async () => {
  console.log("🔻 Closing database pool...");
  await pool.end(); // Đóng tất cả kết nối DB
  console.log("🔻 Database pool closed.");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
