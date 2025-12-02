import { Mail, Lock, User as UserIcon, Store, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const payload = {
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        // user_type sẽ được backend xử lý hoặc mặc định là bidder
        user_type: accountType,
        // Nếu backend cần số (ví dụ 1: buyer, 2: seller) thì phải map lại:
        // role: accountType === 'seller' ? 'SELLER' : 'BIDDER'
      };

      await axios.post("/api/auth/register", payload);
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      onNavigate("login");
    } catch (error: any) {
      console.error("Signup failed:", error);
      const errorMessage =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* --- KHUNG CARD (BẮT ĐẦU) --- */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header của Card */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">AB</span>
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">
              Join AuctionBay to start buying or selling
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">Account Type</Label>
            <RadioGroup
              value={accountType}
              // --- SỬA LỖI TẠI ĐÂY: Thêm type :string cho value ---
              onValueChange={(value: string) =>
                setAccountType(value as "buyer" | "seller")
              }
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="buyer"
                  id="buyer"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="buyer"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#0A84FF] peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                >
                  <UserIcon className="mb-2 h-6 w-6" />
                  <span>Buyer</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="seller"
                  id="seller"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="seller"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#0A84FF] peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                >
                  <Store className="mb-2 h-6 w-6" />
                  <span>Seller</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Full Name */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Input Address */}
            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Main St, City"
                  className="pl-10"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Input Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 mt-6"
            >
              Create Account
            </Button>
          </form>

          {/* Footer Links */}
          <p className="text-xs text-center text-gray-500 mt-4">
            By signing up, you agree to our{" "}
            <a href="#" className="text-[#0A84FF] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#0A84FF] hover:underline">
              Privacy Policy
            </a>
          </p>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="text-[#0A84FF] hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
        {/* --- KHUNG CARD (KẾT THÚC) --- */}
      </div>
    </div>
  );
}
