import pool from "../utils/db";

// Helper: Xử lý mapping ảnh từ kết quả SQL vào object trả về
const mapProductImage = (row: any) => {
  row.images = row.thumbnail ? [row.thumbnail] : [];
  delete row.thumbnail;
  row.category = row.category_name;
  return row;
};

// 1. Task: API Lấy Danh mục
export const fetchCategories = async () => {
  const parentsResult = await pool.query(
    "SELECT * FROM Categories WHERE parent_id IS NULL"
  );
  const parents = parentsResult.rows;

  for (const parent of parents) {
    const childrenResult = await pool.query(
      "SELECT * FROM Categories WHERE parent_id = $1",
      [parent.id]
    );
    parent.children = childrenResult.rows;
  }
  return parents;
};

// 2. Task: API Lấy Sản phẩm (có lọc Category)
export const fetchProducts = async (
  page: number,
  limit: number,
  categoryId?: number
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, 
           c.name as category_name,
           b.full_name as bidder_name,
           (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (categoryId) {
    query += ` WHERE (p.category_id = $${paramIndex} OR c.parent_id = $${paramIndex})`;
    params.push(categoryId);
    paramIndex++;
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${
    paramIndex + 1
  }`;
  params.push(limit, offset);

  const productsResult = await pool.query(query, params);

  let countQuery =
    "SELECT COUNT(*) as total FROM Products p LEFT JOIN Categories c ON p.category_id = c.id";
  let countParams: any[] = [];
  if (categoryId) {
    countQuery += " WHERE (p.category_id = $1 OR c.parent_id = $1)";
    countParams.push(categoryId);
  }
  const totalResult = await pool.query(countQuery, countParams);
  const total = parseInt(totalResult.rows[0].total, 10);

  return {
    products: productsResult.rows.map(mapProductImage),
    pagination: {
      total_pages: Math.ceil(total / limit),
      current_page: page,
    },
  };
};

// 3. Task: API Lấy chi tiết sản phẩm (Đã có Rating + Related)
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

  const imagesRes = await pool.query(
    `SELECT image_url FROM Product_Images WHERE product_id = $1 ORDER BY id ASC`,
    [id]
  );

  const descRes = await pool.query(
    `SELECT description_text, created_at FROM Product_Description_History WHERE product_id = $1 ORDER BY created_at ASC`,
    [id]
  );

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
    images: imagesRes.rows.map((row: any) => row.image_url),
    description_history: descRes.rows,
    related_products: relatedRes.rows.map(mapProductImage),
  };
};

// 4. Task: API Lấy Top sản phẩm cho Trang chủ
export const fetchHomepageTops = async () => {
  const baseSelect = `
    SELECT p.*, c.name as category_name, b.full_name as bidder_name,
    (SELECT image_url FROM Product_Images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) as thumbnail 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id 
    LEFT JOIN Users b ON p.current_highest_bidder_id = b.id
  `;

  const endingSoon = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY end_at ASC LIMIT 5
  `);

  const mostBids = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY bid_count DESC LIMIT 5
  `);

  const highestPrice = await pool.query(`
    ${baseSelect} WHERE end_at > NOW() ORDER BY current_price DESC LIMIT 5
  `);

  return {
    top_ending_soon: endingSoon.rows.map(mapProductImage),
    top_most_bids: mostBids.rows.map(mapProductImage),
    top_highest_price: highestPrice.rows.map(mapProductImage),
  };
};

// 5. Task: Tìm kiếm sản phẩm
export const searchProducts = async (
  keyword: string,
  page: number,
  limit: number,
  sortStr: string
) => {
  const offset = (page - 1) * limit;

  let orderByClause = "ORDER BY p.created_at DESC";
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
    AND p.end_at > NOW()
    ${orderByClause}
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total FROM Products p WHERE p.search_vector @@ plainto_tsquery('english', $1) AND p.end_at > NOW()
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

// 6. Task: Lấy thông tin Seller
export const getSellerInfo = async (sellerId: number) => {
  const userRes = await pool.query(
    `SELECT id, full_name, email, rating_plus, rating_minus, created_at 
         FROM Users WHERE id = $1`,
    [sellerId]
  );
  if (userRes.rows.length === 0) throw new Error("Seller not found");

  const productsRes = await pool.query(
    `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM Product_Images WHERE product_id = p.id LIMIT 1) as image
         FROM Products p 
         LEFT JOIN Categories c ON p.category_id = c.id
         WHERE p.seller_id = $1 AND end_at > NOW()`,
    [sellerId]
  );

  productsRes.rows.forEach((p: any) => {
    p.category = p.category_name;
    if (p.image) {
      p.images = [p.image];
      delete p.image;
    } else {
      p.images = [];
    }
  });

  return { seller: userRes.rows[0], products: productsRes.rows };
};

// 7. Task: Lấy lịch sử đấu giá
export const getBidHistory = async (productId: number) => {
  const res = await pool.query(
    `
        SELECT b.amount, b.created_at, u.full_name
        FROM Bids b
        JOIN Users u ON b.bidder_id = u.id
        WHERE b.product_id = $1
        ORDER BY b.amount DESC
    `,
    [productId]
  );

  return res.rows.map((bid) => {
    const nameParts = bid.full_name
      ? bid.full_name.trim().split(" ")
      : ["Anonymous"];
    const lastName = nameParts[nameParts.length - 1];

    return {
      amount: Number(bid.amount),
      created_at: bid.created_at,
      bidder_name: `*** ${lastName}`,
      bidder_id : bid.bidder_id
    };
  });
};

// --- [ĐÂY LÀ PHẦN BẠN ĐANG THIẾU] ---

// 8. Task: Lấy câu hỏi Q&A
export const getProductQuestions = async (productId: number) => {
  const res = await pool.query(
    `SELECT q.*, u.full_name as user_name 
     FROM Product_Questions q
     JOIN Users u ON q.user_id = u.id
     WHERE q.product_id = $1
     ORDER BY q.created_at DESC`,
    [productId]
  );
  return res.rows;
};

// 9. Task: Lấy đánh giá Seller
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
