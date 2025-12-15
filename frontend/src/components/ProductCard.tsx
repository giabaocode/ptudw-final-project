import {
  ShoppingCart,
  Heart,
  User as UserIcon,
  Calendar,
  Tag,
  Sparkles,
  Clock,
  Zap, // Icon tia sét cho Mua ngay
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
  endTime?: string;
  bidCount?: number;
  categoryId?: number;
  onCategoryClick?: (id: number) => void;
  onViewDetails: (id: number) => void;
  onAddToWatchlist?: (e: React.MouseEvent) => void;
  onBuyNow?: (id: number) => void; // <--- Thêm prop này
}

const NEW_PRODUCT_THRESHOLD_MINUTES = 60; // 60 phút

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
  categoryId,
  onCategoryClick,
  onViewDetails,
  onAddToWatchlist,
  onBuyNow, // <--- Nhận prop
}: ProductCardProps) {
  // --- 1. LOGIC TÍNH THỜI GIAN CÒN LẠI ---
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      const safeEndStr = String(endTime).replace(" ", "T");
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
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [endTime]);

  // --- 2. LOGIC CHECK SẢN PHẨM MỚI ---
  let isNew = false;
  if (createdAt) {
    const safeDateStr = String(createdAt).replace(" ", "T");
    const productDate = new Date(safeDateStr);
    const now = new Date();
    const diffMs = now.getTime() - productDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    isNew = diffMinutes >= 0 && diffMinutes < NEW_PRODUCT_THRESHOLD_MINUTES;
  }

  const activeStyle: React.CSSProperties = {
    border: "2px solid #FFD700",
    boxShadow: "0 0 15px rgba(255, 215, 0, 0.4)",
    zIndex: 1,
    position: "relative",
  };

  return (
    <div
      style={isNew ? activeStyle : {}}
      className={`bg-white rounded-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full
        ${
          !isNew
            ? "border border-gray-100 hover:shadow-md hover:-translate-y-1"
            : ""
        }
      `}
      onClick={() => onViewDetails(id)}
    >
      {/* ẢNH SẢN PHẨM */}
      <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {isNew && (
          <div className="absolute top-0 right-0 z-20">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> MỚI
            </div>
          </div>
        )}

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

        <button
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-colors z-20 opacity-0 group-hover:opacity-100 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddToWatchlist) onAddToWatchlist(e);
          }}
          title="Thêm vào danh sách theo dõi"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* THÔNG TIN SẢN PHẨM */}
      <div
        className={`p-4 space-y-2 flex flex-col flex-1 ${
          isNew ? "bg-yellow-50/30" : ""
        }`}
      >
        <div className="flex justify-between items-start">
          <p
            className="text-xs text-[#0A84FF] font-medium bg-blue-50 px-2 py-0.5 rounded hover:bg-[#0A84FF] hover:text-white transition-colors cursor-pointer z-20 relative"
            onClick={(e) => {
              e.stopPropagation();
              if (onCategoryClick && categoryId) {
                onCategoryClick(categoryId);
              }
            }}
          >
            {category}
          </p>

          {createdAt && (
            <span
              className="text-[10px] text-gray-500 flex items-center"
              title={`Đăng lúc: ${new Date(createdAt).toLocaleString("vi-VN")}`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(createdAt).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>

        <h3
          className="text-gray-900 font-medium line-clamp-2 h-10 hover:text-[#0A84FF] transition-colors text-sm"
          title={name}
        >
          {name}
        </h3>

        <div className="text-xs text-gray-500 space-y-1 bg-white/60 p-2 rounded-lg border border-gray-100 mt-auto">
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

        {/* --- FOOTER: GIÁ VÀ NÚT BẤM --- */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
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

          <div className="flex gap-2">
            {/* 1. NÚT MUA NGAY (Chỉ hiện nếu có buyNowPrice) */}
            {buyNowPrice && (
              <Button
                size="sm"
                onClick={(e: any) => {
                  e.stopPropagation();
                  // Nếu có hàm onBuyNow thì gọi, không thì mặc định vào trang chi tiết
                  if (onBuyNow) onBuyNow(id);
                  else onViewDetails(id);
                }}
                className="h-8 px-2 bg-red-100 text-red-600 hover:bg-red-200 border-0 font-medium"
                title={`Mua ngay với giá $${buyNowPrice.toLocaleString()}`}
              >
                <Zap className="h-4 w-4" />
              </Button>
            )}

            {/* 2. NÚT BID */}
            <Button
              size="sm"
              onClick={(e: any) => {
                e.stopPropagation();
                onViewDetails(id);
              }}
              className="h-8 px-3 transition-colors text-white font-medium"
              style={{
                backgroundColor: isNew ? "#F97316" : "#0A84FF",
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-1" /> Bid
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
