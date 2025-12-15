import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Check,
  Truck,
  CreditCard,
  Star,
  AlertTriangle,
  ExternalLink,
  X,
  UploadCloud, // Icon upload
  Image as ImageIcon, // Icon ảnh
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { ChatBox } from "./Chatbox";

type TransactionStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "received"
  | "completed"
  | "cancelled";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  userRole: "bidder" | "seller";
  onUpdate: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  product,
  userRole,
  onUpdate,
}: TransactionModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  // State địa chỉ
  const [address, setAddress] = useState("");

  // --- THAY ĐỔI: State cho File Upload ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const status: TransactionStatus =
    product.transaction_status || "pending_payment";

  // Khóa scroll khi mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
      // Cleanup preview url khi đóng modal
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [isOpen]);

  // --- XỬ LÝ CHỌN FILE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate loại file (chỉ ảnh)
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh (JPG, PNG, ...)");
        return;
      }

      // Validate kích thước (Ví dụ: < 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh quá lớn. Vui lòng chọn ảnh < 5MB");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // --- API ACTIONS ---
  const handlePay = async () => {
    // Validate: Bắt buộc phải có địa chỉ và File ảnh
    if (!address) return toast.error("Vui lòng nhập địa chỉ nhận hàng");
    if (!selectedFile)
      return toast.error("Vui lòng tải lên ảnh bằng chứng thanh toán");

    setLoading(true);
    try {
      // --- QUAN TRỌNG: Dùng FormData để gửi file ---
      const formData = new FormData();
      formData.append("address", address);
      formData.append("proof", selectedFile); // Key 'proof' này phải khớp với upload.single('proof') ở backend

      await axios.post(`/api/bidder/products/${product.id}/pay`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Bắt buộc dòng này
        },
      });
      toast.success("Đã gửi thông tin thanh toán!");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Lỗi khi gửi thông tin");
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async () => {
    setLoading(true);
    try {
      await axios.post(
        `/api/seller/products/${product.id}/ship`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã xác nhận gửi hàng!");
      onUpdate();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    setLoading(true);
    try {
      await axios.post(
        `/api/bidder/products/${product.id}/receive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã nhận hàng! Hãy đánh giá.");
      onUpdate();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER RENDER UI ---
  const renderStatusStep = (stepStatus: string, label: string, icon: any) => {
    const steps = [
      "pending_payment",
      "paid",
      "shipped",
      "received",
      "completed",
    ];
    const currentIndex = steps.indexOf(status);
    const stepIndex = steps.indexOf(stepStatus);
    const isActive = currentIndex >= stepIndex;

    return (
      <div
        className={`flex flex-col items-center gap-1 ${
          isActive ? "text-blue-600" : "text-gray-300"
        }`}
      >
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
    );
  };

  const renderContent = () => {
    if (status === "cancelled")
      return (
        <div className="text-red-500 font-bold text-center py-8 bg-red-50 rounded-lg mx-5">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          Đơn hàng đã bị hủy.
        </div>
      );

    if (status === "pending_payment") {
      if (userRole === "bidder") {
        return (
          <div className="space-y-4 px-5 pb-5">
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
              Hãy chuyển khoản và nhập thông tin để nhận hàng.
            </div>

            <div className="space-y-2">
              <Label>Địa chỉ nhận hàng</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường, quận..."
              />
            </div>

            {/* --- UI UPLOAD ẢNH --- */}
            <div className="space-y-2">
              <Label>Ảnh chuyển khoản (Bằng chứng)</Label>

              {!previewUrl ? (
                // Khu vực chưa chọn ảnh
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Bấm để tải ảnh lên</span>
                    </p>
                    <p className="text-xs text-gray-400">JPG, PNG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                // Khu vực đã chọn ảnh (Preview)
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 group">
                  <img
                    src={previewUrl}
                    alt="Proof Preview"
                    className="w-full h-full object-contain bg-gray-50"
                  />
                  {/* Nút xóa ảnh */}
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-black text-xs p-1 text-center truncate">
                    {selectedFile?.name}
                  </div>
                </div>
              )}
            </div>
            {/* --------------------- */}

            <Button
              onClick={handlePay}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-black"
            >
              {loading ? "Đang gửi..." : "Xác nhận đã thanh toán"}
            </Button>
          </div>
        );
      }
      return (
        <div className="py-8 text-center text-gray-500 px-5">
          Đang chờ người mua thanh toán...
        </div>
      );
    }

    if (status === "paid") {
      if (userRole === "seller") {
        return (
          <div className="space-y-4 px-5 pb-5">
            <div className="bg-green-50 p-3 rounded text-sm text-green-800 border border-green-200">
              Người mua đã thanh toán. Hãy kiểm tra và gửi hàng.
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm space-y-2">
              <p>
                <strong>Địa chỉ:</strong> {product.shipping_address}
              </p>
              <div className="space-y-1">
                <strong>Bằng chứng thanh toán:</strong>
                {/* Hiển thị ảnh bằng chứng từ Backend */}
                {product.payment_proof ? (
                  <div className="mt-2 border rounded overflow-hidden">
                    <img
                      src={product.payment_proof}
                      alt="Payment Proof"
                      className="max-h-60 w-full object-contain bg-white"
                    />
                    <a
                      href={product.payment_proof}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-blue-600 text-xs py-1 hover:underline bg-gray-50"
                    >
                      Xem ảnh gốc{" "}
                      <ExternalLink className="w-3 h-3 inline ml-1" />
                    </a>
                  </div>
                ) : (
                  <span className="text-gray-400 italic ml-2">
                    Không có ảnh
                  </span>
                )}
              </div>
            </div>
            <Button
              onClick={handleShip}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-black"
            >
              <Truck className="w-4 h-4 mr-2" /> Xác nhận đã gửi hàng
            </Button>
          </div>
        );
      }
      return (
        <div className="py-8 text-center text-gray-500 px-5">
          Đang chờ người bán xác nhận tiền và gửi hàng...
        </div>
      );
    }

    if (status === "shipped") {
      if (userRole === "bidder") {
        return (
          <div className="space-y-4 px-5 pb-5">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-200">
              Người bán đã gửi hàng. Vui lòng xác nhận khi nhận được.
            </div>
            <Button
              onClick={handleReceive}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-black"
            >
              <Check className="w-4 h-4 mr-2" /> Tôi đã nhận được hàng
            </Button>
          </div>
        );
      }
      return (
        <div className="py-8 text-center text-gray-500 px-5">
          Đang đợi người mua nhận hàng...
        </div>
      );
    }

    if (status === "received" || status === "completed") {
      return (
        <div className="py-8 text-center text-green-600 font-bold px-5 bg-green-50 mx-5 rounded-lg">
          Giao dịch thành công! Hãy đánh giá đối phương.
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      style={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}
    >
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative z-10 bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-1200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-gray-800 font-bold text-lg">
            Trạng thái đơn hàng
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TIMELINE */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          {renderStatusStep(
            "pending_payment",
            "Thanh toán",
            <CreditCard className="w-5 h-5" />
          )}
          <div className="h-[2px] flex-1 bg-gray-200 mx-2"></div>
          {renderStatusStep(
            "shipped",
            "Vận chuyển",
            <Truck className="w-5 h-5" />
          )}
          <div className="h-[2px] flex-1 bg-gray-200 mx-2"></div>
          {renderStatusStep(
            "received",
            "Nhận hàng",
            <Check className="w-5 h-5" />
          )}
          <div className="h-[2px] flex-1 bg-gray-200 mx-2"></div>
          {renderStatusStep(
            "completed",
            "Đánh giá",
            <Star className="w-5 h-5" />
          )}
        </div>

        {/* BODY CONTENT - Cuộn nếu quá dài */}
        <div className="pt-5 bg-white overflow-y-auto custom-scrollbar">
          {renderContent()}

          {/* CHAT BOX */}
          {status !== "cancelled" && (
            <div className="bg-white px-5 pb-5">
              <ChatBox productId={product.id} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
