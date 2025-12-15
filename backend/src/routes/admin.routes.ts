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

router.get("/categories", authenticateToken, getCategories);
router.post("/categories", authenticateToken, createCategory);
router.delete("/categories/:id", authenticateToken, deleteCategory);

router.get("/products", authenticateToken, getProducts);
router.delete("/products/:id", authenticateToken, deleteProduct);

router.get("/users", authenticateToken, getUsers);
router.delete("/users/:id", authenticateToken, deleteUser);

router.post("/request-upgrade", authenticateToken, requestUpgrade);

router.get("/upgrade-requests", authenticateToken, getUpgradeRequests);
router.post("/upgrade-requests/:id/approve", authenticateToken, approveUpgrade);
router.post("/upgrade-requests/:id/reject", authenticateToken, rejectUpgrade);

export default router;
