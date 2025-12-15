import { Router } from "express";
import {
  createProduct,
  getMyProducts,
  replyQuestion,
  addDescription,
  kickBidder,
  rateWinnerController,
  cancelTransactionController,
  confirmShipmentController,
} from "../controllers/seller.controller";
import { authenticateToken } from "../utils/auth";
import { upload } from "../utils/upload";

const router = Router();

router.post(
  "/products",
  authenticateToken,
  upload.array("images", 10),
  createProduct
);

router.get("/my-products", authenticateToken, getMyProducts);

router.post("/products/:id/kick/:bidderId", authenticateToken, kickBidder);

router.post("/questions/:questionId/reply", authenticateToken, replyQuestion);

router.post(
  "/products/:productId/description",
  authenticateToken,
  addDescription
);

router.post(
  "/products/:id/rate-winner",
  authenticateToken,
  rateWinnerController
);

router.post(
  "/products/:id/cancel",
  authenticateToken,
  cancelTransactionController
);

router.post("/products/:id/ship", authenticateToken, confirmShipmentController);

export default router;
