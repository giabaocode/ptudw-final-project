import {
  ShoppingCart,
  Heart,
  User as UserIcon,
  Calendar,
  Tag,
  Sparkles,
  Clock,
  TrendingUp, // 1. Thêm icon Clock và TrendingUp
} from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  buyNowPrice?: number;
  bidderName?: string;
  createdAt?: string;
  // 2. Thêm 2 props mới này
  endTime?: string;
  bidCount?: number;

  onViewDetails: (id: number) => void;
}

const NEW_PRODUCT_THRESHOLD_MINUTES = 5;

export function ProductCard({
  id,
  name,
  price,
  image,
  category,
  buyNowPrice,
  bidderName,
  createdAt,
  endTime,
  bidCount, // Nhận props
  onViewDetails,
}: ProductCardProps) {
  // --- LOGIC TÍNH THỜI GIAN CÒN LẠI ---
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      // Fix lỗi ngày tháng giống như phần "Mới"
      const safeEndStr = String(endTime).replace(" ", "T");
      // Nếu thiếu múi giờ thì thêm Z (giả sử DB lưu UTC)
      const endDate = new Date(
        safeEndStr.endsWith("Z") ? safeEndStr : safeEndStr + "Z"
      );
      const now = new Date();

      const diffMs = endDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("Kết thúc");
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTime();
    // Cập nhật mỗi phút một lần cho đỡ nặng
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [endTime]);
  // -------------------------------------

  // Logic "Mới" (Giữ nguyên từ bước trước)
  let isNew = false;
  if (createdAt) {
    const safeDateStr = String(createdAt).replace(" ", "T");
    const productDate = new Date(safeDateStr);
    const now = new Date();
    const diffMs = now.getTime() - productDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000) + now.getTimezoneOffset();
    isNew = diffMinutes >= 0 && diffMinutes < NEW_PRODUCT_THRESHOLD_MINUTES;
  }

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

        {/* 3. HIỂN THỊ THỜI GIAN CÒN LẠI (Góc Trái) */}
        {timeLeft && (
          <div className="absolute top-3 left-3 z-20">
            <div
              className={`text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1 
              ${
                timeLeft === "Kết thúc"
                  ? "bg-gray-200 text-gray-600"
                  : "bg-[#FFD700] text-gray-900"
              }`}
            >
              <Clock className="h-3 w-3" /> {timeLeft}
            </div>
          </div>
        )}

        {/* Nút yêu thích (Dời xuống góc dưới phải để không che giờ) */}
        <button className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-colors z-20 opacity-0 group-hover:opacity-100">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      <div className={`p-4 space-y-2 ${isNew ? "bg-yellow-50/40" : ""}`}>
        <div className="flex justify-between items-start">
          <p className="text-xs text-[#0A84FF] font-medium bg-blue-50 px-2 py-0.5 rounded">
            {category}
          </p>

          {/* --- [SỬA ĐOẠN NÀY] --- */}
          {createdAt && (
            <span
              className="text-[10px] text-gray-500 flex items-center"
              title={`Đăng lúc: ${new Date(createdAt).toLocaleString("vi-VN")}`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {/* Luôn hiển thị ngày tháng cụ thể thay vì chữ "Vừa đăng" */}
              {new Date(createdAt).toLocaleDateString("vi-VN")}
            </span>
          )}
          {/* ---------------------- */}
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
              {bidderName || "---"}
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
