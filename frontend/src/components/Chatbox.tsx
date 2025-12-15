import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner"; // Nhớ import toast

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  message_text: string;
  created_at: string;
}

interface ChatBoxProps {
  productId: number;
}

export function ChatBox({ productId }: ChatBoxProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!productId || !token) return;
    try {
      const res = await axios.get(`/api/chat/products/${productId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Đảm bảo res.data là một array
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi tải chat:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Tăng lên 4s để giảm tải server nếu không cần quá nhanh
    return () => clearInterval(interval);
  }, [productId, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth", // Cuộn mượt mà hơn
      });
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmedMsg = newMessage.trim();
    if (!trimmedMsg || !productId) return;

    try {
      // CHỈNH SỬA Ở ĐÂY: Gửi key là 'content' để khớp với Backend bóc tách
      await axios.post(
        `/api/chat/products/${productId}/messages`,
        { content: trimmedMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage("");
      // Không cần fetchMessages() ngay lập tức vì Polling sẽ lấy,
      // nhưng nếu muốn trải nghiệm cực nhanh thì giữ lại:
      fetchMessages();
    } catch (error: any) {
      console.error("Lỗi gửi tin:", error);
      toast.error(error.response?.data?.message || "Không thể gửi tin nhắn");
    }
  };

  return (
    <div className="flex flex-col h-[350px] border rounded-xl bg-white mt-4 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-100 bg-gray-50/50 font-semibold text-sm text-gray-600 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Trao đổi với người bán
      </div>

      {/* List Tin Nhắn */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" // Đổi nền tổng thành xám nhạt để dễ nhìn tin nhắn trắng
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <p className="text-xs">Chưa có hội thoại nào</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = Number(msg.sender_id) === Number(user?.id);

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {!isMe && (
                    <span className="text-[10px] text-gray-500 mb-1 ml-1">
                      {msg.sender_name || "Người dùng"}
                    </span>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
                      isMe
                        ? "bg-blue-600 text-black rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.message_text || (
                      <span className="italic opacity-50 text-xs">
                        (Nội dung rỗng)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Chat (Giữ nguyên) */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Viết tin nhắn..."
          className="flex-1 h-10 border-none bg-gray-100 focus-visible:ring-0 focus-visible:bg-gray-200/50 transition-all rounded-full px-4 text-black" // Thêm text-black để chắc chắn input nhìn thấy chữ
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          size="icon"
          className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-black flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
