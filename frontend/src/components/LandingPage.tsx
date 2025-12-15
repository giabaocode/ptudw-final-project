import {
  Search,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ProductCard } from "./ProductCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { Product, Auction } from "../types";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface LandingPageProps {
  onNavigate: (page: string, id?: number) => void;
  categoryId?: number | null;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const ITEMS_PER_PAGE = 8;

const SkeletonCard = () => (
  <div className="space-y-3 bg-white rounded-xl p-4 shadow-sm">
    <Skeleton className="h-48 w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-9 w-full rounded-md mt-2" />
  </div>
);

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-gray-600">
        Trang {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function LandingPage({
  onNavigate,
  categoryId,
  searchQuery,
  onSearch,
}: LandingPageProps) {
  const [topEndingSoon, setTopEndingSoon] = useState<Auction[]>([]);
  const [topMostBids, setTopMostBids] = useState<Auction[]>([]);
  const [topHighestPrice, setTopHighestPrice] = useState<Product[]>([]);
  const [categoryAuctions, setCategoryAuctions] = useState<Auction[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [auctionPage, setAuctionPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState("default");
  const [loading, setLoading] = useState(true);

  // --- [1] TỪ NHÁNH TEST-2: XỬ LÝ WATCHLIST ---
  const { isLoggedIn, token } = useAuth();

  const handleBuyNow = async (productId: number) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để mua hàng.");
      onNavigate("login");
      return;
    }

    if (
      !confirm("Bạn có chắc chắn muốn MUA NGAY sản phẩm này với giá niêm yết?")
    )
      return;

    try {
      await axios.post(
        `/api/bidder/products/${productId}/buy-now`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Mua thành công! Vui lòng thanh toán.");

      // Chuyển hướng ngay đến trang Profile (Tab Đã thắng) để thanh toán
      // Lưu ý: Cần đảm bảo ProfilePage mở đúng tab 'won' (mặc định là 'won' nên ok)
      onNavigate("profile");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi mua ngay.");
    }
  };

  const handleAddToWatchlist = async (
    e: React.MouseEvent,
    productId: number
  ) => {
    e.preventDefault(); // Ngăn chuyển trang
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách theo dõi.");
      onNavigate("login");
      return;
    }
    try {
      await axios.post(
        `/api/bidder/products/${productId}/watchlist`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã thêm vào danh sách theo dõi!");
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.info("Sản phẩm đã có trong danh sách theo dõi của bạn.");
      } else {
        console.error("Lỗi khi thêm vào danh sách theo dõi:", error);
        toast.error("Thêm vào danh sách theo dõi thất bại.");
      }
    }
  };
  // --------------------------------------------

  // --- [2] TỪ NHÁNH PAGINATION: TÌM KIẾM HERO ---
  const [heroKeyword, setHeroKeyword] = useState("");

  const handleHeroSearch = () => {
    if (onSearch && heroKeyword.trim()) {
      onSearch(heroKeyword);
    }
  };
  // ----------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setAuctionPage(1);
      setProductPage(1);

      try {
        let response;
        if (searchQuery) {
          response = await axios.get(`/api/products/search`, {
            params: {
              q: searchQuery,
              page: searchPage,
              limit: ITEMS_PER_PAGE,
              sort: sortOption,
            },
          });
          setSearchResults(response.data.products);
          setSearchTotalPages(response.data.pagination.total_pages);
          setCategoryAuctions([]);
          setCategoryProducts([]);
          setTopEndingSoon([]);
        } else if (categoryId) {
          response = await axios.get(
            `/api/products?category_id=${categoryId}&limit=100`
          );
          const allItems = response.data.products;
          const activeAuctions = allItems.filter(
            (p: any) => new Date(p.end_at) > new Date()
          );
          setCategoryAuctions(activeAuctions);
          setCategoryProducts(allItems);
          setTopEndingSoon([]);
          setTopMostBids([]);
          setTopHighestPrice([]);
        } else {
          response = await axios.get("/api/products/homepage-tops");
          const data = response.data;
          setTopEndingSoon(data.top_ending_soon);
          setTopMostBids(data.top_most_bids);
          setTopHighestPrice(data.top_highest_price);
          setCategoryAuctions([]);
          setCategoryProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId, searchQuery, searchPage, sortOption]);

  const currentAuctions = categoryAuctions.slice(
    (auctionPage - 1) * ITEMS_PER_PAGE,
    auctionPage * ITEMS_PER_PAGE
  );
  const totalAuctionPages = Math.ceil(categoryAuctions.length / ITEMS_PER_PAGE);
  const currentProducts = categoryProducts.slice(
    (productPage - 1) * ITEMS_PER_PAGE,
    productPage * ITEMS_PER_PAGE
  );
  const totalProductPages = Math.ceil(categoryProducts.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-72 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Kết quả tìm kiếm cho:{" "}
              <span className="text-[#0A84FF]">"{searchQuery}"</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[200px] bg-white">
                  <SelectValue placeholder="Mặc định" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Liên quan nhất</SelectItem>
                  <SelectItem value="time_desc">
                    Thời gian kết thúc giảm dần
                  </SelectItem>
                  <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={
                  Number(product.current_price) > 0
                    ? Number(product.current_price)
                    : Number(product.start_price)
                }
                category={product.category || "General"}
                image={
                  product.images && product.images.length > 0
                    ? product.images[0]
                    : ""
                }
                buyNowPrice={
                  product.buy_now_price
                    ? Number(product.buy_now_price)
                    : undefined
                }
                bidderName={product.bidder_name}
                createdAt={product.created_at}
                categoryId={product.category_id}
                onCategoryClick={(id) => onNavigate("categories", id)}
                onViewDetails={(id) => onNavigate("product", id)}
                // Truyền hàm Watchlist vào đây
                onAddToWatchlist={(e) => handleAddToWatchlist(e, product.id)}
                onBuyNow={(id) => handleBuyNow(id)}
              />
            ))}
          </div>
          {searchResults.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Không tìm thấy sản phẩm nào phù hợp.
              </p>
            </div>
          )}
          <PaginationControls
            currentPage={searchPage}
            totalPages={searchTotalPages}
            onPageChange={setSearchPage}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {!categoryId && (
        <section className="bg-gradient-to-br from-[#0A84FF] to-[#0066CC] text-white py-16 px-4 mb-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl mb-4 font-bold">
              Sàn Đấu Giá Trực Tuyến
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Săn hàng độc - Giá cực sốc - Uy tín hàng đầu
            </p>
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  className="pl-10 h-12 bg-white text-gray-900"
                  value={heroKeyword}
                  onChange={(e) => setHeroKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}
                />
              </div>
              <Button
                onClick={handleHeroSearch}
                className="h-12 px-8 bg-[#FFD700] text-gray-900 hover:bg-[#FFD700]/90 font-medium"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </section>
      )}

      {!categoryId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 pb-16">
          {topEndingSoon.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-12">
                <Clock className="h-6 w-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sắp Kết Thúc
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topEndingSoon.map((auction) => (
                  <ProductCard
                    key={auction.id}
                    id={auction.id}
                    name={auction.name}
                    image={
                      auction.images && auction.images.length > 0
                        ? auction.images[0]
                        : ""
                    }
                    bidCount={auction.bid_count || 0}
                    price={
                      Number(auction.current_price) > 0
                        ? Number(auction.current_price)
                        : Number(auction.start_price)
                    }
                    endTime={auction.end_at}
                    category={auction.category || ""}
                    buyNowPrice={auction.buy_now_price}
                    createdAt={auction.created_at}
                    bidderName={auction.bidder_name}
                    categoryId={auction.category_id}
                    onCategoryClick={(id) => onNavigate("categories", id)}
                    onViewDetails={(id) => onNavigate("auction", id)}
                    onAddToWatchlist={(e) =>
                      handleAddToWatchlist(e, auction.id)
                    }
                    onBuyNow={(id) => handleBuyNow(id)}
                  />
                ))}
              </div>
            </section>
          )}
          {topMostBids.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-12">
                <TrendingUp className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Sôi Động Nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topMostBids.map((auction) => (
                  <ProductCard
                    key={auction.id}
                    id={auction.id}
                    name={auction.name}
                    image={
                      auction.images && auction.images.length > 0
                        ? auction.images[0]
                        : ""
                    }
                    bidCount={auction.bid_count || 0}
                    price={
                      Number(auction.current_price) > 0
                        ? Number(auction.current_price)
                        : Number(auction.start_price)
                    }
                    endTime={auction.end_at}
                    category={auction.category || ""}
                    buyNowPrice={auction.buy_now_price}
                    createdAt={auction.created_at}
                    bidderName={auction.bidder_name}
                    categoryId={auction.category_id}
                    onCategoryClick={(id) => onNavigate("categories", id)}
                    onViewDetails={(id) => onNavigate("auction", id)}
                    onAddToWatchlist={(e) =>
                      handleAddToWatchlist(e, auction.id)
                    }
                    onBuyNow={(id) => handleBuyNow(id)}
                  />
                ))}
              </div>
            </section>
          )}
          {topHighestPrice.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-12">
                <DollarSign className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Top Giá Cao Nhất
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topHighestPrice.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={
                      Number(product.current_price) > 0
                        ? Number(product.current_price)
                        : Number(product.start_price)
                    }
                    category={product.category || "General"}
                    image={
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : ""
                    }
                    endTime={product.end_at}
                    bidCount={product.bid_count}
                    buyNowPrice={product.buy_now_price}
                    createdAt={product.created_at}
                    bidderName={product.bidder_name}
                    categoryId={product.category_id}
                    onCategoryClick={(id) => onNavigate("categories", id)}
                    onViewDetails={(id) => onNavigate("product", id)}
                    onAddToWatchlist={(e) =>
                      handleAddToWatchlist(e, product.id)
                    }
                    onBuyNow={(id) => handleBuyNow(id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {categoryId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16 pt-8">
          {currentAuctions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-12">
                <Clock className="h-6 w-6 text-[#FFD700]" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Đang đấu giá trong danh mục này
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentAuctions.map((auction) => (
                  <ProductCard
                    key={auction.id}
                    id={auction.id}
                    name={auction.name}
                    price={
                      Number(auction.current_price) > 0
                        ? Number(auction.current_price)
                        : Number(auction.start_price)
                    }
                    category={auction.category || "Đấu giá"}
                    image={
                      auction.images && auction.images.length > 0
                        ? auction.images[0]
                        : ""
                    }
                    endTime={auction.end_at}
                    bidCount={auction.bid_count}
                    bidderName={auction.bidder_name}
                    buyNowPrice={
                      auction.buy_now_price
                        ? Number(auction.buy_now_price)
                        : undefined
                    }
                    createdAt={auction.created_at}
                    categoryId={auction.category_id}
                    onCategoryClick={(id) => onNavigate("categories", id)}
                    onViewDetails={(id) => onNavigate("auction", id)}
                    onAddToWatchlist={(e) =>
                      handleAddToWatchlist(e, auction.id)
                    }
                    onBuyNow={(id) => handleBuyNow(id)}
                  />
                ))}
              </div>
              <PaginationControls
                currentPage={auctionPage}
                totalPages={totalAuctionPages}
                onPageChange={setAuctionPage}
              />
            </section>
          )}

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-12">
              Tất cả sản phẩm
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={
                    Number(product.current_price) > 0
                      ? Number(product.current_price)
                      : Number(product.start_price)
                  }
                  category={product.category || "General"}
                  image={
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : ""
                  }
                  endTime={product.end_at}
                  bidCount={product.bid_count}
                  bidderName={product.bidder_name}
                  buyNowPrice={
                    product.buy_now_price
                      ? Number(product.buy_now_price)
                      : undefined
                  }
                  createdAt={product.created_at}
                  categoryId={product.category_id}
                  onCategoryClick={(id) => onNavigate("categories", id)}
                  onViewDetails={(id) => onNavigate("product", id)}
                  onAddToWatchlist={(e) => handleAddToWatchlist(e, product.id)}
                  onBuyNow={(id) => handleBuyNow(id)}
                />
              ))}

              {currentProducts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Không tìm thấy sản phẩm nào trong danh mục này.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => onNavigate("landing")}
                    className="mt-2 text-[#0A84FF]"
                  >
                    Quay về trang chủ
                  </Button>
                </div>
              )}
            </div>
            <PaginationControls
              currentPage={productPage}
              totalPages={totalProductPages}
              onPageChange={setProductPage}
            />
          </section>
        </div>
      )}
    </div>
  );
}
