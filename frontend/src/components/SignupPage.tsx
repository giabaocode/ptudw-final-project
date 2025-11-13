import { Mail, Lock, User as UserIcon, Store } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useState } from "react";
import axios from "axios"; // 1. Import
import { toast } from "sonner"; // 2. Import

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
    address: "" // 3. Thêm address (hoặc trường khác nếu cần)
  });

  // 4. Hàm onChange chung
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu không khớp. Vui lòng kiểm tra lại.");
      return;
    }
    
    // Logic gọi API
    try{
      const payload = {
        full_name: formData.name, 
        email: formData.email,
        password: formData.password,
        address: formData.address,
      };
      
      await axios.post('/api/auth/register', payload);

      // Nếu thành công (LOGIC ĐÚNG: Chuyển về LOGIN)
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      onNavigate("login");

    }catch (error: any){
      console.error("Signup failed:", error);
      // Tối ưu hóa: Lấy thông báo lỗi cụ thể từ Backend
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  }; // <--- Đảm bảo dấu chấm phẩy (;) chỉ có ở đây, KHÔNG có ở dòng 46/47 trong hình ảnh.

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* ... (Header) ... */}
        {/* ... (Account Type Selection - Giữ nguyên) ... */}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <div className="relative mt-2">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="name"
                name="name" // 7. Thêm 'name'
                type="text"
                placeholder="John Doe"
                className="pl-10"
                value={formData.name}
                onChange={handleChange} // 8. Dùng hàm chung
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                name="email" // 7. Thêm 'name'
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={formData.email}
                onChange={handleChange} // 8. Dùng hàm chung
                required
              />
            </div>
          </div>
          
          {/* (Thêm ô input cho address tương tự) */}

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                name="password" // 7. Thêm 'name'
                type="password"
                placeholder="Create a password"
                className="pl-10"
                value={formData.password}
                onChange={handleChange} // 8. Dùng hàm chung
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword" // 7. Thêm 'name'
                type="password"
                placeholder="Confirm your password"
                className="pl-10"
                value={formData.confirmPassword}
                onChange={handleChange} // 8. Dùng hàm chung
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
        {/* ... (Terms & Login Link) ... */}
      </div>
    </div>
  );
}
