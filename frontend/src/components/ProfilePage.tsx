import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Product } from "../types";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { 
  Trophy, Star, Heart, Gavel, Package, Settings, User, Lock, 
  ThumbsUp, ThumbsDown, ArrowUpCircle, DollarSign, X, 
  ChevronLeft, ChevronRight, Calendar, Mail, Check, AlertCircle
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductCard } from "./ProductCard";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
interface ProfilePageProps {
  onNavigate: (page: string, id?: number) => void;
}

interface Feedback {
  score: 'positive' | 'negative';
  comment: string;
  created_at: string;
  rater_name: string;
}

const ITEMS_PER_PAGE = 7; 

const getAvatarColor = (name: string) => {
    const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-yellow-600", "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-teal-600"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};


export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, token, login } = useAuth();
  
  // Data
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [rawMyBids, setRawMyBids] = useState<Product[]>([]); 
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [pageWon, setPageWon] = useState(1);
  const [pageBids, setPageBids] = useState(1);

  // Form
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", address: "", dob: "" });
  const [passForm, setPassForm] = useState({ oldPass: "", newPass: "" });
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Modal
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingProduct, setRatingProduct] = useState<Product | null>(null);
  const [ratingScore, setRatingScore] = useState<"positive" | "negative">("positive");
  const [ratingComment, setRatingComment] = useState("");

  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [appendContent, setAppendContent] = useState("");

  useEffect(() => {
    if (!token) return;
    if (user) setProfileForm({ full_name: user.full_name || "", email: user.email || "", address: user.address || "", dob: "" });

    const fetchData = async () => {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        try { setWatchlist((await axios.get("/api/bidder/watchlist", { headers })).data); } catch (e) {}
        try { setRawMyBids((await axios.get("/api/bidder/my-bids", { headers })).data); } catch (e) {}
        try { setMyFeedback((await axios.get("/api/auth/feedback", { headers })).data); } catch (e) {}
        if (user?.user_type === 'seller') {
            try { setMyProducts((await axios.get("/api/seller/my-products", { headers })).data.products); } catch (e) {}
        }
        setLoading(false);
    };
    fetchData();
  }, [token, user]);

  // Thêm useEffect này để khóa scroll body khi mở Modal
