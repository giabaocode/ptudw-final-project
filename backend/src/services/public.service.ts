// File: backend/src/services/public.service.ts
import pool from '../utils/db';

// Task: API Lấy Danh mục
export const fetchCategories = async () => {
  const parentsResult = await pool.query("SELECT * FROM Categories WHERE parent_id IS NULL");
  const parents = parentsResult.rows;

  for (const parent of parents) {
    const childrenResult = await pool.query("SELECT * FROM Categories WHERE parent_id = $1", [parent.id]);
    parent.children = childrenResult.rows;
  }
  return parents;
};

// Task: API Lấy Sản phẩm (Phân trang)
export const fetchProducts = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  
  const productsResult = await pool.query(
    "SELECT * FROM Products LIMIT $1 OFFSET $2", 
    [limit, offset]
  );
  
  const totalResult = await pool.query("SELECT COUNT(*) as total FROM Products");
  const total = parseInt(totalResult.rows[0].total, 10);
  
  return {
    products: productsResult.rows,
    pagination: {
      total_pages: Math.ceil(total / limit),
      current_page: page
    }
  };
};

// backend/src/services/public.service.ts

export const fetchProductById = async (id: number) => {
  // 1. Lấy thông tin cơ bản + Join Seller + Join người thắng hiện tại
  const productRes = await pool.query(`
    SELECT p.*, 
           s.full_name as seller_name, s.rating_plus as seller_rating_plus, s.rating_minus as seller_rating_minus,
           b.full_name as bidder_name
    FROM Products p
    JOIN Users s ON p.seller_id = s.id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
    WHERE p.id = $1
  `, [id]);

  if (productRes.rows.length === 0) {
    throw new Error('Không tìm thấy sản phẩm.');
  }
  
  const product = productRes.rows[0];

  // 2. Lấy danh sách ảnh
  const imagesRes = await pool.query(
    `SELECT image_url FROM Product_Images WHERE product_id = $1 ORDER BY id ASC`,
    [id]
  );
  
  // 3. Lấy lịch sử mô tả
  const descRes = await pool.query(
    `SELECT description_text, created_at FROM Product_Description_History WHERE product_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  // 4. Ghép dữ liệu trả về đúng format Frontend cần
  return {
    ...product,
    // Format lại Seller object
    seller: {
        id: product.seller_id,
        full_name: product.seller_name,
        rating_plus: product.seller_rating_plus,
        rating_minus: product.seller_rating_minus
    },
    // Format lại Bidder object (nếu có)
    current_highest_bidder: product.current_highest_bidder_id ? {
        id: product.current_highest_bidder_id,
        full_name: product.bidder_name
    } : null,
    // Mảng ảnh (chỉ lấy url)
    images: imagesRes.rows.map(row => row.image_url),
    // Lịch sử mô tả
    description_history: descRes.rows
  };
};

// Task: Lấy Top sản phẩm cho Trang chủ
export const fetchHomepageTops = async () => {
  // 1. Sắp kết thúc
  const endingSoon = await pool.query("SELECT * FROM Products WHERE end_at > NOW() ORDER BY end_at ASC LIMIT 5");
  // Lấy ảnh thumbnail cho từng sản phẩm
  for (const p of endingSoon.rows) {
     const img = await pool.query("SELECT image_url FROM Product_Images WHERE product_id = $1 AND is_thumbnail = TRUE LIMIT 1", [p.id]);
     p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
  }

  // 2. Giá cao nhất
  const highestPrice = await pool.query("SELECT * FROM Products WHERE end_at > NOW() ORDER BY current_price DESC LIMIT 5");
  for (const p of highestPrice.rows) {
     const img = await pool.query("SELECT image_url FROM Product_Images WHERE product_id = $1 AND is_thumbnail = TRUE LIMIT 1", [p.id]);
     p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
  }

  // 3. Nhiều lượt bid nhất
  const mostBids = await pool.query("SELECT * FROM Products WHERE end_at > NOW() ORDER BY bid_count DESC LIMIT 5");
  
  return {
    top_ending_soon: endingSoon.rows,
    top_highest_price: highestPrice.rows,
    top_most_bids: mostBids.rows
  };
};

// Task: Tìm kiếm sản phẩm
export const searchProducts = async (keyword: string) => {
  // Tìm theo tên, chưa kết thúc
  const res = await pool.query(
    `SELECT * FROM Products 
     WHERE LOWER(name) LIKE LOWER($1) 
     AND end_at > NOW() 
     ORDER BY created_at DESC`,
    [`%${keyword}%`]
  );
  
  // Lấy ảnh cho kết quả tìm kiếm
  for (const p of res.rows) {
     const img = await pool.query("SELECT image_url FROM Product_Images WHERE product_id = $1 AND is_thumbnail = TRUE LIMIT 1", [p.id]);
     p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
  }

  return res.rows;
};

export const getSellerInfo = async (sellerId: number) => {
    // Lấy thông tin user
    const userRes = await pool.query(
        `SELECT id, full_name, email, rating_plus, rating_minus, created_at 
         FROM Users WHERE id = $1`, 
        [sellerId]
    );
    if (userRes.rows.length === 0) throw new Error("Seller not found");

    // Lấy danh sách sản phẩm đang bán
    const productsRes = await pool.query(
        `SELECT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) as image
         FROM Products p WHERE p.seller_id = $1 AND end_at > NOW()`,
        [sellerId]
    );

    return { seller: userRes.rows[0], products: productsRes.rows };
};