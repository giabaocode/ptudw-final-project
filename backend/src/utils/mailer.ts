// backend/src/utils/mailer.ts
import nodemailer from 'nodemailer';

// Cấu hình transporter (Dùng Gmail hoặc SMTP của bạn)
// Lưu ý: Nếu dùng Gmail, bạn cần lấy "App Password" như mình đã hướng dẫn ở đầu cuộc trò chuyện
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pn.giabao9705@gmail.com', // Thay bằng email của bạn
        pass: 'imlt uqrh rihu edki'    
    }
});

export const sendQuestionNotification = async (toEmail: string, productName: string, productId: number, question: string) => {
    const productLink = `http://localhost:5173/products/${productId}`; // Link tới Frontend
    
    const mailOptions = {
        from: '"AuctionBay System" <no-reply@auctionbay.com>',
        to: toEmail,
        subject: `[AuctionBay] Câu hỏi mới về sản phẩm: ${productName}`,
        html: `
            <h3>Bạn nhận được một câu hỏi mới!</h3>
            <p><strong>Sản phẩm:</strong> ${productName}</p>
            <p><strong>Câu hỏi:</strong> "${question}"</p>
            <p>Hãy bấm vào link dưới đây để trả lời ngay:</p>
            <a href="${productLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Xem chi tiết sản phẩm</a>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${toEmail}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};