// File: frontend/src/components/LandingPage.tsx
import { Search, Clock, TrendingUp, DollarSign } from "lucide-react";
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
  // --- STATE CHO TRANG CHỦ (HOMEPAGE) ---
  const [topEndingSoon, setTopEndingSoon] = useState<Auction[]>([]);
  const [topMostBids, setTopMostBids] = useState<Auction[]>([]);
  const [topHighestPrice, setTopHighestPrice] = useState<Product[]>([]);

  // --- STATE CHO TRANG DANH MỤC (CATEGORY) ---
  const [categoryAuctions, setCategoryAuctions] = useState<Auction[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;

        if (categoryId) {
          // === LOGIC KHI XEM DANH MỤC ===
          console.log("Đang tải danh mục ID:", categoryId);
          response = await axios.get(`/api/products?category_id=${categoryId}`);
          const allItems = response.data.products;

          // Lọc ra các món đang còn hạn đấu giá (end_at > now)
          const activeAuctions = allItems.filter(
            (p: any) => new Date(p.end_at) > new Date()
          );

          setCategoryAuctions(activeAuctions);
          setCategoryProducts(allItems);

          // Reset state trang chủ
          setTopEndingSoon([]);
          setTopMostBids([]);
          setTopHighestPrice([]);
        } else {
          // === LOGIC KHI Ở TRANG CHỦ ===
          response = await axios.get("/api/products/homepage-tops");
          const data = response.data;

          setTopEndingSoon(data.top_ending_soon);
          setTopMostBids(data.top_most_bids);
          setTopHighestPrice(data.top_highest_price);

          // Reset state danh mục
          setCategoryAuctions([]);
          setCategoryProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]); // Chạy lại khi categoryId thay đổi

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
      {/* 1. HERO SECTION (Chỉ hiện ở Trang chủ) */}
      {!categoryId && (
        <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4 mb-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl mb-4 font-bold">
              Sàn Đấu Giá Trực Tuyến
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Săn hàng độc - Giá cực sốc - Uy tín hàng đầu
            </p>
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 h-12 bg-white text-gray-900"
                />
              </div>
              <Button className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90 font-medium">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 2. NỘI DUNG TRANG CHỦ (3 MỤC TOP) */}
      {!categoryId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
          {/* Top 5 Sắp kết thúc */}
          {topEndingSoon.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-8">
                {" "}
                {/* Đổi thành mb-12 (48px) cho an toàn */}
                <Clock className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sắp Kết Thúc
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topEndingSoon.map((auction) => (
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
            </section>
          )}

          {/* Top 5 Nhiều lượt ra giá nhất */}
          {topMostBids.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-8 mt-8">
                {" "}
                {/* Đổi thành mb-12 */}
                <TrendingUp className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sôi Động Nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topMostBids.map((auction) => (
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
            </section>
          )}

          {/* Top 5 Giá cao nhất */}
          {topHighestPrice.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-8 mt-8">
                {" "}
                {/* Đổi thành mb-12 */}
                <DollarSign className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Top Giá Cao Nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topHighestPrice.map((product) => (
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
              </div>
            </section>
          )}
        </div>
      )}

      {/* 3. NỘI DUNG KHI XEM DANH MỤC (Auctions + Products) */}
      {categoryId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16 pt-8">
          {/* Mục: Đang đấu giá (chỉ hiện nếu có) */}
          {categoryAuctions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-12">
                {" "}
                {/* Đổi thành mb-12 */}
                <Clock className="h-6 w-6 text-[#FFD700]" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Đang đấu giá trong danh mục này
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryAuctions.map((auction) => (
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
            </section>
          )}

          {/* Mục: Tất cả sản phẩm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-12">
              {" "}
              {/* Đổi thành mb-12 */}
              Tất cả sản phẩm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categoryProducts.map((product) => (
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

              {categoryProducts.length === 0 && (
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
          </section>
        </div>
      )}
    </div>
  );
}
