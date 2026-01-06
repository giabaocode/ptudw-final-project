import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Tạo transporter sử dụng Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // false cho port 587, true cho port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (to: string, otp: string) => {
  const subject = "Xác thực tài khoản AuctionBay";

  // Nội dung HTML cho đẹp
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #0A84FF; text-align: center;">Chào mừng đến với AuctionBay!</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất, vui lòng nhập mã xác thực dưới đây:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #f5f5f7; padding: 10px 20px; border-radius: 8px;">
          ${otp}
        </span>
      </div>
      <p>Mã này sẽ hết hạn sau <strong>15 phút</strong>.</p>
      <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">
        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
      </p>
    </div>
  `;

  try {
    // Kiểm tra xem đã cấu hình chưa
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(
        "⚠️ Chưa cấu hình SMTP_USER/PASS trong .env. Không thể gửi mail thật."
      );
      console.log(`📧 [MOCK MAIL] OTP gửi tới ${to} là: ${otp}`);
      return;
    }

    // Gửi mail thật
    const info = await transporter.sendMail({
      from: `"AuctionBay Support" <${process.env.SMTP_USER}>`, // Tên người gửi đẹp
      to, // Người nhận
      subject,
      html: htmlContent, // Gửi HTML
    });

    console.log(
      `✅ Email sent successfully to ${to} (MsgID: ${info.messageId})`
    );
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    // Lưu ý: Dù lỗi gửi mail cũng không nên làm crash server,
    // nhưng nên báo cho người dùng biết (ở đây mình chỉ log lỗi).
  }
};

// --- [THÊM MỚI] ---
export const sendResetPasswordEmail = async (to: string, otp: string) => {
  const subject = "Yêu cầu đặt lại mật khẩu - AuctionBay";
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #d4183d; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
      <p>Chúng tôi nhận được yêu cầu lấy lại mật khẩu cho tài khoản ${to}.</p>
      <p>Mã xác thực (OTP) của bạn là:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d4183d; background: #fff0f3; padding: 10px 20px; border-radius: 8px;">
          ${otp}
        </span>
      </div>
      <p>Mã này sẽ hết hạn sau <strong>15 phút</strong>.</p>
      <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">
        Nếu bạn không yêu cầu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
      </p>
    </div>
  `;

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [MOCK RESET MAIL] To: ${to} | OTP: ${otp}`);
      return;
    }
    await transporter.sendMail({
      from: `"AuctionBay Security" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error("❌ Error sending reset email:", error);
  }
};

// backend/src/utils/email.ts

// ... (các imports và code cũ giữ nguyên)

// --- [THÊM MỚI] Gửi email thông báo có câu hỏi mới ---
export const sendQuestionNotificationEmail = async (
  to: string,
  productName: string,
  question: string,
  productLink: string
) => {
  const subject = `Câu hỏi mới về sản phẩm: ${productName}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #0A84FF;">Bạn có câu hỏi mới!</h2>
      <p>Xin chào,</p>
      <p>Một người mua tiềm năng vừa đặt câu hỏi về sản phẩm <strong>${productName}</strong> của bạn.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0A84FF; margin: 20px 0;">
        <strong>Câu hỏi:</strong>
        <p style="margin-top: 5px; font-style: italic;">"${question}"</p>
      </div>

      <p>Vui lòng nhấn vào nút bên dưới để xem chi tiết và trả lời:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" style="background-color: #0A84FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Trả lời ngay
        </a>
      </div>
      
      <p style="font-size: 12px; color: #888;">
        Hoặc truy cập link sau: <a href="${productLink}">${productLink}</a>
      </p>
    </div>
  `;

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [MOCK QUESTION MAIL] To: ${to} | Question: ${question}`);
      return;
    }
    await transporter.sendMail({
      from: `"AuctionBay Notification" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✅ Question notification sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending question email:", error);
  }
};

// --- 1. Gửi email khi bị vượt mặt (Outbid) ---
// backend/src/utils/email.ts

