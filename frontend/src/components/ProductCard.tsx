import {
  ShoppingCart,
  Heart,
  User as UserIcon,
  Calendar,
  Tag,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  buyNowPrice?: number;
  bidderName?: string;
  createdAt?: string;
  onViewDetails: (id: number) => void;
}

// Giữ ngưỡng 60 phút như bạn muốn
const NEW_PRODUCT_THRESHOLD_MINUTES = 60;

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  buyNowPrice,
  bidderName,
  createdAt,
  onViewDetails,
}: ProductCardProps) {
  // --- LOGIC XỬ LÝ NGÀY THÁNG (ĐÃ FIX TIMEZONE) ---
  let isNew = false;

  if (createdAt) {
    // 1. Chuyển đổi chuỗi ngày tháng cho an toàn (Safari/Mobile)
    // Lưu ý: KHÔNG thêm "Z" nữa vì chúng ta sẽ xử lý bằng toán học bên dưới
    const safeDateStr = String(createdAt).replace(" ", "T");
    const productDate = new Date(safeDateStr);

    const now = new Date();
    const diffMs = now.getTime() - productDate.getTime();

    // 2. TÍNH TOÁN: Trừ đi độ lệch múi giờ của trình duyệt
    // getTimezoneOffset() trả về khoảng -420 phút (với VN), cộng vào sẽ triệt tiêu độ lệch 440 phút kia
    const diffMinutes = Math.floor(diffMs / 60000) + now.getTimezoneOffset();

    // 3. So sánh
    isNew = diffMinutes >= 0 && diffMinutes < NEW_PRODUCT_THRESHOLD_MINUTES;
  }
  // ------------------------------------------------

  // Style Inline để đảm bảo hiệu ứng luôn hiện
  const activeStyle = {
    border: "2px solid #FFD700",
    boxShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
    transform: "scale(1.02)",
    zIndex: 10,
    position: "relative" as "relative",
  };

  return (
    <div
      style={isNew ? activeStyle : {}}
      className={`bg-white rounded-xl transition-all duration-300 overflow-hidden group cursor-pointer 
        ${
          !isNew
            ? "border border-gray-100 hover:shadow-md hover:-translate-y-1"
            : ""
        }
      `}
    >
      <div
        className="relative h-48 overflow-hidden bg-gray-100"
        onClick={() => onViewDetails(id)}
      >
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {isNew && (
          <div className="absolute top-0 right-0 z-20">
            <div className="bg-[#FFD700] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 animate-pulse">
              <Sparkles className="h-3 w-3" /> MỚI
            </div>
          </div>
        )}

        <button className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-colors z-20">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <p className="text-xs text-[#0A84FF] font-medium bg-blue-50 px-2 py-0.5 rounded">
            {category}
          </p>
          {createdAt && (
            <span
              className={`text-[10px] flex items-center ${
                isNew ? "text-orange-600 font-bold" : "text-gray-400"
              }`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {isNew
                ? "Vừa đăng"
                : new Date(createdAt).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>

        <h3
          className="text-gray-900 font-medium line-clamp-2 h-10 hover:text-[#0A84FF] transition-colors text-sm"
          onClick={() => onViewDetails(id)}
          title={name}
        >
          {name}
        </h3>

        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" /> Bidder:
            </span>
            <span className="font-medium text-gray-700 truncate max-w-[80px]">
              {bidderName || "Chưa có"}
            </span>
          </div>
          {buyNowPrice && (
            <div className="flex justify-between items-center text-red-500">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" /> Mua ngay:
              </span>
              <span className="font-bold">${buyNowPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Giá hiện tại</p>
            <span
              className={`text-xl font-bold ${
                isNew ? "text-orange-600" : "text-gray-900"
              }`}
            >
              ${price.toLocaleString()}
            </span>
          </div>
          <Button
            size="sm"
            className={`${
              isNew
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-[#0A84FF] hover:bg-[#0A84FF]/90"
            } h-8 px-3`}
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Bid
          </Button>
        </div>
      </div>
    </div>
  );
}
