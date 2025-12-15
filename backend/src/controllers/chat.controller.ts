import { Request, Response } from "express";
import * as chatService from "../services/chat.service";

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const message = await chatService.getMessages(userId, productId);
    res.json(message);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);

    const { content } = req.body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      throw new Error("Nội dung tin nhắn không được để trống");
    }

    const result = await chatService.sendMessage(userId, productId, content);

    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
