import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Lock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [email, setEmail] = useState("");

  // State quản lý các bước: 1 = Nhập OTP, 2 = Nhập Pass mới
  const [step, setStep] = useState<1 | 2>(1);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("Vui lòng nhập email trước.");
      onNavigate("forgot-password");
    }
  }, [onNavigate]);

  // --- BƯỚC 1: XÁC THỰC OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Mã OTP phải có 6 số.");

    setLoading(true);
    try {
      // Gọi API kiểm tra OTP trước
      await axios.post("/api/auth/verify-reset-otp", { email, otp });
      toast.success("Mã OTP hợp lệ!");
      setStep(2); // Chuyển sang bước 2
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã OTP không đúng.");
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 2: ĐỔI MẬT KHẨU ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
    if (newPassword !== confirmPassword)
      return toast.error("Mật khẩu xác nhận không khớp.");

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { email, otp, newPassword });

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập.");
      localStorage.removeItem("resetEmail");

      setTimeout(() => onNavigate("login"), 1500);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Đặt lại mật khẩu thất bại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 1 ? (
              <KeyRound className="w-8 h-8" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 ? "Xác thực OTP" : "Đặt lại mật khẩu"}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 1 ? (
              <span>
                Mã OTP đã được gửi tới <strong>{email}</strong>
              </span>
            ) : (
              "Vui lòng nhập mật khẩu mới của bạn."
            )}
          </p>
        </div>

        {/* --- FORM BƯỚC 1: NHẬP OTP --- */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <Label className="text-center block mb-2">
                Nhập mã OTP (6 số)
              </Label>
              <div className="flex justify-center">
                <Input
                  className="text-center text-3xl tracking-[0.5em] font-bold h-14 w-full border-gray-300 focus:border-green-500 focus:ring-green-500 text-green-700"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <ArrowRight className="mr-2 w-5 h-5" />
              )}
              {loading ? "Đang kiểm tra..." : "Xác thực OTP"}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => onNavigate("forgot-password")}
                className="text-sm text-gray-500 hover:underline"
              >
                Gửi lại mã?
              </button>
            </div>
          </form>
        )}

        {/* --- FORM BƯỚC 2: ĐỔI MẬT KHẨU --- */}
        {step === 2 && (
          <form
            onSubmit={handleResetPassword}
            className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <div>
              <Label>Mật khẩu mới</Label>
              <Input
                type="password"
                className="mt-2 h-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>

            <div>
              <Label>Nhập lại mật khẩu</Label>
              <Input
                type="password"
                className="mt-2 h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              className="w-full bg-[#0A84FF] hover:bg-[#0070E0] h-12 text-base mt-4"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="mr-2 w-5 h-5" />
              )}
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
