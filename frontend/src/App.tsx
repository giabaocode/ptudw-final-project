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
  | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const handleNavigate = (page: string, id?: number) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleAddToCart = () => {
    setCartItemsCount((prev) => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "login":
        return <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      case "signup":
        return <SignupPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "shop":
      case "auctions":
      case "categories":
      case "about":
      case "contact":
        return <LandingPage onNavigate={handleNavigate} />;
      case "auction":
        return <AuctionPage onNavigate={handleNavigate} />;
      case "product":
        return (
          <ProductPage
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        );
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
          isLoggedIn={isLoggedIn}
          cartItemsCount={cartItemsCount}
        />
      )}

      <main>{renderPage()}</main>

      {showHeaderFooter && <Footer />}

      <Toaster />
    </div>
  );
}
