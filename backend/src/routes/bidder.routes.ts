import { Router } from "express";
import { placeBid, getWatchlist, getMyBids, addToWatchlist } from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth";
// Thêm route
import { requestUpgrade } from "../controllers/bidder.controller";
import { getWonList, rateUser } from '../controllers/bidder.controller';

// ...

const router = Router();

// Route ra giá
router.post("/products/:id/bid", authenticateToken, placeBid);

// Route Watchlist (Thêm & Xem)
router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist); // <-- Route mới thêm

// Route xem bid của tôi
router.get("/my-bids", authenticateToken, getMyBids);
router.post("/upgrade-request", authenticateToken, requestUpgrade);
router.get('/won-auctions', authenticateToken, getWonList);
router.post('/products/:id/rate', authenticateToken, rateUser);



export default router;