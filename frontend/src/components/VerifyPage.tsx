import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface VerifyPageProps {
  onNavigate: (page: string) => void;
}

export function VerifyPage({ onNavigate }: VerifyPageProps) {
  // Lấy email vừa đăng ký xong từ bộ nhớ tạm
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("registrationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Nếu không có email (do user refresh hoặc vào thẳng link), quay về login
      toast.error("Không tìm thấy thông tin đăng ký.");
      onNavigate("login");
    }
  }, [onNavigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Mã OTP phải có 6 chữ số");
      return;
    }

    setLoading(true);
    try {
      // Gọi API xác thực
      await axios.post("/api/auth/verify", { email, otp });

      toast.success("Xác thực thành công! Đang chuyển đến trang đăng nhập...");

      // Xóa email tạm để dọn dẹp
      localStorage.removeItem("registrationEmail");

      // Chuyển trang sau 1.5s
      setTimeout(() => onNavigate("login"), 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Mã OTP không chính xác hoặc đã hết hạn."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Xác thực Email
          </h1>
          <p className="text-sm text-gray-500 px-4">
            Chúng tôi đã gửi mã OTP 6 số đến <strong>{email}</strong>.
            <br />
            Vui lòng kiểm tra hộp thư (kể cả mục Spam).
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <Label className="text-center block mb-2 text-gray-700">
              Nhập mã OTP
            </Label>
            <div className="flex justify-center">
              <Input
                className="text-center text-3xl tracking-[0.5em] font-bold h-14 w-full border-gray-300 focus:border-[#0A84FF] focus:ring-[#0A84FF] text-[#0A84FF]"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                autoFocus
              />
            </div>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium"
            disabled={loading || otp.length < 6}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <ArrowRight className="mr-2 w-5 h-5" />
            )}
            {loading ? "Đang xác thực..." : "Xác nhận tài khoản"}
          </Button>
        </form>

        <div className="mt-8 text-center border-t pt-6 border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Không nhận được mã?</p>
          <button
            onClick={() => toast.info("Chức năng gửi lại đang phát triển...")}
            className="text-[#0A84FF] hover:underline font-medium text-sm"
          >
            Gửi lại mã
          </button>
          <div className="mt-4">
            <button
              onClick={() => onNavigate("login")}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
