// File: frontend/src/components/LandingPage.tsx
import { Search, Tag, TrendingUp, Shield, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProductCard } from "./ProductCard";
import { AuctionCard } from "./AuctionCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { Product, Auction } from "../types";
import { Skeleton } from "./ui/skeleton"; // Đảm bảo đã có file này

interface LandingPageProps {
  onNavigate: (page: string, id?: number) => void;
  categoryId?: number | null; // Nhận thêm categoryId để lọc
}

const SkeletonCard = () => (
  <div className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-9 w-full rounded-md mt-2" />
  </div>
);

export function LandingPage({ onNavigate, categoryId }: LandingPageProps) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response;
        
        // Logic lọc theo danh mục (nếu có)
        if (categoryId) {
            // Gọi API lọc (Backend cần hỗ trợ query param này)
            response = await axios.get(`/api/products?category_id=${categoryId}`);
            setProducts(response.data.products);
            setAuctions([]); // Tạm thời ẩn auctions khi lọc danh mục
        } else {
            // Gọi API trang chủ
            response = await axios.get('/api/products/homepage-tops');
            setAuctions(response.data.top_ending_soon);
            setProducts(response.data.top_highest_price);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [categoryId]); // Chạy lại khi categoryId thay đổi

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Hero Section (Chỉ hiện ở trang chủ, ẩn khi đang xem danh mục) */}
      {!categoryId && (
          <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl mb-4">Discover Amazing Deals</h1>
                <p className="text-lg md:text-xl text-blue-100 mb-8">
                  Shop thousands of products or bid on exclusive auctions
                </p>
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input placeholder="Search..." className="pl-10 h-12 bg-white text-gray-900" />
                    </div>
                    <Button className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90">Search</Button>
                  </div>
                </div>
              </div>
              {/* Stats... */}
            </div>
          </section>
      )}

      {/* Live Auctions */}
      {auctions.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl text-gray-900 mb-2">Live Auctions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {auctions.map((auction) => (
                <AuctionCard
                    key={auction.id}
                    id={auction.id}
                    name={auction.name}
                    // SỬA: Lấy ảnh đầu tiên hoặc chuỗi rỗng
                    image={auction.images && auction.images.length > 0 ? auction.images[0] : ""}
                    bidCount={auction.bid_count || 0}
                    currentBid={auction.current_price} 
                    endTime={new Date(auction.end_at)}
                    onViewDetails={(id) => onNavigate("auction", id)}
                />
                ))}
            </div>
            </div>
        </section>
      )}

      {/* Products */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl text-gray-900 mb-2">
                {categoryId ? "Category Products" : "Featured Products"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.current_price || product.start_price}
                category={product.category || "General"}
                // SỬA: Lấy ảnh đầu tiên
                image={product.images && product.images.length > 0 ? product.images[0] : ""} 
                onViewDetails={(id) => onNavigate("product", id)}
              />
            ))}
            {products.length === 0 && <p>Không tìm thấy sản phẩm nào.</p>}
          </div>
        </div>
      </section>

    </div>
  );
}
