import { Router } from "express";
import {
  placeBid,
  getWatchlist,
  getMyBids,
  addToWatchlist,
  getWonAuctions,
  rateSeller,
  createQuestion,
  submitPaymentController,
  confirmReceiptController,
  buyNow,
  getWonAuctionsController,
} from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth"; // Hoặc middlewares/auth tùy cấu trúc
import { upload } from "../utils/upload"; // <--- IMPORT MIDDLEWARE UPLOAD

const router = Router();

router.post("/products/:id/bid", authenticateToken, placeBid);

router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist);

router.get("/my-bids", authenticateToken, getMyBids);

router.get("/won-auctions", authenticateToken, getWonAuctions);
router.post("/products/:id/rate", authenticateToken, rateSeller);

router.post("/products/:id/questions", authenticateToken, createQuestion);

// --- ĐÃ CHỈNH SỬA ROUTE NÀY ---
router.post(
  "/products/:id/pay",
  authenticateToken,
  upload.single("proof"), // <--- THÊM UPLOAD MIDDLEWARE (Key 'proof' khớp với frontend)
  submitPaymentController
);

router.post(
  "/products/:id/receive",
  authenticateToken,
  confirmReceiptController
);

router.post("/products/:id/buy-now", authenticateToken, buyNow);

// Lưu ý: Route này đang bị trùng lặp URL với getWonAuctions ở trên.
// Express sẽ chỉ chạy route nào khai báo trước. Bạn nên xóa 1 trong 2 nếu chúng giống nhau.
// router.get("/won-auctions", authenticateToken, getWonAuctionsController);

export default router;
