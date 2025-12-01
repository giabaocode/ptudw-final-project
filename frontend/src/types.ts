export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: 'bidder' | 'seller' | 'admin';
  rating_plus?: number;
  rating_minus?: number;
}

export interface Category {
  id: number;
  name: string;
  children?: Category[];
}

export interface DescriptionHistory {
  description_text: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  
  // Giá
  start_price: number;
  current_price: number;
  step_price: number;
  buy_now_price?: number;
  
  // Thời gian
  start_at?: string;
  end_at: string;
  
  // Ảnh & Mô tả
  image?: string;      // Thumbnail
  images?: string[];   // Mảng ảnh (có thể null nếu backend chưa join)
  description?: string;
  description_history?: DescriptionHistory[];

  // Quan hệ
  category_id?: number;
  category?: string;
  
  seller_id?: number;
  seller?: User;      // Frontend mong đợi (có thể thiếu)
  
  current_highest_bidder_id?: number;
  current_highest_bidder?: User;
  
  // Stats
  bid_count?: number;
  
  // UI helpers
  related_products?: Product[];
}

export type Auction = Product;