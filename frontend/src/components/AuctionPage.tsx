import { Clock, TrendingUp, User as UserIcon, Shield, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Auction } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { Label } from "./ui/label";

interface AuctionPageProps {
  onNavigate: (page: string, id?: any) => void;
  auctionId: number | null;
}

interface BidHistory {
  bidder_name: string;
  amount: number;
  created_at: string;
}

// --- SKELETON LOADING ---
const AuctionPageSkeleton = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-6 w-1/3 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

export function AuctionPage({ onNavigate, auctionId }: AuctionPageProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const { isLoggedIn, token } = useAuth();

  // --- 1. FETCH DATA ---
  const fetchAuctionData = useCallback(async (redirectOnError = false) => {
    if (!auctionId) return;

    try {
      // Gọi API lấy chi tiết sản phẩm
      const auctionRes = await axios.get(`/api/products/${auctionId}`);
      const productData = auctionRes.data;
      
      console.log(">> Dữ liệu sản phẩm từ API:", productData);
      setAuction(productData);

      // Logic tính giá gợi ý bid (Giá hiện tại + bước giá)
      const currentPrice = Number(productData.current_price) || Number(productData.start_price) || 0;
      const stepPrice = Number(productData.step_price) || 10;
      setBidAmount((currentPrice + stepPrice).toString());

      // Gọi API lịch sử đấu giá (Xử lý lỗi 404 êm đẹp)
      try {
        const historyRes = await axios.get(`/api/products/${auctionId}/bid-history`);
        setBidHistory(historyRes.data);
      } catch (error) {
        console.warn("API History 404, dùng mảng rỗng.");
        setBidHistory([]); 
      }

    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      if (redirectOnError) {
        toast.error("Không tìm thấy sản phẩm này.");
        onNavigate("landing");
      }
    }
  }, [auctionId, onNavigate]);

  // Initial Load
  useEffect(() => {
    if (!auctionId) {
      onNavigate("landing");
      return;
    }
    const initData = async () => {
      setLoading(true);
      await fetchAuctionData(true);
      setLoading(false);
    };
    initData();
  }, [auctionId, onNavigate, fetchAuctionData]);

  // Logic đếm ngược
  useEffect(() => {
    if (!auction?.end_at) return;
    const endTime = new Date(auction.end_at);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;
      
      if (distance < 0) {
        setTimeLeft("Ended");
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction?.end_at]);

  // --- 3. HANDLE BID ---
  const handlePlaceBid = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để ra giá.");
      onNavigate("login");
      return;
    }

    const bidVal = parseFloat(bidAmount);
    // Tính giá tối thiểu hợp lệ để check ngay tại Frontend
    const currentPrice = Number(auction?.current_price) || 0;
    const startPrice = Number(auction?.start_price) || 0;
    const stepPrice = Number(auction?.step_price) || 0;
    const bidCount = auction?.bid_count || 0;

    let minValid = 0;
    if (bidCount === 0) {
        minValid = startPrice;
    } else {
        minValid = currentPrice + stepPrice;
    }
    
    if (isNaN(bidVal) || bidVal < minValid) {
       toast.error(`Giá đặt không hợp lệ. Phải ít nhất là $${minValid.toLocaleString()}`);
       return;
    }

    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/bid`,
        { amount: bidVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Ra giá thành công!");
      await fetchAuctionData(false); // Cập nhật lại giá mới ngay lập tức
      
    } catch (error: any) {
      console.error("Lỗi ra giá:", error);
      // Hiển thị lỗi chi tiết từ Backend trả về
      const msg = error.response?.data?.message || "Ra giá thất bại.";
      toast.error(msg);
    }
  };

  // --- 4. HANDLE WATCHLIST (ĐÃ SỬA) ---
  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
        toast.error("Đăng nhập để thêm vào yêu thích");
        onNavigate("login");
        return;
    }

    setWatchlistLoading(true);
    try {
        await axios.post(
            `/api/bidder/products/${auctionId}/watchlist`,
            {}, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Đã thêm vào danh sách theo dõi!");
    } catch (error: any) {
        console.error("Watchlist error:", error);
        toast.error("Không thể thêm vào danh sách theo dõi (Có thể đã tồn tại).");
    } finally {
        setWatchlistLoading(false);
    }
  };

  // --- 5. HANDLE VIEW SELLER (ĐÃ SỬA) ---
  const handleViewSeller = () => {
    // Kiểm tra ID người bán từ object seller hoặc field seller_id
    const sellerId = auction?.seller?.id || auction?.seller_id;
    
    if (sellerId) {
        onNavigate("seller-profile", sellerId); 
    } else {
        toast.error("Không tìm thấy thông tin người bán");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePlaceBid(e as any);
    }
  };

  if (loading || !auction) {
    return <div className="min-h-screen bg-[#F5F5F7]"><AuctionPageSkeleton /></div>;
  }

  // --- LOGIC HIỂN THỊ (FALLBACK) ---
  const displayImages = (auction.images && auction.images.length > 0) 
    ? auction.images 
    : ["https://placehold.co/600x400?text=No+Image"];

  const displayDescription = (auction.description_history && auction.description_history.length > 0)
    ? auction.description_history.map(d => d.description_text).join("\n\n")
    : (auction.description || "Chưa có mô tả chi tiết.");

  const sellerName = auction.seller?.full_name || `Seller #${auction.seller_id || 'Unknown'}`;

  // Giá hiển thị
  const displayPrice = Number(auction.current_price) > 0 ? Number(auction.current_price) : Number(auction.start_price);

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button type="button" onClick={() => onNavigate("dashboard")} className="hover:text-[#0A84FF]">Home</button>
          <span>/</span>
          <button type="button" onClick={() => onNavigate("auctions")} className="hover:text-[#0A84FF]">Auctions</button>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{auction.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Carousel Ảnh */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <Carousel className="w-full">
                <CarouselContent>
                  {displayImages.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video bg-gray-50 flex items-center justify-center">
                        <ImageWithFallback
                          src={img}
                          alt={`${auction.name} view ${index+1}`}
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
            </div>

            {/* Thông tin chi tiết */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{auction.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <Badge className={`hover:bg-[#FFD700]/90 ${timeLeft === "Ended" ? "bg-gray-500" : "bg-[#FFD700] text-gray-900"}`}>
                  <Clock className="h-3 w-3 mr-1" /> {timeLeft}
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <TrendingUp className="h-3 w-3 mr-1" /> {auction.bid_count || 0} bids
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900">Description</h3>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {displayDescription}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3 border border-blue-100">
                <Shield className="h-5 w-5 text-[#0A84FF] mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Buyer Protection</h4>
                  <p className="text-sm text-gray-600">
                    Sản phẩm được bảo vệ bởi chính sách hoàn tiền 100% nếu phát hiện hàng giả.
                  </p>
                </div>
              </div>
            </div>

            {/* Lịch sử đấu giá */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bid History</h3>
              <div className="space-y-3">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{bid.bidder_name}</p>
                          <p className="text-xs text-gray-500">{new Date(bid.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-[#0A84FF]">
                        ${Number(bid.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    Chưa có lượt đấu giá nào.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI - PANEL ĐẶT GIÁ */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                <p className="text-4xl font-bold text-[#0A84FF] mb-4">
                  ${displayPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Minimum bid increment: <span className="font-medium text-gray-900">${(auction.step_price || 50).toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block uppercase font-semibold">
                    Your Bid (Min: ${parseFloat(bidAmount || "0").toLocaleString()})
                  </Label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-12 text-lg"
                    placeholder="Enter bid amount"
                    disabled={timeLeft === "Ended"}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handlePlaceBid}
                  className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12 text-base"
                  disabled={timeLeft === "Ended"}
                >
                  Place Bid
                </Button>

                {/* NÚT WATCHLIST ĐÃ ĐƯỢC GẮN HÀM XỬ LÝ */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddToWatchlist}
                  disabled={watchlistLoading || timeLeft === "Ended"}
                  className="w-full h-12 gap-2"
                >
                  {watchlistLoading ? "Adding..." : (
                    <>
                      <Heart className="w-4 h-4" /> Add to Watchlist
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Thông tin người bán */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{sellerName}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-gray-500">
                      ({auction.seller?.rating_plus || 0}+ / {auction.seller?.rating_minus || 0}-)
                    </span>
                  </div>
                </div>
              </div>

              {/* NÚT VIEW SELLER ĐÃ ĐƯỢC GẮN HÀM XỬ LÝ */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleViewSeller}
              >
                View Seller Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}