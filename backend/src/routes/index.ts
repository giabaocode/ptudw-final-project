import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import sellerRoutes from "./seller.routes"; // Import Mới
import bidderRoutes from "./bidder.routes"; // Import Mới

const router = Router();

router.use("/auth", authRoutes);
router.use("/", publicRoutes);
router.use("/seller", sellerRoutes); // Gắn prefix /api/seller
router.use("/bidder", bidderRoutes); // Gắn prefix /api/bidder

export default router;
