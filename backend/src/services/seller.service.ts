import pool from "../utils/db";
import { sendKickEmail } from "../utils/email";

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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const finalAllowNewBidders =
      allow_new_bidders !== undefined ? allow_new_bidders : true;

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

  return { message: "Đã xác nhận gửi hàng." };
};
