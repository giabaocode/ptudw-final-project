import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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

  // --- ACTIONS ---
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

  // --- RENDER ---
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
        <div className="text-red-500 font-bold text-center py-4">
          Đơn hàng đã bị hủy.
        </div>
      );

    // 1. Chờ thanh toán
    if (status === "pending_payment") {
      if (userRole === "bidder") {
        return (
          <div className="space-y-4 pt-4">
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
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
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Đang gửi..." : "Xác nhận đã thanh toán"}
            </Button>
          </div>
        );
      }
      return (
        <div className="py-6 text-center text-gray-500">
          Đang chờ người mua thanh toán...
        </div>
      );
    }

    // 2. Chờ vận chuyển
    if (status === "paid") {
      if (userRole === "seller") {
        return (
          <div className="space-y-4 pt-4">
            <div className="bg-green-50 p-3 rounded text-sm text-green-800">
              Người mua đã thanh toán. Hãy kiểm tra và gửi hàng.
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
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
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Truck className="w-4 h-4 mr-2" /> Xác nhận đã gửi hàng
            </Button>
          </div>
        );
      }
      return (
        <div className="py-6 text-center text-gray-500">
          Đang chờ người bán xác nhận tiền và gửi hàng...
        </div>
      );
    }

    // 3. Đang giao
    if (status === "shipped") {
      if (userRole === "bidder") {
        return (
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              Người bán đã gửi hàng. Vui lòng xác nhận khi nhận được.
            </div>
            <Button
              onClick={handleReceive}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" /> Tôi đã nhận được hàng
            </Button>
          </div>
        );
      }
      return (
        <div className="py-6 text-center text-gray-500">
          Đang đợi người mua nhận hàng...
        </div>
      );
    }

    // 4. Hoàn tất
    if (status === "received" || status === "completed") {
      return (
        <div className="py-6 text-center text-green-600 font-bold">
          Giao dịch thành công! Hãy đánh giá đối phương.
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Trạng thái đơn hàng</DialogTitle>
        </DialogHeader>

        {/* Timeline */}
        <div className="flex justify-between items-center px-4 py-2 border-b">
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

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
