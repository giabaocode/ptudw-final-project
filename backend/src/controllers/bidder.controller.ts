import { Request, Response } from "express";
import * as bidderService from "../services/bidder.service";

export const placeBid = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const productId = parseInt(req.params.id);
    const { amount } = req.body;

    const result = await bidderService.placeBid(userId, productId, amount);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await bidderService.getWatchlist(userId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBids = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await bidderService.getMyBids(userId);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
