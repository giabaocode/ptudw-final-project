// File: frontend/src/App.tsx
// ✅ Phiên bản chuẩn chỉnh: clean, đúng type, tích hợp Google OAuth

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Import Provider

// Layout & pages
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { Dashboard } from "./components/Dashboard";
import { SellerDashboard } from "./components/SellerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { AuctionPage } from "./components/AuctionPage";
import { ProductPage } from "./components/ProductPage";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { PostProductPage } from "./components/PostProductPage";
import { ProfilePage } from "./components/ProfilePage";
import { SellerProfilePage } from "./components/SellerProfilePage";
import { VerifyPage } from "./components/VerifyPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";

// --- CẤU HÌNH GOOGLE CLIENT ID ---
// Bạn nên để cái này trong file .env (VD: import.meta.env.VITE_GOOGLE_CLIENT_ID)
const GOOGLE_CLIENT_ID = "1083069827194-a01bkt81soe42hgdog4sp2st0cf7kd2b.apps.googleusercontent.com"; 

// ===============================
// Main Layout
// ===============================
const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const hideHeaderFooter = ["/login", "/signup"].includes(location.pathname);

  const handleNavigate = (page: string, id?: number) => {
    if (page === "landing") navigate("/");
    else if (id) navigate(`/${page}/${id}`);
    else navigate(`/${page}`);
  };

  const handleSearch = (query: string) => {
    navigate(`/?search=${query}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!hideHeaderFooter && (
        <Header
          currentPage={location.pathname.replace("/", "") || "landing"}
          onNavigate={handleNavigate}
          cartItemsCount={0}
          onSearch={handleSearch}
        />
      )}

      <main className="flex-grow">{children}</main>

      {!hideHeaderFooter && <Footer />}
      <Toaster position="top-center" />
    </div>
  );
};

// ===============================
// Protected Route
// ===============================
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ===============================
// Smart Dashboard (role-based)
// ===============================
const SmartDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (page: string, id?: number) => {
    if (id) navigate(`/${page}/${id}`);
    else navigate(`/${page}`);
  };

  if (user?.user_type === "admin") {
    return <AdminDashboard onNavigate={handleNavigate} />;
  }

  if (user?.user_type === "seller") {
    return <SellerDashboard onNavigate={handleNavigate} />;
  }

  return <Dashboard onNavigate={handleNavigate} />;
};

// ===============================
// App Root
// ===============================
export default function App() {
  return (
    // Bọc GoogleOAuthProvider ở ngoài cùng hoặc bao quanh Router/AuthProvider
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomeWrapper />} />
              <Route path="/login" element={<LoginWrapper />} />
              <Route path="/signup" element={<SignupWrapper />} />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordWrapper />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordWrapper />}
              />
              <Route path="/verify" element={<VerifyWrapper />} />

              {/* Product & Auction */}
              <Route path="/auction/:id" element={<AuctionWrapper />} />
              <Route path="/product/:id" element={<ProductWrapper />} />
              <Route
                path="/seller-profile/:id"
                element={<SellerProfileWrapper />}
              />

              {/* Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <SmartDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileWrapper />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/post-product"
                element={
                  <ProtectedRoute allowedRoles={["seller"]}>
                    <PostProductWrapper />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartWrapper />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutWrapper />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// ===============================
// Wrappers (legacy compatibility)
// ===============================
const HomeWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  return (
    <LandingPage
      onNavigate={(p, id) => (id ? navigate(`/${p}/${id}`) : navigate(`/${p}`))}
      searchQuery={searchParams.get("search") || ""}
      categoryId={
        searchParams.get("categoryId")
          ? Number(searchParams.get("categoryId"))
          : null
      }
      onSearch={(q) => navigate(`/?search=${q}`)}
    />
  );
};

const LoginWrapper = () => {
  const navigate = useNavigate();
  return (
    <LoginPage onNavigate={(p) => navigate(p === "landing" ? "/" : `/${p}`)} />
  );
};

const SignupWrapper = () => {
  const navigate = useNavigate();
  return (
    <SignupPage onNavigate={(p) => navigate(p === "landing" ? "/" : `/${p}`)} />
  );
};

const ForgotPasswordWrapper = () => {
  const navigate = useNavigate();
  return <ForgotPasswordPage onNavigate={(p) => navigate(`/${p}`)} />;
};

const ResetPasswordWrapper = () => {
  const navigate = useNavigate();
  return <ResetPasswordPage onNavigate={(p) => navigate(`/${p}`)} />;
};

const VerifyWrapper = () => {
  const navigate = useNavigate();
  return <VerifyPage onNavigate={(p) => navigate(`/${p}`)} />;
};

const AuctionWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <AuctionPage
      auctionId={Number(id)}
      onNavigate={(p, pid) =>
        pid ? navigate(`/${p}/${pid}`) : navigate(`/${p}`)
      }
    />
  );
};

const ProductWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ProductPage
      productId={Number(id)}
      onNavigate={(p, pid) =>
        pid ? navigate(`/${p}/${pid}`) : navigate(`/${p}`)
      }
      onAddToCart={() => {}}
    />
  );
};

const SellerProfileWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <SellerProfilePage
      sellerId={Number(id)}
      onNavigate={(p, pid) =>
        pid ? navigate(`/${p}/${pid}`) : navigate(`/${p}`)
      }
    />
  );
};

const ProfileWrapper = () => {
  const navigate = useNavigate();
  return <ProfilePage onNavigate={(p) => navigate(`/${p}`)} />;
};

const PostProductWrapper = () => {
  const navigate = useNavigate();
  return <PostProductPage onNavigate={(p) => navigate(`/${p}`)} />;
};

const CartWrapper = () => {
  const navigate = useNavigate();
  return <CartPage onNavigate={(p) => navigate(`/${p}`)} />;
};

const CheckoutWrapper = () => {
  const navigate = useNavigate();
  return <CheckoutPage onNavigate={(p) => navigate(`/${p}`)} />;
};