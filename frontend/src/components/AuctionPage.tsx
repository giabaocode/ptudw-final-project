import {
  Clock,
  TrendingUp,
  User as UserIcon,
  Shield,
  Heart,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Auction } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { Label } from "./ui/label";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

interface AuctionPageProps {
  onNavigate: (page: string, id?: any) => void;
  auctionId: number | null;
}

interface BidHistory {
  bidder_name: string;
  amount: number;
  created_at: string;
}

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
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const { isLoggedIn, token } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalReady, setModalReady] = useState(false); // đảm bảo modal fully mounted trước focus
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);

  const fetchAuctionData = useCallback(
    async (redirectOnError = false) => {
      if (!auctionId) return;

      try {
        const auctionRes = await axios.get(`/api/products/${auctionId}`);
        const productData = auctionRes.data;
        setAuction(productData);

        const currentPrice =
          Number(productData.current_price) ||
          Number(productData.start_price) ||
          0;
        const stepPrice = Number(productData.step_price) || 10;
        setBidAmount((currentPrice + stepPrice).toString());

        try {
          const historyRes = await axios.get(
            `/api/products/${auctionId}/bid-history`
          );
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
    },
    [auctionId, onNavigate]
  );

  // Auto focus khi modal sẵn sàng
  useEffect(() => {
    if (showConfirmModal) {
      // small delay để portal + DOM hoàn chỉnh, tránh race với animation
      setModalReady(false);
      const t = window.setTimeout(() => setModalReady(true), 20);
      return () => window.clearTimeout(t);
    } else {
      setModalReady(false);
    }
  }, [showConfirmModal]);

  useEffect(() => {
    if (modalReady && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [modalReady]);

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

  // Countdown
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
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (days > 0) setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        else setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction?.end_at]);

  // Disable body scroll + touch when modal open
  useEffect(() => {
    if (showConfirmModal) {
      const prevOverflow = document.body.style.overflow;
      const prevTouch = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow || "";
        document.body.style.touchAction = prevTouch || "";
      };
    }
    // cleanup in case
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [showConfirmModal]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
      }
    };
    if (showConfirmModal) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    return;
  }, [showConfirmModal]);

  const handlePlaceBid = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để ra giá.");
      onNavigate("login");
      return;
    }

    const bidVal = parseFloat(bidAmount);
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
      toast.error(
        `Giá đặt không hợp lệ. Phải ít nhất là $${minValid.toLocaleString()}`
      );
      return;
    }
    setPendingBidAmount(bidVal);
    setShowConfirmModal(true);
  };

  const executeBid = async () => {
    if (!pendingBidAmount) return;
    setLoading(true);

    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/bid`,
        { amount: pendingBidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Ra giá thành công!");
      await fetchAuctionData(false);
      setBidAmount("");
      setShowConfirmModal(false);
    } catch (error: any) {
      console.error("Lỗi ra giá:", error);
      const msg = error.response?.data?.message || "Ra giá thất bại.";
      toast.error(msg);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

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

  const handleViewSeller = () => {
    const sellerId = auction?.seller?.id || auction?.seller_id;

    if (sellerId) {
      onNavigate("seller-profile", sellerId);
    } else {
      toast.error("Không tìm thấy thông tin người bán");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlaceBid(e as any);
    }
  };

  if (loading || !auction) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <AuctionPageSkeleton />
      </div>
    );
  }

  const displayImages =
    auction.images && auction.images.length > 0
      ? auction.images
      : ["https://placehold.co/600x400?text=No+Image"];

  const displayDescription =
    auction.description_history && auction.description_history.length > 0
      ? auction.description_history.map((d) => d.description_text).join("\n\n")
      : auction.description || "Chưa có mô tả chi tiết.";

  const sellerName =
    auction.seller?.full_name || `Seller #${auction.seller_id || "Unknown"}`;

  const displayPrice =
    Number(auction.current_price) > 0
      ? Number(auction.current_price)
      : Number(auction.start_price);

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4 sm:px-6 lg:px-8 z-0">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button
            type="button"
            onClick={() => onNavigate("dashboard")}
            className="hover:text-[#0A84FF]"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onNavigate("auctions")}
            className="hover:text-[#0A84FF]"
          >
            Auctions
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">
            {auction.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <Carousel className="w-full">
                <CarouselContent>
                  {displayImages.map((img, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video bg-gray-50 flex items-center justify-center">
                        <ImageWithFallback
                          src={img}
                          alt={`${auction.name} view ${index + 1}`}
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

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {auction.name}
              </h1>

              <div className="flex items-center gap-3 mb-6">
                <Badge
                  className={`hover:bg-[#FFD700]/90 ${
                    timeLeft === "Ended"
                      ? "bg-gray-500"
                      : "bg-[#FFD700] text-gray-900"
                  }`}
                >
                  <Clock className="h-3 w-3 mr-1" /> {timeLeft}
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <TrendingUp className="h-3 w-3 mr-1" />{" "}
                  {auction.bid_count || 0} bids
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
                  <h4 className="font-medium text-gray-900 mb-1">
                    Buyer Protection
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sản phẩm được bảo vệ bởi chính sách hoàn tiền 100% nếu phát
                    hiện hàng giả.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Bid History
              </h3>
              <div className="space-y-3">
                {bidHistory.length > 0 ? (
                  bidHistory.map((bid, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {bid.bidder_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(bid.created_at).toLocaleString()}
                          </p>
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

          {/* RIGHT - BID PANEL */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Current Bid</p>
                <p className="text-4xl font-bold text-[#0A84FF] mb-4">
                  ${displayPrice.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Minimum bid increment:{" "}
                  <span className="font-medium text-gray-900">
                    ${(auction.step_price || 50).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block uppercase font-semibold">
                    Your Bid (Min: $
                    {parseFloat(bidAmount || "0").toLocaleString()})
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddToWatchlist}
                  disabled={watchlistLoading || timeLeft === "Ended"}
                  className="w-full h-12 gap-2"
                >
                  {watchlistLoading ? (
                    "Adding..."
                  ) : (
                    <>
                      <Heart className="w-4 h-4" /> Add to Watchlist
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Seller Information
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{sellerName}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="text-gray-500">
                      ({auction.seller?.rating_plus || 0}+ /{" "}
                      {auction.seller?.rating_minus || 0}-)
                    </span>
                  </div>
                </div>
              </div>

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

      {/* Modal Portal */}
      {showConfirmModal &&
        (typeof document !== "undefined"
          ? createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                aria-modal="true"
                role="dialog"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
              >
                {/* Overlay */}
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowConfirmModal(false)}
                  style={{ zIndex: 0 }}
                />

                {/* Modal box */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-200 ${
                    modalReady ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-10"
                  }`}
                  style={{ transformOrigin: "center" }}
                >
                  {/* Header */}
                  <div className="bg-white px-6 py-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-[#0A84FF]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Xác nhận ra giá</h3>
                      <p className="text-sm text-gray-500">Hãy kiểm tra kỹ thông tin trước khi đặt.</p>
                    </div>
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
                      <span className="text-gray-600 font-medium">Sản phẩm</span>
                      <span className="text-gray-900 font-bold truncate max-w-[150px]">
                        {auction.name}
                      </span>
                    </div>

                    <div className="bg-[#0A84FF]/5 p-4 rounded-xl flex justify-between items-center border border-[#0A84FF]/20">
                      <span className="text-[#0A84FF] font-medium">Giá bạn đặt</span>
                      <span className="text-2xl font-bold text-[#0A84FF]">
                        ${pendingBidAmount?.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-center text-gray-500 mt-2">
                      Bằng việc chọn "Xác nhận ra giá", bạn cam kết mua sản phẩm này nếu thắng đấu giá.
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmModal(false)}
                      className="font-medium border-gray-200 hover:bg-white hover:text-gray-900"
                    >
                      Hủy bỏ
                    </Button>

                    <button
                      ref={confirmBtnRef}
                      onClick={executeBid}
                      disabled={loading}
                      className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 font-bold px-6 py-2 rounded-md shadow-lg shadow-blue-500/20 disabled:opacity-60"
                    >
                      {loading ? "Đang xử lý..." : "Xác nhận ra giá"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )
          : null)}
    </div>
  );
}
