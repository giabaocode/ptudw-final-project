import { Clock, TrendingUp, User as UserIcon, Shield, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input"; // 1. Thêm Import
import { Badge } from "./ui/badge"; // 2. Thêm Import
import { ImageWithFallback } from "./figma/ImageWithFallback"; // 3. Thêm Import
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel"; // 4. Thêm Import
import { useState, useEffect } from "react";
import axios from "axios";
import { Auction } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton"; // 5. Thêm Import
import { Label } from "./ui/label";

interface AuctionPageProps {
  onNavigate: (page: string, id?: number) => void;
  auctionId: number | null;
}

interface BidHistory {
  bidder_name: string;
  amount: number;
  created_at: string;
}

// 6. Tạo Skeleton component chi tiết
const AuctionPageSkeleton = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-6 w-1/3 mb-6" /> {/* Breadcrumb */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cột trái */}
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="aspect-square w-full rounded-2xl" /> {/* Carousel */}
        {/* Details Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
      {/* Cột phải */}
      <div className="space-y-6">
        {/* Bidding Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        {/* Seller Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="flex gap-3 items-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
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
  
  const { isLoggedIn, token } = useAuth();

  // Gọi API khi auctionId thay đổi
  useEffect(() => {
    if (!auctionId) {
      onNavigate("landing");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [auctionRes, historyRes] = await Promise.all([
          axios.get(`/api/products/${auctionId}`),
          axios.get(`/api/products/${auctionId}/bid-history`)
        ]);
        
        setAuction(auctionRes.data);
        setBidHistory(historyRes.data);
        
        const suggestedBid = (auctionRes.data.current_price || auctionRes.data.start_price) + (auctionRes.data.step_price || 50);
        setBidAmount(suggestedBid.toString());

      } catch (error) {
        console.error("Lỗi tải chi tiết đấu giá:", error);
        toast.error("Không tìm thấy phiên đấu giá.");
        onNavigate("landing");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [auctionId, onNavigate]);

  // 7. Logic đếm ngược (Hoàn thiện)
  useEffect(() => {
    if (!auction?.end_time) return;

    const endTime = new Date(auction.end_time);
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

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction?.end_time]);

  // 5. Hàm xử lý Đặt giá (Giữ nguyên - đã đúng)
  const handlePlaceBid = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để ra giá.");
      onNavigate("login");
      return;
    }
    
    try {
      await axios.post(
        `/api/products/${auctionId}/bid`, 
        { amount: parseFloat(bidAmount) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast.success("Ra giá thành công!");
      // Tải lại dữ liệu (Cách đơn giản)
      window.location.reload(); 

    } catch (error: any) {
      console.error("Lỗi ra giá:", error);
      toast.error(error.response?.data?.message || "Ra giá thất bại.");
    }
  };

  // 6. Hiển thị Skeleton Loading (chi tiết hơn)
  if (loading || !auction) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <AuctionPageSkeleton />
      </div>
    );
  }

  // 7. Dùng dữ liệu thật (Hoàn thiện JSX)
  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => onNavigate("dashboard")} className="hover:text-[#0A84FF]">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate("auctions")} className="hover:text-[#0A84FF]">
            Auctions
          </button>
          <span>/</span>
          <span className="text-gray-900">{auction.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <Carousel className="w-full">
                <CarouselContent>
                  {auction.images?.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square bg-gray-100">
                        <ImageWithFallback
                          src={image}
                          alt={`${auction.name} view ${index + 1}`}
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

            {/* Product Details */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h1 className="text-3xl text-gray-900 mb-4">
                {auction.name}
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <Badge className={`hover:bg-[#FFD700]/90 ${timeLeft === 'Ended' ? 'bg-gray-500' : 'bg-[#FFD700] text-gray-900'}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}
                </Badge>
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {auction.bidCount || 0} bids
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-gray-900 mb-2">Description</h3>
                  {auction.description_history?.map((desc, index) => (
                     <p key={index} className="text-gray-600">
                       {desc.description_text}
                     </p>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#0A84FF] mt-0.5" />
                <div>
                  <h4 className="text-gray-900 mb-1">Buyer Protection</h4>
                  <p className="text-sm text-gray-600">
                    All purchases are covered by our buyer protection program. Authentic products
                    guaranteed or your money back.
                  </p>
                </div>
              </div>
            </div>

            {/* Bid History */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl text-gray-900 mb-4">Bid History</h3>
              <div className="space-y-3">
                {bidHistory.map((bid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900">{bid.bidder_name}</p>
                        <p className="text-xs text-gray-500">{new Date(bid.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[#0A84FF]">${bid.amount.toLocaleString()}</p>
                  </div>
                ))}
                {bidHistory.length === 0 && (
                  <p className="text-gray-500 text-sm">Be the first to bid!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Bidding Panel */}
          <div className="space-y-6">
            {/* Bidding Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Current Bid</p>
                <p className="text-4xl text-[#0A84FF] mb-4">${auction.current_price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">
                  Minimum bid increment: <span className="text-gray-900">${(auction as any).step_price?.toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Your Bid (Min: ${parseFloat(bidAmount).toLocaleString()})</Label>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="text-lg"
                    placeholder="Enter bid amount"
                    disabled={timeLeft === 'Ended'}
                  />
                </div>

                <Button onClick={handlePlaceBid} className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 h-12" disabled={timeLeft === 'Ended'}>
                  Place Bid
                </Button>

                <Button variant="outline" className="w-full h-12" disabled={timeLeft === 'Ended'}>
                  Add to Watchlist
                </Button>
              </div>
            
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-900">{auction.seller?.fullName}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-xs text-gray-600">
                      ({auction.seller?.rating_plus || 0}+ / {auction.seller?.rating_minus || 0}-)
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                View Seller Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
