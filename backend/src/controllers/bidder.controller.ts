import { Request, Response } from "express";
import * as bidderService from "../services/bidder.service";

export const placeBid = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);

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

export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);

    const result = await bidderService.addToWatchlist(userId, productId);

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

    console.log(`User ${userId} watchlist:`, list);

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

export const getWonAuctions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

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

    const result = await bidderService.rateSeller(
      userId,
      productId,
      score,
      comment
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

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

// --- ĐÃ CHỈNH SỬA HÀM NÀY ---
export const submitPaymentController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);

    // 1. Lấy address từ body
    const { address } = req.body;

    // 2. Lấy file từ Multer
    const file = req.file;

    if (!address) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập địa chỉ nhận hàng" });
    }

    if (!file) {
      return res
        .status(400)
        .json({ message: "Vui lòng upload ảnh minh chứng chuyển khoản" });
    }

    // 3. Lấy đường dẫn file (Cloudinary URL hoặc Local Path)
    const proof = file.path;

    const result = await bidderService.submitPayment(
      userId,
      productId,
      address,
      proof
    );
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const confirmReceiptController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const result = await bidderService.confirmReceipt(userId, productId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const buyNow = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const result = await bidderService.buyNow(userId, productId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getWonAuctionsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const products = await bidderService.getWonAuctions(userId);
    res.json(products);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
