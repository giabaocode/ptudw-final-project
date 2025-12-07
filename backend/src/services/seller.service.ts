import pool from "../utils/db";

export const createProduct = async (sellerId: number, productData: any) => {
  // 1. Lấy dữ liệu từ input (Bao gồm cả allow_new_bidders từ nhánh test-2)
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Mặc định cho phép người mới nếu không truyền lên
    const finalAllowNewBidders =
      allow_new_bidders !== undefined ? allow_new_bidders : true;

    // 2. Insert vào bảng Products (Có cột description và allow_new_bidders)
    const productRes = await client.query(
      `INSERT INTO Products 
      (name, category_id, seller_id, start_price, step_price, buy_now_price, current_price, end_at, description, allow_new_bidders)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        name,
        category_id,
        sellerId,
        start_price,
        step_price,
        buy_now_price,
        start_price,
        end_at,
        description,
        finalAllowNewBidders,
      ]
    );

    const productId = productRes.rows[0].id;

    // Lưu lịch sử mô tả
    await client.query(
      `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
      [productId, description]
    );

    if (images && images.length > 0 && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        if (images[i].length > 500) {
          console.warn("Ảnh quá dài, bỏ qua:", images[i]);
          continue;
        }

        await client.query(
          `INSERT INTO Product_Images (product_id, image_url, is_thumbnail) VALUES ($1, $2, $3)`,
          [productId, images[i].trim(), i === 0]
        );
      }
    }
    await client.query("COMMIT");
    return { product_id: productId };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Lỗi tạo sản phẩm:", e);
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

// --- [TỪ NHÁNH PAGINATION] Trả lời câu hỏi ---
export const answerQuestion = async (
  sellerId: number,
  questionId: number,
  answer: string
) => {
  const checkRes = await pool.query(
    `SELECT p.seller_id 
     FROM Product_Questions q
     JOIN Products p ON q.product_id = p.id
     WHERE q.id = $1`,
    [questionId]
  );

  if (checkRes.rows.length === 0) throw new Error("Câu hỏi không tồn tại");
  if (checkRes.rows[0].seller_id !== sellerId)
    throw new Error("Bạn không có quyền trả lời câu hỏi này");

  await pool.query(
    `UPDATE Product_Questions SET answer_text = $1 WHERE id = $2`,
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
    await client.query("BEGIN"); // 1. Bắt đầu

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

    // Tạo nội dung nối thêm
    const appendText = `\n\n<hr />\n<p><strong>[Cập nhật lúc ${timestamp}]:</strong></p>\n${additionalDescription}`;

    // 2. Update nối chuỗi vào bảng chính (ĐÚNG LOGIC)
    await client.query(`UPDATE Products SET description = $1 WHERE id = $2`, [
      currentDescription + appendText,
      productId,
    ]);

    // 3. Lưu lịch sử
    await client.query(
      `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
      [productId, additionalDescription]
    );

    // 4. QUAN TRỌNG: PHẢI CÓ DÒNG NÀY MỚI LƯU ĐƯỢC
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK"); // Hủy nếu lỗi
    console.error("Lỗi khi bổ sung mô tả:", e);
    throw e;
  } finally {
    client.release();
  }
};

// backend/src/services/seller.service.ts

export const rejectBidder = async (
  sellerId: number,
  productId: number,
  bidderId: number
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Kiểm tra quyền sở hữu
    const productCheck = await client.query(
      "SELECT id FROM Products WHERE id = $1 AND seller_id = $2 FOR UPDATE",
      [productId, sellerId]
    );
    if (productCheck.rows.length === 0)
      throw new Error("Bạn không phải người bán sản phẩm này.");

    // 2. Chặn bidder (Insert vào bảng Blocked_Bidders của bạn)
    // Lưu ý: Dùng đúng tên cột bidder_id như bạn đã tạo bảng
    await client.query(
      `INSERT INTO Blocked_Bidders (product_id, bidder_id, seller_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (product_id, bidder_id) DO NOTHING`,
      [productId, bidderId, sellerId]
    );

    // 3. Xóa TOÀN BỘ lượt bid của người này tại sản phẩm này
    await client.query(
      "DELETE FROM Bids WHERE product_id = $1 AND bidder_id = $2",
      [productId, bidderId]
    );

    // 4. Tìm người thắng mới (Người cao nhất còn lại)
    const nextWinnerRes = await client.query(
      `SELECT bidder_id, amount 
       FROM Bids 
       WHERE product_id = $1 
       ORDER BY amount DESC, created_at ASC 
       LIMIT 1`,
      [productId]
    );

    // 5. Cập nhật lại bảng Products
    if (nextWinnerRes.rows.length > 0) {
      // Trường hợp CÓ người thứ nhì lên thay
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
      // Trường hợp KHÔNG còn ai (Về giá sàn)
      await client.query(
        `UPDATE Products 
         SET current_price = start_price, 
             current_highest_bidder_id = NULL,
             bid_count = 0
         WHERE id = $1`,
        [productId]
      );
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

    // Check quyền & Trạng thái sản phẩm
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

    // Tạo hoặc Lấy Transaction ID
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

    // Insert đánh giá vào bảng Ratings
    // (Lưu ý: rated_user_id ở đây là winnerId)
    await client.query(
      `INSERT INTO Ratings (transaction_id, rater_id, rated_user_id, score, comment)
         VALUES ($1, $2, $3, $4, $5)`,
      [transId, sellerId, winnerId, score, comment]
    );

    // Cập nhật điểm uy tín cho người thắng (Bidder)
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

// --- [THÊM MỚI] 2. Hủy giao dịch (Tự động -1 điểm) ---
export const cancelTransaction = async (
  sellerId: number,
  productId: number
) => {
  // Hủy đơn thực chất là đánh giá tiêu cực với lý do cố định
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
    SET status='shipped' updated_at=NOW()
    WHERE product_id=$1 and seller_id=$2 AND status='paid'
    `,
    [productId, userId]
  );
  if (res.rowCount === 0) {
    throw new Error(
      "Lỗi: Đơn hàng chưa được thanh toán hoặc bạn không phải người bán."
    );
  }

  return { message: "Đã xác nhận gửi hàng." };
};
