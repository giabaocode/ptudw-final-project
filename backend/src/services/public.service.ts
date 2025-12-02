import pool from "../utils/db";

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
    SELECT p.*, c.name as category_name 
    FROM Products p
    LEFT JOIN Categories c ON p.category_id = c.id
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

  for (const p of productsResult.rows) {
    const img = await pool.query(
      "SELECT image_url FROM Product_Images WHERE product_id = $1 LIMIT 1",
      [p.id]
    );
    p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
    p.category = p.category_name;
  }

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
    products: productsResult.rows,
    pagination: {
      total_pages: Math.ceil(total / limit),
      current_page: page,
    },
  };
};

// 3. Task: API Lấy chi tiết sản phẩm
export const fetchProductById = async (id: number) => {
  const productRes = await pool.query(
    `
    SELECT p.*, c.name as category_name,
           s.full_name as seller_name, s.rating_plus as seller_rating_plus, s.rating_minus as seller_rating_minus,
           b.full_name as bidder_name
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

  return {
    ...product,
    seller: {
      id: product.seller_id,
      full_name: product.seller_name,
      rating_plus: product.seller_rating_plus,
      rating_minus: product.seller_rating_minus,
    },
    current_highest_bidder: product.current_highest_bidder_id
      ? {
          id: product.current_highest_bidder_id,
          full_name: product.bidder_name,
        }
      : null,
    images: imagesRes.rows.map((row: any) => row.image_url),
    description_history: descRes.rows,
  };
};

// 4. Task: API Lấy Top sản phẩm cho Trang chủ (Đã cập nhật 3 danh sách)
export const fetchHomepageTops = async () => {
  const processProducts = async (products: any[]) => {
    for (const p of products) {
      const img = await pool.query(
        "SELECT image_url FROM Product_Images WHERE product_id = $1 LIMIT 1",
        [p.id]
      );
      p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
      p.category = p.category_name;
    }
    return products;
  };

  // Top 5 Sắp kết thúc
  const endingSoon = await pool.query(`
    SELECT p.*, c.name as category_name 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id 
    WHERE end_at > NOW() 
    ORDER BY end_at ASC LIMIT 5
  `);

  // Top 5 Nhiều lượt ra giá nhất
  const mostBids = await pool.query(`
    SELECT p.*, c.name as category_name 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id 
    WHERE end_at > NOW() 
    ORDER BY bid_count DESC LIMIT 5
  `);

  // Top 5 Giá cao nhất
  const highestPrice = await pool.query(`
    SELECT p.*, c.name as category_name 
    FROM Products p 
    LEFT JOIN Categories c ON p.category_id = c.id 
    WHERE end_at > NOW() 
    ORDER BY current_price DESC LIMIT 5
  `);

  return {
    top_ending_soon: await processProducts(endingSoon.rows),
    top_most_bids: await processProducts(mostBids.rows),
    top_highest_price: await processProducts(highestPrice.rows),
  };
};

// 5. Task: Tìm kiếm sản phẩm
export const searchProducts = async (keyword: string) => {
  const res = await pool.query(
    `SELECT p.*, c.name as category_name 
     FROM Products p 
     LEFT JOIN Categories c ON p.category_id = c.id
     WHERE (LOWER(p.name) LIKE LOWER($1) OR LOWER(c.name) LIKE LOWER($1))
     AND end_at > NOW() 
     ORDER BY p.created_at DESC`,
    [`%${keyword}%`]
  );

  for (const p of res.rows) {
    const img = await pool.query(
      "SELECT image_url FROM Product_Images WHERE product_id = $1 LIMIT 1",
      [p.id]
    );
    p.images = img.rows.length > 0 ? [img.rows[0].image_url] : [];
    p.category = p.category_name;
  }

  return res.rows;
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

  productsRes.rows.forEach((p: any) => (p.category = p.category_name));

  return { seller: userRes.rows[0], products: productsRes.rows };
};
