import { Router } from "express";
import {
  getCategories,
  getProducts,
  getProductById,
  getHomepageTops,
  searchProducts,
} from "../controllers/public.controller";
// Thêm dòng này
import { getSellerProfile } from "../controllers/public.controller";
import { getBidHistory } from "../controllers/public.controller";

// Route công khai
const router = Router();

router.get("/categories", getCategories);

router.get("/products", getProducts);

router.get("/products/search", searchProducts); // 1. Search
// --- QUAN TRỌNG: homepage-tops PHẢI ĐỨNG TRƯỚC :id ---
router.get("/products/homepage-tops", getHomepageTops);
// ------------------------------------------------------

router.get("/products/:id", getProductById);
router.get("/sellers/:id", getSellerProfile);

router.get("/products/:id/bid-history", getBidHistory);

export default router;
