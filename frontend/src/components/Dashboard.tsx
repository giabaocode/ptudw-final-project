// File: frontend/src/components/Dashboard.tsx
import { Wallet, Package, Gavel, Heart, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AuctionCard } from "./AuctionCard";
import { ProductCard } from "./ProductCard";
import { useAuth } from "../context/AuthContext"; // 1. Import Context
import { useState, useEffect } from "react";
import axios from "axios";
import { Product } from "../types";

interface DashboardProps {
  onNavigate: (page: string, id?: number) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, token } = useAuth(); // 2. Lấy user thật từ context
  
  // State cho dữ liệu thật
  const [myBids, setMyBids] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [watchlist, setWatchlist] = useState<Product[]>([]);

  // 3. Gọi API lấy dữ liệu thật
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
        try {
            // Lấy sản phẩm mình đang bid
            const bidRes = await axios.get('/api/bidder/my-bids', { headers: { Authorization: `Bearer ${token}` } });
            setMyBids(bidRes.data);

            // Lấy watchlist
            const watchRes = await axios.get('/api/bidder/watchlist', { headers: { Authorization: `Bearer ${token}` } });
            setWatchlist(watchRes.data);

            // Nếu là Seller, lấy sản phẩm mình bán
            if (user?.user_type === 'seller') {
                const prodRes = await axios.get('/api/seller/my-products', { headers: { Authorization: `Bearer ${token}` } });
                setMyProducts(prodRes.data);
            }
        } catch (error) {
            console.error("Lỗi tải dashboard:", error);
        }
    };
    fetchData();
  }, [token, user?.user_type]);

  // Tính toán số liệu thống kê thật
  const stats = [
    { 
      icon: Gavel, label: "Active Bids", 
      value: myBids.length.toString(), color: "text-[#0A84FF]", bgColor: "bg-blue-50" 
    },
    { 
      icon: Heart, label: "Saved Items", 
      value: watchlist.length.toString(), color: "text-red-500", bgColor: "bg-red-50" 
    },
    { 
      icon: Package, label: "My Products", 
      value: myProducts.length.toString(), color: "text-green-500", bgColor: "bg-green-50" 
    },
    // Wallet tạm thời để tĩnh hoặc lấy từ DB nếu có bảng Wallet
    { icon: Wallet, label: "Wallet", value: "$0", color: "text-[#FFD700]", bgColor: "bg-yellow-50" }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Header - DÙNG TÊN THẬT */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl text-gray-900 mb-2">
              Welcome back, {user?.full_name || "User"}!
            </h1>
            <p className="text-gray-600">
                Account Type: <span className="font-bold uppercase text-[#0A84FF]">{user?.user_type}</span>
            </p>
          </div>
          
          {/* Nút Đăng bán (Chỉ hiện cho Seller) */}
          {user?.user_type === 'seller' && (
              <Button onClick={() => onNavigate('post-product')} className="bg-[#0A84FF] hover:bg-[#0A84FF]/90">
                  + Post New Product
              </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} rounded-xl p-3`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs Section - DÙNG DỮ LIỆU THẬT */}
        <Tabs defaultValue="my-bids" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm">
            <TabsTrigger value="my-bids">My Active Bids</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            {user?.user_type === 'seller' && (
                <TabsTrigger value="my-products">My Products</TabsTrigger>
            )}
          </TabsList>

          {/* Tab: My Bids */}
          <TabsContent value="my-bids">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myBids.length > 0 ? myBids.map((product) => (
                <AuctionCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  image={product.images && product.images.length > 0 ? product.images[0] : ""}
                  currentBid={product.current_price}
                  bidCount={0} // Cần thêm trường này vào API nếu muốn hiển thị
                  endTime={new Date()} // Cần thêm trường này vào API
                  onViewDetails={(id) => onNavigate("auction", id)}
                />
              )) : <p className="text-gray-500 col-span-4 text-center py-8">You haven't placed any bids yet.</p>}
            </div>
          </TabsContent>

          {/* Tab: Watchlist */}
          <TabsContent value="watchlist">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {watchlist.length > 0 ? watchlist.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.current_price || product.start_price}
                  image={product.images && product.images.length > 0 ? product.images[0] : ""}
                  category={product.category || "General"}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              )) : <p className="text-gray-500 col-span-4 text-center py-8">Your watchlist is empty.</p>}
            </div>
          </TabsContent>

          {/* Tab: My Products (Seller Only) */}
          <TabsContent value="my-products">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {myProducts.length > 0 ? myProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.current_price || product.start_price} // Hoặc current_price
                  image={product.images && product.images.length > 0 ? product.images[0] : ""}
                  category={product.category || "General"}
                  onViewDetails={(id) => onNavigate("product", id)}
                />
              )) : <p className="text-gray-500 col-span-4 text-center py-8">You haven't posted any products yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
