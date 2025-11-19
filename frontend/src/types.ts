export interface User{
    id: number;
    fullName: string;
    email: string;
    user_type: 'bidder' | 'seller' | 'admin';
    rating_plus ?: number;
    rating_minus ?: number;
}

export interface Category{
    id: number;
    name: string;
    children: Category[];
}


export interface Product{
    id: number;
    name: string;
    price: number;
    current_price: number;
    buy_now_price?: number;
    starting_price: number;
    image_url: string;
    images: string[];
    category: string;
    description_history ?: {
        description_text: string;
        created_at: string;
    }[];
    seller?: User;
    current_highest_bidder?: User;
    related_products?: Product[];
}

export interface Auction extends Product{
    end_time: string;
    bidCount: number;
    currentBid: number;
}   