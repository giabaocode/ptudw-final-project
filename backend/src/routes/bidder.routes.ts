import { Router } from "express";
import { placeBid, getWatchlist, getMyBids, addToWatchlist, getWonAuctions, rateSeller} from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth";
// Thêm route


const router = Router();

// Route ra giá
router.post("/products/:id/bid", authenticateToken, placeBid);

// Route Watchlist (Thêm & Xem)
router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist); // <-- Route mới thêm

// Route xem bid của tôi
router.get("/my-bids", authenticateToken, getMyBids);
router.get('/won-auctions', authenticateToken, getWonAuctions);
router.post('/products/:id/rate', authenticateToken, rateSeller);




export default router;