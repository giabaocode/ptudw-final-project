import {
  Mail,
  Lock,
  User as UserIcon,
  Store,
  MapPin,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  // State cho Captcha
  const [isNotRobot, setIsNotRobot] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- HÀM XỬ LÝ CLICK CAPTCHA ---
  const handleCaptchaClick = () => {
    if (isNotRobot || isVerifying) return;

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setIsNotRobot(true);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    if (!isNotRobot) {
      toast.error("Vui lòng xác nhận bạn không phải là người máy.");
      return;
    }

    try {
      const payload = {
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        user_type: accountType,
        recaptcha_token: "SKIP_CAPTCHA_TEST_MODE",
      };

      await axios.post("/api/auth/register", payload);

      toast.info("Mã xác thực đã được gửi đến email của bạn.");

      localStorage.setItem("registrationEmail", formData.email);

      onNavigate("verify");
    } catch (error: any) {
      console.error("Signup failed:", error);
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white font-bold">AB</span>
            </div>
            <h1 className="text-3xl text-gray-900 font-bold mb-2">
              Tạo tài khoản mới
            </h1>
            <p className="text-gray-600">
              Tham gia AuctionBay để bắt đầu mua sắm và kinh doanh
            </p>
          </div>

          <div className="mb-6">
            <Label className="mb-3 block text-sm font-medium text-gray-700">
              Bạn là
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                  accountType === "buyer"
                    ? "border-[#0A84FF] bg-blue-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="buyer"
                  checked={accountType === "buyer"}
                  onChange={() => setAccountType("buyer")}
                  className="sr-only"
                />
                <UserIcon
                  className={`mb-2 h-6 w-6 ${
                    accountType === "buyer" ? "text-[#0A84FF]" : "text-gray-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    accountType === "buyer" ? "text-[#0A84FF]" : "text-gray-700"
                  }`}
                >
                  Người mua
                </span>
              </label>

              <label
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
                  accountType === "seller"
                    ? "border-[#0A84FF] bg-blue-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="seller"
                  checked={accountType === "seller"}
                  onChange={() => setAccountType("seller")}
                  className="sr-only"
                />
                <Store
                  className={`mb-2 h-6 w-6 ${
                    accountType === "seller"
                      ? "text-[#0A84FF]"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`font-medium ${
                    accountType === "seller"
                      ? "text-[#0A84FF]"
                      : "text-gray-700"
                  }`}
                >
                  Người bán
                </span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Họ và tên</Label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="pl-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Địa chỉ Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nguoidung@vidu.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Địa chỉ liên hệ</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Số 123, Đường ABC, TP.HCM"
                  className="pl-10"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Tạo mật khẩu của bạn"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* --- CAPTCHA VIỆT HÓA --- */}
            <div className="flex justify-center pt-4">
              <div className="flex items-center p-3 bg-[#f9f9f9] border border-[#d3d3d3] rounded-[3px] w-fit min-w-[300px] shadow-[0_0_4px_1px_rgba(0,0,0,0.08)] select-none hover:bg-[#f0f0f0] transition-colors">
                <div
                  onClick={handleCaptchaClick}
                  className={`
                            w-[28px] h-[28px] bg-white border-[2px] rounded-[2px] flex items-center justify-center cursor-pointer mr-3 transition-all duration-200
                            ${
                              isNotRobot
                                ? "border-transparent"
                                : "border-[#c1c1c1] hover:border-[#b2b2b2]"
                            }
                        `}
                >
                  {isVerifying ? (
                    <Loader2
                      className="w-6 h-6 text-[#0A84FF] animate-spin-smooth"
                      strokeWidth={2.5}
                    />
                  ) : isNotRobot ? (
                    <Check
                      className="w-7 h-7 text-[#009900] animate-pop"
                      strokeWidth={3}
                    />
                  ) : null}
                </div>

                <label
                  onClick={handleCaptchaClick}
                  className="text-[14px] font-normal text-black cursor-pointer flex-1"
                >
                  Tôi không phải là người máy
                </label>

                <div className="flex flex-col items-center justify-center ml-4">
                  <img
                    src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                    alt="recaptcha"
                    className="w-8 h-8 opacity-70"
                  />
                  <span className="text-[10px] text-gray-500 mt-1">
                    reCAPTCHA
                  </span>
                  <div className="text-[8px] text-gray-400 flex gap-1">
                    <span>Bảo mật</span>-<span>Điều khoản</span>
                  </div>
                </div>
              </div>
            </div>
            {/* ------------------------------------- */}

            <Button
              type="submit"
              className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 mt-6 h-11 text-base font-medium"
            >
              Đăng ký tài khoản
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-4">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <a href="#" className="text-[#0A84FF] hover:underline">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="#" className="text-[#0A84FF] hover:underline">
              Chính sách bảo mật
            </a>{" "}
            của chúng tôi.
          </p>

          <p className="text-center text-sm text-gray-600 mt-6">
            Bạn đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="text-[#0A84FF] hover:underline font-medium"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
