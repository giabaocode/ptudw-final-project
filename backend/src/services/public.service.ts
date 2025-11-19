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

// Task: API Lấy Chi tiết Sản phẩm
export const fetchProductById = async (id: number) => {
  const result = await pool.query("SELECT * FROM Products WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    throw new Error('Không tìm thấy sản phẩm.');
  }
  const product = result.rows[0];
  
  // (Lấy thêm thông tin khác và gộp vào product...)
  // Ví dụ: Lấy ảnh, Lấy thông tin seller...
  
  return product;
};