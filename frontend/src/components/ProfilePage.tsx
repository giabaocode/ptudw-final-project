import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { ProductCard } from "./ProductCard";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Product } from "../types";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";
import { ArrowUpCircle, Trophy, Star, Heart, Gavel, Package, Settings, User, Lock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input"; // Nhớ import Input
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProfilePageProps {
  onNavigate: (page: string, id?: number) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, token } = useAuth();
  
  // State dữ liệu
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [myBids, setMyBids] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [wonAuctions, setWonAuctions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State: Xin nâng cấp
  const [isUpgrading, setIsUpgrading] = useState(false);

  // State: Đánh giá
  const [ratingProduct, setRatingProduct] = useState<number | null>(null);
  const [ratingScore, setRatingScore] = useState<"positive" | "negative">("positive");
  const [ratingComment, setRatingComment] = useState("");

  // State: Chỉnh sửa Profile [MỚI]
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", address: "", dob: "" });
  const [passForm, setPassForm] = useState({ oldPass: "", newPass: "" });
  const [activeSettingsTab, setActiveSettingsTab] = useState("info");

  useEffect(() => {
    if (!token) return;
    if (user) {
        // Điền sẵn thông tin vào form edit
        setEditForm({
            full_name: user.full_name || "",
            email: user.email || "",
            address: "", // Backend cần trả về address nếu muốn hiện
            dob: ""      // Backend cần trả về dob nếu muốn hiện
        });
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            // Gọi song song các API để tiết kiệm thời gian
            const [resWatch, resBids, resWon] = await Promise.all([
                axios.get("/api/bidder/watchlist", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/bidder/my-bids", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/bidder/won-auctions", { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setWatchlist(resWatch.data);
            setMyBids(resBids.data);
            setWonAuctions(resWon.data);

            if (user?.user_type === 'seller') {
                const resProds = await axios.get("/api/seller/my-products", { headers: { Authorization: `Bearer ${token}` } });
                setMyProducts(resProds.data.products); 
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu profile:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [token, user]);

  // Hàm xử lý Update Info [MỚI]
  const handleUpdateInfo = async () => {
    try {
        await axios.put("/api/auth/profile", editForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Cập nhật thông tin thành công!");
        setShowProfileModal(false);
        // Có thể cần reload lại trang hoặc cập nhật context user
        window.location.reload(); 
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi cập nhật.");
    }
  };

  // Hàm xử lý Đổi mật khẩu [MỚI]
  const handleChangePass = async () => {
    if (!passForm.oldPass || !passForm.newPass) {
        toast.error("Vui lòng nhập đủ thông tin");
        return;
    }
    try {
        await axios.put("/api/auth/change-password", passForm, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đổi mật khẩu thành công!");
        setPassForm({ oldPass: "", newPass: "" });
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi đổi mật khẩu.");
    }
  };

  // Các hàm cũ (Upgrade, Rate) giữ nguyên
  const handleRequestUpgrade = async () => {
    try {
        setIsUpgrading(true);
        await axios.post("/api/bidder/upgrade-request", { reason: "Tôi muốn bán hàng." }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đã gửi yêu cầu thành công! Vui lòng chờ Admin duyệt.");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi gửi yêu cầu.");
    } finally {
        setIsUpgrading(false);
    }
  };

  const handleRateSeller = async () => {
    if (!ratingProduct) return;
    try {
        await axios.post(`/api/bidder/products/${ratingProduct}/rate`, { score: ratingScore, comment: ratingComment }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Đánh giá người bán thành công!");
        setRatingProduct(null);
        setRatingComment("");
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi đánh giá.");
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Hồ Sơ */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                 {user?.full_name?.charAt(0) || "U"}
             </div>
             <div>
                <h1 className="text-2xl text-gray-900 font-bold flex items-center gap-2">
                    {user?.full_name}
                    {/* NÚT CÀI ĐẶT TÀI KHOẢN [MỚI] */}
                    <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Cài đặt tài khoản</DialogTitle>
                            </DialogHeader>
                            <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info" className="gap-2"><User className="w-4 h-4"/> Thông tin</TabsTrigger>
                                    <TabsTrigger value="security" className="gap-2"><Lock className="w-4 h-4"/> Mật khẩu</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Họ và tên</Label>
                                        <Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ngày sinh</Label>
                                        <Input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Địa chỉ</Label>
                                        <Input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                                    </div>
                                    <Button onClick={handleUpdateInfo} className="w-full bg-blue-600 mt-2">Lưu thay đổi</Button>
                                </TabsContent>
                                <TabsContent value="security" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Mật khẩu cũ</Label>
                                        <Input type="password" value={passForm.oldPass} onChange={e => setPassForm({...passForm, oldPass: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mật khẩu mới</Label>
                                        <Input type="password" value={passForm.newPass} onChange={e => setPassForm({...passForm, newPass: e.target.value})} />
                                    </div>
                                    <Button onClick={handleChangePass} className="w-full bg-red-600 mt-2 hover:bg-red-700">Đổi mật khẩu</Button>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </h1>
                <p className="text-gray-500">{user?.email}</p>
                {/* ... (Giữ nguyên phần Badge uy tín) ... */}
             </div>
          </div>
          
          <div className="flex gap-3">
             {user?.user_type === 'bidder' && (
                <Button variant="outline" className="gap-2 border-blue-500 text-blue-600" onClick={handleRequestUpgrade} disabled={isUpgrading}>
                    <ArrowUpCircle className="w-4 h-4" />
                    {isUpgrading ? "Đang gửi..." : "Xin lên Seller"}
                </Button>
             )}
             {user?.user_type === 'seller' && (
                <Button onClick={() => onNavigate("post-product")} className="bg-[#0A84FF]">+ Đăng bán</Button>
             )}
          </div>
        </div>

        <Tabs defaultValue="watchlist" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm inline-flex h-auto flex-wrap">
            <TabsTrigger value="watchlist" className="py-2 px-4 gap-2"><Heart className="w-4 h-4"/> Đang theo dõi ({watchlist.length})</TabsTrigger>
            <TabsTrigger value="bids" className="py-2 px-4 gap-2"><Gavel className="w-4 h-4"/> Đang đấu giá ({myBids.length})</TabsTrigger>
            <TabsTrigger value="won-auctions" className="py-2 px-4 gap-2"><Trophy className="w-4 h-4 text-yellow-600"/> Đã thắng ({wonAuctions.length})</TabsTrigger>
            {user?.user_type === 'seller' && (
                <TabsTrigger value="my-products" className="py-2 px-4 gap-2"><Package className="w-4 h-4"/> Kho hàng ({myProducts.length})</TabsTrigger>
            )}
          </TabsList>

          {/* TAB WATCHLIST */}
          <TabsContent value="watchlist">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchlist.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={Number(p.current_price) > 0 ? Number(p.current_price) : Number(p.start_price)}
                    category={p.category || "Yêu thích"}
                    image={p.image || (p.images && p.images.length > 0 ? p.images[0] : "https://placehold.co/600x400?text=No+Image")}
                    onViewDetails={(id) => onNavigate("auction", id)}
                  />
              ))}
              {watchlist.length === 0 && <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl">Chưa theo dõi sản phẩm nào.</div>}
            </div>
          </TabsContent>

          {/* TAB MY BIDS */}
          <TabsContent value="bids">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBids.map((p) => (
                 <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={Number(p.current_price)}
                    category={"Đã đặt giá"}
                    image={p.image || "https://placehold.co/600x400?text=No+Image"}
                    onViewDetails={(id) => onNavigate("auction", id)}
                 />
              ))}
              {myBids.length === 0 && <p className="col-span-full text-center text-gray-500 py-12 bg-white rounded-xl">Chưa tham gia đấu giá nào.</p>}
            </div>
          </TabsContent>

          {/* TAB WON AUCTIONS (MỚI) */}
          <TabsContent value="won-auctions">
            <div className="space-y-4">
                {wonAuctions.length === 0 && <p className="text-center text-gray-500 py-12 bg-white rounded-xl">Bạn chưa thắng sản phẩm nào.</p>}
                {wonAuctions.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border bg-gray-100">
                                <ImageWithFallback src={p.image || ""} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                                <p className="text-sm text-gray-500">Giá thắng: <span className="text-green-600 font-bold text-base">${Number(p.current_price).toLocaleString()}</span></p>
                                <p className="text-xs text-gray-400 mt-1">Kết thúc: {new Date(p.end_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        {/* Nút Đánh giá (Dialog) */}
                        <Dialog open={ratingProduct === p.id} onOpenChange={(open : any) => !open && setRatingProduct(null)}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setRatingProduct(p.id)} variant="secondary" className="gap-2 border shadow-sm">
                                    <Star className="w-4 h-4 text-yellow-500" /> Đánh giá Seller
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Đánh giá giao dịch</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Mức độ hài lòng</Label>
                                        <RadioGroup defaultValue="positive" onValueChange={(v: any) => setRatingScore(v)} className="flex gap-4 mt-2">
                                            <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-green-50 transition-colors">
                                                <RadioGroupItem value="positive" id="r1" />
                                                <Label htmlFor="r1" className="cursor-pointer font-bold text-green-600 flex items-center gap-1">
                                                    👍 Hài lòng (+1)
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                                                <RadioGroupItem value="negative" id="r2" />
                                                <Label htmlFor="r2" className="cursor-pointer font-bold text-red-600 flex items-center gap-1">
                                                    👎 Không hài lòng (-1)
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Nhận xét chi tiết</Label>
                                        <Textarea 
                                            placeholder="Hãy chia sẻ trải nghiệm của bạn về người bán..." 
                                            value={ratingComment} 
                                            onChange={e => setRatingComment(e.target.value)} 
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleRateSeller} className="bg-[#0A84FF]">Gửi đánh giá</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ))}
            </div>
          </TabsContent>

          {/* TAB MY PRODUCTS (Seller Only) */}
          <TabsContent value="my-products">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProducts.map((p) => (
                 <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={Number(p.current_price)}
                    category={"Sản phẩm của tôi"}
                    image={p.image || "https://placehold.co/600x400?text=No+Image"}
                    onViewDetails={(id) => onNavigate("auction", id)}
                 />
              ))}
              {myProducts.length === 0 && <p className="col-span-full text-center text-gray-500 py-12 bg-white rounded-xl">Chưa đăng bán sản phẩm nào.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}