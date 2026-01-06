import pool from "../utils/db";
import {
  sendQuestionNotificationEmail,
  sendOutbidEmail,
  sendSellerNewBidEmail,
  sendPaymentNotificationEmail,
} from "../utils/email";
// 1. RA GIÁ (BID)
export const placeBid = async (
  bidderId: number,
  productId: number,
  amount: number,
  maxAmount: number | null
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock sản phẩm & Validate
    const productRes = await client.query(
      `SELECT * FROM Products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (productRes.rows.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productRes.rows[0];
    console.log(productId);
    const blockcheck = await client.query(
      `SELECT 1 FROM Blocked_Bidders WHERE product_id=$1 AND bidder_id=$2`,
      [productId, bidderId]
    );

    if (blockcheck.rows.length > 0) {
      throw new Error(
        "⛔ Bạn đã bị người bán từ chối tham gia đấu giá sản phẩm này."
      );
    }

    const now = new Date();
    if (new Date(product.end_at) < now) throw new Error("Đấu giá đã kết thúc");
    if (product.seller_id === bidderId)
      throw new Error("Người bán không được tự đấu giá");

    // --- Validate User Rating (Logic từ database mới) ---
    const userRes = await client.query(
      `SELECT rating_plus, rating_minus FROM Users WHERE id = $1`,
      [bidderId]
    );
    const userInfo = userRes.rows[0];
    const plus = userInfo.rating_plus || 0;
    const minus = userInfo.rating_minus || 0;
    const total = plus + minus;

    if (total > 0) {
      if (plus / total < 0.8) {
        throw new Error(
          "Tỷ lệ đánh giá tích cực của bạn quá thấp (<80%), không thể tham gia đấu giá."
        );
      }
    } else {
      // Nếu chưa có rating nào, check xem sản phẩm có cho phép người mới không
      if (product.allow_new_bidders === false) {
        throw new Error("Sản phẩm này không cho phép người dùng mới tham gia.");
      }
    }
    // -----------------------------------------------------

    // Lấy thông tin người thắng hiện tại
    let currentWinnerId = product.current_highest_bidder_id;
    let currentWinnerMaxBid = 0;

    if (currentWinnerId) {
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

    const step = Number(product.step_price);
    const currentPrice = Number(product.current_price);
    const startPrice = Number(product.start_price);

    let minValidPrice =
      product.bid_count === 0 ? startPrice : currentPrice + step;

    if (amount < minValidPrice) {
      throw new Error(
        `Giá đặt không hợp lệ! Phải ít nhất là ${minValidPrice.toLocaleString()}`
      );
    }

    // --- XỬ LÝ LOGIC AUTO BID ---

    // Case A: Người đang thắng tự update giá trần
    if (bidderId === currentWinnerId) {
      if (amount <= currentWinnerMaxBid) {
        throw new Error(
          `Bạn đang giữ giá trần cao hơn hoặc bằng mức này (${currentWinnerMaxBid})`
        );
      }
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, currentPrice, amount]
      );
      await client.query("COMMIT");
      return { message: "Đã cập nhật giá trần mới!", status: "updated_max" };
    }

    // Case B: Người mới đặt thấp hơn giá trần của người cũ (Thua ngay lập tức)
    if (currentWinnerId && amount <= currentWinnerMaxBid) {
      let autoBidAmount = amount;

      // Bid của người mới
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [productId, bidderId, amount, amount]
      );

      // Bid tự động của người cũ
      await client.query(
        `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, is_auto_bid, created_at) 
         VALUES ($1, $2, $3, $4, TRUE, NOW())`,
        [productId, currentWinnerId, autoBidAmount, currentWinnerMaxBid]
      );

      // Update giá hiện tại
      await client.query(
        `UPDATE Products SET current_price = $1, bid_count = bid_count + 2 WHERE id = $2`,
        [autoBidAmount, productId]
      );

      await client.query("COMMIT");
      return {
        message:
          "Giá của bạn thấp hơn giá trần của người dẫn đầu! Hệ thống đã tự động đặt lại.",
        status: "outbid",
      };
    }

    // Case C: Người mới thắng
    let newCurrentPrice = amount;
    if (currentWinnerId) {
      newCurrentPrice = currentWinnerMaxBid + step;
      if (newCurrentPrice > amount) newCurrentPrice = amount;
    } else {
      newCurrentPrice = startPrice;
    }

    await client.query(
      `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at)
      VALUES ($1, $2, $3, $4, NOW())`,
      [productId, bidderId, newCurrentPrice, amount]
    );

    // Anti-Sniping: Gia hạn nếu còn dưới 5 phút
    const timeRemaining = new Date(product.end_at).getTime() - now.getTime();
    let newEndAt = product.end_at;

    const IS_AUTO_EXTEND_ENABLED = true;

    if (
      IS_AUTO_EXTEND_ENABLED &&
      timeRemaining > 0 &&
      timeRemaining < 5 * 60 * 1000
    ) {
      console.log("⚡ Kích hoạt Anti-Sniping: Gia hạn thêm 10 phút!");
      newEndAt = new Date(new Date(product.end_at).getTime() + 10 * 60 * 1000);
    }

    await client.query(
      `UPDATE Products 
       SET current_price = $1, current_highest_bidder_id = $2, bid_count = bid_count + 1, end_at = $3 
       WHERE id = $4`,
      [newCurrentPrice, bidderId, newEndAt, productId]
    );

    if (currentWinnerId && currentWinnerId !== bidderId) {
      // Lấy email người cũ
      const oldUserRes = await client.query(
        "SELECT email FROM Users WHERE id = $1",
        [currentWinnerId]
      );
      if (oldUserRes.rows.length > 0) {
        const oldEmail = oldUserRes.rows[0].email;
        // Không await để tránh làm chậm phản hồi cho người đang bid
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const productLink = `${frontendUrl}/?page=auction&id=${productId}`;

        // 👇 TRUYỀN LINK VÀO HÀM GỬI MAIL
        sendOutbidEmail(
          oldEmail,
          product.name,
          newCurrentPrice,
          productLink // <--- Tham số mới thêm
        ).catch(console.error);
      }
    }

    const sellerRes = await client.query(
      "SELECT email FROM Users WHERE id = $1",
      [product.seller_id]
    );

    if (sellerRes.rows.length > 0) {
      const sellerEmail = sellerRes.rows[0].email;

      // Import hàm này từ email.ts nhé
      // Gửi mail báo: "Sản phẩm của bạn có giá mới"
      sendSellerNewBidEmail(sellerEmail, product.name, newCurrentPrice).catch(
        console.error
      );
    }

    await client.query("COMMIT");
    return {
      message: "Ra giá thành công! Bạn đang dẫn đầu.",
      status: "success",
    };
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("Bid Error:", e);
    throw new Error(e.message || "Đã có lỗi xảy ra trong quá trình đấu giá");
  } finally {
    client.release();
  }
};

// 2. THÊM VÀO WATCHLIST
export const addToWatchlist = async (userId: number, productId: number) => {
  const res = await pool.query(
    `INSERT INTO Watchlists (user_id, product_id) VALUES ($1, $2) 
         ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
  if (res.rowCount === 0) {
    return {
      success: false,
      message: "Sản phẩm đã có trong danh sách theo dõi của bạn.",
    };
  }
  return {
    success: true,
    message: "Đã thêm vào danh sách theo dõi thành công!",
  };
};

