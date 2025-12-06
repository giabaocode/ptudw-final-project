import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  replyQuestion,
  addDescription,
  kickBidder,
  rateWinnerController,
  cancelTransactionController
} from "../controllers/seller.controller";
import { authenticateToken } from "../utils/auth";



const router = Router();

// Yêu cầu đăng nhập để dùng các tính năng này
router.post("/products", authenticateToken, createProduct);
router.get("/my-products", authenticateToken, getMyProducts);

// ...
router.post("/products/:id/kick/:bidderId", authenticateToken, kickBidder);
// ... routes cũ

// --- [THÊM ROUTE MỚI] ---
router.post("/questions/:questionId/reply", authenticateToken, replyQuestion);
// ------------------------
router.post("/products/:productId/description", authenticateToken, addDescription);
router.post("/products/:id/rate-winner", authenticateToken, rateWinnerController);
router.post("/products/:id/cancel", authenticateToken, cancelTransactionController);

export default router;
