import {
  Clock,
  TrendingUp,
  User as UserIcon,
  Heart,
  Share2,
  Star,
  Calendar,
  Tag,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  X, // Icon cho Modal
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ProductCard } from "./ProductCard";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Auction, Product } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { createPortal } from "react-dom"; // Để render Modal

interface AuctionPageProps {
  onNavigate: (page: string, id?: any) => void;
  auctionId: number | null;
}

interface BidHistory {
  bidder_name: string;
  amount: number;
  created_at: string;
}

interface Question {
  id: number;
  user_name: string;
  question_text: string;
  answer_text: string | null;
  created_at: string;
}

interface Review {
  rater_name: string;
  score: "positive" | "negative";
  comment: string;
  created_at: string;
}

// --- HELPER FUNCTIONS (Từ nhánh Pagination) ---
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "Vừa xong";
  const safeDateStr = String(dateString).replace(" ", "T");
  const date = new Date(safeDateStr);
  const fixedDate = new Date(
    date.getTime() - new Date().getTimezoneOffset() * 60000
  );
  return formatDistanceToNow(fixedDate, { addSuffix: true, locale: vi });
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours > 0 && diffHours < 72) {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  }
  return format(date, "HH:mm dd/MM/yyyy");
};

const ReplyForm = ({
  questionId,
  onReplied,
}: {
  questionId: number;
  onReplied: () => void;
}) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(
        `/api/seller/questions/${questionId}/reply`,
        { answer: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText("");
      onReplied();
    } catch (error) {
      toast.error("Lỗi khi gửi trả lời");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 items-start mt-3 animate-in fade-in slide-in-from-top-2">
      <Input
        className="h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-all"
        placeholder="Nhập câu trả lời..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim()}
        className="bg-gray-900 text-white h-9 px-4 shrink-0"
      >
        {isSubmitting ? "..." : "Trả lời"}
      </Button>
    </div>
  );
};

