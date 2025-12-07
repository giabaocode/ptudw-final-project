// src/routes/admin.routes.ts
import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  getProducts,
  deleteProduct,
  getUsers,
  deleteUser,
  requestUpgrade,
  getUpgradeRequests,
  approveUpgrade,
  rejectUpgrade,
} from "../controllers/admin.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// Middleware: authenticateToken đảm bảo user đã đăng nhập.
// Lưu ý: Logic check quyền "admin" nên được thêm vào middleware hoặc controller nếu cần chặt chẽ hơn.
// Ở đây tôi giữ simple theo style của bạn.

// 1. Quản lý danh mục
router.get("/categories", authenticateToken, getCategories);
router.post("/categories", authenticateToken, createCategory);
router.delete("/categories/:id", authenticateToken, deleteCategory);

// 2. Quản lý sản phẩm
router.get("/products", authenticateToken, getProducts);
router.delete("/products/:id", authenticateToken, deleteProduct);

// 3. Quản lý người dùng
router.get("/users", authenticateToken, getUsers);
router.delete("/users/:id", authenticateToken, deleteUser);

// 4. Nâng cấp tài khoản (Mục 2.7)
// Route dành cho Bidder gửi yêu cầu
router.post("/request-upgrade", authenticateToken, requestUpgrade);

// Route dành cho Admin duyệt
router.get("/upgrade-requests", authenticateToken, getUpgradeRequests);
router.post("/upgrade-requests/:id/approve", authenticateToken, approveUpgrade);
router.post("/upgrade-requests/:id/reject", authenticateToken, rejectUpgrade);

export default router;
