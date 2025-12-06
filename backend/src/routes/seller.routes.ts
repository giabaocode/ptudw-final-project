import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  replyQuestion,
} from "../controllers/seller.controller";
import { authenticateToken } from "../utils/auth";
import { addDescription } from "../controllers/seller.controller";

const router = Router();

// Yêu cầu đăng nhập để dùng các tính năng này
router.post("/products", authenticateToken, createProduct);
router.get("/my-products", authenticateToken, getMyProducts);

// ... routes cũ

// --- [THÊM ROUTE MỚI] ---
router.post("/questions/:questionId/reply", authenticateToken, replyQuestion);
// ------------------------
router.post("/products/:productId/description", authenticateToken, addDescription);

export default router;
