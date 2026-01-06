import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0A84FF] to-[#FFD700] rounded-lg flex items-center justify-center">
                <span className="text-white">AB</span>
              </div>
              <span className="text-xl text-white">AuctionBay</span>
            </div>
            <p className="text-sm">
              Nền tảng đấu giá trực tuyến và thương mại điện tử uy tín. Mua, bán
              và đấu giá những sản phẩm tuyệt vời ngay hôm nay.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Quy chế hoạt động
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Điều khoản & Điều kiện
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white mb-4">Chăm sóc khách hàng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Phương thức thanh toán
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Vận chuyển & Hoàn trả
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0A84FF] transition-colors">
                  Liên hệ hỗ trợ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white mb-4">Thông tin liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>1900 123 456</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hotro@auctionbay.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Tòa nhà Tech, Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2025 AuctionBay. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[#0A84FF] transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-[#0A84FF] transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-[#0A84FF] transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-[#0A84FF] transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
