import pool from "../utils/db";

export const getAllCategories = async () => {
  const res = await pool.query(`
    SELECT c.*, p.name as parent_name, 
    (SELECT COUNT(*) FROM Products WHERE category_id = c.id) as product_count
    FROM Categories c
    LEFT JOIN Categories p ON c.parent_id = p.id
    ORDER BY c.id ASC
  `);
  return res.rows;
};

export const createCategory = async (name: string, parentId?: number) => {
  const res = await pool.query(
    `INSERT INTO Categories (name, parent_id) VALUES ($1, $2) RETURNING *`,
    [name, parentId || null]
  );
  return res.rows[0];
};

export const deleteCategory = async (id: number) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkRes = await client.query(
      `SELECT COUNT(*) as count FROM Products WHERE category_id = $1`,
      [id]
    );

    if (parseInt(checkRes.rows[0].count) > 0) {
      throw new Error("Không được xóa danh mục đã có sản phẩm!");
    }

    await client.query(`DELETE FROM Categories WHERE id = $1`, [id]);
    await client.query("COMMIT");
    return { message: "Đã xóa danh mục thành công" };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const getAllProducts = async () => {
  const res = await pool.query(`
    SELECT p.id, p.name, p.current_price, u.full_name as seller_name, c.name as category_name, p.created_at
    FROM Products p
    JOIN Users u ON p.seller_id = u.id
    JOIN Categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `);
  return res.rows;
};

export const deleteProduct = async (id: number) => {
  await pool.query(`DELETE FROM Products WHERE id = $1`, [id]);
  return { message: "Đã gỡ bỏ sản phẩm" };
};

export const getAllUsers = async () => {
  const res = await pool.query(`
    SELECT id, full_name, email, user_type, created_at, seller_expiry_date
    FROM Users 
    ORDER BY id ASC
  `);
  return res.rows;
};

export const deleteUser = async (id: number) => {
  await pool.query(`DELETE FROM Users WHERE id = $1`, [id]);
  return { message: "Đã xóa người dùng" };
};

export const requestUpgrade = async (userId: number) => {
  const checkRes = await pool.query(
    `SELECT id FROM Upgrade_Requests WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );

  if (checkRes.rows.length > 0) {
    throw new Error("Bạn đã có yêu cầu đang chờ duyệt.");
  }

  await pool.query(
    `INSERT INTO Upgrade_Requests (user_id, status) VALUES ($1, 'pending')`,
    [userId]
  );
  return { message: "Gửi yêu cầu thành công" };
};

export const getPendingUpgradeRequests = async () => {
  const res = await pool.query(`
    SELECT ur.*, u.full_name, u.email 
    FROM Upgrade_Requests ur
    JOIN Users u ON ur.user_id = u.id
    WHERE ur.status = 'pending'
    ORDER BY ur.requested_at DESC
  `);
  return res.rows;
};

export const approveUpgradeRequest = async (
  requestId: number,
  adminId: number
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reqRes = await client.query(
      `SELECT user_id FROM Upgrade_Requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    if (reqRes.rows.length === 0) throw new Error("Yêu cầu không tồn tại");

    const userId = reqRes.rows[0].user_id;

    await client.query(
      `UPDATE Upgrade_Requests SET status = 'approved', processed_by_admin_id = $1 WHERE id = $2`,
      [adminId, requestId]
    );

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await client.query(
      `UPDATE Users SET user_type = 'seller', seller_expiry_date = $1 WHERE id = $2`,
      [expiryDate, userId]
    );

    await client.query("COMMIT");
    return { message: "Đã duyệt nâng cấp thành công (7 ngày)" };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const rejectUpgradeRequest = async (
  requestId: number,
  adminId: number
) => {
  await pool.query(
    `UPDATE Upgrade_Requests SET status = 'rejected', processed_by_admin_id = $1 WHERE id = $2`,
    [adminId, requestId]
  );
  return { message: "Đã từ chối yêu cầu" };
};