useEffect(() => {
  if (isAppendModalOpen) {
    // Khi modal mở -> Khóa cuộn + thêm padding bên phải để tránh giật layout (do mất thanh scrollbar)
    document.body.style.overflow = 'hidden';
  } else {
    // Khi modal đóng -> Trả lại trạng thái bình thường
    document.body.style.overflow = 'unset';
  }

  // Cleanup function phòng trường hợp component bị hủy đột ngột
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isAppendModalOpen]);

  const now = new Date().getTime();
  const wonBids = rawMyBids.filter(p => new Date(p.end_at).getTime() <= now && p.current_highest_bidder_id === user?.id);
  const activeBids = rawMyBids.filter(p => new Date(p.end_at).getTime() > now);

  const sellingProducts = myProducts.filter(p => new Date(p.end_at).getTime() > now);
  const soldProducts = myProducts.filter(p => new Date(p.end_at).getTime() <= now && p.current_highest_bidder_id);

  const paginate = (items: any[], page: number) => {
      const start = (page - 1) * ITEMS_PER_PAGE;
      return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const handleOpenRating = (product: Product) => {
      setRatingProduct(product);
      setRatingModalOpen(true);
  };

  

  const handleRateSeller = async () => {
    if (!ratingProduct) return;
    try {
        await axios.post(`/api/bidder/products/${ratingProduct.id}/rate`, 
            { score: ratingScore, comment: ratingComment }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Đánh giá thành công!");
        setRatingModalOpen(false);
        setRatingComment("");
    } catch (error: any) { toast.error(error.response?.data?.message || "Lỗi gửi đánh giá."); }
  };

  const handleUpdateProfile = async () => {
    try {
        const res = await axios.put("/api/auth/profile", profileForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Cập nhật thành công!");
        if (res.data.user && token) login(token, res.data.user);
    } catch (e) { toast.error("Lỗi cập nhật."); }
  };

  const handleChangePassword = async () => {
    try {
        await axios.put("/api/auth/change-password", { oldPass: passForm.oldPass, newPass: passForm.newPass }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đổi mật khẩu thành công!"); setPassForm({ oldPass: "", newPass: "" });
    } catch (e) { toast.error("Lỗi đổi mật khẩu."); }
  };

// src/components/ProfilePage.tsx

const handleRequestUpgrade = async () => {
    // 👇 SỬA LẠI DÒNG NÀY: Dùng đúng tên "authToken" như trong ảnh của bạn
    const rawToken = localStorage.getItem("authToken"); 
    
    if (!rawToken) {
        toast.error("Lỗi: Không tìm thấy token (authToken)!");
        return;
    }

    // Xử lý xóa dấu ngoặc kép nếu có (đề phòng)
    const token = rawToken.replace(/"/g, ''); 

    try {
        const res = await fetch("/api/admin/request-upgrade", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` // Gửi token chuẩn
            }
        });

        // ... (phần xử lý response giữ nguyên) ...
        const data = await res.json();
        if (res.ok) {
             toast.success("Đã gửi yêu cầu thành công!");
        } else {
             toast.error(data.message || "Lỗi gửi yêu cầu");
        }

    } catch (e) {
        toast.error("Lỗi kết nối");
    }
};

  const isQuillEmpty = (value: string) => {
    if (value.replace(/<(.|\n)*?>/g, '').trim().length === 0) {
      return true;
    }
    return false;
  };

  const handleAppendSubmit = async () => {
    // 1. Kiểm tra kỹ ID sản phẩm (Chặn lỗi NaN)
    const productId = Number(selectedProductId);
    if (!selectedProductId || isNaN(productId)) {
      toast.error("Lỗi: Không tìm thấy ID sản phẩm. Vui lòng tải lại trang!");
      console.error("ID không hợp lệ:", selectedProductId);
      return;
    }

    // 2. Kiểm tra nội dung rỗng
    const plainText = appendContent.replace(/<(.|\n)*?>/g, '').trim();
    if (!plainText) {
      toast.error("Vui lòng nhập nội dung!");
      return;
    }

    try {
        // Gửi request với ID đã được kiểm tra chắc chắn là số
        await axios.post(`/api/seller/products/${productId}/description`,
            { description: appendContent },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success("Cập nhật thành công!");
        setIsAppendModalOpen(false);
        setAppendContent("");
    } catch (error: any) {
        console.error("API Error:", error);
        toast.error(error.response?.data?.message || "Lỗi cập nhật mô tả.");
    }
  }
  const handleRateWinner = async (productId: number, score: 'positive' | 'negative') => {
    const comment = prompt(score === 'positive' ? "Nhập lời khen:" : "Nhập lý do trừ điểm:");
    if (!comment) return;
    try {
        await axios.post(`/api/seller/products/${productId}/rate-winner`, 
            { score, comment }, { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Đã gửi đánh giá!");
    } catch (e: any) { toast.error(e.response?.data?.message || "Lỗi."); }
  };

  const handleCancelTrans = async (productId: number) => {
    if (!confirm("Hủy đơn sẽ trừ điểm người thắng. Tiếp tục?")) return;
    try {
        await axios.post(`/api/seller/products/${productId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đã hủy đơn!");
    } catch (e: any) { toast.error(e.response?.data?.message || "Lỗi."); }
  };

  if (loading) return <div className="p-8 max-w-6xl mx-auto"><Skeleton className="h-48 w-full rounded-2xl" /></div>;

  const avatarInitial = user?.full_name?.charAt(0).toUpperCase() || "U";
  const avatarBg = getAvatarColor(user?.full_name || "User");

  return (
    <div className="min-h-screen bg-[#F0F2F5] py-8 px-4 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className={`w-24 h-24 ${avatarBg} text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-md border-4 border-white shrink-0`}>
             {avatarInitial}
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
             <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
             <div className="flex justify-center md:justify-start gap-4 text-gray-500 text-sm">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4"/> {user?.email}</span>
                <span className="flex items-center gap-1"><User className="w-4 h-4"/> ID: {user?.id}</span>
             </div>
             <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase border border-blue-100">
                    {user?.user_type}
                </span>
             </div>
          </div>
          <div className="flex gap-3">
             {user?.user_type === 'bidder' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-yellow-800">Nâng cấp tài khoản Seller</h4>
                    <p className="text-sm text-yellow-700">Bạn muốn đăng bán sản phẩm? Hãy gửi yêu cầu để được cấp quyền bán trong 7 ngày.</p>
                </div>
                <button onClick={handleRequestUpgrade} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-bold transition">
                    Xin nâng cấp
                </button>
            </div>
             )}
             {user?.user_type === 'seller' && (
                <Button onClick={() => onNavigate("post-product")} className="bg-[#1a73e8] hover:bg-[#1557b0] shadow-md gap-2 text-black">
                    <Package className="w-4 h-4"/> Đăng bán
                </Button>
             )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="won" className="w-full">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
            <TabsList className="bg-transparent p-0 w-full flex justify-start gap-1 min-w-max">
                <TabsTrigger value="won" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Trophy className="w-4 h-4"/> Đã thắng</TabsTrigger>
                <TabsTrigger value="bids" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Gavel className="w-4 h-4"/> Đang đấu</TabsTrigger>
                <TabsTrigger value="watchlist" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Heart className="w-4 h-4"/> Yêu thích</TabsTrigger>
                <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Star className="w-4 h-4"/> Đánh giá về tôi</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Settings className="w-4 h-4"/> Cài đặt</TabsTrigger>
                {user?.user_type === 'seller' && <TabsTrigger value="my-products" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Package className="w-4 h-4"/> Kho hàng</TabsTrigger>}
            </TabsList>
          </div>

          {/* TAB: ĐÃ THẮNG - CĂN GIỮA (CENTER ALIGN) */}
          <TabsContent value="won" className="outline-none">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                     <table className="w-full min-w-[700px]">
                         <thead className="bg-gray-50 border-b border-gray-200">
                             <tr>
                                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[40%]">Sản phẩm</th>
                                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[20%]">Người bán</th>
                                 <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-[15%]">Giá chốt</th>
                                 <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%]">Thao tác</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {wonBids.length > 0 ? paginate(wonBids, pageWon).map(p => (
                                 <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4 align-middle">
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded border bg-gray-100 overflow-hidden shrink-0">
                                                 <ImageWithFallback src={p.image || ""} className="w-full h-full object-cover" />
                                             </div>
                                             <div className="min-w-0">
                                                 <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={p.name}>{p.name}</div>
                                                 <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3"/> {new Date(p.end_at).toLocaleDateString()}</div>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 align-middle text-sm text-gray-700">
                                         {(p as any).seller_name || "Unknown"}
                                     </td>
                                     <td className="px-6 py-4 align-middle text-center">
                                         <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">${Number(p.current_price).toLocaleString()}</span>
                                     </td>
                                     <td className="px-6 py-4 align-middle text-center">
                                         <div className="flex justify-center gap-2">
                                             <Button size="sm" variant="outline" className="h-8 border-yellow-400 text-yellow-700 hover:bg-yellow-50" onClick={() => handleOpenRating(p)}>
                                                 <Star className="w-3 h-3 mr-1"/> Rate
                                             </Button>
                                             <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white">
                                                 <DollarSign className="w-3 h-3 mr-1"/> Pay
                                             </Button>
                                         </div>
                                     </td>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Chưa thắng sản phẩm nào.</td></tr>
                             )}
                         </tbody>
                     </table>
                 </div>
                 {wonBids.length > ITEMS_PER_PAGE && <PaginationBar currentPage={pageWon} totalItems={wonBids.length} onPageChange={setPageWon} />}
             </div>
          </TabsContent>

          {/* TAB: ĐANG ĐẤU GIÁ - CĂN CHỈNH */}
          <TabsContent value="bids" className="outline-none">
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                     <table className="w-full min-w-[600px]">
                         <thead className="bg-gray-50 border-b border-gray-200">
                             <tr>
                                 <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                 <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Giá hiện tại</th>
                                 <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Giá bạn đặt</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                             {activeBids.length > 0 ? paginate(activeBids, pageBids).map(p => (
                                 <tr key={p.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate("auction", p.id)}>
                                     <td className="px-6 py-4 align-middle">
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded border bg-gray-100 overflow-hidden shrink-0"><ImageWithFallback src={p.image || ""} className="w-full h-full object-cover"/></div>
                                             <div className="min-w-0">
                                                 <div className="font-semibold text-gray-900 truncate max-w-[250px]">{p.name}</div>
                                                 <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Đang diễn ra</span>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 align-middle text-right font-bold text-gray-900">${Number(p.current_price).toLocaleString()}</td>
                                     <td className="px-6 py-4 align-middle text-right font-medium text-blue-600">${Number((p as any).my_highest_bid || 0).toLocaleString()}</td>
                                 </tr>
                             )) : (
                                 <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Không có sản phẩm đang đấu giá.</td></tr>
                             )}
                         </tbody>
                     </table>
                 </div>
                 {activeBids.length > ITEMS_PER_PAGE && <PaginationBar currentPage={pageBids} totalItems={activeBids.length} onPageChange={setPageBids} />}
             </div>
          </TabsContent>

          {/* TAB: WATCHLIST */}
          <TabsContent value="watchlist" className="outline-none">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {watchlist.map(p => (
                    <ProductCard key={p.id} {...p} price={Number(p.current_price || p.start_price)} category="Watchlist" image={p.image || p.images?.[0] || ""} onViewDetails={(id) => onNavigate("auction", id)} />
                 ))}
                 {watchlist.length === 0 && <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">Danh sách theo dõi trống.</div>}
             </div>
          </TabsContent>

          {/* TAB: FEEDBACK */}
          <TabsContent value="feedback" className="outline-none">
              <div className="grid gap-4">
                  {myFeedback.length > 0 ? myFeedback.map((fb, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${fb.score === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}>
                                      {fb.score === 'positive' ? <ThumbsUp className="w-4 h-4"/> : <ThumbsDown className="w-4 h-4"/>}
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900">{fb.rater_name || "Người dùng ẩn danh"}</p>
                                      <p className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold border ${fb.score === 'positive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {fb.score === 'positive' ? '+1 Positive' : '-1 Negative'}
                              </span>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic border border-gray-100">"{fb.comment}"</div>
                      </div>
                  )) : (
                      <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">Chưa có đánh giá nào về bạn.</div>
                  )}
              </div>
          </TabsContent>

          {/* TAB: SETTINGS (INPUT VIỀN RÕ RÀNG) */}
          <TabsContent value="settings" className="outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
                          <User className="w-5 h-5 text-blue-600"/><h3 className="font-bold text-gray-800">Thông tin cá nhân</h3>
                      </div>
                      <div className="space-y-5">
                          <div className="space-y-1.5"><Label className="text-gray-700 font-medium">Họ và tên</Label><Input className="h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} /></div>
                          <div className="space-y-1.5"><Label className="text-gray-700 font-medium">Email</Label><Input className="h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} /></div>
                          <div className="space-y-1.5"><Label className="text-gray-700 font-medium">Địa chỉ</Label><Input className="h-10 border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={profileForm.address} placeholder="Nhập địa chỉ của bạn" onChange={e => setProfileForm({...profileForm, address: e.target.value})} /></div>
                          <Button onClick={handleUpdateProfile} className="w-full mt-2 h-10 border border-red-200 bg-white text-red-600 hover:bg-red-50 font-medium">Lưu thay đổi</Button>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
                          <Lock className="w-5 h-5 text-red-600"/><h3 className="font-bold text-gray-800">Bảo mật</h3>
                      </div>
                      <div className="space-y-5">
                          <div className="space-y-1.5"><Label className="text-gray-700 font-medium">Mật khẩu cũ</Label><Input type="password" className="h-10 border border-gray-300 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-100" value={passForm.oldPass} onChange={e => setPassForm({...passForm, oldPass: e.target.value})} /></div>
                          <div className="space-y-1.5"><Label className="text-gray-700 font-medium">Mật khẩu mới</Label><Input type="password" className="h-10 border border-gray-300 shadow-sm focus:border-red-500 focus:ring-1 focus:ring-red-100" value={passForm.newPass} onChange={e => setPassForm({...passForm, newPass: e.target.value})} /></div>
                          <Button onClick={handleChangePassword} variant="destructive" className="w-full mt-2 h-10 border border-red-200 bg-white text-red-600 hover:bg-red-50 font-medium">Đổi mật khẩu</Button>
                      </div>
                  </div>
              </div>
          </TabsContent>

          {user?.user_type === 'seller' && (
            <TabsContent value="my-products" className="outline-none space-y-12">
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                        <Package className="w-5 h-5 text-blue-600"/>
                        Đang bán ({sellingProducts.length})
                    </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {myProducts.map((p) => (
                        <div key={p.id} className="relative group">
                            {/* 1. Hiển thị Card sản phẩm như cũ */}
                            <ProductCard 
                                {...p} 
                                price={Number(p.current_price)} 
                                category="Kho hàng" 
                                image={p.image || (p.images && p.images[0]) || ""} 
                                onViewDetails={(id) => onNavigate("auction", id)} 
                            />
                            
                            {/* 2. Thêm nút bấm Bổ sung mô tả ngay bên dưới */}
                            {/* Thay thế nút Button cũ bằng đoạn này */}
                            <Button 
                                variant="secondary"
                                className="w-full mt-2 border-dashed border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={(e: any) => {
                                    e.stopPropagation(); // Ngăn sự kiện click bị lan ra ngoài (quan trọng)
                                    
                                    // --- LOG DEBUG ---
                                    console.log("Check sản phẩm:", p); 
                                    
                                    // Kiểm tra xem p.id có tồn tại không
                                    const idToCheck = p.id || (p as any).product_id || (p as any)._id; 
                                    
                                    if (!idToCheck) {
                                        alert("Lỗi dữ liệu: Sản phẩm này không có ID!");
                                        console.error("ID bị thiếu trong object:", p);
                                        return;
                                    }

                                    // Cập nhật State
                                    setSelectedProductId(Number(idToCheck)); 
                                    setIsAppendModalOpen(true);
                                }}
                            >
                                ✏️ Bổ sung mô tả
                            </Button>
                        </div>
                    ))}

                   {sellingProducts.length === 0 && <p className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-xl">Không có sản phẩm đang bán.</p>}
                </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-700">
                        <Check className="w-5 h-5"/>
                        Đã bán thành công ({soldProducts.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {soldProducts.map((p) => (
                            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden shrink-0">
                                        <ImageWithFallback src={p.image || ""} className="w-full h-full object-cover"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                        <p className="text-sm text-green-600 font-bold mt-1">Chốt: ${Number(p.current_price).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">Người thắng: <span className="font-medium text-gray-800">{p.bidder_name || "Ẩn danh"}</span></p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => handleRateWinner(p.id, 'positive')} className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                                        <ThumbsUp className="w-4 h-4 mr-2"/> Đánh giá (+1)
                                    </Button>
                                    <Button onClick={() => handleCancelTrans(p.id)} className="bg-red-100 text-red-700 hover:bg-red-200 border-0">
                                        <AlertCircle className="w-4 h-4 mr-2"/> Hủy đơn (-1)
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {soldProducts.length === 0 && <p className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-xl">Chưa có sản phẩm nào bán thành công.</p>}
                    </div>
                </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* --- FIXED PORTAL MODAL (CĂN GIỮA TUYỆT ĐỐI) --- */}
      {ratingModalOpen && createPortal(
        <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 animate-in fade-in zoom-in duration-200 m-4">
                <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                    <h3 className="font-bold text-xl text-gray-800">Đánh giá người bán</h3>
                    <button onClick={() => setRatingModalOpen(false)} className="text-gray-400 hover:text-gray-900 p-1 rounded-full hover:bg-gray-200 transition-colors"><X className="w-6 h-6"/></button>
                </div>
                <div className="p-6 space-y-6">
                    {ratingProduct && (
                        <div className="text-center pb-4 border-b border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Giao dịch sản phẩm:</p>
                            <p className="font-bold text-gray-900 text-lg line-clamp-1">{ratingProduct.name}</p>
                        </div>
                    )}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-800">Trải nghiệm của bạn</Label>
                        <div className="flex gap-4">
                            <div onClick={() => setRatingScore("positive")} className={`flex-1 border-2 p-4 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 font-bold ${ratingScore === 'positive' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm ring-1 ring-green-200' : 'border-gray-100 hover:border-gray-300 text-gray-500 hover:bg-gray-50'}`}><ThumbsUp className="w-8 h-8"/> Tích cực</div>
                            <div onClick={() => setRatingScore("negative")} className={`flex-1 border-2 p-4 rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 font-bold ${ratingScore === 'negative' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm ring-1 ring-red-200' : 'border-gray-100 hover:border-gray-300 text-gray-500 hover:bg-gray-50'}`}><ThumbsDown className="w-8 h-8"/> Tiêu cực</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-base font-semibold text-gray-800">Nhận xét chi tiết</Label>
                        <Textarea placeholder="Người bán có nhiệt tình không?..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="min-h-[120px] text-base p-3 resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                    </div>
                </div>
                <div className="p-5 bg-gray-50 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setRatingModalOpen(false)} className="h-11 px-6 border-gray-300">Hủy bỏ</Button>
                    <Button onClick={handleRateSeller} className="bg-[#1a73e8] hover:bg-blue-600 h-11 px-6 font-bold text-black shadow-md">Gửi đánh giá</Button>
                </div>
            </div>
        </div>,
        document.body
      )}
   {isAppendModalOpen &&
  createPortal(
    <div
      className="
        fixed inset-0 z-[99999] flex items-center justify-center
        bg-black/60 backdrop-blur-sm p-4
      "
      style={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}
    >
      {/* Click ra ngoài để đóng */}
      <div
        className="fixed inset-0"
        onClick={() => setIsAppendModalOpen(false)}
      ></div>

      {/* MODAL WRAPPER */}
      <div
        className="
          relative z-10 bg-white w-full max-w-md rounded-xl shadow-2xl
          border border-gray-1200
          overflow-hidden flex flex-col
          animate-in zoom-in-95 duration-200
        "
      >
        {/* HEADER */}
        <div
          className="
            flex items-center justify-between
            px-5 py-4 bg-gray-50 border-b border-gray-100
          "
        >
          <h3 className="text-gray-800 font-bold">Bổ sung mô tả</h3>

          <button
            onClick={() => setIsAppendModalOpen(false)}
            className="
              p-1 rounded text-gray-400 hover:text-red-500
              hover:bg-red-50 transition-all
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 bg-white space-y-3">
          <Label className="text-sm font-semibold text-gray-700">
            Nội dung chi tiết
          </Label>

          {/* Quill Editor Wrapper */}
          <div
            className="
              h-40 border border-gray-300 rounded-md overflow-hidden
              focus-within:ring-2 focus-within:ring-blue-100
              transition-all
            "
          >
            <ReactQuill
              theme="snow"
              value={appendContent}
              onChange={setAppendContent}
              className="h-full flex flex-col"
              placeholder="Nhập nội dung cập nhật..."
              modules={{
                toolbar: [
                  ["bold", "italic", "underline"],
                  [{ list: "bullet" }, { list: "ordered" }],
                ],
              }}
            />
          </div>

          <p className="text-xs text-right text-gray-400 italic">
            *Nội dung sẽ được thêm vào cuối mô tả hiện tại
          </p>
        </div>

        {/* FOOTER */}
        <div
          className="
            px-5 py-4 bg-gray-50 border-t border-gray-100
            flex justify-end gap-3
          "
        >
          <Button
            variant="outline"
            onClick={() => setIsAppendModalOpen(false)}
            className="h-9 px-4 text-sm font-medium"
          >
            Hủy bỏ
          </Button>

          <Button
            onClick={handleAppendSubmit}
            className="
              h-9 px-4 text-sm font-bold
              bg-blue-600 hover:bg-blue-700
              text-black shadow-md
            "
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )}

    </div>
  );
}

const PaginationBar = ({currentPage, totalItems, onPageChange}: {currentPage: number, totalItems: number, onPageChange: any}) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return (
        <div className="p-3 border-t border-gray-200 flex justify-center items-center gap-4 bg-gray-50/50">
            <Button variant="outline" size="sm" onClick={() => onPageChange((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8"><ChevronLeft className="w-4 h-4 mr-1"/> Trước</Button>
            <span className="text-xs font-medium text-gray-600">Trang {currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8">Sau <ChevronRight className="w-4 h-4 ml-1"/></Button>
        </div>
    );
};