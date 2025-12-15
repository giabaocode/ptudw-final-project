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
  const [address, setAddress] = useState("");
  const [proof, setProof] = useState("");

  const status: TransactionStatus =
    product.transaction_status || "pending_payment";

  // --- 1. XỬ LÝ KHÓA SCROLL THỦ CÔNG (Giống AppendModal) ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // --- 2. API ACTIONS ---
  const handlePay = async () => {
    if (!address || !proof)
      return toast.error("Vui lòng nhập địa chỉ và link ảnh");
    setLoading(true);
    try {
      await axios.post(
        `/api/bidder/products/${product.id}/pay`,
        { address, proof },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã gửi thông tin thanh toán!");
      onUpdate();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi");
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

  // --- 3. HELPER RENDER UI ---
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
                placeholder="Số nhà, đường..."
              />
            </div>
            <div className="space-y-2">
              <Label>Link ảnh chuyển khoản (URL)</Label>
              <Input
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="https://imgur.com/..."
              />
            </div>
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
              <p className="flex items-center gap-1">
                <strong>Bằng chứng:</strong>{" "}
                <a
                  href={product.payment_proof}
                  target="_blank"
                  className="text-blue-500 underline flex items-center"
                >
                  Xem ảnh <ExternalLink className="w-3 h-3" />
                </a>
              </p>
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

  // --- 4. RENDER VỚI CREATE PORTAL (Giống hệt AppendModal) ---
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      style={{ position: "fixed", top: 0, left: 0, bottom: 0, right: 0 }}
    >
      {/* Click ra ngoài để đóng */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* MODAL WRAPPER - Giống hệt class của AppendModal */}
      <div className="relative z-10 bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-1200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
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
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-white">
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

        {/* BODY CONTENT */}
        <div className="pt-5 bg-white">{renderContent()}</div>

        {/* CHAT BOX */}
        {status !== "cancelled" && (
          <div className="bg-white px-5 pb-5">
            <ChatBox productId={product.id} />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
