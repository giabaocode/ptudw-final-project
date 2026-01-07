import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Star, ThumbsUp, ThumbsDown, Check, User, Clock, Loader2 } from "lucide-react";
import axios from "axios";
import { Button } from "./ui/button";

interface Feedback {
  score: "positive" | "negative";
  comment: string;
  created_at: string;
  rater_name: string;
}

interface UserFeedbackModalProps {
  userId: number | null;
  userName?: string; // Tên hiển thị trên tiêu đề modal
  isOpen: boolean;
  onClose: () => void;
}

export function UserFeedbackModal({ userId, userName, isOpen, onClose }: UserFeedbackModalProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchFeedback = async () => {
        setLoading(true);
        try {
          // Gọi API public vừa tạo ở Bước 1
          const res = await axios.get(`/api/users/${userId}/feedback`);
          setFeedbacks(res.data);
        } catch (error) {
          console.error("Lỗi tải feedback:", error);
          setFeedbacks([]);
        } finally {
          setLoading(false);
        }
      };
      fetchFeedback();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Tính toán thống kê
  const totalCount = feedbacks.length;
  const positiveCount = feedbacks.filter((f) => f.score === "positive").length;
  const negativeCount = totalCount - positiveCount;
  const positivePercent = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative z-10 bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Hồ sơ uy tín</h3>
            <p className="text-sm text-gray-500">
              Người dùng: <span className="font-semibold text-blue-600">{userName || `ID: ${userId}`}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dashboard Thống kê */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Star className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {totalCount > 0 ? `${positivePercent}%` : "--"}
                  </span>
                  <span className="text-xs text-gray-500 font-medium uppercase mt-1">Uy tín</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{positiveCount}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase mt-1">Tích cực</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{negativeCount}</span>
                  <span className="text-xs text-gray-500 font-medium uppercase mt-1">Tiêu cực</span>
                </div>
              </div>

              {/* Danh sách Feedback */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-4 h-4" /> Lịch sử đánh giá
                </h4>
                
                {feedbacks.length > 0 ? (
                  feedbacks.map((fb, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              fb.score === "positive" ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {fb.score === "positive" ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">
                              {fb.rater_name || "Ẩn danh"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(fb.created_at).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            fb.score === "positive"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {fb.score === "positive" ? "+1 Positive" : "-1 Negative"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                        "{fb.comment}"
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                    Chưa có đánh giá nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}