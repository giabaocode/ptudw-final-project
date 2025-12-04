import { Router } from "express";
import {
  placeBid,
  getWatchlist,
  getMyBids,
  addToWatchlist,
} from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth";
import { createQuestion } from "../controllers/bidder.controller";

const router = Router();

// Route ra giá
router.post("/products/:id/bid", authenticateToken, placeBid);

// Route Watchlist (Thêm & Xem)
router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist); // <-- Route mới thêm

// Route xem bid của tôi
router.get("/my-bids", authenticateToken, getMyBids);
router.post("/products/:id/questions", authenticateToken, createQuestion);

export default router;
