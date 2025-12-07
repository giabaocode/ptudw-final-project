import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const result = await sellerService.createProduct(sellerId, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProducts = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const products = await sellerService.getMyProducts(sellerId);
    res.status(200).json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- [THÊM MỚI] ---
export const replyQuestion = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const questionId = parseInt(req.params.questionId);
    const { answer } = req.body;

    if (!answer) throw new Error("Nội dung trả lời không được để trống");

    await sellerService.answerQuestion(sellerId, questionId, answer);
    res.json({ success: true, message: "Trả lời thành công" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
// ------------------
export const addDescription = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const productId = parseInt(req.params.productId);
    const { description } = req.body;

    if (!description) throw new Error("Nội dung mô tả không được để trống");
    await sellerService.appendDescription(sellerId, productId, description);
    res.json({ success: true, message: "Đã thêm mô tả cho sản phẩm" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const kickBidder = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const bidderId = parseInt(req.params.bidderId);

    await sellerService.rejectBidder(sellerId, productId, bidderId);
    res.json({ success: true, message: "Đã từ chối lượt ra giá." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const rateWinnerController = async (req: Request, res: Response) => {
  try {
    const sellerId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const { score, comment } = req.body;

    const result = await sellerService.rateWinner(
      sellerId,
      productId,
      score,
      comment
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelTransactionController = async (
  req: Request,
  res: Response
) => {
  try {
    const sellerId = (req as any).user.id;
    const productId = parseInt(req.params.id);

    const result = await sellerService.cancelTransaction(sellerId, productId);
    res.json({
      ...result,
      message: "Đã hủy giao dịch và trừ điểm người thắng.",
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const confirmShipmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const seller_id = (req as any).user.id;
    const product_id = parseInt(req.params.id);
    const result = await sellerService.confirmShipment(seller_id, product_id);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
