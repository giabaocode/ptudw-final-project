import { ShoppingCart, Heart, Star, Truck, RefreshCw, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { ProductCard } from "./ProductCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { Product } from "../types";
import { toast } from "sonner"; // 1. Thêm import Toast
import { Skeleton } from "./ui/skeleton"; // 2. Thêm import Skeleton

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


export function ProductPage({ onNavigate, onAddToCart, productId }: ProductPageProps) {
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
  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-[#0A84FF]">
            Home
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Images */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {/* Dùng mảng 'images' (đúng) */}
                {product.images?.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square bg-gray-100">
                      <ImageWithFallback
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-3">{product.category}</Badge>
              <h1 className="text-3xl md:text-4xl text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(128 reviews)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl text-gray-900">${product.price}</span>
              </div>
              
              {/* 7. Hiển thị mô tả từ history (thay cho P tĩnh) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Description</h3>
                {product.description_history?.map((desc, index) => (
                  <p key={index} className="text-gray-600">
                    {desc.description_text}
                  </p>
                ))}
              </div>
            </div>

            {/* 8. Actions (Thêm code vào khối bị thiếu) */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12"
                onClick={() => {
                  onAddToCart();
                  onNavigate("cart");
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  Buy Now
                </Button>
                <Button variant="outline" className="h-12">
                  <Heart className="h-5 w-5 mr-2" />
                  Wishlist
                </Button>
              </div>
            </div>

            {/* Additional Info (Giữ nguyên) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <Truck className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-600">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <RefreshCw className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">30-Day Returns</p>
                  <p className="text-xs text-gray-600">Money back guarantee</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <Shield className="h-5 w-5 text-[#0A84FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-900">2 Year Warranty</p>
                  <p className="text-xs text-gray-600">Full coverage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section>
          <h2 className="text-2xl text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 9. SỬA LỖI LOGIC: Truyền prop thủ công (không dùng spread) */}
            {product.related_products?.map((related) => (
              <ProductCard
                key={related.id}
                id={related.id}
                name={related.name}
                price={related.price}
                category={related.category || "General"}
                // Sửa lỗi: Lấy ảnh đầu tiên từ mảng 'images'
                image={related.images && related.images.length > 0 ? related.images[0] : ""} 
                onViewDetails={(id) => onNavigate("product", id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
