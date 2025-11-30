import { Router } from "express";
import { createProduct, getMyProducts } from "../controllers/seller.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// Yêu cầu đăng nhập để dùng các tính năng này
router.post("/products", authenticateToken, createProduct);
router.get("/my-products", authenticateToken, getMyProducts);

export default router;
