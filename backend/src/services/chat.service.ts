import pool from "../utils/db";

export const getMessages = async (userId: number, productId: number) => {
  const transCheck = await pool.query(
    `SELECT id, buyer_id, seller_id FROM Transactions WHERE product_id = $1`,
    [productId]
  );

  if (transCheck.rows.length === 0) return [];

  const { id: transactionId, buyer_id, seller_id } = transCheck.rows[0];

  if (userId !== buyer_id && userId !== seller_id) {
    throw new Error("Bạn không có quyền xem cuộc trò chuyện này.");
  }

  const res = await pool.query(
    `SELECT m.*, u.full_name as sender_name 
     FROM Chat_Messages m
     JOIN Users u ON m.sender_id = u.id
     WHERE m.transaction_id = $1
     ORDER BY m.created_at ASC`,
    [transactionId]
  );

  return res.rows;
};

export const sendMessage = async (
  userId: number,
  productId: number,
  message: string
) => {
  const transCheck = await pool.query(
    `SELECT id, buyer_id, seller_id FROM Transactions WHERE product_id = $1`,
    [productId]
  );

  if (transCheck.rows.length === 0) throw new Error("Giao dịch không tồn tại.");

  const { id: transactionId, buyer_id, seller_id } = transCheck.rows[0];

  let receiverId: number;
  if (userId === buyer_id) {
    receiverId = seller_id;
  } else if (userId === seller_id) {
    receiverId = buyer_id;
  } else {
    throw new Error("Bạn không có quyền gửi tin nhắn trong giao dịch này.");
  }

  await pool.query(
    `INSERT INTO Chat_Messages (transaction_id, sender_id, receiver_id, message_text) 
     VALUES ($1, $2, $3, $4)`,
    [transactionId, userId, receiverId, message]
  );

  return { success: true };
};
