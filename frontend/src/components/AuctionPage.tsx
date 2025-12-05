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
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ProductCard } from "./ProductCard";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Auction, Product } from "../types";
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

// --- HELPER FUNCTIONS ---
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
  if (diffHours > 0 && diffHours < 72)
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
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
        className="h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
        placeholder="Nhập câu trả lời..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalReady, setModalReady] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);

  const [qaPage, setQaPage] = useState(1);
  const QA_ITEMS_PER_PAGE = 3;

  const { isLoggedIn, token } = useAuth();

  // Reset data khi đổi sản phẩm
  useEffect(() => {
    setAuction(null);
    setBidHistory([]);
    setQuestions([]);
    setReviews([]);
    setActiveImage("");
    setActiveImageIndex(0);
    setBidAmount("");
    setLoading(true);
  }, [auctionId]);

  // --- FETCH DATA ---
  const fetchAuctionData = useCallback(
    async (isBackground = false) => {
      if (!auctionId) return;

      if (!isBackground) setLoading(true);

      try {
        const res = await axios.get(`/api/products/${auctionId}`);
        const newAuctionData = res.data;

        setAuction((prev) => {
          if (
            !prev &&
            newAuctionData.images &&
            newAuctionData.images.length > 0
          ) {
            setActiveImage(newAuctionData.images[0]);
            setActiveImageIndex(0);
          }
          return newAuctionData;
        });

        const currentPrice =
          Number(newAuctionData.current_price) ||
          Number(newAuctionData.start_price) ||
          0;
        const stepPrice = Number(newAuctionData.step_price) || 10;

        setBidAmount((prev) => {
          if (prev === "") return (currentPrice + stepPrice).toString();
          return prev;
        });

        try {
          const hRes = await axios.get(
            `/api/products/${auctionId}/bid-history`
          );
          setBidHistory((prev) =>
            JSON.stringify(prev) !== JSON.stringify(hRes.data)
              ? hRes.data
              : prev
          );
        } catch (e) {
          setBidHistory([]);
        }

        try {
          const qRes = await axios.get(`/api/products/${auctionId}/questions`);
          setQuestions((prev) =>
            JSON.stringify(prev) !== JSON.stringify(qRes.data)
              ? qRes.data
              : prev
          );
        } catch (e) {
          setQuestions([]);
        }

        if (newAuctionData.seller_id) {
          try {
            const rRes = await axios.get(
              `/api/sellers/${newAuctionData.seller_id}/reviews`
            );
            setReviews((prev) =>
              JSON.stringify(prev) !== JSON.stringify(rRes.data)
                ? rRes.data
                : prev
            );
          } catch (e) {
            setReviews([]);
          }
        }
      } catch (error) {
        if (!isBackground) {
          toast.error("Lỗi tải dữ liệu");
          onNavigate("landing");
        }
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [auctionId, onNavigate, activeImage]
  );

  // Load lần đầu
  useEffect(() => {
    fetchAuctionData(false);
  }, [fetchAuctionData]);

  // Update Realtime mỗi 1 giây
  useEffect(() => {
    if (!auctionId) return;
    const interval = setInterval(() => {
      fetchAuctionData(true);
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchAuctionData, auctionId]);

  // Modal Logic
  useEffect(() => {
    if (showConfirmModal) {
      setModalReady(false);
      const t = window.setTimeout(() => setModalReady(true), 50);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [showConfirmModal]);
  useEffect(() => {
    if (modalReady && confirmBtnRef.current) confirmBtnRef.current.focus();
  }, [modalReady]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowConfirmModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmModal]);

  // Nav Images (Logic Prev/Next ảnh lớn)
  const handleNextImage = () => {
    if (!auction?.images) return;
    const next = (activeImageIndex + 1) % auction.images.length;
    setActiveImage(auction.images[next]);
    setActiveImageIndex(next);
  };
  const handlePrevImage = () => {
    if (!auction?.images) return;
    const prev =
      (activeImageIndex - 1 + auction.images.length) % auction.images.length;
    setActiveImage(auction.images[prev]);
    setActiveImageIndex(prev);
  };

  // Handlers
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

  const executeBid = async () => {
    if (!pendingBidAmount) return;
    setAuction((prev) =>
      prev
        ? {
            ...prev,
            current_price: pendingBidAmount,
            bid_count: (prev.bid_count || 0) + 1,
          }
        : null
    );
    setShowConfirmModal(false);
    toast.success("Đang gửi giá...");
    try {
      await axios.post(
        `/api/bidder/products/${auctionId}/bid`,
        { amount: pendingBidAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Ra giá thành công!");
      setBidAmount("");
      fetchAuctionData(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi ra giá.");
      fetchAuctionData(true);
    }
  };

  const handlePostQuestion = async () => {
    if (!isLoggedIn) return toast.error("Vui lòng đăng nhập");
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
      fetchAuctionData(true);
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

  if (loading || !auction)
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );

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
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="max-w-7xl mx-auto relative z-0">
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

        {/* GRID LAYOUT 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* CỘT TRÁI: 2/3 */}
          <div className="lg:col-span-2">
            {/* ẢNH LỚN (FIXED HEIGHT 500px - KHÔNG ZOOM, KHÔNG ICON) */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden relative w-full h-[500px] flex items-center justify-center bg-gray-50 group">
              <ImageWithFallback
                src={activeImage}
                alt={auction.name}
                // Ép ảnh nằm gọn trong khung 500px
                className="max-w-full max-h-full w-auto h-auto object-contain p-2 transition-transform duration-300"
              />

              {/* Nút Prev/Next */}
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
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button className="p-2 bg-white/90 rounded-full shadow hover:text-red-500 transition">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/90 rounded-full shadow hover:text-blue-500 transition">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LIST ẢNH NHỎ (THAY CAROUSEL BẰNG SCROLL NGANG THUẦN) */}
            {auction.images && auction.images.length > 1 && (
              <div className="mt-4">
                {/* Container cuộn ngang */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {auction.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImage(img);
                        setActiveImageIndex(idx);
                      }}
                      // Flex-shrink-0: Đảm bảo kích thước không bị co
                      // w-20 h-20: Kích thước thumbnail cố định
                      className={`
                                        relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-white 
                                        ${
                                          activeImage === img
                                            ? "border-[#0A84FF] ring-1 ring-[#0A84FF]"
                                            : "border-transparent hover:border-gray-300"
                                        }
                                    `}
                    >
                      <ImageWithFallback
                        src={img}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {auction.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-black font-medium">5.0</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span
                  className="flex items-center gap-1"
                  title={new Date(auction.created_at).toLocaleString()}
                >
                  <Calendar className="w-4 h-4" /> Đăng:{" "}
                  {format(new Date(auction.created_at), "dd/MM/yyyy")}
                </span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="flex items-center gap-1 text-green-600">
                  <ShieldCheck className="w-4 h-4" /> Chính hãng
                </span>
              </div>

              <Tabs defaultValue="description">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent p-0 mb-6">
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
                    Lịch sử đấu giá
                  </TabsTrigger>
                  <TabsTrigger
                    value="qa"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0A84FF] data-[state=active]:text-[#0A84FF] px-4 pb-3 text-base font-medium"
                  >
                    Hỏi đáp ({questions.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="description"
                  className="bg-white p-6 rounded-xl border border-gray-100 min-h-[200px]"
                >
                  <div className="prose prose-gray max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                    {auction.description_history &&
                    auction.description_history.length > 0
                      ? auction.description_history[0].description_text
                      : auction.description}
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {bidHistory.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                          <tr>
                            <th className="px-6 py-3">Bidder</th>
                            <th className="px-6 py-3">Giá</th>
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
                          className="h-12 pl-4 pr-4 py-3 w-full text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50 rounded-xl"
                          placeholder={
                            isLoggedIn ? "Nhập câu hỏi..." : "Đăng nhập để hỏi"
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
                                    fetchAuctionData(true);
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
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">
                          {qaPage} / {totalQaPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQaPage((p) => Math.min(totalQaPages, p + 1))
                          }
                          disabled={qaPage === totalQaPages}
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

          {/* CỘT PHẢI: 1/3 */}
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
              {auction.buy_now_price && (
                <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    Mua ngay: ${Number(auction.buy_now_price).toLocaleString()}
                  </span>
                </div>
              )}
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
              <div className="space-y-3 mt-6">
                <Input
                  type="number"
                  className="h-11 text-base"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={isEnded}
                  placeholder="Nhập giá đấu..."
                />
                <Button
                  onClick={handlePlaceBidClick}
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
                        ))}{" "}
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

        {/* Related Products */}
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

      {/* MODAL FIXED */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "450px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
              zIndex: 100000,
            }}
            onClick={(e) => e.stopPropagation()}
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
                <span className="text-[#0A84FF] font-medium">Giá bạn đặt</span>
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
                className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-white font-bold px-6 py-2 rounded-md shadow-lg shadow-blue-500/20"
              >
                Xác nhận ra giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
