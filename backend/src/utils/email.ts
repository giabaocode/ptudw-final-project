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
export const sendOutbidEmail = async (
  to: string,
  productName: string,
  newPrice: number
) => {
  const subject = `[AuctionBay] Cảnh báo: Bạn đã bị vượt giá sản phẩm "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #d4183d;">Bạn đã bị vượt mặt!</h2>
      <p>Xin chào,</p>
      <p>Một người dùng khác vừa đặt giá cao hơn cho sản phẩm <strong>${productName}</strong>.</p>
      <p>Giá hiện tại: <strong style="color: #0A84FF; font-size: 18px;">${newPrice.toLocaleString()} VNĐ</strong></p>
      <p>Hãy quay lại ngay để đặt giá mới nếu bạn vẫn muốn sở hữu sản phẩm này!</p>
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
  const subject = `[AuctionBay] Kết thúc đấu giá: "${productName}"`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #0A84FF;">Phiên đấu giá đã kết thúc</h2>
      <p>Sản phẩm <strong>${productName}</strong> của bạn đã hết giờ.</p>
      ${
        hasWinner
          ? `<p style="color: green;">✅ <strong>Đã có người mua!</strong> Giá chốt: ${price?.toLocaleString()} VNĐ. Vui lòng chờ người mua thanh toán.</p>`
          : `<p style="color: red;">❌ <strong>Không có người mua.</strong> Rất tiếc, không ai ra giá cho sản phẩm này.</p>`
      }
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