export const sendOutbidEmail = async (
  to: string,
  productName: string,
  newPrice: number,
  productLink: string // 👈 THÊM THAM SỐ NÀY
) => {
  const subject = `[CẢNH BÁO] Bạn đã bị vượt giá sản phẩm "${productName}" ⚠️`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d4183d;">⚠️ Bạn không còn dẫn đầu nữa!</h2>
      
      <p>Xin chào,</p>
      <p>Có người vừa đặt giá cao hơn bạn cho sản phẩm <strong>"${productName}"</strong>.</p>
      
      <div style="background-color: #fff1f2; padding: 15px; border-radius: 5px; border: 1px solid #fda4af; margin: 15px 0;">
        <p style="margin: 0; color: #9f1239;">Giá hiện tại: <strong>${newPrice.toLocaleString(
          "vi-VN"
        )} VNĐ</strong></p>
      </div>

      <p>Đừng để mất món đồ yêu thích này. Hãy ra giá lại ngay!</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${productLink}" 
           style="background-color: #d4183d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
           🔨 Đấu giá lại ngay
        </a>
      </div>
      
      <p style="font-size: 12px; color: #888;">Nếu nút trên không hoạt động, hãy copy link sau vào trình duyệt:</p>
      <p style="font-size: 12px; color: #0A84FF;">${productLink}</p>
    </div>
  `;

  return sendMail(to, subject, html);
};

// --- 2. Gửi email thông báo bị từ chối (Kick) ---
export const sendKickEmail = async (to: string, productName: string) => {
  const subject = `[AuctionBay] Thông báo: Bạn bị từ chối quyền đấu giá "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #d4183d;">Thông báo quan trọng</h2>
      <p>Người bán đã từ chối lượt ra giá của bạn tại sản phẩm <strong>${productName}</strong>.</p>
      <p>Bạn sẽ không thể tiếp tục tham gia đấu giá sản phẩm này.</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

// --- 3. Gửi email chúc mừng người thắng (Winner) ---
export const sendWinnerEmail = async (
  to: string,
  productName: string,
  price: number
) => {
  const subject = `[AuctionBay] CHÚC MỪNG! Bạn đã thắng đấu giá "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; background-color: #f9fff9;">
      <h2 style="color: #28a745;">Chúc mừng chiến thắng! 🎉</h2>
      <p>Bạn đã thắng đấu giá sản phẩm <strong>${productName}</strong>.</p>
      <p>Giá chốt: <strong>${price.toLocaleString()} VNĐ</strong></p>
      <p>Vui lòng đăng nhập vào hệ thống, truy cập mục <strong>"Đã thắng"</strong> trong hồ sơ để tiến hành thanh toán.</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

// --- 4. Gửi email báo cáo kết quả cho người bán (Seller) ---
export const sendSellerEndEmail = async (
  to: string,
  productName: string,
  hasWinner: boolean,
  price?: number
) => {
  const subject = `[AuctionBay] Kết quả đấu giá: "${productName}"`;

  // 1. Xử lý hiển thị giá tiền an toàn
  // Nếu có giá thì format kiểu VN (ví dụ: 10.000.000), nếu không có thì để 0
  const priceString = price ? price.toLocaleString("vi-VN") : "0";

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; max-width: 600px; margin: 0 auto; border-radius: 8px;">
      <h2 style="color: #0A84FF; margin-bottom: 15px;">Thông báo kết thúc đấu giá 🔔</h2>
      
      <p>Xin chào,</p>
      <p>Thời gian đấu giá cho sản phẩm <strong>"${productName}"</strong> của bạn đã kết thúc.</p>

      ${
        hasWinner
          ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
             <p style="color: #15803d; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">🎉 Chúc mừng! Đã bán thành công.</p>
             
             <p style="margin: 0; font-size: 15px;">
                Giá chốt cuối cùng: 
                <strong style="color: #d4183d; font-size: 20px;">${priceString} VNĐ</strong>
             </p>
             
             <p style="margin-top: 15px; font-size: 14px; color: #555;">
                Vui lòng truy cập <a href="${
                  process.env.FRONTEND_URL || "http://localhost:3000"
                }/dashboard" style="color: #0A84FF; text-decoration: none;">Trang quản lý</a> để xem thông tin người mua và tiến hành giao hàng.
             </p>
          </div>
          `
          : `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
             <p style="color: #b91c1c; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">❌ Không có người mua</p>
             <p style="margin: 0; font-size: 14px; color: #555;">
                Rất tiếc, phiên đấu giá đã kết thúc mà không có lượt ra giá nào.
             </p>
             <p style="margin-top: 10px; font-size: 14px; color: #555;">
                Bạn có thể đăng bán lại sản phẩm này bất cứ lúc nào.
             </p>
          </div>
          `
      }

      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">Cảm ơn bạn đã sử dụng AuctionBay.</p>
    </div>
  `;

  return sendMail(to, subject, html);
};

// Hàm wrapper chung để tái sử dụng logic gửi (tránh lặp lại transporter)

// --- 5. Gửi email báo có bid mới cho Seller ---
export const sendSellerNewBidEmail = async (
  to: string,
  productName: string,
  newPrice: number
) => {
  const subject = `[AuctionBay] Tin mới: Sản phẩm "${productName}" có lượt ra giá mới!`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #0A84FF;">Sản phẩm của bạn đang hot! 🔥</h2>
      <p>Xin chào,</p>
      <p>Sản phẩm <strong>${productName}</strong> vừa nhận được một lượt ra giá mới.</p>
      <p>Giá hiện tại: <strong style="color: #d4183d; font-size: 18px;">${newPrice.toLocaleString()} VNĐ</strong></p>
      <p>Hãy vào kiểm tra ngay!</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

const sendMail = async (to: string, subject: string, html: string) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: `"AuctionBay System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`❌ Lỗi gửi mail tới ${to}:`, error);
  }
};

