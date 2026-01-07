import pool from "../utils/db";

// Helper: Map dữ liệu ảnh thumbnail vào format chuẩn cho Frontend
const mapProductImage = (row: any) => {
  // Ưu tiên lấy thumbnail từ subquery, nếu không thì để mảng rỗng
  row.images = row.thumbnail ? [row.thumbnail] : [];
  // Gán thêm trường image đơn lẻ để Frontend dễ hiển thị
  row.image = row.thumbnail || "";

  delete row.thumbnail; // Xóa field thừa cho gọn

  if (row.category_name) {
    row.category = row.category_name;
  }
  return row;
};

// 1. LẤY DANH MỤC (MENU)
export const fetchCategories = async () => {
  const parentsResult = await pool.query(
    "SELECT * FROM Categories WHERE parent_id IS NULL ORDER BY id ASC"
  );
  const parents = parentsResult.rows;

  for (const parent of parents) {
    const childrenResult = await pool.query(
      "SELECT * FROM Categories WHERE parent_id = $1 ORDER BY id ASC",
      [parent.id]
    );
    parent.children = childrenResult.rows;
  }
  return parents;
};

// 2. LẤY DANH SÁCH SẢN PHẨM (CÓ PHÂN TRANG & LỌC CATEGORY)
export const fetchProducts = async (
  page: number,
  limit: number,
  categoryId?: number
) => {
  const offset = (page - 1) * limit;

  // Query cơ bản: Chỉ lấy sản phẩm CHƯA KẾT THÚC (end_at > NOW())
  let query = `
    SELECT p.*, 
           c.name as category_name,
           b.full_name as bidder_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
    WHERE p.end_at > NOW() 
  `;

  const params: any[] = [];

  // Nếu có lọc theo danh mục
  if (categoryId) {
    query += ` AND (p.category_id = $${params.length + 1} OR c.parent_id = $${
      params.length + 1
    })`;
    params.push(categoryId);
  }

  // Sắp xếp và Phân trang
  // Lưu ý: tham số limit/offset được push tiếp theo
  query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${
    params.length + 2
  }`;
  params.push(limit, offset);

  const productsResult = await pool.query(query, params);

  // Tính tổng số lượng để phân trang
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id
    WHERE p.end_at > NOW()
  `;

  let countParams: any[] = [];
  if (categoryId) {
    countQuery += ` AND (p.category_id = $1 OR c.parent_id = $1)`;
    countParams.push(categoryId);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = parseInt(totalResult.rows[0].total, 10);

  return {
    products: productsResult.rows.map(mapProductImage),
    pagination: {
      total_pages: Math.ceil(total / limit),
      current_page: page,
      total_records: total,
    },
  };
};

// 3. CHI TIẾT SẢN PHẨM
export const fetchProductById = async (id: number) => {
  const productRes = await pool.query(
    `
    SELECT p.*, c.name as category_name,
           s.full_name as seller_name, s.rating_plus as seller_rating_plus, s.rating_minus as seller_rating_minus,
           b.full_name as bidder_name, b.rating_plus as bidder_rating_plus, b.rating_minus as bidder_rating_minus
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    JOIN Users s ON p.seller_id = s.id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
    WHERE p.id = $1
  `,
    [id]
  );

  if (productRes.rows.length === 0) {
    throw new Error("Không tìm thấy sản phẩm.");
  }

  const product = productRes.rows[0];
  product.category = product.category_name;

  // Lấy toàn bộ ảnh của sản phẩm
  const imagesRes = await pool.query(
    `SELECT image_url FROM Product_Images WHERE product_id = $1 ORDER BY id ASC`,
    [id]
  );

  // Lấy lịch sử cập nhật mô tả
  const descRes = await pool.query(
    `SELECT description_text, created_at FROM Product_Description_History WHERE product_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  // Lấy 5 sản phẩm liên quan (cùng danh mục, chưa kết thúc)
  const relatedRes = await pool.query(
    `
    SELECT p.*, c.name as category_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    WHERE p.category_id = $1 AND p.id != $2 AND p.end_at > NOW()
    ORDER BY p.bid_count DESC
    LIMIT 5
    `,
    [product.category_id, id]
  );

  return {
    ...product,
    seller: {
      id: product.seller_id,
      full_name: product.seller_name,
      rating_plus: product.seller_rating_plus,
      rating_minus: product.seller_rating_minus,
    },
    bidder_name: product.bidder_name,
    current_highest_bidder: product.current_highest_bidder_id
      ? {
          id: product.current_highest_bidder_id,
          full_name: product.bidder_name,
          rating_plus: product.bidder_rating_plus,
          rating_minus: product.bidder_rating_minus,
        }
      : null,
    images: imagesRes.rows.map((row: any) => row.image_url), // Trả về mảng string url
    description_history: descRes.rows,
    related_products: relatedRes.rows.map(mapProductImage),
  };
};

// 4. TRANG CHỦ (TOP SẢN PHẨM)
export const fetchHomepageTops = async () => {
  const baseSelect = `
    SELECT p.*, c.name as category_name, b.full_name as bidder_name,
    (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id 
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
  `;

  // Top 5 gần kết thúc
  const endingSoon = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY end_at ASC LIMIT 5
  `);

  // Top 5 nhiều lượt ra giá nhất
  const mostBids = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY bid_count DESC LIMIT 5
  `);

  // Top 5 giá cao nhất
  const highestPrice = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY current_price DESC LIMIT 5
  `);

  return {
    top_ending_soon: endingSoon.rows.map(mapProductImage),
    top_most_bids: mostBids.rows.map(mapProductImage),
    top_highest_price: highestPrice.rows.map(mapProductImage),
  };
};

// 5. TÌM KIẾM SẢN PHẨM (Full Text Search)
export const searchProducts = async (
  keyword: string,
  page: number,
  limit: number,
  sortStr: string
) => {
  const offset = (page - 1) * limit;

  let orderByClause = "ORDER BY p.created_at DESC"; // Mặc định: Mới nhất

  if (sortStr === "time_desc") {
    orderByClause = "ORDER BY p.end_at DESC";
  } else if (sortStr === "price_asc") {
    orderByClause =
      "ORDER BY COALESCE(NULLIF(p.current_price, 0), p.start_price) ASC";
  }

  const query = `
    SELECT p.*, 
           c.name as category_name,
           b.full_name as bidder_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
    WHERE p.search_vector @@ plainto_tsquery('english', $1)
    AND p.end_at > NOW() -- Chỉ tìm sản phẩm chưa kết thúc
    ${orderByClause}
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM Products p 
    WHERE p.search_vector @@ plainto_tsquery('english', $1) 
    AND p.end_at > NOW()
  `;

  const productsResult = await pool.query(query, [keyword, limit, offset]);
  const totalResult = await pool.query(countQuery, [keyword]);
  const total = parseInt(totalResult.rows[0].total, 10);

  return {
    products: productsResult.rows.map(mapProductImage),
    pagination: {
      total_pages: Math.ceil(total / limit),
      current_page: page,
      total_records: total,
    },
  };
};

// 6. THÔNG TIN NGƯỜI BÁN (VÀ SẢN PHẨM CỦA HỌ)
export const getSellerInfo = async (sellerId: number) => {
  const userRes = await pool.query(
    `SELECT id, full_name, email, rating_plus, rating_minus, created_at 
     FROM Users WHERE id = $1`,
    [sellerId]
  );
  if (userRes.rows.length === 0) throw new Error("Seller not found");

  const productsRes = await pool.query(
    `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail
     FROM Products p 
     LEFT JOIN Categories c ON p.category_id = c.id
     WHERE p.seller_id = $1 AND end_at > NOW()`,
    [sellerId]
  );

  return {
    seller: userRes.rows[0],
    products: productsRes.rows.map(mapProductImage),
  };
};

// 7. LỊCH SỬ ĐẤU GIÁ (Che tên)
export const getBidHistory = async (productId: number) => {
  const res = await pool.query(
    `
      SELECT b.amount, b.created_at, u.full_name, b.bidder_id
      FROM Bids b
      JOIN Users u ON b.bidder_id = u.id
      WHERE b.product_id = $1
      ORDER BY b.amount DESC
    `,
    [productId]
  );

  return res.rows.map((bid) => {
    // Masking tên: **** Tên
    const nameParts = bid.full_name
      ? bid.full_name.trim().split(" ")
      : ["Anonymous"];
    const lastName = nameParts[nameParts.length - 1];

    return {
      amount: Number(bid.amount),
      created_at: bid.created_at,
      bidder_name: `*** ${lastName}`,
      bidder_id: bid.bidder_id,
    };
  });
};

// 8. CÂU HỎI VỀ SẢN PHẨM
export const getProductQuestions = async (productId: number) => {
  const res = await pool.query(
    `SELECT q.*, 
            u.full_name as user_name,
            r.full_name as responder_name
     FROM Question_Answers q
     JOIN Users u ON q.asker_id = u.id
     LEFT JOIN Users r ON q.responder_id = r.id
     WHERE q.product_id = $1
     ORDER BY q.asked_at DESC`,
    [productId]
  );
  return res.rows;
};

// 9. ĐÁNH GIÁ NGƯỜI BÁN
export const getSellerReviews = async (sellerId: number) => {
  const res = await pool.query(
    `SELECT r.score, r.comment, r.created_at, u.full_name as rater_name
     FROM Ratings r
     JOIN Users u ON r.rater_id = u.id
     WHERE r.rated_user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 10`,
    [sellerId]
  );
  return res.rows;
};

// --- Dán thêm vào cuối file ---

// 10. LẤY FEEDBACK CỦA BẤT KỲ USER NÀO (Dùng cho Modal)
export const getUserFeedback = async (userId: number) => {
  // Query lấy đánh giá từ bảng Ratings, join với Users để lấy tên người đánh giá
  const res = await pool.query(
    `SELECT r.score, r.comment, r.created_at, u.full_name as rater_name
     FROM Ratings r 
     JOIN Users u ON r.rater_id = u.id
     WHERE r.rated_user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return res.rows;
};