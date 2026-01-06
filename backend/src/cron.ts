// backend/src/cron.ts
import cron from "node-cron";
import pool from "./utils/db";
import { sendWinnerEmail, sendSellerEndEmail } from "./utils/email"; // Đảm bảo bạn đã có các hàm này trong email.ts

export const startCronJobs = () => {
  console.log("⏳ Hệ thống Cron Job đã khởi động...");

  // Cấu hình chạy mỗi phút một lần (* * * * *)
  cron.schedule("* * * * *", async () => {
    const client = await pool.connect();
    try {
      // 1. Tìm các sản phẩm:
      // - Đã hết hạn (end_at < NOW())
      // - Chưa được gửi mail (email_sent = FALSE hoặc NULL)
      const res = await client.query(`
        SELECT p.id, p.name, p.current_price, p.seller_id, p.current_highest_bidder_id,
               s.email as seller_email, s.full_name as seller_name,
               b.email as winner_email, b.full_name as winner_name
        FROM Products p
        JOIN Users s ON p.seller_id = s.id
        LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
        WHERE p.end_at < NOW() AND (p.email_sent IS FALSE OR p.email_sent IS NULL)
      `);

      if (res.rows.length > 0) {
        console.log(
          `🔎 Tìm thấy ${res.rows.length} phiên đấu giá vừa kết thúc.`
        );
      }

      for (const product of res.rows) {
        const {
          id,
          name,
          current_price,
          seller_email,
          winner_email,
          winner_name,
          current_highest_bidder_id,
        } = product;

        // CASE A: Có người thắng -> Gửi mail cho cả 2
        if (current_highest_bidder_id && winner_email) {
          console.log(`📧 Gửi mail thắng cuộc tới: ${winner_email}`);

          // 1. Mail cho người thắng
          await sendWinnerEmail(
            winner_email,
            name,
            Number(current_price)
          ).catch(console.error);

          // 2. Mail cho người bán (báo đã bán được)
          await sendSellerEndEmail(
            seller_email,
            name,
            true,
            Number(current_price)
          ).catch(console.error);
        }
        // CASE B: Không ai mua -> Gửi mail chia buồn cho Seller
        else {
          console.log(
            `📧 Gửi mail kết thúc (không người mua) tới: ${seller_email}`
          );
          await sendSellerEndEmail(seller_email, name, false).catch(
            console.error
          );
        }

        // QUAN TRỌNG: Đánh dấu đã xử lý xong để phút sau không gửi lại
        await client.query(
          `UPDATE Products SET email_sent = TRUE WHERE id = $1`,
          [id]
        );
      }
    } catch (error) {
      console.error("❌ Lỗi trong Cron Job:", error);
    } finally {
      client.release();
    }
  });
};
