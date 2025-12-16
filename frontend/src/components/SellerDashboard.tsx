import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  MoreVertical,
  Gavel,
  Clock,
  PackageCheck,
  User,
  DollarSign,
  ImageOff,
  Search,
  Plus,
} from "lucide-react";
// [QUAN TRỌNG] Nhớ import DropdownMenuPortal
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Product } from "../types";

interface SellerDashboardProps {
  onNavigate: (page: string, id?: number) => void;
}

export function SellerDashboard({ onNavigate }: SellerDashboardProps) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        const res = await axios.get("/api/seller/my-products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.products || res.data || [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      }
    };
    fetchMyProducts();
  }, [token]);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProducts = filteredProducts.filter(
    (p) => new Date(p.end_at) > new Date()
  );
  const endedProducts = filteredProducts.filter(
    (p) => new Date(p.end_at) <= new Date()
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Kho Hàng
            </h1>
            <p className="text-gray-500 mt-1">
              Đang có{" "}
              <span className="font-semibold text-blue-600">
                {activeProducts.length}
              </span>{" "}
              sản phẩm đang bán
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm sản phẩm..."
                className="pl-10 w-[240px] bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => onNavigate("post-product")}
              className="bg-[#0A84FF] hover:bg-[#006FE0] text-white shadow"
            >
              <Plus className="mr-2 h-4 w-4" /> Đăng bán
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="bg-white border rounded-xl p-1 w-full max-w-md">
            <TabsTrigger value="active" className="w-1/2">
              Đang bán ({activeProducts.length})
            </TabsTrigger>
            <TabsTrigger value="ended" className="w-1/2">
              Đã kết thúc ({endedProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Active */}
          <TabsContent value="active" className="mt-6">
            {activeProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {activeProducts.map((product) => (
                  <SellerProductCard
                    key={product.id}
                    product={product}
                    type="active"
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                type="active"
                onPost={() => onNavigate("post-product")}
              />
            )}
          </TabsContent>

          {/* Ended */}
          <TabsContent value="ended" className="mt-6">
            {endedProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                {endedProducts.map((product) => (
                  <SellerProductCard
                    key={product.id}
                    product={product}
                    type="ended"
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type="ended" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SellerProductCard({
  product,
  type,
  onNavigate,
}: {
  product: Product;
  type: "active" | "ended";
  onNavigate: any;
}) {
  const thumbnail = product.images?.[0];
  const isSold = type === "ended" && product.current_highest_bidder_id;

  return (
    <Card className="h-full flex flex-col rounded-xl border hover:shadow-lg transition-all duration-200 relative bg-white group hover:border-blue-300">
      {/* Container ảnh */}
      <div className="relative h-48 bg-gray-100 flex-shrink-0 rounded-t-xl overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <ImageOff className="h-8 w-8 mb-1" />
            <span className="text-xs">No image</span>
          </div>
        )}

        <div className="absolute top-2 left-2 z-10">
          {type === "active" ? (
            <Badge className="bg-green-500 hover:bg-green-600 shadow-sm">
              Đang bán
            </Badge>
          ) : (
            <Badge
              className={`shadow-sm ${
                isSold ? "bg-blue-600" : "bg-gray-500 text-white"
              }`}
            >
              {isSold ? "Đã bán" : "Không bán được"}
            </Badge>
          )}
        </div>

        {/* --- [ĐÂY LÀ PHẦN SỬA CHỮA QUAN TRỌNG NHẤT] --- */}
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm text-gray-700"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            {/* PHẢI BỌC PORTAL Ở ĐÂY THÌ MỚI THOÁT KHỎI THẺ CARD ĐƯỢC */}
            <DropdownMenuPortal>
              <DropdownMenuContent
                align="end"
                className="w-48 z-[9999] shadow-xl border-gray-100 bg-white" // z-index cực cao
              >
                <DropdownMenuItem
                  onClick={() => onNavigate("auction", product.id)}
                  className="cursor-pointer py-2.5"
                >
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate("edit-product", product.id)}
                  className="cursor-pointer py-2.5 text-blue-600 font-medium"
                >
                  ✏️ Bổ sung mô tả
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <h3
            className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onNavigate("auction", product.id)}
            title={product.name}
          >
            {product.name}
          </h3>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              <Gavel className="h-3 w-3" /> {product.bid_count || 0} lượt
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              <Clock className="h-3 w-3" />
              {new Date(product.end_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-dashed border-gray-200">
          <div className="flex items-center text-blue-600 font-bold text-lg">
            <DollarSign className="h-4 w-4" />
            {product.current_price?.toLocaleString() ||
              product.start_price?.toLocaleString()}
          </div>

          <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 flex items-center gap-2 text-gray-600">
            <User className="h-3 w-3 text-gray-400" />
            <span className="truncate max-w-[150px]">
              {product.bidder_name || "Chưa có người đặt"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex-shrink-0">
        {type === "active" ? (
          <Button
            variant="outline"
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            onClick={() => onNavigate("auction", product.id)}
          >
            Vào phòng đấu giá
          </Button>
        ) : (
          <Button
            disabled={!isSold}
            className={`w-full transition-colors ${
              isSold
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
            }`}
            onClick={() => isSold && onNavigate("orders", product.id)}
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            {isSold ? "Xử lý đơn hàng" : "Kết thúc"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function EmptyState({ type, onPost }: { type: string; onPost?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Gavel className="h-8 w-8 text-gray-300" />
      </div>
      <p className="text-gray-500 mb-4 text-center font-medium">
        {type === "active"
          ? "Bạn chưa có sản phẩm nào đang bán"
          : "Chưa có sản phẩm nào đã kết thúc"}
      </p>
      {type === "active" && onPost && (
        <Button
          onClick={onPost}
          className="bg-[#0A84FF] hover:bg-[#006FE0] text-white shadow-md transition-all hover:scale-105"
        >
          <Plus className="mr-2 h-4 w-4" /> Đăng bán ngay
        </Button>
      )}
    </div>
  );
}
