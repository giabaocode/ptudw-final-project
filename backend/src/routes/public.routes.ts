import { Router } from "express";
import {
  getCategories,
  getProducts,
  getProductById,
  getHomepageTops,
  searchProducts,
  getQuestions,
  getSellerReviews,
} from "../controllers/public.controller";

import { getSellerProfile } from "../controllers/public.controller";
import { getBidHistory } from "../controllers/public.controller";

const router = Router();

router.get("/categories", getCategories);

router.get("/products", getProducts);

router.get("/products/search", searchProducts);

router.get("/products/homepage-tops", getHomepageTops);

router.get("/products/:id", getProductById);
router.get("/sellers/:id", getSellerProfile);

router.get("/products/:id/bid-history", getBidHistory);

router.get("/products/:id/questions", getQuestions);
router.get("/sellers/:id/reviews", getSellerReviews);

export default router;
