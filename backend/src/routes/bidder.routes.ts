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
import { authenticateToken } from "../utils/auth";

const router = Router();

router.post("/products/:id/bid", authenticateToken, placeBid);

router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist);

router.get("/my-bids", authenticateToken, getMyBids);

router.get("/won-auctions", authenticateToken, getWonAuctions);
router.post("/products/:id/rate", authenticateToken, rateSeller);

router.post("/products/:id/questions", authenticateToken, createQuestion);

router.post("/products/:id/pay", authenticateToken, submitPaymentController);
router.post(
  "/products/:id/receive",
  authenticateToken,
  confirmReceiptController
);

router.post("/products/:id/buy-now", authenticateToken, buyNow);
router.get("/won-auctions", authenticateToken, getWonAuctionsController);

export default router;