// --- 6. Gửi email thông báo Buyer đã thanh toán (Gửi cho Seller) ---
export const sendPaymentNotificationEmail = async (
  to: string,
  productName: string,
  buyerName: string
) => {
  const subject = `[AuctionBay] Người mua đã thanh toán cho sản phẩm "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #0A84FF;">Xác nhận thanh toán</h2>
      <p>Xin chào,</p>
      <p>Người mua <strong>${buyerName}</strong> đã gửi bằng chứng thanh toán cho sản phẩm <strong>${productName}</strong>.</p>
      <p>Vui lòng truy cập trang quản lý để xác nhận và tiến hành giao hàng.</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

// --- 7. Gửi email thông báo hàng đã được gửi (Gửi cho Buyer) ---
export const sendShipmentNotificationEmail = async (
  to: string,
  productName: string
) => {
  const subject = `[AuctionBay] Đơn hàng "${productName}" đang trên đường đến!`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #28a745;">Hàng đang được giao 🚚</h2>
      <p>Xin chào,</p>
      <p>Người bán đã xác nhận gửi hàng cho sản phẩm <strong>${productName}</strong>.</p>
      <p>Vui lòng chú ý điện thoại để nhận hàng trong vài ngày tới.</p>
    </div>
  `;
  return sendMail(to, subject, html);
};

// --- 8. Gửi email thông báo nâng cấp Seller thành công (Gửi cho User) ---
export const sendUpgradeSuccessEmail = async (to: string) => {
  const subject = `[AuctionBay] Chúc mừng! Tài khoản đã được nâng cấp`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #d4183d;">Nâng cấp thành công 🌟</h2>
      <p>Yêu cầu nâng cấp tài khoản của bạn đã được Admin phê duyệt.</p>
      <p>Bây giờ bạn có thể đăng bán sản phẩm đấu giá. Chúc bạn buôn may bán đắt!</p>
      <p><em>Lưu ý: Quyền hạn có hiệu lực trong 7 ngày.</em></p>
    </div>
  `;
  return sendMail(to, subject, html);
};

// --- 9. Gửi email thông báo mô tả sản phẩm thay đổi ---
export const sendDescriptionUpdateEmail = async (
  to: string,
  productName: string,
  newDescription: string
) => {
  const subject = `[AuctionBay] Cập nhật mô tả cho sản phẩm "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #ff9800;">Thông báo cập nhật mô tả ⚠️</h2>
      <p>Xin chào,</p>
      <p>Người bán vừa cập nhật thêm thông tin cho sản phẩm <strong>${productName}</strong> mà bạn đang quan tâm.</p>
      
      <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
        <strong>Nội dung bổ sung:</strong>
        <p style="margin-top: 5px; font-style: italic;">"${newDescription}"</p>
      </div>

      <p>Vui lòng xem xét kỹ trước khi tiếp tục đấu giá.</p>
    </div>
  `;
  return sendMail(to, subject, html);
};
