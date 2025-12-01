import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { ProductCard } from "./ProductCard";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Product } from "../types";

interface ProfilePageProps {
  onNavigate: (page: string, id?: number) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, token } = useAuth();

  // State dữ liệu
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [myBids, setMyBids] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]); // Cho Seller

  // Fetch dữ liệu
  useEffect(() => {
    if (!token) return;

    // 1. Lấy Watchlist
    axios
      .get("/api/bidder/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setWatchlist(res.data))
      .catch((err) => console.error(err));

    // 2. Lấy My Bids
    axios
      .get("/api/bidder/my-bids", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMyBids(res.data))
      .catch((err) => console.error(err));

    // 3. Lấy My Products (Nếu là Seller)
    // (Bạn có thể check user?.user_type === 'seller' trước nếu muốn)
    axios
      .get("/api/seller/my-products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMyProducts(res.data))
      .catch((err) => console.error(err)); // User thường sẽ bị lỗi 403 hoặc mảng rỗng, kệ nó
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl text-gray-900">Xin chào, {user?.fullName}</h1>
          {/* Nút đăng bán chỉ hiện cho Seller */}
          <Button onClick={() => onNavigate("post-product")}>
            + Đăng bán sản phẩm
          </Button>
        </div>

        <Tabs defaultValue="watchlist" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="watchlist">
              Đang theo dõi ({watchlist.length})
            </TabsTrigger>
            <TabsTrigger value="bids">
              Đang đấu giá ({myBids.length})
            </TabsTrigger>
            <TabsTrigger value="my-products">
              Sản phẩm của tôi ({myProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab Watchlist */}
          <TabsContent value="watchlist">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchlist.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  category={p.category}
                  image={p.images && p.images.length > 0 ? p.images[0] : ""}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Tab My Bids */}
          <TabsContent value="bids">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBids.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  category={p.category}
                  image={p.images && p.images.length > 0 ? p.images[0] : ""}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Tab My Products */}
          <TabsContent value="my-products">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  category={p.category}
                  image={p.images && p.images.length > 0 ? p.images[0] : ""}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