// 3. LẤY WATCHLIST
// backend/src/services/bidder.service.ts

// backend/src/services/bidder.service.ts

// backend/src/services/bidder.service.ts
// backend/src/services/bidder.service.ts

export const getMyWatchList = async (userId: number) => {
  // 1. Câu query an toàn:
  // - Lấy thông tin sản phẩm (p.*)
  // - Lấy tên người bán (u.full_name)
  // - Lấy 1 ảnh đại diện từ bảng Product_Images (subquery) để chắc chắn có ảnh hiển thị
  const query = `
    SELECT p.*, 
           u.full_name as seller_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail_image
    FROM Watchlists w
    JOIN Products p ON w.product_id = p.id
    JOIN Users u ON p.seller_id = u.id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);

    return result.rows.map((row) => {
      // 2. Xử lý ảnh: Ưu tiên lấy ảnh từ bảng Product_Images (thumbnail_image)
      // Nếu không có, mới thử parse cột images cũ (đề phòng dữ liệu cũ)
      let finalImage = row.thumbnail_image || "";
      let imagesArray: string[] = [];

      // Logic "chống sập" khi parse JSON
      if (!finalImage && row.images) {
        if (typeof row.images === "string") {
          try {
            imagesArray = JSON.parse(row.images);
          } catch (e) {
            imagesArray = [];
          }
        } else if (Array.isArray(row.images)) {
          imagesArray = row.images;
        }
        if (imagesArray.length > 0) finalImage = imagesArray[0];
      }

      return {
        ...row,
        images: imagesArray, // Trả về mảng ảnh (nếu cần dùng)
        image: finalImage, // Frontend dùng trường này để hiển thị ảnh bìa
      };
    });
  } catch (error) {
    // 3. Log lỗi chi tiết ra Terminal để bạn biết chính xác dòng nào sai
    console.error("❌ CRITICAL ERROR tại getMyWatchList:", error);
    throw error;
  }
};
// 4. LẤY DANH SÁCH ĐÃ BID (Sử dụng phiên bản tối ưu từ nhánh Pagination)
// 4. LẤY DANH SÁCH ĐÃ BID (Gộp tính năng của cả 2 nhánh)
// Tìm và thay thế hàm getMyBid cũ bằng hàm này:

export const getMyBid = async (userId: number) => {
  // 1. Câu lệnh SQL chuẩn, đã test kỹ
  const query = `
    SELECT DISTINCT p.*, 
           (
             SELECT MAX(amount) 
             FROM Bids 
             WHERE product_id = p.id AND bidder_id = $1
           ) as my_highest_bid,
           u.full_name as seller_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as image
    FROM Products p
    JOIN Bids b ON p.id = b.product_id
    JOIN Users u ON p.seller_id = u.id
    WHERE b.bidder_id = $1
    ORDER BY p.end_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);

    return result.rows.map((row) => {
      // 2. Xử lý logic parse ảnh an toàn hơn (tránh crash nếu data lỗi)
      let images: string[] = [];

      if (typeof row.images === "string") {
        try {
          // Thử parse nếu là chuỗi JSON
          images = JSON.parse(row.images);
        } catch (e) {
          // Nếu lỗi parse, coi như không có ảnh
          images = [];
        }
      } else if (Array.isArray(row.images)) {
        // Nếu DB trả về mảng sẵn
        images = row.images;
      }

      return {
        ...row,
        images: images,
        // Ưu tiên lấy ảnh từ subquery (row.image), nếu không có thì lấy từ mảng images
        image: row.image || (images.length > 0 ? images[0] : ""),
      };
    });
  } catch (error) {
    // 3. Log lỗi ra terminal để dễ debug nếu có sự cố tiếp
    console.error("❌ Lỗi tại bidder.service.ts -> getMyBid:", error);
    throw error; // Ném lỗi để Controller bắt được và trả về 500
  }
};
// backend/src/services/bidder.service.ts

