import { Router } from "express";
import authRoutes from "./auth.routes";
import publicRoutes from "./public.routes";
import sellerRoutes from "./seller.routes";
import bidderRoutes from "./bidder.routes";
import adminRoutes from "./admin.routes";
import chatRoutes from "./chat.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", publicRoutes);
router.use("/seller", sellerRoutes);
router.use("/bidder", bidderRoutes);
router.use("/admin", adminRoutes);
router.use("/chat", chatRoutes);

export default router;
``;
