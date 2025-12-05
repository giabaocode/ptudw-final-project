export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: "bidder" | "seller" | "admin";
  rating_plus?: number;
  rating_minus?: number;
  address: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  children?: Category[];
}

export interface DescriptionHistory {
  description_text: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  start_price: number;
  current_price: number;
  step_price: number;
  buy_now_price?: number; // Đã có
  start_at?: string;
  end_at: string;
  created_at: string; // Thêm trường này để tính sản phẩm mới

  image?: string;
  images?: string[];
  description?: string;
  description_history?: DescriptionHistory[];

  category_id?: number;
  category?: string;

  seller?: User;
  seller_id?: number;
  // Bổ sung bidder_name lấy từ join bảng search
  bidder_name?: string;
  current_highest_bidder_id?: number;

  // --- [THÊM ĐOẠN NÀY ĐỂ HẾT LỖI] ---
  current_highest_bidder?: {
    id: number;
    full_name: string;
    rating_plus?: number;
    rating_minus?: number;
  } | null;
  // ---------------------------------

  bid_count?: number;
  related_products?: Product[];
}

export type Auction = Product;
