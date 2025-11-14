import { Search, Tag, TrendingUp, Shield, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProductCard } from "./ProductCard";
import { AuctionCard } from "./AuctionCard";
import {useState, useEffect} from "react";
import axios from "axios";
import { Product, Auction } from "../types";
import { Skeleton } from "./ui/skeleton";


interface LandingPageProps {
  onNavigate: (page: string, id?: number) => void;
}

const SkeletonCard = () => (
  <div className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
    <Skeleton className="h-48 w-full rounded-lg" /> {/* Mô phỏng hình ảnh */}
    <Skeleton className="h-4 w-3/4" />             {/* Mô phỏng tên sản phẩm */}
    <Skeleton className="h-4 w-1/2" />             {/* Mô phỏng giá */}
    <Skeleton className="h-9 w-full rounded-md mt-2" /> {/* Mô phỏng nút bấm */}
  </div>
);
export function LandingPage({ onNavigate }: LandingPageProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products/homepage-tops');
        setAuctions(response.data.top_ending_soon);
        setProducts(response.data.top_highest_price);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* 1. MÔ PHỎNG HEADER CHO AUCTIONS */}
          <Skeleton className="h-8 w-72 mb-8" />
          
          {/* 2. MÔ PHỎNG LƯỚI 4 CỘT CHO AUCTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>

          {/* 3. MÔ PHỎNG HEADER CHO PRODUCTS */}
          <Skeleton className="h-8 w-72 mb-8" />

          {/* 4. MÔ PHỎNG LƯỚI 4 CỘT CHO PRODUCTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>

        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl mb-4">Discover Amazing Deals</h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Shop thousands of products or bid on exclusive auctions
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search for products, auctions, or categories..."
                    className="pl-10 h-12 bg-white text-gray-900"
                  />
                </div>
                <Button className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90">
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="text-center">
              <div className="text-3xl mb-1">10K+</div>
              <div className="text-blue-100">Active Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">5K+</div>
              <div className="text-blue-100">Live Auctions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">50K+</div>
              <div className="text-blue-100">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-sm text-gray-600">On orders over $50</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Best Prices</h3>
              <p className="text-sm text-gray-600">Competitive pricing</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-[#0A84FF]" />
              </div>
              <h3 className="text-gray-900 mb-2">Live Bidding</h3>
              <p className="text-sm text-gray-600">Real-time auctions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl text-gray-900 mb-2">Live Auctions</h2>
              <p className="text-gray-600">Don't miss out on these exclusive deals</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => onNavigate("auctions")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {auctions.map((auction) => (
              <AuctionCard
              key={auction.id}
              id={auction.id}
              name={auction.name}
              image={auction.images && auction.images.length > 0 ? auction.images[0] : ""}              
              bidCount={auction.bidCount || 0} // Giả sử auction có bid_count
              // 3. SỬA LỖI XUNG ĐỘT PROP:
              //    Ánh xạ `current_price` (từ API) sang `currentBid` (mà Card cần)
              currentBid={auction.current_price} 
              // 4. SỬA LỖI TYPE:
              //    `auction.endTime` giờ đã tồn tại vì `auctions` là `Auction[]`
              endTime={new Date(auction.end_time)}
              onViewDetails={(id) => onNavigate("auction", id)}
            />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked items just for you</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => onNavigate("shop")}
            >
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                category={product.category || "General"}
                image={product.images && product.images.length > 0 ? product.images[0] : ""} 
                onViewDetails={(id) => onNavigate("product", id)}
/>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#FFD700] to-[#FFC700]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-gray-900 mb-4">
            Start Selling Today
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Join thousands of sellers and reach millions of buyers worldwide
          </p>
          <Button 
            size="lg"
            className="bg-[#0A84FF] hover:bg-[#0A84FF]/90"
            onClick={() => onNavigate("signup")}
          >
            Become a Seller
          </Button>
        </div>
      </section>
    </div>
  );
}
