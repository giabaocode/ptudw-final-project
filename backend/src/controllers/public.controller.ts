import { Request, Response } from 'express';
import * as publicService from '../services/public.service';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await publicService.fetchCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    // Lấy query param cho phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await publicService.fetchProducts(page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await publicService.fetchProductById(id);
    res.json(product);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};