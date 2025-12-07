import pool from "../utils/db";

export const getMessage = async (userId: number, productId: number) => {
  const transCheck = await pool.query(
    `SELECT bidder_id, seller_id
        FROM Transactions WHERE product_id=$1`,
    [productId]
  );

  if (transCheck.rows.length === 0) return [];

  const { bidder_id, seller_id } = transCheck.rows[0];

  if (userId !== bidder_id && userId !== seller_id) {
    throw new Error("Bạn không có quyền xem cuộc trò chuyện");
  }

  const res = await pool.query(
    `SELECT m.*, u.full_name as sender_name
    FROM Chat_Messages m
    JOIN Users u ON m.sender_id = u.id
    WHERE m.transaction_id = $1
    ORDER BY m.created_at ASC`,
    [productId]
  );
  return res.rows;
};

export const sendMessage = async (
  userId: number,
  productId: number,
  message: string
) => {
  const transCheck = await pool.query(
    `SELECT bidder_id, seller_id FROM Transactions WHERE product_id=$1`,
    [productId]
  );
  if (transCheck.rows.length === 0) throw new Error("Giao dịch không tồn tại");
  const { bidder_id, seller_id } = transCheck.rows[0];

  if (userId !== bidder_id && userId !== seller_id)
    throw new Error("Bạn không có quyền gửi tinh nhắn trong cuộc trò chuyện");
  await pool.query(
    `INSERT INTO Chat_Messages (transaction_id, sender_id, message_text) VALUES($1,$2,$3)`,
    [productId, userId, message]
  );
  return { success: true };
};
