import { Router } from 'express';
import authRoutes from './auth.routes';
import publicRoutes from './public.routes';

const router = Router();

// Gắn các routes con vào
router.use('/auth', authRoutes);
router.use('/', publicRoutes); // Gắn các route public (categories, products) vào gốc /api

export default router;