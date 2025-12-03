import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { ProductCard } from "./ProductCard";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Product } from "../types";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner"; // Thêm toast để biết lỗi gì

interface ProfilePageProps {
  onNavigate: (page: string, id?: number) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, token } = useAuth();
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [myBids, setMyBids] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
        setLoading(true);
        
        // 1. Lấy Watchlist (Chạy độc lập)
        try {
            const resWatch = await axios.get("/api/bidder/watchlist", { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            console.log("Watchlist Frontend nhận được:", resWatch.data); // Debug
            setWatchlist(resWatch.data);
        } catch (error) {
            console.error("Lỗi tải Watchlist:", error);
        }

        // 2. Lấy Bid History (Chạy độc lập)
        try {
            const resBids = await axios.get("/api/bidder/my-bids", { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setMyBids(resBids.data);
        } catch (error) {
            console.warn("Lỗi tải My Bids (Có thể backend chưa xong):", error);
        }

        // 3. Lấy Sản phẩm seller (Nếu là seller)
    
        if (user?.user_type === 'seller') {
          try {
              const resProds = await axios.get("/api/seller/my-products", { 
                  headers: { Authorization: `Bearer ${token}` } 
              });
              // SỬA LẠI: Lấy thuộc tính .products từ object trả về
              setMyProducts(resProds.data.products); 
          } catch (error) {
              console.warn("Lỗi tải My Products:", error);
        }
}

        setLoading(false);
    };

    fetchData();
  }, [token, user?.user_type]);

  if (loading) {
      return (
          <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
              <div className="max-w-6xl mx-auto">
                  <Skeleton className="h-12 w-1/3 mb-8" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Skeleton className="h-64 w-full" />
                      <Skeleton className="h-64 w-full" />
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 font-bold">Xin chào, {user?.full_name}</h1>
            <p className="text-gray-500">Quản lý hoạt động cá nhân</p>
          </div>
          
          {user?.user_type === 'seller' && (
            <Button onClick={() => onNavigate("post-product")} className="bg-[#0A84FF] hover:bg-[#0A84FF]/90">
                + Đăng bán sản phẩm
            </Button>
          )}
        </div>

        <Tabs defaultValue="watchlist" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm inline-flex h-auto">
            <TabsTrigger value="watchlist" className="py-2 px-4">Đang theo dõi ({watchlist.length})</TabsTrigger>
            <TabsTrigger value="bids" className="py-2 px-4">Đang đấu giá ({myBids.length})</TabsTrigger>
            {user?.user_type === 'seller' && (
                <TabsTrigger value="my-products" className="py-2 px-4">Sản phẩm của tôi ({myProducts.length})</TabsTrigger>
            )}
          </TabsList>

          {/* TAB WATCHLIST */}
          <TabsContent value="watchlist">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((p) => {
                // Logic hiển thị ảnh: Ưu tiên p.image (từ query watchlist backend)
                const displayImage = p.image || (p.images && p.images.length > 0 ? p.images[0] : "https://placehold.co/600x400?text=No+Image");
                
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    // Fix giá tiền
                    price={Number(p.current_price) > 0 ? Number(p.current_price) : Number(p.start_price)}
                    category={p.category || "Yêu thích"}
                    image={displayImage}
                    onViewDetails={(id) => onNavigate("auction", id)}
                  />
                );
              })}
              {watchlist.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl">
                      Bạn chưa theo dõi sản phẩm nào.
                  </div>
              )}
            </div>
          </TabsContent>

          {/* TAB MY BIDS */}
          <TabsContent value="bids">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBids.map((p) => (
                 <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={Number(p.current_price)}
                    category={"Đã đặt giá"}
                    image={p.image || "https://placehold.co/600x400?text=No+Image"}
                    onViewDetails={(id) => onNavigate("auction", id)}
                 />
              ))}
              {myBids.length === 0 && <p className="col-span-full text-center text-gray-500">Chưa tham gia đấu giá nào.</p>}
            </div>
          </TabsContent>

          {/* TAB MY PRODUCTS */}
          <TabsContent value="my-products">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProducts.map((p) => (
                 <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={Number(p.current_price)}
                    category={"Sản phẩm của tôi"}
                    image={p.image || "https://placehold.co/600x400?text=No+Image"}
                    onViewDetails={(id) => onNavigate("auction", id)}
                 />
              ))}
              {myProducts.length === 0 && <p className="col-span-full text-center text-gray-500">Chưa đăng bán sản phẩm nào.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}