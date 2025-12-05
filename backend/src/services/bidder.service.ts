import pool from "../utils/db";

// backend/src/services/bidder.service.ts

export const placeBid = async (
  bidderId: number,
  productId: number,
  amount: number,
  maxAmount: number | null
) => {
  // Lưu ý: amount ở đây là "Giá tối đa" người dùng sẵn sàng trả (Max Bid)
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // =================================================================
    // 1. LOCK SẢN PHẨM & VALIDATE CƠ BẢN
    // =================================================================
    const productRes = await client.query(
      `SELECT * FROM Products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (productRes.rows.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productRes.rows[0];

    const now = new Date();
    if (new Date(product.end_at) < now) throw new Error("Đấu giá đã kết thúc");
    if (product.seller_id === bidderId)
      throw new Error("Người bán không được tự đấu giá");

    // =================================================================
    // 2. LẤY THÔNG TIN NGƯỜI THẮNG HIỆN TẠI
    // =================================================================
    let currentWinnerId = product.current_highest_bidder_id;
    let currentWinnerMaxBid = 0;

    if (currentWinnerId) {
      // FIX: Sắp xếp theo max_amount để lấy giá trần thực sự
      const winnerBidRes = await client.query(
        `SELECT max_amount FROM Bids 
         WHERE product_id = $1 AND bidder_id = $2 
         ORDER BY max_amount DESC, created_at DESC LIMIT 1`,
        [productId, currentWinnerId]
      );

      if (winnerBidRes.rows.length > 0) {
        currentWinnerMaxBid = Number(winnerBidRes.rows[0].max_amount) || 0;
      }
    }

    const userRes = await client.query(
      `SELECT rating_plus, rating_minus FROM Users WHERE id = $1`,
      [bidderId]
    );

    const userInfo = userRes.rows[0];
    const plus = userInfo.rating_plus || 0;
    const minus = userInfo.rating_minus || 0;
    const total = plus + minus;

    if (total > 0){
      if (plus / total < 0.8){
        throw new Error("Tỷ lệ đánh giá tích cực của bạn quá thấp, không thể tham gia đấu giá.");
      }
    }else{
      if (!product.allow_new_bidders){
        throw new Error("Người dùng mới không được phép tham gia đấu giá sản phẩm này.");
      }
    }
   




    const step = Number(product.step_price);
    const currentPrice = Number(product.current_price);
    const startPrice = Number(product.start_price);

    // Validate giá sàn (Nếu chưa ai đặt thì là giá khởi điểm, ngược lại là giá hiện tại + bước giá)
    let minValidPrice =
      product.bid_count === 0 ? startPrice : currentPrice + step;

    if (amount < minValidPrice) {
      throw new Error(
        `Giá đặt không hợp lệ! Phải ít nhất là ${minValidPrice.toLocaleString()}`
      );
    }

    // =================================================================
    // 3. XỬ LÝ CÁC KỊCH BẢN ĐẤU GIÁ
    // =================================================================

    // --- CASE A: NGƯỜI ĐANG THẮNG TỰ NÂNG GIÁ TRẦN (HOẶC GIẢM GIÁ TRẦN NHƯNG VẪN CAO HƠN HIỆN TẠI) ---
    if (bidderId === currentWinnerId) {
      if (amount <= currentWinnerMaxBid) {
        // Tùy nghiệp vụ: Có thể báo lỗi hoặc cho phép cập nhật giảm max_bid (nhưng không thấp hơn currentPrice)
        // Ở đây giữ logic báo lỗi như code cũ của bạn
        throw new Error(
          `Bạn đang giữ giá trần cao hơn hoặc bằng mức này (${currentWinnerMaxBid})`
        );
      }

      // Chỉ cập nhật max_amount mới, giá hiện tại (currentPrice) không đổi
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, currentPrice, amount]
      );

      await client.query("COMMIT");
      return { message: "Đã cập nhật giá trần mới!", status: "updated_max" };
    }

    // --- CASE B: NGƯỜI MỚI THUA TỰ ĐỘNG (Proxy Bidding chặn lại) ---
    // Điều kiện: Có người thắng cũ VÀ Giá người mới <= Giá trần người cũ
    if (currentWinnerId && amount <= currentWinnerMaxBid) {
      // Hệ thống tự động nâng giá lên bằng mức người mới đặt để chặn
      let autoBidAmount = amount;

      // B1: Insert bid của người mới (Trạng thái thua)
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, amount, amount]
      );

      // B2: Insert bid tự động của người cũ (Thắng lại ngay lập tức)
      // Lưu ý: is_auto_bid = TRUE để dễ tracking
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, is_auto_bid, created_at) 
         VALUES ($1, $2, $3, $4, TRUE, NOW())`,
        [productId, currentWinnerId, autoBidAmount, currentWinnerMaxBid]
      );

      // B3: Update giá hiển thị sản phẩm (Người giữ giá không đổi)
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

    // --- CASE C: NGƯỜI MỚI THẮNG (Vượt qua giá trần cũ hoặc là người đầu tiên) ---
    let newCurrentPrice = amount;

    if (currentWinnerId) {
      // Logic Second-price auction: Giá mới = Giá trần người cũ + Bước giá
      newCurrentPrice = currentWinnerMaxBid + step;

      // Nếu (Giá trần cũ + Bước giá) vẫn lớn hơn giá Max của người mới -> Lấy giá Max người mới
      // (Trường hợp này hiếm vì đã check amount > currentWinnerMaxBid ở trên, nhưng cần thiết để chặn vượt trần)
      if (newCurrentPrice > amount) newCurrentPrice = amount;
    } else {
      // Nếu chưa ai đặt thì giá bắt đầu = giá khởi điểm
      newCurrentPrice = startPrice;
    }

    // B1: Insert bid người mới
    await client.query(
      `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at)
      VALUES ($1, $2, $3, $4, NOW())`,
      [productId, bidderId, newCurrentPrice, amount]
    );

    // B2: Tự động gia hạn (Logic "Anti-Sniping")
    // Nếu còn dưới 5 phút (300000ms) thì cộng thêm 10 phút
    const timeRemaining = new Date(product.end_at).getTime() - now.getTime();
    let newEndAt = product.end_at;

    if (timeRemaining > 0 && timeRemaining < 5 * 60 * 1000) {
      newEndAt = new Date(new Date(product.end_at).getTime() + 10 * 60 * 1000);
    }

    // B3: Update sản phẩm (Đổi người thắng, cập nhật giá, cập nhật thời gian)
    await client.query(
      `UPDATE Products 
       SET current_price = $1, current_highest_bidder_id = $2, bid_count = bid_count + 1, end_at = $3 
       WHERE id = $4`,
      [newCurrentPrice, bidderId, newEndAt, productId]
    );

    await client.query("COMMIT");
    return {
      message: "Ra giá thành công! Bạn đang dẫn đầu.",
      status: "success",
    };
  } catch (e: any) {
    await client.query("ROLLBACK");
    // Log error ra console hoặc file log để debug
    console.error("Bid Error:", e);
    throw new Error(e.message || "Đã có lỗi xảy ra trong quá trình đấu giá");
  } finally {
    client.release();
  }
};

