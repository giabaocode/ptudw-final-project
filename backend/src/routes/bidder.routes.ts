import { Router } from "express";
import {
  placeBid,
  getWatchlist,
  getMyBids,
} from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// :id là product_id
router.post("/products/:id/bid", authenticateToken, placeBid);
router.get("/watchlist", authenticateToken, getWatchlist);
router.get("/my-bids", authenticateToken, getMyBids);

export default router;
