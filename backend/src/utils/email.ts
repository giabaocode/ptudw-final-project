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