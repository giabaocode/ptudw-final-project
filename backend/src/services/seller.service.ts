import pool from "../utils/db";
import {
  sendKickEmail,
  sendShipmentNotificationEmail,
  sendDescriptionUpdateEmail,
} from "../utils/email";

// backend/src/services/seller.service.ts

export const createProduct = async (sellerId: number, productData: any) => {
  const {
    name,
    category_id,
    start_price,
    step_price,
    buy_now_price,
    end_at,
    description,
    images,
    allow_new_bidders,
  } = productData;

  // 1. Kiểm tra sellerId
  if (!sellerId) {
    throw new Error("Thiếu ID người bán (Seller ID). Vui lòng đăng nhập lại.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 2. Xử lý dữ liệu an toàn (Ép kiểu)
    const safeCategoryId = Number(category_id);
    const safeStartPrice = Number(start_price);
    const safeStepPrice = Number(step_price);

    // Nếu buy_now_price rỗng hoặc = 0 thì coi như là NULL (không có mua ngay)
    const safeBuyNowPrice = buy_now_price ? Number(buy_now_price) : null;

    const finalAllowNewBidders =
      allow_new_bidders !== undefined ? allow_new_bidders : true;

    // 3. Thực hiện Insert
    const productRes = await client.query(
      `INSERT INTO Products 
      (name, category_id, seller_id, start_price, step_price, buy_now_price, current_price, end_at, description, allow_new_bidders)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        name,
        safeCategoryId,
        sellerId,
        safeStartPrice,
        safeStepPrice,
        safeBuyNowPrice,
        safeStartPrice, // Giá hiện tại = Giá khởi điểm
        end_at, // Đảm bảo Frontend gửi chuỗi ISO (YYYY-MM-DDTHH:mm:ss...)
        description,
        finalAllowNewBidders,
      ]
    );

    const productId = productRes.rows[0].id;

    // 4. Lưu lịch sử mô tả
    await client.query(
      `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
      [productId, description]
    );

    // 5. Lưu ảnh (Có kiểm tra kỹ hơn)
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = images[i];

        // Bỏ qua nếu url không phải chuỗi hoặc rỗng
        if (typeof url !== "string" || !url.trim()) continue;

        // Cảnh báo nếu URL quá dài (Tùy chỉnh giới hạn cột trong DB của bạn, thường là 255 hoặc TEXT)
        if (url.length > 2000) {
          console.warn(
            `⚠️ Ảnh thứ ${i} quá dài, có thể gây lỗi DB. Độ dài: ${url.length}`
          );
          // Nếu cột DB là TEXT thì không sao, nếu là VARCHAR(255) thì sẽ lỗi tại đây
        }

        await client.query(
          `INSERT INTO Product_Images (product_id, image_url, is_thumbnail) VALUES ($1, $2, $3)`,
          [productId, url.trim(), i === 0] // Ảnh đầu tiên là thumbnail
        );
      }
    }

    await client.query("COMMIT");
    console.log(`✅ Đã tạo sản phẩm ID: ${productId}`);
    return { product_id: productId };
  } catch (e) {
    await client.query("ROLLBACK");
    // In lỗi chi tiết ra Terminal để debug
    console.error("❌ LỖI TẠO SẢN PHẨM (Chi tiết):", e);
    throw e;
  } finally {
    client.release();
  }
};
export const getMyProducts = async (sellerId: number) => {
  const res = await pool.query(
    `SELECT p.*, 
    (SELECT image_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) AS image,
    t.status as transaction_status,
    t.shipping_address,
    t.payment_proof,
    b.full_name as bidder_name -- Lấy tên người thắng
    FROM Products p
    LEFT JOIN Transactions t ON p.id = t.product_id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
    WHERE p.seller_id = $1
    ORDER BY p.created_at DESC`,
    [sellerId]
  );
  return res.rows;
};

