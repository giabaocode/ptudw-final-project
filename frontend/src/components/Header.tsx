import { ShoppingCart, User, Menu, X, Search } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
  cartItemsCount: number;
}

export function Header({ currentPage, onNavigate, isLoggedIn, cartItemsCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", value: "landing" },
    { label: "Shop", value: "shop" },
    { label: "Auctions", value: "auctions" },
    { label: "Categories", value: "categories" },
    { label: "About", value: "about" },
    { label: "Contact", value: "contact" },
  ];

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
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => onNavigate(item.value)}
                className={`text-gray-700 hover:text-[#0A84FF] transition-colors ${
                  currentPage === item.value ? "text-[#0A84FF]" : ""
                }`}
              >
                {item.label}
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
                  onClick={() => onNavigate("dashboard")}
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
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    onNavigate(item.value);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg ${
                    currentPage === item.value ? "text-[#0A84FF] bg-blue-50" : ""
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {!isLoggedIn && (
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
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
