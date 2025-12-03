import pool from "../utils/db";

// backend/src/services/bidder.service.ts

export const placeBid = async (
  bidderId: number,
  productId: number,
  amount: number,
  maxAmount: number | null
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Lock sản phẩm để tránh Race Condition
    const productRes = await client.query(
      `SELECT * FROM Products WHERE id = $1 FOR UPDATE`,
      [productId]
    );
    if (productRes.rows.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productRes.rows[0];

    if (new Date(product.end_at) < new Date())
      throw new Error("Đấu giá đã kết thúc");
    if (product.seller_id === bidderId)
      throw new Error("Người bán không được tự đấu giá");

    // 2. Lấy thông tin người thắng hiện tại & Giá trần của họ
    let currentWinnerId = product.current_highest_bidder_id;
    let currentWinnerMaxBid = 0;

    if (currentWinnerId) {
      // --- SỬA LỖI CÚ PHÁP TẠI ĐÂY (Dấu ` đóng trước dấu phẩy) ---
      const winnerBidRes = await client.query(
        `SELECT max_amount FROM Bids WHERE product_id = $1 AND bidder_id = $2 ORDER BY amount DESC LIMIT 1`,
        [productId, currentWinnerId]
      );
      // ------------------------------------------------------------
      if (winnerBidRes.rows.length > 0) {
        currentWinnerMaxBid = Number(winnerBidRes.rows[0].max_amount) || 0;
      }
    }

    const step = Number(product.step_price);
    const currentPrice = Number(product.current_price);
    const startPrice = Number(product.start_price);

    // 3. Validate giá sàn
    let minValidPrice =
      product.bid_count === 0 ? startPrice : currentPrice + step;

    if (amount < minValidPrice) {
      throw new Error(
        `Giá đặt không hợp lệ! Phải ít nhất là ${minValidPrice.toLocaleString()}`
      );
    }

    // --- LOGIC: NGƯỜI CŨ TỰ NÂNG GIÁ TRẦN ---
    if (bidderId === currentWinnerId) {
      if (amount <= currentWinnerMaxBid)
        throw new Error(
          `Bạn đang giữ giá trần cao hơn (${currentWinnerMaxBid})`
        );

      // Cập nhật max_amount mới, giữ nguyên giá hiện tại (currentPrice)
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, currentPrice, amount]
      );
      await client.query("COMMIT");
      return { message: "Đã cập nhật giá trần mới!", status: "updated_max" };
    }

    // --- LOGIC: ĐẤU GIÁ TỰ ĐỘNG ---

    // KỊCH BẢN 1: Người mới ra giá <= Giá trần người cũ (Người cũ thắng tự động)
    if (currentWinnerId && amount <= currentWinnerMaxBid) {
      let autoBidAmount = amount;
      // Hệ thống tự động nâng giá người cũ lên bằng mức người mới vừa đặt để chặn

      // Insert bid người mới (thua)
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, amount, amount]
      );

      // Insert bid tự động của người cũ (thắng lại ngay lập tức)
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, is_auto_bid, created_at) VALUES ($1, $2, $3, $4, TRUE, NOW())`,
        [productId, currentWinnerId, autoBidAmount, currentWinnerMaxBid]
      );

      // Update giá hiển thị
      await client.query(
        `UPDATE Products SET current_price = $1, bid_count = bid_count + 2 WHERE id = $2`,
        [autoBidAmount, productId]
      );

      await client.query("COMMIT");
      return {
        message:
          "Giá của bạn thấp hơn hoặc bằng giá trần của người dẫn đầu! Hệ thống đã tự động đặt lại.",
        status: "outbid",
      };
    }

    // KỊCH BẢN 2: Người mới ra giá > Giá trần người cũ (Người mới thắng)
    let newCurrentPrice = amount;

    if (currentWinnerId) {
      // Giá mới = Giá trần cũ + Bước giá (Second-price auction logic)
      newCurrentPrice = currentWinnerMaxBid + step;
      // Không được vượt quá giá người mới đặt
      if (newCurrentPrice > amount) newCurrentPrice = amount;
    } else {
      // Nếu chưa ai đặt thì giá = giá khởi điểm
      newCurrentPrice = startPrice;
    }

    // Insert bid người mới
    await client.query(
      `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) VALUES ($1, $2, $3, $4, NOW())`,
      [productId, bidderId, newCurrentPrice, amount]
    );

    // Tự động gia hạn (nếu còn < 5p thì cộng thêm 10p)
    const timeRemaining = new Date(product.end_at).getTime() - Date.now();
    let newEndAt = product.end_at;
    if (timeRemaining > 0 && timeRemaining < 5 * 60 * 1000) {
      newEndAt = new Date(new Date(product.end_at).getTime() + 10 * 60 * 1000);
    }

    // Update sản phẩm (đổi người thắng)
    await client.query(
      `UPDATE Products SET current_price = $1, current_highest_bidder_id = $2, bid_count = bid_count + 1, end_at = $3 WHERE id = $4`,
      [newCurrentPrice, bidderId, newEndAt, productId]
    );

    await client.query("COMMIT");
    return {
      message: "Ra giá thành công! Bạn đang dẫn đầu.",
      status: "success",
    };
  } catch (e: any) {
    await client.query("ROLLBACK");
    throw new Error(e.message);
  } finally {
    client.release();
  }
};

export const addToWatchlist = async (userId: number, productId: number) => {
  await pool.query(
    `INSERT INTO Watchlists (user_id, product_id) VALUES ($1, $2) 
         ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
  return {
    success: true,
    message: "Đã thêm vào danh sách theo dõi thành công!",
  };
};

// backend/src/services/bidder.service.ts

export const getMyWatchList = async (userId: number) => {
    // Sửa ORDER BY thành p.id DESC (An toàn nhất, không lo thiếu cột created_at)
    const res = await pool.query(
        `SELECT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) AS image 
        FROM Watchlists w
        JOIN Products p ON w.product_id = p.id
        WHERE w.user_id = $1
        ORDER BY p.id DESC`, 
        [userId]
    );
    return res.rows;
};

export const getMyBid = async (userId: number) => {
    // Sửa ORDER BY thành p.id DESC
    const res = await pool.query(
        `SELECT DISTINCT p.*, b.amount as my_bid_amount,
        (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) AS image
        FROM Bids b
        JOIN Products p ON b.product_id = p.id
        WHERE b.bidder_id = $1
        ORDER BY p.id DESC`, 
        [userId]
    );
    return res.rows;
};