export const answerQuestion = async (
  sellerId: number,
  questionId: number,
  answer: string
) => {
  const checkRes = await pool.query(
    `SELECT p.seller_id 
     FROM Question_Answers q
     JOIN Products p ON q.product_id = p.id
     WHERE q.id = $1`,
    [questionId]
  );

  if (checkRes.rows.length === 0) throw new Error("Câu hỏi không tồn tại");
  if (checkRes.rows[0].seller_id !== sellerId)
    throw new Error("Bạn không có quyền trả lời câu hỏi này");

  await pool.query(
    `UPDATE Question_Answers SET answer_text = $1 WHERE id = $2`,
    [answer, questionId]
  );

  return { message: "Đã trả lời câu hỏi" };
};
export const appendDescription = async (
  sellerId: number,
  productId: number,
  additionalDescription: string
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productRes = await client.query(
      `SELECT id, description FROM Products WHERE id = $1 AND seller_id = $2 FOR UPDATE`,
      [productId, sellerId]
    );

    if (productRes.rows.length === 0) {
      throw new Error(
        "Sản phẩm không tồn tại hoặc bạn không có quyền chỉnh sửa"
      );
    }

    const currentDescription = productRes.rows[0].description || "";
    const timestamp = new Date().toLocaleString("vi-VN");

    const appendText = `\n\n<hr />\n<p><strong>[Cập nhật lúc ${timestamp}]:</strong></p>\n${additionalDescription}`;

    await client.query(`UPDATE Products SET description = $1 WHERE id = $2`, [
      currentDescription + appendText,
      productId,
    ]);

    await client.query(
      `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
      [productId, additionalDescription]
    );

    const productInfo = await client.query(
      "SELECT name FROM Products WHERE id = $1",
      [productId]
    );
    const productName = productInfo.rows[0]?.name || "Sản phẩm";

    // 2. Lấy danh sách TẤT CẢ những người đã từng bid vào sản phẩm này
    const biddersRes = await client.query(
      `SELECT DISTINCT u.email 
       FROM Bids b
       JOIN Users u ON b.bidder_id = u.id
       WHERE b.product_id = $1`,
      [productId]
    );

    // 3. Gửi email cho từng người
    // Dùng Promise.all để gửi song song cho nhanh, không bắt user chờ
    const emailPromises = biddersRes.rows.map((row) =>
      sendDescriptionUpdateEmail(
        row.email,
        productName,
        additionalDescription
      ).catch((err) => console.error(`Lỗi gửi mail tới ${row.email}:`, err))
    );

    // Không cần await Promise.all nếu muốn phản hồi ngay lập tức cho Seller
    Promise.all(emailPromises);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Lỗi khi bổ sung mô tả:", e);
    throw e;
  } finally {
    client.release();
  }
};

export const rejectBidder = async (
  sellerId: number,
  productId: number,
  bidderId: number
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productCheck = await client.query(
      "SELECT id FROM Products WHERE id = $1 AND seller_id = $2 FOR UPDATE",
      [productId, sellerId]
    );
    if (productCheck.rows.length === 0)
      throw new Error("Bạn không phải người bán sản phẩm này.");

    await client.query(
      `INSERT INTO Blocked_Bidders (product_id, bidder_id, seller_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (product_id, bidder_id) DO NOTHING`,
      [productId, bidderId, sellerId]
    );

    await client.query(
      "DELETE FROM Bids WHERE product_id = $1 AND bidder_id = $2",
      [productId, bidderId]
    );

    const nextWinnerRes = await client.query(
      `SELECT bidder_id, amount 
       FROM Bids 
       WHERE product_id = $1 
       ORDER BY amount DESC, created_at ASC 
       LIMIT 1`,
      [productId]
    );

    if (nextWinnerRes.rows.length > 0) {
      const newWinner = nextWinnerRes.rows[0];
      await client.query(
        `UPDATE Products 
         SET current_price = $1, 
             current_highest_bidder_id = $2,
             bid_count = (SELECT COUNT(*) FROM Bids WHERE product_id = $3)
         WHERE id = $3`,
        [newWinner.amount, newWinner.bidder_id, productId]
      );
    } else {
      await client.query(
        `UPDATE Products 
         SET current_price = start_price, 
             current_highest_bidder_id = NULL,
             bid_count = 0
         WHERE id = $1`,
        [productId]
      );
    }

    const kickedUserRes = await client.query(
      "SELECT email FROM Users WHERE id = $1",
      [bidderId]
    );
    const productInfo = await client.query(
      "SELECT name FROM Products WHERE id = $1",
      [productId]
    );

    if (kickedUserRes.rows.length > 0) {
      sendKickEmail(
        kickedUserRes.rows[0].email,
        productInfo.rows[0].name
      ).catch(console.error);
    }

    await client.query("COMMIT");
    return {
      success: true,
      message: "Đã từ chối và cập nhật người thắng mới.",
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const rateWinner = async (
  sellerId: number,
  productId: number,
  score: "positive" | "negative",
  comment: string
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productRes = await client.query(
      `SELECT current_highest_bidder_id, end_at FROM Products WHERE id = $1 AND seller_id = $2`,
      [productId, sellerId]
    );

    if (productRes.rows.length === 0)
      throw new Error("Sản phẩm không tồn tại hoặc bạn không có quyền.");
    const product = productRes.rows[0];

    if (new Date(product.end_at) > new Date())
      throw new Error("Đấu giá chưa kết thúc.");
    if (!product.current_highest_bidder_id)
      throw new Error("Sản phẩm này không có người thắng.");

    const winnerId = product.current_highest_bidder_id;

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
             VALUES ($1, $2, $3, 0, 'pending_payment') RETURNING id`,
        [productId, winnerId, sellerId]
      );
      transId = newTrans.rows[0].id;
    }

    await client.query(
      `INSERT INTO Ratings (transaction_id, rater_id, rated_user_id, score, comment)
         VALUES ($1, $2, $3, $4, $5)`,
      [transId, sellerId, winnerId, score, comment]
    );

    if (score === "positive") {
      await client.query(
        "UPDATE Users SET rating_plus = rating_plus + 1 WHERE id = $1",
        [winnerId]
      );
    } else {
      await client.query(
        "UPDATE Users SET rating_minus = rating_minus + 1 WHERE id = $1",
        [winnerId]
      );
    }

    await client.query("COMMIT");
    return { success: true, message: "Đánh giá người thắng thành công!" };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const cancelTransaction = async (
  sellerId: number,
  productId: number
) => {
  return rateWinner(
    sellerId,
    productId,
    "negative",
    "Người thắng không thanh toán (Hủy giao dịch)"
  );
};

export const confirmShipment = async (userId: number, productId: number) => {
  const res = await pool.query(
    `UPDATE Transactions
     SET status='shipped', updated_at=NOW()
     WHERE product_id=$1 AND seller_id=$2 AND status='paid'
    `,
    [productId, userId]
  );

  if (res.rowCount === 0) {
    throw new Error(
      "Lỗi: Đơn hàng chưa được thanh toán hoặc bạn không phải người bán."
    );
  }

  const transRes = await pool.query(
    `SELECT t.buyer_id, p.name 
       FROM Transactions t
       JOIN Products p ON t.product_id = p.id
       WHERE t.product_id = $1`,
    [productId]
  );

  if (transRes.rows.length > 0) {
    const buyerId = transRes.rows[0].buyer_id;
    const productName = transRes.rows[0].name;

    const buyerRes = await pool.query("SELECT email FROM Users WHERE id = $1", [
      buyerId,
    ]);
    if (buyerRes.rows.length > 0) {
      sendShipmentNotificationEmail(buyerRes.rows[0].email, productName).catch(
        console.error
      );
    }
  }

  return { message: "Đã xác nhận gửi hàng." };
};
