import {
  Clock,
  TrendingUp,
  User as UserIcon,
  Heart,
  Share2,
  Star,
  ShieldCheck,
  Flag,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ProductCard } from "./ProductCard";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Auction } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

interface AuctionPageProps {
  onNavigate: (page: string, id?: any) => void;
  auctionId: number | null;
}

interface BidHistory {
  bidder_name: string;
  amount: number;
  created_at: string;
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours > 0 && diffHours < 72) {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  }
  return format(date, "HH:mm dd/MM/yyyy");
};

export function AuctionPage({ onNavigate, auctionId }: AuctionPageProps) {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");
  const [bidAmount, setBidAmount] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const { isLoggedIn, token } = useAuth();

  const fetchAuctionData = useCallback(async () => {
    if (!auctionId) return;
    try {
      const res = await axios.get(`/api/products/${auctionId}`);
      setAuction(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setActiveImage(res.data.images[0]);
      }
      const currentPrice =
        Number(res.data.current_price) || Number(res.data.start_price) || 0;
      const stepPrice = Number(res.data.step_price) || 10;
      setBidAmount((currentPrice + stepPrice).toString());

      try {
        const historyRes = await axios.get(
          `/api/products/${auctionId}/bid-history`
        );
        setBidHistory(historyRes.data);
      } catch (e) {
        setBidHistory([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải sản phẩm");
      onNavigate("landing");
    } finally {
      setLoading(false);
    }
  }, [auctionId, onNavigate]);

  useEffect(() => {
    setLoading(true);
    fetchAuctionData();
  }, [fetchAuctionData]);

  const handlePlaceBid = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để đấu giá");
      return onNavigate("login");
    }
    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/bid`,
        { amount: Number(bidAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Ra giá thành công!");
      fetchAuctionData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi khi ra giá");
    }
  };

  const handleAddToWatchlist = async () => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập");
      return onNavigate("login");
    }
    setWatchlistLoading(true);
    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/watchlist`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã thêm vào danh sách theo dõi");
    } catch (e) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading || !auction) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-2xl mb-4" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isEnded = new Date(auction.end_at) < new Date();
  const displayPrice =
    Number(auction.current_price) > 0
      ? Number(auction.current_price)
      : Number(auction.start_price);

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => onNavigate("landing")}
          >
            Home
          </span>
          <span>/</span>
          <span
            className="cursor-pointer hover:text-blue-600"
            onClick={() => onNavigate("categories", auction.category_id)}
          >
            Auctions
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[300px]">
            {auction.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* --- CỘT TRÁI (2/3): ẢNH & CHI TIẾT --- */}
          <div className="lg:col-span-2">
            {/* 1. Ảnh lớn */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-sm relative group aspect-[16/10]">
              <ImageWithFallback
                src={activeImage}
                alt={auction.name}
                className="w-full h-full object-contain mx-auto"
              />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-blue-500 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List ảnh nhỏ (Nếu có) */}
            {auction.images && auction.images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {auction.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImage === img
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 2. Tiêu đề & Thông tin cơ bản (Nằm dưới ảnh như mẫu) */}
            <div className="mt-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {auction.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge className="bg-[#FFD700] hover:bg-[#E5C100] text-black border-none px-3 py-1 text-sm font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />{" "}
                  {formatRelativeTime(auction.end_at)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gray-300 text-gray-600 px-3 py-1"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />{" "}
                  {auction.bid_count} bids
                </Badge>
                <Badge
                  variant="outline"
                  className="border-gray-300 text-gray-600 px-3 py-1"
                >
                  {auction.category}
                </Badge>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <div className="prose prose-gray max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
                  {auction.description_history &&
                  auction.description_history.length > 0
                    ? auction.description_history[0].description_text
                    : auction.description}
                </div>
              </div>
            </div>

            {/* 3. Lịch sử đấu giá (Tabs) */}
            <div className="mt-12">
              <Tabs defaultValue="history">
                <TabsList className="w-full justify-start border-b border-gray-200 rounded-none bg-transparent h-auto p-0 mb-6">
                  <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 px-0 pb-3 mr-8 text-base"
                  >
                    Bid History ({bidHistory.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 px-0 pb-3 mr-8 text-base"
                  >
                    Questions & Answers
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {bidHistory.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                          <tr>
                            <th className="px-6 py-3">Bidder</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bidHistory.map((bid, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {bid.bidder_name}
                                {i === 0 && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Leading
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-blue-600 font-bold">
                                ${Number(bid.amount).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500">
                                {format(
                                  new Date(bid.created_at),
                                  "HH:mm dd/MM/yyyy"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        Chưa có ai đặt giá. Hãy là người đầu tiên!
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="qa">
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                    <p className="text-gray-500">
                      Chưa có câu hỏi nào cho sản phẩm này.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* --- CỘT PHẢI (1/3): ĐẶT GIÁ & SELLER (Sticky) --- */}
          <div className="lg:col-span-1 space-y-6">
            {/* 1. CARD ĐẶT GIÁ (Giống mẫu Samsung) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium mb-1">
                  Current Bid
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#0A84FF]">
                    ${displayPrice.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum bid increment:{" "}
                  <span className="font-bold text-gray-900">
                    ${(auction.step_price || 0).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Your Bid</span>
                    <span>
                      Min: ${parseFloat(bidAmount || "0").toLocaleString()}
                    </span>
                  </div>
                  <Input
                    type="number"
                    className="h-11 text-base border-gray-200 focus:border-blue-500"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={isEnded}
                  />
                </div>

                <Button
                  onClick={handlePlaceBid}
                  disabled={isEnded}
                  className="w-full h-11 bg-[#0A84FF] hover:bg-[#0066CC] text-white font-semibold rounded-lg shadow-sm"
                >
                  {isEnded ? "Đấu giá đã kết thúc" : "Place Bid"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleAddToWatchlist}
                  disabled={watchlistLoading}
                  className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {watchlistLoading ? "Adding..." : "Add to Watchlist"}
                </Button>
              </div>
            </div>

            {/* 2. CARD SELLER INFORMATION */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Seller Information
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {auction.seller?.full_name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 mt-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-gray-400 ml-1">
                      ({auction.seller?.rating_plus || 0})
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Identity
                  Verified
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-500" /> Member since 2023
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 h-10 border-gray-200 rounded-lg text-sm"
              >
                View Seller Profile
              </Button>
            </div>
          </div>
        </div>

        {/* SẢN PHẨM LIÊN QUAN */}
        {auction.related_products && auction.related_products.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              More from this category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {auction.related_products.map((rel: any) => (
                <ProductCard
                  key={rel.id}
                  id={rel.id}
                  name={rel.name}
                  price={
                    Number(rel.current_price) > 0
                      ? Number(rel.current_price)
                      : Number(rel.start_price)
                  }
                  category={rel.category || auction.category || ""}
                  image={
                    rel.images && rel.images.length > 0 ? rel.images[0] : ""
                  }
                  bidCount={rel.bid_count}
                  endTime={rel.end_at}
                  buyNowPrice={rel.buy_now_price}
                  createdAt={rel.created_at}
                  onViewDetails={(id) => onNavigate("auction", id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
