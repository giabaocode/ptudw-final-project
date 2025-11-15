import { Router } from 'express';
import { getCategories, getProducts, getProductById } from '../controllers/public.controller';

const router = Router();

// /api/categories
router.get('/categories', getCategories);

// /api/products
router.get('/products', getProducts);

// /api/products/:id
router.get('/products/:id', getProductById);

export default router;