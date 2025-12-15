import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Category } from "../types"; // Import type Category

interface PostProductPageProps {
  onNavigate: (page: string) => void;
}

export function PostProductPage({ onNavigate }: PostProductPageProps) {
  const { token } = useAuth();
  const [descContent, setDescContent] = useState("");

  // State for file upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // State cho danh mục
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    setValue, // Cần hàm này để set giá trị cho Select
    trigger, // Cần hàm này để validate lại sau khi chọn
    formState: { errors, isSubmitting },
  } = useForm();

  // 1. Fetch Categories khi load trang
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();

    // Đăng ký field category_id vào form vì Select không dùng ref trực tiếp được
    register("category_id", { required: "Vui lòng chọn danh mục" });
  }, [register]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      const validFiles = newFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      if (validFiles.length !== newFiles.length) {
        toast.warning("Đã bỏ qua một số file không phải là ảnh.");
      }

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data: any) => {
    if (selectedFiles.length < 3) {
      toast.error("Vui lòng tải lên tối thiểu 3 ảnh sản phẩm.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("category_id", data.category_id); // Giá trị này giờ lấy từ Select
      formData.append("start_price", data.start_price);
      formData.append("step_price", data.step_price);
      if (data.buy_now_price)
        formData.append("buy_now_price", data.buy_now_price);
      formData.append("end_at", data.end_at);
      formData.append("description", descContent);

      formData.append(
        "allow_new_bidders",
        data.allow_new_bidders ? "true" : "false"
      );

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      await axios.post("/api/seller/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đăng sản phẩm thành công!");
      onNavigate("profile");
    } catch (error: any) {
      console.error("Post product error:", error);
      const msg = error.response?.data?.message || "Lỗi khi đăng sản phẩm.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="border-none shadow-md">
          <CardHeader className="bg-white border-b border-gray-100 rounded-t-xl">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Đăng Bán Sản Phẩm Mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white rounded-b-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Thông tin cơ bản
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: iPhone 15 Pro Max Titanium"
                    className="h-11"
                    {...register("name", {
                      required: "Tên sản phẩm là bắt buộc",
                    })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">
                      {String(errors.name.message)}
                    </p>
                  )}
                </div>

                {/* --- PHẦN SELECT DANH MỤC MỚI --- */}
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select
                    onValueChange={(val: any) => {
                      setValue("category_id", val); // Cập nhật giá trị vào form
                      trigger("category_id"); // Xóa lỗi validation nếu có
                    }}
                  >
                    <SelectTrigger className="h-11 bg-white">
                      <SelectValue placeholder="Chọn danh mục sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((parent) =>
                        parent.children && parent.children.length > 0 ? (
                          <SelectGroup key={parent.id}>
                            <SelectLabel className="pl-2 text-gray-500 font-bold bg-gray-50">
                              {parent.name}
                            </SelectLabel>
                            {parent.children.map((child) => (
                              <SelectItem
                                key={child.id}
                                value={child.id.toString()}
                                className="pl-6 cursor-pointer"
                              >
                                {child.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : (
                          <SelectItem
                            key={parent.id}
                            value={parent.id.toString()}
                          >
                            {parent.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-red-500 text-sm">
                      Vui lòng chọn danh mục
                    </p>
                  )}
                </div>
                {/* -------------------------------- */}
              </div>

              {/* Pricing & Timing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Giá & Thời gian
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_price">Giá khởi điểm ($)</Label>
                    <Input
                      id="start_price"
                      type="number"
                      className="h-11"
                      {...register("start_price", { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="step_price">Bước giá ($)</Label>
                    <Input
                      id="step_price"
                      type="number"
                      className="h-11"
                      {...register("step_price", { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy_now_price">Giá mua ngay ($)</Label>
                    <Input
                      id="buy_now_price"
                      type="number"
                      placeholder="Tùy chọn"
                      className="h-11"
                      {...register("buy_now_price")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_at">Ngày kết thúc</Label>
                  <Input
                    id="end_at"
                    type="datetime-local"
                    className="h-11"
                    {...register("end_at", { required: true })}
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Hình ảnh sản phẩm
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedFiles.length} đã chọn (Tối thiểu 3)
                  </span>
                </div>

                {/* Upload Style 1: Modern & Clean (Dùng style đẹp mà bạn đã chọn) */}
                {previewUrls.length > 0 ? (
                  <div className="mt-4 border border-gray-200/80 bg-gray-50/50 p-4 rounded-xl overflow-hidden">
                    <div className="flex flex-wrap gap-3">
                      {previewUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="group relative w-28 h-28 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white transition-all hover:shadow-md"
                        >
                          <img
                            src={url}
                            alt={`preview ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10"></div>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white/90 hover:text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {/* Nút thêm ảnh nhỏ bên cạnh danh sách nếu muốn */}
                      <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors bg-white">
                        <UploadCloud className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Thêm</span>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  // Empty State Upload
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition-colors text-center">
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                        <UploadCloud className="w-10 h-10" />
                      </div>
                      <span className="text-base font-medium text-gray-700 mt-2">
                        Bấm để tải ảnh lên
                      </span>
                      <span className="text-xs text-gray-500">
                        Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label>Mô tả chi tiết</Label>
                <div className="prose-sm">
                  <ReactQuill
                    theme="snow"
                    value={descContent}
                    onChange={setDescContent}
                    className="h-64 bg-white mb-12"
                    placeholder="Mô tả chi tiết về tình trạng, xuất xứ, thông số kỹ thuật..."
                  />
                </div>
              </div>

              {/* Settings Section */}
              <div className="pt-8">
                <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <input
                    type="checkbox"
                    id="allow_new_bidders"
                    className="w-5 h-5 text-blue-600 mt-0.5 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    {...register("allow_new_bidders")}
                    defaultChecked={true}
                  />
                  <div className="grid gap-1">
                    <Label
                      htmlFor="allow_new_bidders"
                      className="text-base font-medium cursor-pointer"
                    >
                      Cho phép người mới tham gia?
                    </Label>
                    <p className="text-sm text-gray-500">
                      Nếu bỏ chọn, chỉ những người dùng có điểm uy tín &gt; 80%
                      mới được phép ra giá.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Hệ thống sẽ tự động gia hạn thêm 10 phút nếu có lượt ra giá
                  mới trong 5 phút cuối.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-[#0A84FF] hover:bg-[#0070E0] shadow-lg shadow-blue-500/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý..." : "Đăng Sản Phẩm Ngay"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
