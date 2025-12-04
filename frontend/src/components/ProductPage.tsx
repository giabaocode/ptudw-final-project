import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  RefreshCw,
  Shield,
  MessageCircle, // Icon tin nhắn
  User as UserIcon,
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
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";

interface ProductPageProps {
  onNavigate: (page: string, id?: number) => void;
  onAddToCart: () => void;
  productId: number | null;
}

// Skeleton Loading
const ProductPageSkeleton = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-6 w-1/3 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-4">
        <Skeleton className="aspect-square w-full rounded-lg" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-12 w-full mt-4" />
      </div>
    </div>
  </div>
);

export function ProductPage({
  onNavigate,
  onAddToCart,
  productId,
}: ProductPageProps) {
  const { user, token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // State cho tính năng Hỏi người bán
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);

  // 1. Tải dữ liệu sản phẩm
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
        toast.error("Không tìm thấy sản phẩm.");
        onNavigate("landing");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, onNavigate]);

  // 2. Xử lý gửi câu hỏi
  const handleAskQuestion = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt câu hỏi.");
      onNavigate("login");
      return;
    }
    if (!question.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    try {
      setIsAsking(true);
      await axios.post(
        `/api/bidder/products/${productId}/questions`,
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã gửi câu hỏi! Người bán sẽ nhận được email thông báo.");
      setQuestion("");
      setShowAskModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi câu hỏi");
    } finally {
      setIsAsking(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <ProductPageSkeleton />
      </div>
    );
  }

  // Lấy ảnh hiển thị (nếu mảng images rỗng thì dùng ảnh mặc định)
  const displayImages =
    product.images && product.images.length > 0
      ? product.images
      : ["https://placehold.co/600x600?text=No+Image"];

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb đơn giản */}
        <button
          onClick={() => onNavigate("landing")}
          className="text-gray-500 hover:text-[#0A84FF] mb-6 flex items-center text-sm"
        >
          ← Quay lại trang chủ
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <Carousel className="w-full">
              <CarouselContent>
                {displayImages.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {displayImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
            {/* Thumbnails nhỏ bên dưới (Optional) */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {displayImages.map((img, index) => (
                <div
                  key={index}
                  className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-500"
                >
                  <ImageWithFallback
                    src={img}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                >
                  {product.category || "Sản phẩm"}
                </Badge>
                {/* Logic hiển thị Badge Mới */}
                {new Date(product.created_at || "").getTime() >
                  Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                  <Badge className="bg-green-500">Mới đăng</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Giá và Giá mua ngay */}
              <div className="flex items-baseline gap-4 mt-4">
                <span className="text-4xl font-bold text-[#0A84FF]">
                  ${Number(product.current_price).toLocaleString()}
                </span>
                {product.buy_now_price && (
                    <span className="text-sm text-gray-500 border border-red-200 bg-red-50 px-2 py-1 rounded">
                        Mua ngay: ${Number(product.buy_now_price).toLocaleString()}
                    </span>
                )}
              </div>
            </div>

            {/* Thông tin người bán & Nút Hỏi đáp */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người bán</p>
                    <p className="font-bold text-gray-900">
                      {product.seller?.full_name || "Ẩn danh"}
                    </p>
                  </div>
                </div>

                {/* NÚT HỎI NGƯỜI BÁN (Chỉ hiện nếu không phải là người bán) */}
                {user?.id !== product.seller_id && (
                  <Dialog open={showAskModal} onOpenChange={setShowAskModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Hỏi người bán
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          Đặt câu hỏi cho {product.seller?.full_name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          placeholder="Ví dụ: Sản phẩm này còn đầy đủ phụ kiện không? Có trầy xước gì không?"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Người bán sẽ nhận được email thông báo về câu hỏi này.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setShowAskModal(false)}
                        >
                          Hủy
                        </Button>
                        <Button onClick={handleAskQuestion} disabled={isAsking}>
                          {isAsking ? "Đang gửi..." : "Gửi câu hỏi"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Các nút hành động chính */}
            <div className="flex flex-col gap-3">
              {/* Chuyển hướng sang trang Đấu giá chuyên sâu */}
              <Button
                size="lg"
                className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-lg font-bold h-14"
                onClick={() => onNavigate("auction", product.id)}
              >
                Tham gia Đấu giá ngay
              </Button>
              <div className="flex gap-3">
                <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2"
                    // Logic thêm vào giỏ hoặc watchlist
                >
                    <Heart className="w-5 h-5" /> Theo dõi
                </Button>
              </div>
            </div>
            
             {/* Cam kết */}
             <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-5 h-5 text-green-600" /> Bảo vệ người mua
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-5 h-5 text-blue-600" /> Giao hàng toàn quốc
                </div>
            </div>
          </div>
        </div>

        {/* MÔ TẢ SẢN PHẨM */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-12">
          <h2 className="text-2xl font-bold mb-6">Mô tả sản phẩm</h2>
          <div
            className="prose max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description || "Chưa có mô tả chi tiết." }}
          />
        </div>

        {/* SẢN PHẨM LIÊN QUAN */}
        {product.related_products && product.related_products.length > 0 && (
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Sản phẩm tương tự</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {product.related_products.map((relProd) => (
                        <ProductCard 
                            key={relProd.id}
                            id={relProd.id}
                            name={relProd.name}
                            price={Number(relProd.current_price)}
                            image={relProd.images?.[0] || ""}
                            category={relProd.category || ""}
                            onViewDetails={(id) => onNavigate("product", id)}
                        />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}