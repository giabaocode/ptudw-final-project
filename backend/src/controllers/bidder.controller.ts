import { Request, Response } from "express";
import * as bidderService from "../services/bidder.service";

export const placeBid = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    // Nhận thêm max_amount cho tính năng Auto Bid
    const { amount, max_amount } = req.body; 

    const result = await bidderService.placeBid(userId, productId, amount, max_amount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Hàm mới cho Watchlist
export const addToWatchlist = async (req: Request, res: Response) => {
    try {
        // Lấy userId từ token (đã qua middleware auth)
        const userId = (req as any).user.id;
        // Lấy productId từ URL
        const productId = parseInt(req.params.id);

        await bidderService.addToWatchlist(userId, productId);
        
        res.status(200).json({ message: "Sản phẩm đã được thêm vào Watchlist." });
    } catch (error: any) {
        console.error("Watchlist Error:", error);
        res.status(500).json({ message: "Lỗi server khi thêm Watchlist." });
    }
};
// backend/src/controllers/bidder.controller.ts

export const getWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await bidderService.getMyWatchList(userId);
    
    // --- THÊM DÒNG NÀY ĐỂ DEBUG ---
    console.log(`User ${userId} watchlist:`, list); 
    // ------------------------------

    res.json(list);
  } catch (error: any) {
    console.error("Watchlist Error:", error); // Log lỗi nếu có
    res.status(500).json({ message: error.message });
  }
};

export const getMyBids = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await bidderService.getMyBid(userId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};