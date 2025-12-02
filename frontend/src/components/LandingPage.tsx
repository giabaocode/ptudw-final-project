// File: frontend/src/components/LandingPage.tsx
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProductCard } from "./ProductCard";
import { AuctionCard } from "./AuctionCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { Product, Auction } from "../types";
import { Skeleton } from "./ui/skeleton";

interface LandingPageProps {
  onNavigate: (page: string, id?: number) => void;
  categoryId?: number | null;
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
      setLoading(true);
      try {
        let response;

        if (categoryId) {
          // Logic lọc theo danh mục
          response = await axios.get(`/api/products?category_id=${categoryId}`);
          const allItems = response.data.products;

          // Lọc ra các món đang còn hạn đấu giá (end_at > now)
          // Code này đảm bảo mục "Đang đấu giá" chỉ hiện hàng active
          const auctionItems = allItems.filter(
            (p: any) => new Date(p.end_at) > new Date()
          );

          setAuctions(auctionItems);
          setProducts(allItems); // Mục dưới vẫn hiện tất cả để user dễ tìm
        } else {
          // Logic trang chủ (Top sản phẩm)
          response = await axios.get("/api/products/homepage-tops");
          setAuctions(response.data.top_ending_soon);
          setProducts(response.data.top_highest_price);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Hero Section - Chỉ hiện ở trang chủ */}
      {!categoryId && (
        <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl mb-4 font-bold">
              Discover Amazing Deals
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Shop thousands of products or bid on exclusive auctions
            </p>
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 h-12 bg-white text-gray-900"
                />
              </div>
              <Button className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90 font-medium">
                Search
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Live Auctions Section */}
      {auctions.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {categoryId ? "Đang đấu giá trong danh mục này" : "Live Auctions"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {auctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  id={auction.id}
                  name={auction.name}
                  image={
                    auction.images && auction.images.length > 0
                      ? auction.images[0]
                      : ""
                  }
                  bidCount={auction.bid_count || 0}
                  currentBid={
                    Number(auction.current_price) > 0
                      ? Number(auction.current_price)
                      : Number(auction.start_price)
                  }
                  endTime={new Date(auction.end_at)}
                  onViewDetails={(id) => onNavigate("auction", id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products List Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {categoryId ? "Tất cả sản phẩm" : "Sản phẩm nổi bật"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={
                  Number(product.current_price) > 0
                    ? Number(product.current_price)
                    : Number(product.start_price)
                }
                category={product.category || "General"}
                image={
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : ""
                }
                onViewDetails={(id) => onNavigate("product", id)}
              />
            ))}

            {products.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy sản phẩm nào trong danh mục này.
                </p>
                <Button
                  variant="link"
                  onClick={() => onNavigate("landing")}
                  className="mt-2 text-[#0A84FF]"
                >
                  Quay về trang chủ
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
