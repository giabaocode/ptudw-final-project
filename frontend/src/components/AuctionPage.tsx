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
  Flag,
  Trophy,
  AlertTriangle,
  X,
  Shield,
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
import { Auction } from "../types";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
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

// Hàm format thời gian (Fix Timezone)
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
    if (!text.trim() || isSubmitting) return; // Chặn spam click
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
      console.error(error);
      toast.error("Lỗi khi gửi trả lời");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 items-start mt-3 animate-in fade-in slide-in-from-top-2">
      <Input
        className="h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white transition-all"
        placeholder="Nhập câu trả lời của bạn..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting} // Disable khi đang gửi
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

  // State lock nút gửi để tránh spam
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);

  const [qaPage, setQaPage] = useState(1);
  const QA_ITEMS_PER_PAGE = 3;

  const { isLoggedIn, token } = useAuth();

  // State và ref cho modal xác nhận ra giá (từ code cần merge)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [isBidding, setIsBidding] = useState(false);

  // Ref cho interval để clear khi component unmount hoặc khi chuyển sản phẩm
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  const fetchAuctionData = useCallback(async () => {
    if (!auctionId || !isComponentMounted.current) return;

    try {
      const res = await axios.get(`/api/products/${auctionId}`);

      if (!isComponentMounted.current) return;

      setAuction(res.data);
      if (res.data.images && res.data.images.length > 0) {
        setActiveImage(res.data.images[0]);
        setActiveImageIndex(0);
      }

      const currentPrice =
        Number(res.data.current_price) || Number(res.data.start_price) || 0;
      const stepPrice = Number(res.data.step_price) || 10;
      setBidAmount((currentPrice + stepPrice).toString());

      try {
        const historyRes = await axios.get(
          `/api/products/${auctionId}/bid-history`
        );
        if (isComponentMounted.current) {
          setBidHistory(historyRes.data);
        }
      } catch (e) {
        if (isComponentMounted.current) {
          setBidHistory([]);
        }
      }

      try {
        const qRes = await axios.get(`/api/products/${auctionId}/questions`);
        if (isComponentMounted.current) {
          setQuestions(qRes.data);
        }
      } catch (e) {
        if (isComponentMounted.current) {
          setQuestions([]);
        }
      }

      if (res.data.seller_id) {
        try {
          const rRes = await axios.get(
            `/api/sellers/${res.data.seller_id}/reviews`
          );
          if (isComponentMounted.current) {
            setReviews(rRes.data);
          }
        } catch (e) {
          if (isComponentMounted.current) {
            setReviews([]);
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (isComponentMounted.current) {
        toast.error("Lỗi tải dữ liệu");
        onNavigate("landing");
      }
    } finally {
      if (isComponentMounted.current) {
        setLoading(false);
      }
    }
  }, [auctionId, onNavigate]);

  useEffect(() => {
    // Reset và tải dữ liệu mới khi auctionId thay đổi
    const loadAuctionData = async () => {
      if (!auctionId) return;

      // Clear polling cũ nếu có
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Reset state
      setAuction(null);
      setBidHistory([]);
      setQuestions([]);
      setReviews([]);
      setActiveImage("");
      setActiveImageIndex(0);
      setLoading(true);

      // Fetch dữ liệu
      await fetchAuctionData();

      // Chỉ bắt đầu polling sau khi dữ liệu đã load xong và component vẫn mounted
      if (isComponentMounted.current && auctionId) {
        // Thiết lập polling với khoảng thời gian hợp lý hơn (5 giây)
        pollingIntervalRef.current = setInterval(() => {
          if (
            document.visibilityState === "visible" &&
            isComponentMounted.current
          ) {
            fetchAuctionData();
          }
        }, 5000); // 5 giây để giảm tải
      }
    };

    loadAuctionData();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [auctionId, fetchAuctionData]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Auto focus khi modal sẵn sàng (từ code cần merge)
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

  // Disable body scroll + touch when modal open (từ code cần merge)
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
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [showConfirmModal]);

  // Close on ESC (từ code cần merge)
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

  // Hàm xử lý đặt giá với modal xác nhận (tích hợp từ code cần merge)
  const handlePlaceBid = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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

  // Hàm thực hiện đặt giá sau khi xác nhận
  const executeBid = async () => {
    if (!pendingBidAmount || !auction) return;
    setIsBidding(true);

    try {
      // Gọi API đặt giá
      await axios.post(
        `/api/bidder/products/${auctionId}/bid`,
        { amount: pendingBidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Ra giá thành công!");

      // Fetch lại dữ liệu để cập nhật real-time
      await fetchAuctionData();

      // Đóng modal
      setShowConfirmModal(false);
      setPendingBidAmount(null);
    } catch (error: any) {
      console.error("Lỗi ra giá:", error);
      const msg = error.response?.data?.message || "Ra giá thất bại.";
      toast.error(msg);
    } finally {
      setIsBidding(false);
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
      // Cập nhật ngay lập tức
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlePlaceBid(e as any);
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

  // Lấy tên người giữ giá (ưu tiên current_highest_bidder object, fallback về bidder_name)
  const highestBidderName =
    auction.current_highest_bidder?.full_name ||
    auction.bidder_name ||
    "Chưa có";

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm relative group aspect-[16/10] border border-gray-100">
              <ImageWithFallback
                src={activeImage}
                alt={auction.name}
                className="w-full h-full object-contain mx-auto mix-blend-multiply"
              />
            </div>
            {auction.images && auction.images.length > 1 && (
              <div className="flex mt-4 overflow-x-auto pb-2">
                {auction.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-full rounded-lg border-2 transition-all ${
                      activeImage === img
                        ? "border-blue-500"
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

            <div className="mt-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {auction.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-black font-medium">5.0</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>

                {/* --- [MỚI] HIỂN THỊ THỜI ĐIỂM ĐĂNG --- */}
                <span
                  className="flex items-center gap-1"
                  title={new Date(auction.created_at).toLocaleString()}
                >
                  <Calendar className="w-4 h-4" />
                  Đăng: {format(new Date(auction.created_at), "dd/MM/yyyy")}
                </span>
                {/* ------------------------------------ */}

                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1 text-green-600">
                  <ShieldCheck className="w-4 h-4" /> Chính hãng
                </span>
              </div>

              <Tabs defaultValue="description" className="mt-8">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 mb-6">
                  <TabsTrigger
                    value="description"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 px-0 pb-3 mr-8 text-base"
                  >
                    Mô tả
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 px-0 pb-3 mr-8 text-base"
                  >
                    Lịch sử đấu giá
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 px-0 pb-3 mr-8 text-base"
                  >
                    Hỏi đáp ({questions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description">
                  <div 
                    className="prose prose-gray max-w-none text-gray-600 whitespace-pre-line leading-relaxed bg-white p-6 rounded-xl border border-gray-100"
                    dangerouslySetInnerHTML={{
                      __html: (
                        auction.description_history && auction.description_history.length > 0
                          ? auction.description_history[0].description_text
                          : auction.description
                      ) || '' // <--- Bổ sung || '' để luôn đảm bảo là chuỗi
                    }}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {bidHistory.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-6 py-3">Bidder</th>
                            <th className="px-6 py-3">Giá</th>
                            <th className="px-6 py-3 text-right">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bidHistory.map((bid, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {bid.bidder_name}
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
                        Chưa có ai đặt giá.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="qa">
                  <div className="mt-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3 mb-8">
                      <div className="flex-1 relative">
                        <Input
                          className="h-12 pl-4 pr-4 py-3 w-full text-base focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 rounded-xl"
                          placeholder={
                            isLoggedIn
                              ? "Nhập câu hỏi của bạn..."
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
                            Chưa có câu hỏi nào. Hãy là người đầu tiên!
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

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <p className="text-sm text-gray-500 font-medium mb-1">
                Giá hiện tại (Current Bid)
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#0A84FF]">
                  ${displayPrice.toLocaleString()}
                </span>
              </div>

              {/* --- [MỚI] HIỂN THỊ GIÁ MUA NGAY --- */}
              {auction.buy_now_price && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    Mua ngay: ${Number(auction.buy_now_price).toLocaleString()}
                  </span>
                </div>
              )}
              {/* ----------------------------------- */}

              {/* --- [MỚI] THÔNG TIN NGƯỜI GIỮ GIÁ CAO NHẤT --- */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                    {highestBidderName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                      Người thắng hiện tại
                    </p>
                    <p
                      className="font-bold text-blue-900 text-sm truncate max-w-[120px]"
                      title={highestBidderName}
                    >
                      {highestBidderName}
                    </p>
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              {/* --------------------------------------------- */}

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

              <div className="space-y-3 mt-6">
                <Input
                  type="number"
                  className="h-11 text-base"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isEnded}
                  placeholder="Nhập giá đấu..."
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={isEnded}
                  className="w-full h-11 bg-[#0A84FF] hover:bg-[#0066CC] font-bold"
                >
                  {isEnded ? "Đã kết thúc" : "Đặt Giá Ngay"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddToWatchlist}
                  disabled={watchlistLoading}
                  className="w-full h-11"
                >
                  {watchlistLoading ? "Adding..." : "Add to Watchlist"}
                </Button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Thông tin người bán
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {auction.seller?.full_name}
                  </p>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-yellow-500 mt-0.5 cursor-pointer hover:underline">
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
                        <h4 className="text-sm font-semibold">
                          Đánh giá gần đây
                        </h4>
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
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 text-sm"
                onClick={() => onNavigate("seller-profile", auction.seller_id)}
              >
                Xem hồ sơ Shop
              </Button>
            </div>
          </div>
        </div>

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

      {/* Modal Portal cho xác nhận ra giá (từ code cần merge) */}
      {showConfirmModal &&
        (typeof document !== "undefined"
          ? createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                aria-modal="true"
                role="dialog"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
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
                    modalReady
                      ? "opacity-100 scale-100 z-10"
                      : "opacity-0 scale-95 z-10"
                  }`}
                  style={{ transformOrigin: "center" }}
                >
                  {/* Header */}
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
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center border border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Sản phẩm
                      </span>
                      <span className="text-gray-900 font-bold truncate max-w-[150px]">
                        {auction?.name}
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
                      Bằng việc chọn "Xác nhận ra giá", bạn cam kết mua sản phẩm
                      này nếu thắng đấu giá.
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
                      disabled={isBidding}
                      className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 font-bold px-6 py-2 rounded-md shadow-lg shadow-blue-500/20 disabled:opacity-60"
                    >
                      {isBidding ? "Đang xử lý..." : "Xác nhận ra giá"}
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
