import pool from '../utils/db';


export const createProduct = async (sellerId: number, productData: any) => {
    // 1. Lấy description từ input
    const { name, category_id, start_price, step_price, buy_now_price, end_at, description, images, allow_new_bidders } = productData;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const finalAllowNewBidders = allow_new_bidders !== undefined ? allow_new_bidders : true;

        // 2. SỬA LỖI: Thêm cột description vào câu lệnh INSERT
        const productRes = await client.query(
            `INSERT INTO Products 
            (name, category_id, seller_id, start_price, step_price, buy_now_price, current_price, end_at, description, allow_new_bidders)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
            [name, category_id, sellerId, start_price, step_price, buy_now_price, start_price, end_at, description, finalAllowNewBidders]
        );
        
        const productId = productRes.rows[0].id;

        // Lưu lịch sử mô tả
        await client.query(
            `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
            [productId, description]
        );

        if (images && images.length > 0 && Array.isArray(images)) {
            for (let i = 0; i < images.length; i++) {
                // Kiểm tra độ dài ảnh để tránh lỗi DB (Optional)
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
        await client.query('COMMIT');
        return { product_id: productId };

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Lỗi tạo sản phẩm:", e); // Log lỗi ra để biết chính xác là lỗi gì (Category hay Ảnh)
        throw e;
    } finally {
        client.release();
    }
};

export const getMyProducts = async (sellerId: number) => {
    const res = await pool.query(
        `SELECT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) AS image
        FROM Products p
        WHERE p.seller_id = $1
        ORDER BY p.created_at DESC`,
        [sellerId]
    );
    return res.rows;

};