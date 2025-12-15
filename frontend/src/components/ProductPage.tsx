import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { ProductCard } from "./ProductCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { Product } from "../types";
import { toast } from "sonner"; // 1. Thêm import Toast
import { Skeleton } from "./ui/skeleton"; // 2. Thêm import Skeleton
import { AuctionPage } from "./AuctionPage";

interface ProductPageProps {
  onNavigate: (page: string, id?: number) => void;
  onAddToCart: () => void;
  productId: number | null;
}

// 3. Tạo một Skeleton component chi tiết cho trang này
const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-6 w-1/3 mb-6" /> {/* Breadcrumb */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Cột trái (Ảnh) */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
      {/* Cột phải (Thông tin) */}
      <div className="space-y-6">
        <Skeleton className="h-5 w-24" /> {/* Badge */}
        <Skeleton className="h-10 w-full" /> {/* Tên sản phẩm */}
        <Skeleton className="h-12 w-32" /> {/* Giá */}
        {/* Mô tả */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        {/* Nút bấm */}
        <Skeleton className="h-12 w-full mt-4" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
    {/* Related Products Skeleton */}
    <Skeleton className="h-8 w-48 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full rounded-md mt-2" />
        </div>
      ))}
    </div>
  </div>
);

export function ProductPage({
  onNavigate,
  onAddToCart,
  productId,
}: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Gọi API khi productId thay đổi
  useEffect(() => {
    if (!productId) {
      onNavigate("landing");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
        toast.error("Không tìm thấy sản phẩm."); // 4. Thêm thông báo lỗi
        onNavigate("landing");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, onNavigate]); // Chạy lại khi ID thay đổi

  // 5. Hiển thị Skeleton loading
  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <ProductPageSkeleton />
      </div>
    );
  }

  // 6. Dùng dữ liệu thật sau khi tải xong
  return <AuctionPage onNavigate={onNavigate} auctionId={productId} />;
}