// backend/src/services/bidder.service.ts

export const getWonAuctions = async (userId: number) => {
  const query = `
    SELECT p.*,
      -- Lấy ảnh thumbnail chuẩn
      (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as image,
      u.full_name as seller_name,
      
      -- Lấy trạng thái giao dịch (nếu có)
      t.status as transaction_status,
      t.id as transaction_id
      
    FROM Products p
    JOIN Users u ON p.seller_id = u.id
    LEFT JOIN Transactions t ON p.id = t.product_id
    
    WHERE p.current_highest_bidder_id = $1 
      AND p.end_at < NOW() -- Điều kiện tiên quyết: Đã hết giờ và mình là người giữ giá cao nhất
      
    ORDER BY p.end_at DESC
  `;

  try {
    const res = await pool.query(query, [userId]);

    // Map xử lý ảnh để tránh lỗi null
    return res.rows.map((row) => {
      let finalImage = row.image || "";
      // Logic fallback ảnh cũ nếu cần...
      return { ...row, image: finalImage };
    });
  } catch (error) {
    console.error("❌ Lỗi getWonAuctions:", error);
    throw error;
  }
};

// 6. ĐÁNH GIÁ NGƯỜI BÁN (Từ nhánh Test-2)
export const rateSeller = async (
  bidderId: number,
  productId: number,
  score: "positive" | "negative",
  comment: string
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // A. Kiểm tra quyền đánh giá
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

    // B. Tạo Transaction nếu chưa có
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

    // C. Insert hoặc Update Rating
    const rateCheck = await client.query(
      "SELECT id FROM Ratings WHERE transaction_id = $1 AND rater_id = $2",
      [transId, bidderId]
    );
    if (rateCheck.rows.length > 0) {
      await client.query(
        `UPDATE Ratings SET score = $1, comment = $2 WHERE id = $3`,
        [score, comment, rateCheck.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO Ratings (transaction_id, rater_id, rated_user_id, score, comment)
         VALUES ($1, $2, $3, $4, $5)`,
        [transId, bidderId, product.seller_id, score, comment]
      );
    }

    // D. Update điểm số Seller
    if (score === "positive") {
      await client.query(
        "UPDATE Users SET rating_plus = rating_plus + 1 WHERE id = $1",
        [product.seller_id]
      );
    } else {
      await client.query(
        "UPDATE Users SET rating_minus = rating_minus + 1 WHERE id = $1",
        [product.seller_id]
      );
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

// 7. ĐẶT CÂU HỎI (Từ nhánh Pagination)
export const postQuestion = async (
  userId: number,
  productId: number,
  text: string
) => {
  const client = await pool.connect();
  try {
    // 1. Lưu câu hỏi vào DB
    await client.query(
      `INSERT INTO Question_Answers (product_id, asker_id, question_text) VALUES ($1, $2, $3)`,
      [productId, userId, text]
    );

    // 2. Lấy thông tin Email người bán và Tên sản phẩm
    const infoRes = await client.query(
      `SELECT p.name as product_name, u.email as seller_email
       FROM Products p
       JOIN Users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [productId]
    );

    if (infoRes.rows.length > 0) {
      const { product_name, seller_email } = infoRes.rows[0];

      // Tạo link trỏ về trang chi tiết sản phẩm ở Frontend (Giả sử FE chạy port 3000)
      // Bạn nên đưa URL gốc vào biến môi trường (process.env.FRONTEND_URL) thì tốt hơn
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const productLink = `${frontendUrl}/?page=auction&id=${productId}`;

      // 3. Gửi email (Không await để tránh làm chậm response của User)
      sendQuestionNotificationEmail(
        seller_email,
        product_name,
        text,
        productLink
      ).catch((err) => console.error("Background email error:", err));
    }

    return { message: "Đã gửi câu hỏi thành công!" };
  } finally {
    client.release();
  }
};

export const submitPayment = async (
  userId: number,
  productId: number,
  address: string,
  proofUrl: string
) => {
  const client = await pool.connect();
  try {
    // 👇 SỬA LỖI Ở ĐÂY: Thêm cột "name" vào câu truy vấn
    const product = await client.query(
      `SELECT current_highest_bidder_id, current_price, seller_id, name FROM Products WHERE id = $1`,
      [productId]
    );

    if (product.rows.length === 0) {
      throw new Error("Sản phẩm không tồn tại");
    }
    if (product.rows[0].current_highest_bidder_id !== userId) {
      throw new Error("Bạn không phải người thắng cuộc");
    }

    await client.query(
      `
      INSERT INTO Transactions (product_id, buyer_id, seller_id, final_price, status, shipping_address, payment_proof, created_at)
      VALUES ($1, $2, $3, $4, 'paid', $5, $6, NOW())
      ON CONFLICT (product_id) 
      DO UPDATE SET 
        status = 'paid', 
        shipping_address = $5, 
        payment_proof = $6, 
        updated_at = NOW()
    `,
      [
        productId,
        userId,
        product.rows[0].seller_id,
        product.rows[0].current_price,
        address,
        proofUrl,
      ]
    );

    const sellerRes = await client.query(
      "SELECT email FROM Users WHERE id = $1",
      [product.rows[0].seller_id]
    );
    const buyerRes = await client.query(
      "SELECT full_name FROM Users WHERE id = $1",
      [userId]
    );

    if (sellerRes.rows.length > 0 && buyerRes.rows.length > 0) {
      // Gửi mail không cần await để giao diện phản hồi nhanh
      sendPaymentNotificationEmail(
        sellerRes.rows[0].email,
        product.rows[0].name, // ✅ Bây giờ cái này mới có dữ liệu
        buyerRes.rows[0].full_name
      ).catch(console.error);
    }

    return { message: "Đã gửi thông tin thanh toán. Chờ người bán xác nhận." };
  } catch (error) {
    console.error("Lỗi submitPayment:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const confirmReceipt = async (userId: number, productId: number) => {
  // 3. Sửa lỗi SQL: Thêm dấu phẩy (,) trước updated_at
  const res = await pool.query(
    `UPDATE Transactions
     SET status='received', updated_at=NOW() 
     WHERE product_id=$1 AND buyer_id=$2 AND status='shipped'
    `,
    [productId, userId]
  );

  if (res.rowCount === 0) {
    throw new Error(
      "Không thể xác nhận (Đơn hàng chưa được gửi hoặc bạn không có quyền)"
    );
  }

  return {
    message: "Đã nhận hàng thành công. Hãy đánh giá người bán để hoàn tất.",
  };
};
// ... imports

// [CHỨC NĂNG MỚI] MUA NGAY
export const buyNow = async (userId: number, productId: number) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productRes = await client.query(
      `SELECT * FROM Products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (productRes.rows.length === 0) throw new Error("Sản phẩm không tồn tại");
    const product = productRes.rows[0];

    if (!product.buy_now_price)
      throw new Error("Sản phẩm này không hỗ trợ Mua ngay.");
    if (new Date(product.end_at) < new Date())
      throw new Error("Đấu giá đã kết thúc.");
    if (product.seller_id === userId)
      throw new Error("Bạn không thể tự mua hàng của mình.");

    const buyPrice = Number(product.buy_now_price);

    // 1. Cập nhật sản phẩm
    await client.query(
      `UPDATE Products 
       SET current_price = $1, 
           current_highest_bidder_id = $2, 
           end_at = NOW(),
           bid_count = bid_count + 1 
       WHERE id = $3`,
      [buyPrice, userId, productId]
    );

    // 2. [QUAN TRỌNG] Ghi vào lịch sử đấu giá (để API /my-bids tìm thấy)
    await client.query(
      `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [productId, userId, buyPrice, buyPrice]
    );

    // 3. Tạo Transaction
    await client.query(
      `
      INSERT INTO Transactions (product_id, buyer_id, seller_id, final_price, status, created_at)
      VALUES ($1, $2, $3, $4, 'pending_payment', NOW())
      ON CONFLICT (product_id) DO NOTHING
    `,
      [productId, userId, product.seller_id, buyPrice]
    );

    await client.query("COMMIT");
    return { message: "Chúc mừng! Bạn đã mua thành công sản phẩm." };
  } catch (e: any) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
