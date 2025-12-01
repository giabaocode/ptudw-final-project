import { useEffect, useState } from "react";
import { User as UserIcon, Star } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "./ui/skeleton";
import axios from "axios";
import { toast } from "sonner";
import { User, Product } from "../types";

// --- CÁC HÀM TIỆN ÍCH CHO AVATAR ---

// 1. Hàm lấy chữ cái đầu in hoa
const getInitials = (name: string | undefined | null) => {
    if (!name) return "?";
    // Lấy ký tự đầu tiên và viết hoa
    return name.charAt(0).toUpperCase();
};

// 2. Hàm sinh màu ngẫu nhiên (nhưng cố định) dựa trên chuỗi tên
// Cách hoạt động: Biến tên thành một con số (hash), rồi dùng số đó để chọn màu HSL
const stringToColor = (string: string | undefined | null) => {
    if (!string) return "#ccc"; // Màu mặc định nếu không có tên

    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Tạo màu HSL:
    // H (Hue - Sắc thái): Dựa vào hash để xoay vòng 360 độ màu
    // S (Saturation - Độ bão hòa): Cố định khoảng 65% cho màu tươi tắn
    // L (Lightness - Độ sáng): Cố định khoảng 45% để chữ trắng luôn dễ đọc
    const h = hash % 360;
    return `hsl(${h}, 65%, 45%)`;
};
// ------------------------------------

interface SellerProfilePageProps {
  onNavigate: (page: string, id?: number) => void;
  sellerId: number | null;
}

export function SellerProfilePage({ onNavigate, sellerId }: SellerProfilePageProps) {
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/sellers/${sellerId}`);
        setSeller(res.data.seller);
        setProducts(res.data.products);
      } catch (error) {
        console.error("Lỗi tải seller:", error);
        toast.error("Không tìm thấy người bán này hoặc lỗi Server.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sellerId]);

  // Màn hình Loading
  if (loading) {
      return (
        <div className="min-h-screen bg-[#F5F5F7] p-8">
            <div className="max-w-6xl mx-auto">
                <Skeleton className="h-48 w-full rounded-2xl mb-8" />
                <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
      );
  }

  // Màn hình Lỗi
  if (!seller) {
      return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy người bán</h2>
                <button onClick={() => onNavigate("landing")} className="text-blue-600 hover:underline">
                    Quay về trang chủ
                </button>
            </div>
        </div>
      );
  }

  // --- CHUẨN BỊ DỮ LIỆU AVATAR ---
  const avatarInitial = getInitials(seller.full_name);
  const avatarBackgroundColor = stringToColor(seller.full_name);
  // ------------------------------

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Seller */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 flex items-center gap-6">
          
          {/* --- PHẦN AVATAR ĐÃ ĐƯỢC SỬA ĐỔI --- */}
          {/* Chúng ta dùng inline style (style={{...}}) để gán màu động */}
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-sm select-none"
            style={{ backgroundColor: avatarBackgroundColor }} 
          >
            {avatarInitial}
          </div>
          {/* ----------------------------------- */}

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{seller.full_name}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                    <span className="font-medium text-yellow-700">
                        {seller.rating_plus || 0} Tích cực / {seller.rating_minus || 0} Tiêu cực
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                    <UserIcon className="w-4 h-4"/>
                    <span className="uppercase text-xs font-bold tracking-wider">{seller.user_type}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            Sản phẩm đang bán 
            <span className="text-sm font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                {products.length}
            </span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={Number(product.current_price) > 0 ? Number(product.current_price) : Number(product.start_price)}
                category={product.category || "Sản phẩm"}
                image={product.image || (product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/600x400?text=No+Image")} 
                onViewDetails={(id) => onNavigate("auction", id)}
              />
            ))}
            
            {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl">
                    Người bán này chưa có sản phẩm nào khác.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}