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
  ChevronLeft, ChevronRight, Calendar, Mail
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProductCard } from "./ProductCard";

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
  
  // Data States
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [rawMyBids, setRawMyBids] = useState<Product[]>([]); 
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [pageWon, setPageWon] = useState(1);
  const [pageBids, setPageBids] = useState(1);

  // Form States
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", address: "", dob: "" });
  const [passForm, setPassForm] = useState({ oldPass: "", newPass: "" });
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Rating Modal States
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingProduct, setRatingProduct] = useState<Product | null>(null);
  const [ratingScore, setRatingScore] = useState<"positive" | "negative">("positive");
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    if (!token) return;
    if (user) setProfileForm({ full_name: user.full_name || "", email: user.email || "", address: user.address || "", dob: "" });

    const fetchData = async () => {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        try { 
            const resWatch = await axios.get("/api/bidder/watchlist", { headers });
            setWatchlist(resWatch.data);
        } catch (e) { console.error("Error fetching watchlist", e); }

        try { 
            const resBids = await axios.get("/api/bidder/my-bids", { headers });
            setRawMyBids(resBids.data);
        } catch (e) { console.error("Error fetching bids", e); }

        try { 
            const resFeedback = await axios.get("/api/auth/feedback", { headers });
            setMyFeedback(resFeedback.data);
        } catch (e) { console.error("Error fetching feedback", e); }

        if (user?.user_type === 'seller') {
            try { 
                const resProds = await axios.get("/api/seller/my-products", { headers });
                setMyProducts(resProds.data.products || resProds.data); // Handle cả trường hợp trả về {products: []} hoặc []
            } catch (e) { console.error("Error fetching products", e); }
        }
        setLoading(false);
    };
    fetchData();
  }, [token, user]);

  // Logic lọc sản phẩm thắng/thua/đang đấu
  const now = new Date().getTime();
  // Sản phẩm đã kết thúc VÀ người thắng là mình
  const wonBids = rawMyBids.filter(p => new Date(p.end_at).getTime() <= now && p.current_highest_bidder_id === user?.id);
  // Sản phẩm chưa kết thúc
  const activeBids = rawMyBids.filter(p => new Date(p.end_at).getTime() > now);

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
    } catch (error: any) { 
        toast.error(error.response?.data?.message || "Lỗi gửi đánh giá."); 
    }
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

  const handleRequestUpgrade = async () => {
    try {
        // Giả lập API request upgrade
        // await axios.post("/api/bidder/upgrade-request", { reason: "Upgrade" }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đã gửi yêu cầu lên Admin!");
    } catch (e) { toast.error("Lỗi gửi yêu cầu."); } finally { setIsUpgrading(false); }
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
                <Button variant="outline" className="gap-2 border-gray-300" onClick={handleRequestUpgrade} disabled={isUpgrading}>
                    <ArrowUpCircle className="w-4 h-4" /> Xin lên Seller
                </Button>
             )}
             {user?.user_type === 'seller' && (
                <Button onClick={() => onNavigate("post-product")} className="bg-[#1a73e8] hover:bg-[#1557b0] shadow-md gap-2">
                    <Package className="w-4 h-4"/> Đăng bán
                </Button>
             )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bids" className="w-full">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
            <TabsList className="bg-transparent p-0 w-full flex justify-start gap-1 min-w-max">
                <TabsTrigger value="bids" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Gavel className="w-4 h-4"/> Đang đấu</TabsTrigger>
                <TabsTrigger value="won" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Trophy className="w-4 h-4"/> Đã thắng</TabsTrigger>
                <TabsTrigger value="watchlist" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Heart className="w-4 h-4"/> Yêu thích</TabsTrigger>
                <TabsTrigger value="feedback" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Star className="w-4 h-4"/> Đánh giá về tôi</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Settings className="w-4 h-4"/> Cài đặt</TabsTrigger>
                {user?.user_type === 'seller' && <TabsTrigger value="my-products" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 gap-2"><Package className="w-4 h-4"/> Kho hàng</TabsTrigger>}
            </TabsList>
          </div>

          {/* TAB: ĐANG ĐẤU GIÁ */}
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
                                     {/* my_highest_bid lấy từ query getMyBid trong bidder.service.ts đã merge */}
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

          {/* TAB: ĐÃ THẮNG */}
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

          {/* TAB: WATCHLIST */}
          <TabsContent value="watchlist" className="outline-none">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {watchlist.map(p => (
                    <ProductCard 
                        key={p.id} 
                        {...p} 
                        price={Number(p.current_price || p.start_price)} 
                        category="Watchlist" 
                        image={p.image || (p.images && p.images[0]) || ""} 
                        onViewDetails={(id) => onNavigate("auction", id)} 
                    />
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

          {/* TAB: SETTINGS */}
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
            <TabsContent value="my-products" className="outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {myProducts.map(p => <ProductCard key={p.id} {...p} price={Number(p.current_price)} category="Kho hàng" image={p.image || (p.images && p.images[0]) || ""} onViewDetails={(id) => onNavigate("auction", id)} />)}
                    {myProducts.length === 0 && <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">Kho hàng trống.</div>}
                </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* --- FIXED PORTAL MODAL (RATING) --- */}
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
    </div>
  );
}

// Component Pagination Bar
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