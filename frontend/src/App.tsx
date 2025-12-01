import { useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";
import { AuctionPage } from "./components/AuctionPage";
import { ProductPage } from "./components/ProductPage"; // ProductPage dùng để mua ngay, AuctionPage để đấu giá
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { PostProductPage } from "./components/PostProductPage"; 
import { ProfilePage } from "./components/ProfilePage";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext"; 
import { SellerProfilePage } from "./components/SellerProfilePage";

// Component Wrapper để lấy AuthContext trong App
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState("landing");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const { isLoggedIn } = useAuth();

  const handleNavigate = (page: string, id?: number) => {
    window.scrollTo(0, 0);
    if (page === 'categories') {
        setCurrentPage('landing');
        setCategoryId(id || null);
    } else {
        setCurrentPage(page);
        if (id) setCurrentId(id);
        if (page !== 'landing') setCategoryId(null);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing": return <LandingPage onNavigate={handleNavigate} categoryId={categoryId} />;
      case "login": return <LoginPage onNavigate={handleNavigate} />;
      case "signup": return <SignupPage onNavigate={handleNavigate} />;
      case "dashboard": return isLoggedIn ? <Dashboard onNavigate={handleNavigate} /> : <LoginPage onNavigate={handleNavigate} />;
      case "profile": return isLoggedIn ? <ProfilePage onNavigate={handleNavigate} /> : <LoginPage onNavigate={handleNavigate} />;
      case "auction": return <AuctionPage onNavigate={handleNavigate} auctionId={currentId} />;
      case "product": return <ProductPage onNavigate={handleNavigate} onAddToCart={() => {}} productId={currentId} />;
      case "post-product": return isLoggedIn ? <PostProductPage onNavigate={handleNavigate} /> : <LoginPage onNavigate={handleNavigate} />;
      case "cart": return <CartPage onNavigate={handleNavigate} />;
      case "checkout": return <CheckoutPage onNavigate={handleNavigate} />;
      case "seller-profile":
        return <SellerProfilePage onNavigate={handleNavigate} sellerId={currentId} />;
      default: return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {currentPage !== 'login' && currentPage !== 'signup' && (
        <Header currentPage={currentPage} onNavigate={handleNavigate} cartItemsCount={0} />
      )}
      <main className="flex-grow">{renderPage()}</main>
      {currentPage !== 'login' && currentPage !== 'signup' && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}