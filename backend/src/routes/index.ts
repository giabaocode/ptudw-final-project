import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import sellerRoutes from "./seller.routes"; // Import Mới
import bidderRoutes from "./bidder.routes"; // Import Mới
import adminRoutes from "./admin.routes";
import chatRoutes from "./chat.routes";
// ...

const router = Router();

router.use("/auth", authRoutes);
router.use("/", publicRoutes);
router.use("/seller", sellerRoutes); // Gắn prefix /api/seller
router.use("/bidder", bidderRoutes); // Gắn prefix /api/bidder
router.use("/admin", adminRoutes);
router.use("/chat", chatRoutes);

export default router;
``;
