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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useState } from "react"; // Nhớ import useState

interface PostProductPageProps {
  onNavigate: (page: string) => void;
}

export function PostProductPage({ onNavigate }: PostProductPageProps) {
  const { token } = useAuth();
  const [descContent, setDescContent] = useState(""); // State riêng cho mô tả
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      // 1. Logic tách chuỗi ảnh thông minh (Hỗ trợ xuống dòng hoặc dấu phẩy)
      const imagesArray = data.images_url
        .split(/[\n,]+/) 
        .map((url: string) => url.trim())
        .filter((url: string) => url !== "");

      if (imagesArray.length < 3) {
        toast.error("Vui lòng nhập ít nhất 3 link ảnh");
        return;
      }

      // 2. Tạo payload gửi xuống Backend
      const payload = {
        name: data.name,
        start_price: Number(data.start_price),
        step_price: Number(data.step_price),
        buy_now_price: data.buy_now_price ? Number(data.buy_now_price) : null,
        end_at: data.end_at,
        description: descContent,
        category_id: Number(data.category_id),
        images: imagesArray, 
        // Thêm trường này từ nhánh test-2
        allow_new_bidders: data.allow_new_bidders, 
        
      };

      await axios.post("/api/seller/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Đăng sản phẩm thành công!");
      
      // Chuyển hướng về Profile
      onNavigate("profile");

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
                  placeholder="Ví dụ: iPhone 15 Pro Max Titanium"
                  {...register("name", { required: "Tên sản phẩm là bắt buộc" })}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
              </div>

              {/* Danh mục */}
              <div>
                <Label htmlFor="category_id">ID Danh mục</Label>
                <Input
                  id="category_id"
                  type="number"
                  placeholder="VD: 1 (Điện thoại), 2 (Laptop)..."
                  {...register("category_id", { required: true })}
                />
              </div>

              {/* Giá */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_price">Giá khởi điểm ($)</Label>
                  <Input id="start_price" type="number" {...register("start_price", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="step_price">Bước giá ($)</Label>
                  <Input id="step_price" type="number" {...register("step_price", { required: true })} />
                </div>
              </div>

              <div>
                <Label htmlFor="buy_now_price">Giá mua ngay (Tùy chọn)</Label>
                <Input id="buy_now_price" type="number" {...register("buy_now_price")} />
              </div>

              {/* Thời gian */}
              <div>
                <Label htmlFor="end_at">Ngày kết thúc</Label>
                <Input id="end_at" type="datetime-local" {...register("end_at", { required: true })} />
              </div>

              {/* Mô tả */}
             <div className="mb-12"> {/* Thêm margin bottom vì toolbar của Quill cần chỗ */}
                <Label className="mb-2 block">Mô tả chi tiết sản phẩm</Label>
                <ReactQuill 
                  theme="snow"
                  value={descContent}
                  onChange={setDescContent}
                  className="h-64 bg-white"
                  placeholder="Nhập thông tin chi tiết, tình trạng, cấu hình..."
                />
              </div>

              {/* Input ảnh (Textarea nhiều dòng) */}
              <div>
                <Label htmlFor="images_url">Danh sách Link ảnh (Tối thiểu 3 ảnh)</Label>
                <Textarea
                  id="images_url"
                  className="h-32 font-mono text-sm"
                  placeholder={`https://anh1.com/a.jpg\nhttps://anh2.com/b.jpg\nhttps://anh3.com/c.jpg`}
                  {...register("images_url", { required: true })}
                />
                <p className="text-xs text-gray-500 mt-2">
                  * Mẹo: Nhập mỗi link ảnh trên một dòng hoặc cách nhau bằng dấu phẩy.
                </p>
              </div>

              {/* --- TÙY CHỌN CHO PHÉP NGƯỜI MỚI (Từ nhánh test-2) --- */}
              <div className="flex items-center space-x-2 border p-4 rounded-lg bg-gray-50">
                <input 
                  type="checkbox" 
                  id="allow_new_bidders"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                  {...register("allow_new_bidders")} 
                  defaultChecked={true} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label 
                    htmlFor="allow_new_bidders" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Cho phép người mua mới (chưa có đánh giá) tham gia đấu giá?
                  </Label>
                  <p className="text-sm text-gray-500">
                    Nếu bỏ chọn, chỉ những người có điểm uy tín {'>'} 80% mới được ra giá.
                  </p>
                </div>
              </div>
              {/* ----------------------------------------------------- */}
              <p className="text-xs text-gray-500 italic mt-4">
                * Mặc định hệ thống sẽ tự động gia hạn 10 phút nếu có người đấu giá vào phút chót.
              </p>
              <Button type="submit" className="w-full bg-[#0A84FF] hover:bg-[#0070E0]" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Đăng Sản Phẩm"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}