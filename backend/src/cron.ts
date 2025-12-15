import cron from "node-cron";
import pool from "./utils/db";
import { sendWinnerEmail, sendSellerEndEmail } from "./utils/email";

export const startCronJobs = () => {
  console.log("⏳ Cron job started: Checking for ended auctions...");

  cron.schedule("* * * * *", async () => {
    try {
      const res = await pool.query(`
        SELECT p.id, p.name, p.current_price, p.seller_id, p.current_highest_bidder_id,
               s.email as seller_email,
               b.email as winner_email
        FROM Products p
        JOIN Users s ON p.seller_id = s.id
        LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
        WHERE p.end_at < NOW() AND p.email_sent = FALSE
      `);

      if (res.rows.length === 0) return;

      console.log(`Found ${res.rows.length} ended auctions. Sending emails...`);

      for (const product of res.rows) {
        const {
          name,
          current_price,
          seller_email,
          winner_email,
          current_highest_bidder_id,
        } = product;

        if (current_highest_bidder_id && winner_email) {
          await sendWinnerEmail(winner_email, name, Number(current_price));
        }

        const hasWinner = !!current_highest_bidder_id;
        await sendSellerEndEmail(
          seller_email,
          name,
          hasWinner,
          Number(current_price)
        );

        await pool.query(
          "UPDATE Products SET email_sent = TRUE WHERE id = $1",
          [product.id]
        );
      }
    } catch (error) {
      console.error("❌ Cron job error:", error);
    }
  });
};
