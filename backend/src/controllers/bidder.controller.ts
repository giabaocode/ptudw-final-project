import { Request, Response } from "express";
import * as bidderService from "../services/bidder.service";

export const placeBid = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    // Nhận thêm max_amount cho tính năng Auto Bid
    const { amount, max_amount } = req.body;

    const result = await bidderService.placeBid(
      userId,
      productId,
      amount,
      max_amount
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Hàm mới cho Watchlist (Gộp logic của cả 2 nhánh)
export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);

    const result = await bidderService.addToWatchlist(userId, productId);

    // Kiểm tra nếu service trả về success: false (Logic từ nhánh test-2)
    if (result && (result as any).success === false) {
        return res.status(409).json({ message: result.message });
    }

    res.status(200).json({ message: "Sản phẩm đã được thêm vào Watchlist." });
  } catch (error: any) {
    console.error("Watchlist Error:", error);
    res.status(500).json({ message: "Lỗi server khi thêm Watchlist." });
  }
};

export const getWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await bidderService.getMyWatchList(userId);

    // --- DEBUG ---
    console.log(`User ${userId} watchlist:`, list);
    // -------------

    res.json(list);
  } catch (error: any) {
    console.error("Watchlist Error:", error);
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

// ========================================================
// TÍNH NĂNG TỪ NHÁNH TEST-2 (Thắng cuộc & Đánh giá)
// ========================================================

export const getWonAuctions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // Lưu ý: Cần đảm bảo bidderService có hàm getWonAuctions
    const result = await bidderService.getWonAuctions(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rateSeller = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const { score, comment } = req.body;
    // Lưu ý: Cần đảm bảo bidderService có hàm rateSeller
    const result = await bidderService.rateSeller(userId, productId, score, comment);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ========================================================
// TÍNH NĂNG TỪ NHÁNH PAGINATION (Hỏi đáp)
// ========================================================

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const { question } = req.body;

    if (!question) throw new Error("Nội dung câu hỏi không được để trống");

    await bidderService.postQuestion(userId, productId, question);
    res.status(201).json({ message: "Gửi câu hỏi thành công" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};