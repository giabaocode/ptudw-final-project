import { Request, Response } from "express";
import * as sellerService from "../services/seller.service";

export const createProduct = async (req: Request, res: Response) => {
  try {
    // 1. [DEBUG] In ra terminal để xem Frontend gửi gì lên
    console.log("📥 [Controller] Body:", req.body);
    console.log("📥 [Controller] Files:", req.files);

    // 2. Kiểm tra Authentication
    // (Đề phòng middleware auth bị lỗi hoặc chưa chạy)
    const user = (req as any).user;
    if (!user || !user.id) {
      console.error(
        "❌ [Controller] Lỗi: Không tìm thấy User ID trong Request"
      );
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập hết hạn hoặc không hợp lệ.",
      });
    }
    const sellerId = Number(user.id);

    // 3. Kiểm tra File ảnh
    const files = req.files as Express.Multer.File[];
    if (!files || files.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng tải lên tối thiểu 3 ảnh minh họa.",
      });
    }

    // Lấy đường dẫn ảnh (Nếu dùng Cloudinary thì là file.path hoặc file.secure_url)
    const imageUrls = files.map((file) => file.path);

    // 4. Xử lý dữ liệu an toàn (Tránh lỗi NaN khi ép kiểu)
    const parseNumber = (value: any) => {
      if (!value || value === "null" || value === "undefined") return 0;
      return Number(value);
    };

    const productData = {
      name: req.body.name,
      description: req.body.description, // Đảm bảo có trường này
      category_id: parseNumber(req.body.category_id),
      start_price: parseNumber(req.body.start_price),
      step_price: parseNumber(req.body.step_price),
      buy_now_price: req.body.buy_now_price
        ? parseNumber(req.body.buy_now_price)
        : null,
      end_at: req.body.end_at, // Chuỗi ISO String từ Frontend
      images: imageUrls,
      allow_new_bidders:
        req.body.allow_new_bidders === "true" ||
        req.body.allow_new_bidders === "on" ||
        req.body.allow_new_bidders === true,
    };

    // 5. Kiểm tra dữ liệu lần cuối trước khi gọi Service
    if (!productData.name || !productData.category_id || !productData.end_at) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (Tên, Danh mục hoặc Thời gian).",
      });
    }

    // 6. Gọi Service
    const result = await sellerService.createProduct(sellerId, productData);

    console.log("✅ [Controller] Tạo thành công SP ID:", result.product_id);
    res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error("❌ [Controller] Lỗi tạo sản phẩm:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi server nội bộ",
    });
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
