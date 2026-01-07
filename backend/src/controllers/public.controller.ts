import { Request, Response } from "express";
import * as publicService from "../services/public.service";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await publicService.fetchCategories();
    res.json(categories);
  } catch (error: any) {
    console.error(">>> [ERROR] getCategories:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const categoryId = req.query.category_id
      ? parseInt(req.query.category_id as string)
      : undefined;

    console.log(
      `[Controller] Nhận yêu cầu lấy sản phẩm. CategoryID: ${categoryId}`
    );

    const result = await publicService.fetchProducts(page, limit, categoryId);
    res.json(result);
  } catch (error: any) {
    console.error(">>> [ERROR] Lỗi tại getProducts:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await publicService.fetchProductById(id);
    res.json(product);
  } catch (error: any) {
    console.error(">>> [ERROR] getProductById:", error);
    res.status(404).json({ message: error.message });
  }
};

export const getHomepageTops = async (req: Request, res: Response) => {
  try {
    const result = await publicService.fetchHomepageTops();
    res.json(result);
  } catch (error: any) {
    console.error(">>> [ERROR] getHomepageTops:", error);
    res.status(500).json({ message: error.message });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || "default";

    if (!keyword)
      return res.json({
        products: [],
        pagination: { total_pages: 0, current_page: 1 },
      });

    console.log(`[Search] Keyword: ${keyword}, Page: ${page}, Sort: ${sort}`);

    const result = await publicService.searchProducts(
      keyword,
      page,
      limit,
      sort
    );
    res.json(result);
  } catch (error: any) {
    console.error(">>> [ERROR] searchProducts:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getSellerProfile = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = await publicService.getSellerInfo(id);
    res.json(data);
  } catch (error: any) {
    console.error(">>> [ERROR] getSellerProfile:", error);
    res.status(404).json({ message: error.message });
  }
};

export const getBidHistory = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const history = await publicService.getBidHistory(productId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const questions = await publicService.getProductQuestions(productId);
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSellerReviews = async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const reviews = await publicService.getSellerReviews(sellerId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// --- Dán thêm vào cuối file ---

export const getUserFeedbackController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid User ID" });
    }
    const feedback = await publicService.getUserFeedback(userId);
    res.json(feedback);
  } catch (error: any) {
    console.error(">>> [ERROR] getUserFeedback:", error);
    res.status(500).json({ message: error.message });
  }
};