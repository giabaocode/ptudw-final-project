import { Mail, Lock, User as UserIcon, Store } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { useState } from "react";

interface SignupPageProps {
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

export function SignupPage({ onNavigate, onLogin }: SignupPageProps) {
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
    onNavigate("dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">AB</span>
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join AuctionBay to start buying or selling</p>
          </div>

          {/* Account Type Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">Account Type</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(value) => setAccountType(value as "buyer" | "seller")}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                <Label
                  htmlFor="buyer"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#0A84FF] peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                >
                  <UserIcon className="mb-2 h-6 w-6" />
                  <span>Buyer</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
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
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="relative mt-2">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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

          {/* Terms */}
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

          {/* Login Link */}
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
      </div>
    </div>
  );
}