export const addToWatchlist = async (userId: number, productId: number) => {
  const res = await pool.query(
    `INSERT INTO Watchlists (user_id, product_id) VALUES ($1, $2) 
         ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
  if (res.rowCount === 0) {
    return{
      success: false,
      message: "Sản phẩm đã có trong danh sách theo dõi của bạn.",
    }
  }
  return {
    success: true,
    message: "Đã thêm vào danh sách theo dõi thành công!",
  };
};

export const getMyWatchList = async (userId: number) => {
  const res = await pool.query(
    `SELECT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id LIMIT 1) AS image 
        FROM Watchlists w
        JOIN Products p ON w.product_id = p.id
        WHERE w.user_id = $1
        AND p.end_at > NOW()  -- <--- THÊM DÒNG NÀY: Chỉ lấy sản phẩm chưa kết thúc
        ORDER BY w.created_at DESC`,
    [userId]
  );

  return res.rows;
};

// backend/src/services/bidder.service.ts

// backend/src/services/bidder.service.ts

export const getMyBid = async (userId: number) => {
  const res = await pool.query(
    `SELECT DISTINCT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id LIMIT 1) as image,
        (SELECT MAX(amount) FROM Bids WHERE product_id = p.id AND bidder_id = $1) as my_highest_bid,
        u.full_name as seller_name  -- <--- LẤY TÊN NGƯỜI BÁN
     FROM Bids b
     JOIN Products p ON b.product_id = p.id
     JOIN Users u ON p.seller_id = u.id -- <--- JOIN VỚI BẢNG USERS
     WHERE b.bidder_id = $1 
     ORDER BY p.end_at DESC`,
    [userId]
  );
  return res.rows;
};

export const getWonAuctions = async (userId: number) => {
  const res = await pool.query(`
    SELECT p.*,
      (SELECT image_url FROM Product_Images WHERE product_id = p.id LIMIT 1) as image,
      u.full_name as seller_name
    FROM Products p
    JOIN Users u ON p.seller_id = u.id
    WHERE p.current_highest_bidder_id = $1 
      AND p.end_at < NOW()
    ORDER BY p.end_at DESC
  `, [userId]);
  return res.rows;
};

// 2. ĐÁNH GIÁ NGƯỜI BÁN (+1/-1)
export const rateSeller = async (bidderId: number, productId: number, score: 'positive' | 'negative', comment: string) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // A. Kiểm tra xem user có thắng sản phẩm này không
    const productRes = await client.query(
      `SELECT id, seller_id, current_highest_bidder_id, current_price, end_at 
       FROM Products WHERE id = $1`, 
      [productId]
    );
    if (productRes.rows.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productRes.rows[0];

    if (product.current_highest_bidder_id !== bidderId) {
      throw new Error("Bạn không phải là người thắng sản phẩm này.");
    }
    if (new Date(product.end_at) > new Date()) {
      throw new Error("Phiên đấu giá chưa kết thúc.");
    }

    // B. Kiểm tra Transaction (Nếu chưa có thì tạo mới để link Rating vào)
    // Đây là bước xử lý logic "Pending Payment" tự động để cho phép Rating
    let transId;
    const transCheck = await client.query(
      "SELECT id FROM Transactions WHERE product_id = $1", 
      [productId]
    );

    if (transCheck.rows.length > 0) {
      transId = transCheck.rows[0].id;
    } else {
      const newTrans = await client.query(
        `INSERT INTO Transactions (product_id, buyer_id, seller_id, final_price, status)
         VALUES ($1, $2, $3, $4, 'pending_payment')
         RETURNING id`,
        [productId, bidderId, product.seller_id, product.current_price]
      );
      transId = newTrans.rows[0].id;
    }

    // C. Kiểm tra đã đánh giá chưa
    const rateCheck = await client.query(
      "SELECT id FROM Ratings WHERE transaction_id = $1 AND rater_id = $2",
      [transId, bidderId]
    );
    if (rateCheck.rows.length > 0) {
      // Nếu có rồi thì Update
      await client.query(
        `UPDATE Ratings SET score = $1, comment = $2 WHERE id = $3`,
        [score, comment, rateCheck.rows[0].id]
      );
    } else {
      // Nếu chưa thì Insert
      await client.query(
        `INSERT INTO Ratings (transaction_id, rater_id, rated_user_id, score, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [transId, bidderId, product.seller_id, score, comment]
      );
    }

    // D. Cập nhật điểm số Seller (+1/-1)
    // Lưu ý: Logic này đơn giản là cộng thẳng. Nếu muốn chuẩn xác (chống spam 1 người rate nhiều lần), nên count từ bảng Ratings.
    if (score === 'positive') {
      await client.query("UPDATE Users SET rating_plus = rating_plus + 1 WHERE id = $1", [product.seller_id]);
    } else {
      await client.query("UPDATE Users SET rating_minus = rating_minus + 1 WHERE id = $1", [product.seller_id]);
    }

    await client.query("COMMIT");
    return { success: true, message: "Đánh giá thành công!" };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};