import { ShoppingCart, User, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Category } from "../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Search } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, id?: number) => void;
  cartItemsCount: number;
  onSearch?: (query: string) => void; // Prop mới optional
}

export function Header({
  currentPage,
  onNavigate,
  cartItemsCount,
  onSearch,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState("");

  const handleSearchSubmit = () => {
    if (onSearch && keyword.trim()) {
      onSearch(keyword);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearchSubmit();
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
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate("landing")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">AB</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AuctionBay</span>
          </div>
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] outline-none text-sm bg-gray-50"
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

          {/* --- MENU DESKTOP 2 CẤP --- */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate("landing")}
              className={`text-sm font-medium transition-colors hover:text-[#0A84FF] ${
                currentPage === "landing" ? "text-[#0A84FF]" : "text-gray-700"
              }`}
            >
              Trang chủ
            </button>

            {categories.map((parent) => (
              <div key={parent.id}>
                {/* Nếu có con thì dùng Dropdown, không thì hiển thị nút thường */}
                {parent.children && parent.children.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#0A84FF] outline-none">
                      {parent.name} <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {parent.children.map((child) => (
                        <DropdownMenuItem
                          key={child.id}
                          onClick={() => onNavigate("categories", child.id)}
                          className="cursor-pointer"
                        >
                          {child.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    onClick={() => onNavigate("categories", parent.id)}
                    className="text-sm font-medium text-gray-700 hover:text-[#0A84FF]"
                  >
                    {parent.name}
                  </button>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => onNavigate("cart")}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FFD700] text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavigate("profile")}
                  title="Hồ sơ cá nhân"
                >
                  <User className="h-5 w-5" />
                </Button>
                {/* Nút Logout cho Desktop */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout();
                    onNavigate("landing");
                  }}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate("login")}
                  className="hidden sm:flex"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => onNavigate("signup")}
                  className="hidden sm:flex bg-[#0A84FF] hover:bg-[#0A84FF]/90"
                >
                  Đăng ký
                </Button>
              </>
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

        {/* --- MENU MOBILE (Hiển thị dạng danh sách phẳng cho dễ dùng) --- */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onNavigate("landing");
                  setMobileMenuOpen(false);
                }}
                className="text-left px-4 py-2 font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                Trang chủ
              </button>

              {categories.map((parent) => (
                <div key={parent.id} className="px-4 py-2">
                  <div className="font-bold text-gray-900 mb-2">
                    {parent.name}
                  </div>
                  <div className="pl-4 flex flex-col gap-2 border-l-2 border-gray-100">
                    {parent.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onNavigate("categories", child.id);
                          setMobileMenuOpen(false);
                        }}
                        className="text-left text-sm text-gray-600 hover:text-[#0A84FF]"
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Mobile Auth Buttons */}
              <div className="border-t pt-4 mt-2 px-4 space-y-3">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        onNavigate("profile");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 font-medium"
                    >
                      Hồ sơ cá nhân
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2 text-red-600 font-medium"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onNavigate("login");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2 border rounded-lg"
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => {
                        onNavigate("signup");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-2 bg-[#0A84FF] text-white rounded-lg"
                    >
                      Đăng ký
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
