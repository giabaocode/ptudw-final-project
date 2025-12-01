// File: frontend/src/components/PostProductPage.tsx
// (Giữ nguyên các import)
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface PostProductPageProps {
  onNavigate: (page: string) => void;
}

export function PostProductPage({ onNavigate }: PostProductPageProps) {
  const { token } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      // Chuyển đổi dữ liệu
      const payload = {
        name: data.name,
        start_price: Number(data.start_price),
        step_price: Number(data.step_price),
        buy_now_price: data.buy_now_price ? Number(data.buy_now_price) : null,
        end_at: data.end_at, // datetime-local string
        description: data.description,
        category_id: Number(data.category_id),
        // Tách chuỗi ảnh bằng dấu phẩy thành mảng
        images: data.images_url
          .split(",")
          .map((url: string) => url.trim())
          .filter((url: string) => url !== ""),
      };

      await axios.post("/api/seller/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Đăng sản phẩm thành công!");
      onNavigate("dashboard"); // Hoặc về trang profile
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi đăng sản phẩm");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Đăng Bán Sản Phẩm Mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tên SP */}
              <div>
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input
                  id="name"
                  type="text" // Thêm type rõ ràng
                  placeholder="Nhập tên sản phẩm"
                  {...register("name", { 
                    required: "Tên sản phẩm là bắt buộc",
                    minLength: { value: 3, message: "Tên phải dài hơn 3 ký tự" }
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">
                    {String(errors.name.message)}
                  </p>
                )}
              </div>

              {/* Danh mục (Tạm thời nhập ID, sau này làm Select) */}
              <div>
                <Label htmlFor="category_id">
                  ID Danh mục (VD: 1=Điện thoại, 3=Đồng hồ)
                </Label>
                <Input
                  id="category_id"
                  type="number"
                  {...register("category_id", { required: "Bắt buộc" })}
                />
              </div>

              {/* Giá */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_price">Giá khởi điểm</Label>
                  <Input
                    id="start_price"
                    type="number"
                    {...register("start_price", { required: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="step_price">Bước giá</Label>
                  <Input
                    id="step_price"
                    type="number"
                    {...register("step_price", { required: true })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buy_now_price">Giá mua ngay (Tùy chọn)</Label>
                <Input
                  id="buy_now_price"
                  type="number"
                  {...register("buy_now_price")}
                />
              </div>

              {/* Thời gian */}
              <div>
                <Label htmlFor="end_at">Ngày kết thúc</Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  {...register("end_at", { required: true })}
                />
              </div>

              {/* Mô tả */}
              <div>
                <Label htmlFor="description">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  className="h-32"
                  {...register("description", { required: true })}
                />
              </div>

              {/* Ảnh (Nhập URL) */}
              <div>
                <Label htmlFor="images_url">
                  Link ảnh (Cách nhau bằng dấu phẩy)
                </Label>
                <Input
                  id="images_url"
                  placeholder="https://anh1.jpg, https://anh2.jpg"
                  {...register("images_url", { required: true })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy link ảnh từ Google/Unsplash rồi dán vào đây.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0A84FF]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng Sản Phẩm"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}