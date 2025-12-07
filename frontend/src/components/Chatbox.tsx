import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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

  // 1. Hàm lấy tin nhắn
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/chat/products/${productId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (error) {
      console.error("Lỗi tải chat:", error);
    }
  };

  // 2. Polling: Gọi fetch mỗi 3 giây
  useEffect(() => {
    fetchMessages(); // Gọi ngay lần đầu
    const interval = setInterval(fetchMessages, 3000); // 3000ms = 3s
    return () => clearInterval(interval); // Dọn dẹp khi đóng chat
  }, [productId]);

  // 3. Auto Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 4. Gửi tin nhắn
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await axios.post(
        `/api/chat/products/${productId}/messages`,
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
      fetchMessages(); // Tải lại ngay lập tức
    } catch (error) {
      console.error("Lỗi gửi tin:", error);
    }
  };

  return (
    <div className="flex flex-col h-[300px] border rounded-lg bg-gray-50 mt-4">
      {/* Header Chat */}
      <div className="p-3 border-b bg-white rounded-t-lg font-bold text-sm text-gray-700">
        Trao đổi trực tiếp
      </div>

      {/* Danh sách tin nhắn */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-10">
            Chưa có tin nhắn nào. Hãy bắt đầu chào hỏi!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border text-gray-800 rounded-bl-none"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-gray-500 mb-1">
                    {msg.sender_name}
                  </p>
                )}
                {msg.message_text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input gửi tin */}
      <div className="p-3 border-t bg-white rounded-b-lg flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 h-9 text-sm"
        />
        <Button
          onClick={handleSend}
          size="sm"
          className="h-9 w-9 p-0 bg-blue-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
