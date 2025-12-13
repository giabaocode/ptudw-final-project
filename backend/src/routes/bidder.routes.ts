import { Router } from "express";
import { 
    // Các hàm cơ bản
    placeBid, 
    getWatchlist, 
    getMyBids, 
    addToWatchlist,
    
    // Hàm từ nhánh test-2 (Thắng cuộc & Đánh giá)
    getWonAuctions, 
    rateSeller,

    // Hàm từ nhánh pagination (Hỏi đáp)
    createQuestion
} from "../controllers/bidder.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

// --- BIDDING ---
router.post("/products/:id/bid", authenticateToken, placeBid);

// --- WATCHLIST ---
router.get("/watchlist", authenticateToken, getWatchlist);
router.post("/products/:id/watchlist", authenticateToken, addToWatchlist);

// --- MY ACTIVITY ---
router.get("/my-bids", authenticateToken, getMyBids);

// --- WON AUCTIONS & RATING (Từ nhánh test-2) ---
router.get('/won-auctions', authenticateToken, getWonAuctions);
router.post('/products/:id/rate', authenticateToken, rateSeller);

// --- QUESTIONS (Từ nhánh pagination) ---
router.post("/products/:id/questions", authenticateToken, createQuestion);

export default router;