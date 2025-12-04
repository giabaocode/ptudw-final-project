// frontend/src/components/ProductCard.tsx
import {
  ShoppingCart,
  Heart,
  User as UserIcon,
  Calendar,
  Zap,
  Tag,
} from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;

  // Props mới bổ sung
  buyNowPrice?: number;
  bidderName?: string;
  createdAt?: string; // Dùng để tính badge "Mới"

  onViewDetails: (id: number) => void;
  onAddToWatchlist?: (id: number) => void;
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
  onViewDetails,
  onAddToWatchlist
}: ProductCardProps) {
  // Logic kiểm tra sản phẩm mới
  const isNew = createdAt
    ? (new Date().getTime() - new Date(createdAt).getTime()) / 60000 <
      NEW_PRODUCT_THRESHOLD_MINUTES
    : false;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer border ${
        isNew ? "border-[#FFD700] ring-1 ring-[#FFD700]" : "border-gray-100"
      }`}
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

        {/* Badge Mới */}
        {isNew && (
          <div className="absolute top-0 left-0 bg-[#FFD700] text-gray-900 text-xs font-bold px-3 py-1 rounded-br-lg shadow-sm flex items-center gap-1">
            <Zap className="h-3 w-3" /> MỚI
          </div>
        )}

        <button className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm hover:bg-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onAddToWatchlist && onAddToWatchlist(id);
          }}
          title="Add to Watchlist">
          <Heart className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <p className="text-xs text-[#0A84FF] font-medium bg-blue-50 px-2 py-0.5 rounded">
            {category}
          </p>
          {createdAt && (
            <span className="text-[10px] text-gray-400 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(createdAt).toLocaleDateString("vi-VN")}
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

        {/* Thông tin Bidder & Giá mua ngay */}
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
              <span className="font-bold">${buyNowPrice}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Giá hiện tại</p>
            <span className="text-xl font-bold text-gray-900">${price}</span>
          </div>
          <Button
            size="sm"
            className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-8 px-3"
            onClick={(e : any) => {
              e.stopPropagation();
              onViewDetails(id);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Bid
          </Button>
        </div>
      </div>
    </div>
  );
}
