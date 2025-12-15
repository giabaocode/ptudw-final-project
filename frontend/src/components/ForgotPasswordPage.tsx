import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Mail, ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });

      toast.success("Đã gửi mã OTP. Vui lòng kiểm tra email.");

      // Lưu email để sang trang reset dùng
      localStorage.setItem("resetEmail", email);

      // Chuyển sang trang nhập mật khẩu mới
      onNavigate("reset-password");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi gửi yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <button
          onClick={() => onNavigate("login")}
          className="flex items-center text-sm text-gray-500 hover:text-[#0A84FF] mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại đăng nhập
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Quên mật khẩu?
          </h1>
          <p className="text-sm text-gray-500">
            Nhập email của bạn và chúng tôi sẽ gửi mã xác thực để đặt lại mật
            khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Email đã đăng ký</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                className="pl-10 h-12"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            className="w-full bg-[#0A84FF] hover:bg-[#0070E0] h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <ArrowRight className="mr-2 w-5 h-5" />
            )}
            {loading ? "Đang gửi..." : "Gửi mã xác thực"}
          </Button>
        </form>
      </div>
    </div>
  );
}
