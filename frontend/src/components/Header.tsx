import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Category } from "../types";
import { Link, useNavigate } from "react-router-dom"; // Import Link & useNavigate
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, id?: number) => void;
  cartItemsCount: number;
  onSearch?: (query: string) => void;
}

export function Header({
  currentPage,
  onNavigate, // Vẫn giữ props này để tương thích ngược nếu cần, nhưng ưu tiên dùng Link/navigate
  cartItemsCount,
  onSearch,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate(); // Hook điều hướng

  const handleSearchSubmit = () => {
    if (keyword.trim()) {
      if (onSearch) {
        onSearch(keyword);
      } else {
        // Fallback: Tự điều hướng nếu không có prop onSearch
        navigate(`/?search=${keyword}`);
      }
      setMobileMenuOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AB</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AuctionBay</span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] outline-none text-sm bg-gray-50 transition-all"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSearchSubmit}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0A84FF]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* --- MENU DESKTOP --- */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-[#0A84FF] ${
                currentPage === "landing" ? "text-[#0A84FF]" : "text-gray-700"
              }`}
            >
              Trang chủ
            </Link>

            {categories.map((parent) => (
              <div key={parent.id}>
                {parent.children && parent.children.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#0A84FF] outline-none">
                      {parent.name} <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {parent.children.map((child) => (
                        <DropdownMenuItem key={child.id} asChild>
                          <Link
                            to={`/?categoryId=${child.id}`}
                            className="cursor-pointer w-full block"
                          >
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    to={`/?categoryId=${parent.id}`}
                    className="text-sm font-medium text-gray-700 hover:text-[#0A84FF]"
                  >
                    {parent.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {isLoggedIn ? (
              <>
                {/* Giỏ hàng */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  asChild
                ></Button>

                {/* Profile */}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Hồ sơ cá nhân"
                  asChild
                >
                  <Link to="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>

                {/* Nút Admin (Chỉ hiện nếu là Admin) */}
                {user?.user_type === "admin" && (
                  <Button
                    variant="ghost"
                    asChild
                    className="hidden sm:flex text-red-600 font-bold hover:text-red-700 hover:bg-red-50"
                  >
                    <Link to="/dashboard">Admin CP</Link>
                  </Button>
                )}

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Đăng nhập</Link>
                </Button>
                <Button
                  className="bg-[#0A84FF] hover:bg-[#0A84FF]/90 shadow-md shadow-blue-500/20"
                  asChild
                >
                  <Link to="/signup">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* --- MENU MOBILE --- */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-5 duration-200">
            <nav className="flex flex-col gap-2">
              {/* Mobile Search */}
              <div className="px-4 mb-4 relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:ring-1 focus:ring-[#0A84FF] outline-none"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 font-medium text-gray-900 bg-gray-50 mx-4 rounded-lg"
              >
                Trang chủ
              </Link>

              {categories.map((parent) => (
                <div key={parent.id} className="px-4 py-2">
                  <div className="font-bold text-gray-900 mb-2 flex items-center justify-between">
                    {parent.name}
                  </div>
                  <div className="pl-4 flex flex-col gap-2 border-l-2 border-gray-100 ml-1">
                    {parent.children?.map((child) => (
                      <Link
                        key={child.id}
                        to={`/?categoryId=${child.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-gray-600 hover:text-[#0A84FF] py-1 block"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="border-t pt-4 mt-2 px-4 space-y-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2 font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2"
                    >
                      Hồ sơ cá nhân
                    </Link>

                    {user?.user_type === "seller" && (
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full py-2 font-medium text-blue-600 hover:bg-blue-50 rounded-lg px-2"
                      >
                        Quản lý kho hàng
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg px-2"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 bg-[#0A84FF] text-white rounded-lg font-medium hover:bg-[#0070E0] shadow-sm"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
