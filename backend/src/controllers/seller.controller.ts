import {Request, Response} from 'express';
import * as sellerService from '../services/seller.service';

export const createProduct = async (req: Request, res: Response) => {
    try{
        const sellerId = (req as any).user.id;
        const result = await sellerService.createProduct(sellerId, req.body);
        res.status(201).json({success: true, ...result});

    }catch(error: any){
        res.status(500).json({success: false, message: error.message});
    }
};

export const getMyProducts = async (req: Request, res: Response) => {
    try{
        const sellerId = (req as any).user.id;
        const products = await sellerService.getMyProducts(sellerId);
        res.status(200).json({success: true, products});    
    }catch(error: any){
        res.status(500).json({success: false, message: error.message});
    }
};