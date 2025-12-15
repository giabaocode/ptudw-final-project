import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/chat.controller";
import { authenticateToken } from "../utils/auth";

const router = Router();

router.get("/products/:id/messages", authenticateToken, getMessages);
router.post("/products/:id/messages", authenticateToken, sendMessage);

export default router;
