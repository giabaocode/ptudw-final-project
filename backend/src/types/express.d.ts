import * as express from 'express';

// Khai báo mở rộng Global cho Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        user_type: string;
      };
    }
  }
}