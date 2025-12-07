// src/controllers/admin.controller.ts
import { Request, Response } from "express";
import * as adminService from "../services/admin.service";

// --- CATEGORIES ---
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await adminService.getAllCategories();
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, parent_id } = req.body;
    const result = await adminService.createCategory(name, parent_id);
    res.status(201).json({ success: true, category: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminService.deleteCategory(id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- PRODUCTS ---
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await adminService.getAllProducts();
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminService.deleteProduct(id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- USERS ---
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await adminService.getAllUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await adminService.deleteUser(id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- UPGRADE REQUESTS ---
export const requestUpgrade = async (req: Request, res: Response) => {
  try {
    // Lấy ID người dùng từ token (tương tự seller.controller)
    const userId = (req as any).user.id; 
    const result = await adminService.requestUpgrade(userId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUpgradeRequests = async (req: Request, res: Response) => {
  try {
    const requests = await adminService.getPendingUpgradeRequests();
    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveUpgrade = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const requestId = parseInt(req.params.id);
    const result = await adminService.approveUpgradeRequest(requestId, adminId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectUpgrade = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user.id;
    const requestId = parseInt(req.params.id);
    const result = await adminService.rejectUpgradeRequest(requestId, adminId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};