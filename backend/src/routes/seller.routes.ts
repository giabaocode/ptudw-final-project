import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  replyQuestion,
} from "../controllers/seller.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// Yêu cầu đăng nhập để dùng các tính năng này
router.post("/products", authenticateToken, createProduct);
router.get("/my-products", authenticateToken, getMyProducts);

// ... routes cũ

// --- [THÊM ROUTE MỚI] ---
router.post("/questions/:questionId/reply", authenticateToken, replyQuestion);
// ------------------------

export default router;
