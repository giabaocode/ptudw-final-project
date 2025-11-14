import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";
import { AuctionPage } from "./components/AuctionPage";
import { ProductPage } from "./components/ProductPage";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { Toaster } from "./components/ui/sonner";
import { useAuth } from "./context/AuthContext"; // 1. Import hook

type Page = 
  | "landing" 
  | "login" 
  | "signup" 
  | "dashboard" 
  | "shop" 
  | "auctions" 
  | "categories"
  | "about"
  | "contact"
  | "auction"
  | "product"
  | "cart"
  | "checkout"
  | "admin"
  | "profile"         // 3. Thêm
  | "post-product";   // 4. Thêm

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [currentId, setCurrentId] = useState<number | null>(null); // 5. State để lưu ID

  const { isLoggedIn } = useAuth(); // 6. Lấy trạng thái đăng nhập từ Context

  const handleNavigate = (page: string, id?: number) => {
    setCurrentPage(page as Page);
    if (id) {
      setCurrentId(id); // 7. Lưu ID khi chuyển trang
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 8. XÓA handleLogin, Context sẽ lo

  const handleAddToCart = () => {
    setCartItemsCount(prev => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "login":
        return <LoginPage onNavigate={handleNavigate} />; // 9. Xóa prop onLogin
      case "signup":
        return <SignupPage onNavigate={handleNavigate} />; // 10. Xóa prop onLogin
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "shop":
      case "auctions":
      case "categories":
      case "about":
      case "contact":
        return <LandingPage onNavigate={handleNavigate} />;
      case "auction":
        // 11. Truyền ID vào
        return <AuctionPage onNavigate={handleNavigate} auctionId={currentId} />;
      case "product":
        // 12. Truyền ID vào
        return <ProductPage onNavigate={handleNavigate} onAddToCart={handleAddToCart} productId={currentId} />;
      case "cart":
        return <CartPage onNavigate={handleNavigate} />;
      case "checkout":
        return <CheckoutPage onNavigate={handleNavigate} />;
      case "admin":
        return <AdminDashboard onNavigate={handleNavigate} />;
  
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showHeaderFooter = currentPage !== "admin";

  return (
    <div className="min-h-screen bg-white">
      {showHeaderFooter && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          // 14. XÓA prop isLoggedIn
          cartItemsCount={cartItemsCount}
        />
      )}
      
      <main>
        {renderPage()}
      </main>
      
      {showHeaderFooter && <Footer />}
      
      <Toaster /> {/* Toaster để hiển thị thông báo lỗi/thành công */}
    </div>
  );
}
