// Ghi đè (override) định nghĩa Request của Express
declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      user_type: string;
    }
  }
}