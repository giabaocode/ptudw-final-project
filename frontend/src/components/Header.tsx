import { ShoppingCart, User, Menu, X, Search , LogOut} from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Category } from "../types";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, id?: number) => void;
  //isLoggedIn: boolean;
  cartItemsCount: number;
}

export function Header({ currentPage, onNavigate,  cartItemsCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, logout }  = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
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
            onClick={() => onNavigate(isLoggedIn ? "dashboard" : "landing")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-white">AB</span>
            </div>
            <span className="text-xl text-gray-900">AuctionBay</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate("landing")}
              className={`text-gray-700 hover:text-[#0A84FF] transition-colors ${
                currentPage === "landing" ? "text-[#0A84FF]" : ""
              }`}>
              Home
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate("categories", cat.id)}
                  className={`ml-4 text-gray-700 hover:text-[#0A84FF] transition-colors ${
                    currentPage === cat.name ? "text-[#0A84FF]" : ""
                  }`}
                >
                  {cat.name}
                </button>
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
                >
                  <User className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate("login")}
                  className="hidden sm:flex"
                >
                  Login
                </Button>
                <Button
                  onClick={() => onNavigate("signup")}
                  className="hidden sm:flex bg-[#0A84FF] hover:bg-[#0A84FF]/90"
                >
                  Sign Up
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
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-3">
              {/* Nút Home tĩnh */}
              <button
                onClick={() => {
                  onNavigate("landing");
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg ${
                  currentPage === "landing" ? "text-[#0A84FF] bg-blue-50" : ""
                }`}
              >
                Home
              </button>

              {/* Vòng lặp Categories (Dữ liệu động) */}
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onNavigate("categories", cat.id);
                    setMobileMenuOpen(false); // Đóng menu sau khi chuyển hướng
                  }}
                  className={`text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg ${
                    currentPage === cat.name ? "text-[#0A84FF] bg-blue-50" : ""
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              
              {/* --- KHỐI XỬ LÝ AUTH MOBILE --- */}
              {isLoggedIn ? (
                // HIỂN THỊ LOGOUT KHI ĐÃ ĐĂNG NHẬP
                <>
                  <button
                    onClick={() => onNavigate("profile")}
                    className="text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Hồ sơ
                  </button>
                  <button
                    onClick={() => {
                      logout(); // Gọi hàm logout từ AuthContext
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                // HIỂN THỊ LOGIN/SIGNUP KHI CHƯA ĐĂNG NHẬP
                <>
                  <button
                    onClick={() => {
                      onNavigate("login");
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("signup");
                      setMobileMenuOpen(false);
                    }}
                    className="text-left px-4 py-2 bg-[#0A84FF] text-white rounded-lg hover:bg-[#0A84FF]/90"
                  >
                    Sign Up
                  </button>
                </>
              )}
              {/* --- HẾT KHỐI AUTH MOBILE --- */}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