export function AuctionPage({ onNavigate, auctionId }: AuctionPageProps) {
  // Ref cho nút confirm (Từ nhánh Test-2)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState<string>("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [bidAmount, setBidAmount] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);

  // Pagination Q&A
  const [qaPage, setQaPage] = useState(1);
  const QA_ITEMS_PER_PAGE = 3;

  // Modal States (Từ nhánh Test-2)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);

  const { isLoggedIn, token } = useAuth();

  // --- FETCH DATA (Gộp logic của cả 2 nhánh) ---
  const fetchAuctionData = useCallback(async () => {
    if (!auctionId) return;
    try {
      const res = await axios.get(`/api/products/${auctionId}`);
      setAuction(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setActiveImage(res.data.images[0]);
        setActiveImageIndex(0);
      }

      const currentPrice =
        Number(res.data.current_price) || Number(res.data.start_price) || 0;
      const stepPrice = Number(res.data.step_price) || 10;
      setBidAmount((currentPrice + stepPrice).toString());

      // Lấy History
      try {
        const hRes = await axios.get(`/api/products/${auctionId}/bid-history`);
        setBidHistory(hRes.data);
      } catch (e) {
        setBidHistory([]);
      }

      // Lấy Questions (Pagination)
      try {
        const qRes = await axios.get(`/api/products/${auctionId}/questions`);
        setQuestions(qRes.data);
      } catch (e) {
        setQuestions([]);
      }

      // Lấy Reviews
      if (res.data.seller_id) {
        try {
          const rRes = await axios.get(
            `/api/sellers/${res.data.seller_id}/reviews`
          );
          setReviews(rRes.data);
        } catch (e) {
          setReviews([]);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải dữ liệu");
      onNavigate("landing");
    } finally {
      setLoading(false);
    }
  }, [auctionId, onNavigate]);

  useEffect(() => {
    setLoading(true);
    fetchAuctionData();
  }, [fetchAuctionData]);

  // --- LOGIC MODAL TỪ NHÁNH TEST-2 ---
  useEffect(() => {
    if (showConfirmModal) {
      setModalReady(false);
      const t = window.setTimeout(() => setModalReady(true), 20);
      // Disable scroll body
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [showConfirmModal]);

  useEffect(() => {
    if (modalReady && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [modalReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirmModal(false);
    };
    if (showConfirmModal) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmModal]);
  // ------------------------------------

  // Image Navigation
  const handleNextImage = () => {
    if (!auction?.images) return;
    const nextIndex = (activeImageIndex + 1) % auction.images.length;
    setActiveImage(auction.images[nextIndex]);
    setActiveImageIndex(nextIndex);
  };
  const handlePrevImage = () => {
    if (!auction?.images) return;
    const prevIndex =
      (activeImageIndex - 1 + auction.images.length) % auction.images.length;
    setActiveImage(auction.images[prevIndex]);
    setActiveImageIndex(prevIndex);
  };

  // --- ACTIONS ---

  // 1. Click Đặt giá -> Mở Modal (Logic Test-2)
  const handlePlaceBidClick = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập");

    const bidVal = parseFloat(bidAmount);
    const currentPrice =
      Number(auction?.current_price) || Number(auction?.start_price) || 0;
    const stepPrice = Number(auction?.step_price) || 0;
    const minValid = currentPrice + stepPrice;

    if (isNaN(bidVal) || bidVal < minValid) {
      toast.error(
        `Giá đặt không hợp lệ. Tối thiểu: $${minValid.toLocaleString()}`
      );
      return;
    }

    setPendingBidAmount(bidVal);
    setShowConfirmModal(true);
  };

  // 2. Xác nhận trong Modal -> Gọi API (Logic thực thi)
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
      await fetchAuctionData();
      setShowConfirmModal(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi ra giá.";
      toast.error(msg);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập để hỏi");
    if (!questionText.trim()) return;
    if (isPostingQuestion) return;

    setIsPostingQuestion(true);
    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/questions`,
        { question: questionText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã gửi câu hỏi!");
      setQuestionText("");
      setQaPage(1);
      const qRes = await axios.get(`/api/products/${auctionId}/questions`);
      setQuestions(qRes.data);
    } catch (e) {
      toast.error("Lỗi gửi câu hỏi");
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập");
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

  const totalQaPages = Math.ceil(questions.length / QA_ITEMS_PER_PAGE);
  const currentQuestions = questions.slice(
    (qaPage - 1) * QA_ITEMS_PER_PAGE,
    qaPage * QA_ITEMS_PER_PAGE
  );

  if (loading || !auction) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const isEnded = new Date(auction.end_at) < new Date();
  const displayPrice =
    Number(auction.current_price) > 0
      ? Number(auction.current_price)
      : Number(auction.start_price);
  const highestBidderName =
    auction.current_highest_bidder?.full_name ||
    auction.bidder_name ||
    "Chưa có";

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
            {auction.category || "Danh mục"}
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[300px]">
            {auction.name}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 mb-16 items-start">
          {/* --- CỘT TRÁI --- */}
          <div className="w-full lg:w-[500px] shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden relative w-full h-[400px] lg:h-[500px] flex items-center justify-center bg-gray-50 group">
                <ImageWithFallback
                  src={activeImage}
                  alt={auction.name}
                  className="max-w-full max-h-full w-auto h-auto object-contain p-2"
                />
                {/* Nav Buttons */}
                {auction.images && auction.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {auction.images && auction.images.length > 1 && (
                <div className="px-8 relative w-full">
                  <Carousel
                    opts={{ align: "start", loop: true }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2">
                      {auction.images.map((img, idx) => (
                        <CarouselItem key={idx} className="pl-2 basis-1/5">
                          <div
                            onClick={() => {
                              setActiveImage(img);
                              setActiveImageIndex(idx);
                            }}
                            className={`
                              cursor-pointer relative h-20 w-20 rounded-lg overflow-hidden border-2 transition-all bg-white flex items-center justify-center
                              ${
                                activeImage === img
                                  ? "border-[#0A84FF] ring-1 ring-[#0A84FF]"
                                  : "border-transparent hover:border-gray-300"
                              }
                            `}
                          >
                            <ImageWithFallback
                              src={img}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-6 h-8 w-8 border-none bg-gray-100 hover:bg-[#0A84FF] hover:text-white" />
                    <CarouselNext className="-right-6 h-8 w-8 border-none bg-gray-100 hover:bg-[#0A84FF] hover:text-white" />
                  </Carousel>
                </div>
              )}
            </div>
          </div>

          {/* --- CỘT PHẢI --- */}
          <div className="flex-1 w-full min-w-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug break-words">
                {auction.name}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 flex-wrap">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-black font-medium">5.0</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span
                  className="flex items-center gap-1"
                  title={new Date(auction.created_at).toLocaleString()}
                >
                  <Calendar className="w-4 h-4" />
                  Đăng: {format(new Date(auction.created_at), "dd/MM/yyyy")}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1 text-green-600">
                  <ShieldCheck className="w-4 h-4" /> Chính hãng
                </span>
              </div>

              <div className="bg-[#F8F9FA] p-5 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Giá hiện tại
                </p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl font-extrabold text-[#0A84FF]">
                    ${displayPrice.toLocaleString()}
                  </span>
                  {auction.buy_now_price && (
                    <span className="text-sm text-gray-400 line-through">
                      ${Number(auction.buy_now_price).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Mua ngay */}
                {auction.buy_now_price && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm font-bold">
                      Mua ngay: $
                      {Number(auction.buy_now_price).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Người thắng */}
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {highestBidderName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Người thắng hiện tại
                      </p>
                      <p className="font-bold text-blue-900 text-sm truncate max-w-[120px]">
                        {highestBidderName}
                      </p>
                    </div>
                  </div>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Badge className="bg-[#FFD700] text-black hover:bg-[#E5C100] px-3 py-1">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />{" "}
                    {formatRelativeTime(auction.end_at)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-blue-200 text-blue-700 bg-blue-50 px-3 py-1"
                  >
                    Bước giá: ${(auction.step_price || 0).toLocaleString()}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                      $
                    </span>
                    <Input
                      type="number"
                      className="h-12 pl-8 text-lg font-bold border-gray-300 focus:border-[#0A84FF] focus:ring-[#0A84FF] w-full"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      disabled={isEnded}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Nhập tối thiểu: $
                    {(displayPrice + (auction.step_price || 0)).toLocaleString()}
                  </p>
                </div>
                {/* BUTTON MỞ MODAL */}
                <Button
                  onClick={handlePlaceBidClick}
                  disabled={isEnded}
                  className="h-12 px-8 bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 flex-1 sm:flex-none"
                >
                  {isEnded ? "Đã kết thúc" : "Đặt Giá Ngay"}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleAddToWatchlist}
                disabled={watchlistLoading}
                className="w-full mt-3 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-10 text-sm"
              >
                {watchlistLoading ? "Adding..." : "Thêm vào danh sách yêu thích"}
              </Button>
            </div>

            {/* Seller Info */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4 w-full">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl flex-shrink-0 border border-gray-200">
                {auction.seller?.full_name?.charAt(0)}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-gray-900 text-lg">
                  {auction.seller?.full_name}
                </h3>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-yellow-500 mt-0.5 cursor-pointer hover:underline">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                      <span className="text-gray-400 ml-1">
                        ({auction.seller?.rating_plus} đánh giá)
                      </span>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Đánh giá gần đây</h4>
                      {reviews.length > 0 ? (
                        reviews.map((r, i) => (
                          <div
                            key={i}
                            className="text-xs border-b pb-2 last:border-0"
                          >
                            <div className="flex justify-between text-gray-500 mb-1">
                              <span>{r.rater_name}</span>
                              <span>{formatTimeAgo(r.created_at)}</span>
                            </div>
                            <p className="text-gray-800 italic">
                              "{r.comment}"
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">
                          Chưa có đánh giá nào.
                        </p>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Button
                variant="outline"
                className="rounded-lg border-gray-300 hover:bg-gray-50 w-full sm:w-auto"
                onClick={() => onNavigate("seller-profile", auction.seller_id)}
              >
                Xem Shop
              </Button>
            </div>

            {/* Tabs Nội dung */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
              <Tabs defaultValue="description">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 mb-6 flex-wrap h-auto">
                  <TabsTrigger
                    value="description"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A84FF] data-[state=active]:text-[#0A84FF] px-4 pb-3 text-base font-medium"
                  >
                    Mô tả
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A84FF] data-[state=active]:text-[#0A84FF] px-4 pb-3 text-base font-medium"
                  >
                    Lịch sử ({bidHistory.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A84FF] data-[state=active]:text-[#0A84FF] px-4 pb-3 text-base font-medium"
                  >
                    Hỏi đáp ({questions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-6">
                  <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line leading-relaxed min-h-[200px]">
                    {auction.description_history &&
                    auction.description_history.length > 0
                      ? auction.description_history[0].description_text
                      : auction.description}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="border rounded-xl overflow-hidden">
                    {bidHistory.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                          <tr>
                            <th className="px-6 py-3">Người đấu giá</th>
                            <th className="px-6 py-3">Mức giá</th>
                            <th className="px-6 py-3 text-right">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bidHistory.map((bid, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {bid.bidder_name}
                              </td>
                              <td className="px-6 py-4 text-[#0A84FF] font-bold">
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
                      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                        Chưa có lượt đấu giá nào.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="qa" className="mt-6">
                  <div className="mt-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 mb-8">
                      <div className="flex-1 relative">
                        <Input
                          className="h-12 pl-4 pr-4 py-3 w-full text-base focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 rounded-xl"
                          placeholder={
                            isLoggedIn
                              ? "Nhập câu hỏi..."
                              : "Đăng nhập để đặt câu hỏi"
                          }
                          disabled={!isLoggedIn || isPostingQuestion}
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostQuestion();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handlePostQuestion}
                        disabled={
                          !isLoggedIn ||
                          !questionText.trim() ||
                          isPostingQuestion
                        }
                        className="h-12 px-6 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 min-w-[100px]"
                      >
                        {isPostingQuestion ? (
                          "..."
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Gửi</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {currentQuestions.length > 0 ? (
                        currentQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm shadow-sm shrink-0">
                                {q.user_name.charAt(0)}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900">
                                    {q.user_name}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">
                                    {formatTimeAgo(q.created_at)}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-base">
                                  {q.question_text}
                                </p>
                              </div>
                            </div>

                            {q.answer_text && (
                              <div className="mt-4 ml-14 bg-blue-50/50 p-4 rounded-2xl rounded-tl-sm border border-blue-100 flex gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                                  S
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                                    Phản hồi từ Người bán
                                  </p>
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {q.answer_text}
                                  </p>
                                </div>
                              </div>
                            )}

                            {!q.answer_text && isLoggedIn && (
                              <div className="mt-4 ml-14">
                                <ReplyForm
                                  questionId={q.id}
                                  onReplied={() => {
                                    fetchAuctionData();
                                    toast.success("Đã trả lời!");
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">
                            Chưa có câu hỏi nào.
                          </p>
                        </div>
                      )}
                    </div>

                    {totalQaPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQaPage((p) => Math.max(1, p - 1))}
                          disabled={qaPage === 1}
                          className="h-9 w-9 p-0 rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-gray-600">
                          Trang {qaPage} / {totalQaPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQaPage((p) => Math.min(totalQaPages, p + 1))
                          }
                          disabled={qaPage === totalQaPages}
                          className="h-9 w-9 p-0 rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Sản phẩm liên quan */}
        {auction.related_products && auction.related_products.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Sản phẩm cùng chuyên mục
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
                  category={rel.category || ""}
                  image={rel.images?.[0] || ""}
                  bidCount={rel.bid_count}
                  endTime={rel.end_at}
                  buyNowPrice={rel.buy_now_price}
                  createdAt={rel.created_at}
                  onViewDetails={(id) => onNavigate("auction", id)}
                  categoryId={rel.category_id}
                  onCategoryClick={(id) => onNavigate("categories", id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL CONFIRM BID (TỪ NHÁNH TEST-2) --- */}
      {showConfirmModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowConfirmModal(false)}
            />

            {/* Modal Box */}
            <div
              className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-200 ${
                modalReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="bg-white px-6 py-6 border-b border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-[#0A84FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Xác nhận ra giá
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hãy kiểm tra kỹ thông tin trước khi đặt.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
                  <span className="text-gray-600 font-medium">Sản phẩm</span>
                  <span className="text-gray-900 font-bold truncate max-w-[150px]">
                    {auction.name}
                  </span>
                </div>

                <div className="bg-[#0A84FF]/5 p-4 rounded-xl flex justify-between items-center border border-[#0A84FF]/20">
                  <span className="text-[#0A84FF] font-medium">
                    Giá bạn đặt
                  </span>
                  <span className="text-2xl font-bold text-[#0A84FF]">
                    ${pendingBidAmount?.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-center text-gray-500 mt-2">
                  Bằng việc chọn "Xác nhận ra giá", bạn cam kết mua sản phẩm này
                  nếu thắng đấu giá.
                </p>
              </div>

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
                  className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-bold px-6 py-2 rounded-md shadow-lg shadow-blue-500/20 disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận ra giá"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}