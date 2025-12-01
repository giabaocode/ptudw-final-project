import pool from '../utils/db';

export const createProduct = async (sellerId: number, productData: any) =>{
    const {name, category_id, start_price, step_price, buy_now_price ,end_at, description, images} = productData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const productRes = await client.query (
            `INSERT INTO Products 
            (name, category_id, seller_id, start_price, step_price, buy_now_price,current_price, end_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [name, category_id, sellerId, start_price, step_price, buy_now_price, start_price, end_at]
        );
        const productId = productRes.rows[0].id;
        
        await client.query(
            `INSERT INTO Product_Description_History(product_id, description_text) VALUES ($1, $2)`,
            [productId, description]
        );

        if (images && images.length > 0 && Array.isArray(images)) {
            for(let i = 0; i < images.length; i++){
                await client.query(
                    `INSERT INTO Product_Images (product_id, image_url, is_thumbnail) VALUES ($1, $2, $3)`,
                    [productId, images[i].trim(), i === 0]
                );
            }
        }
        await client.query('COMMIT');
        return {product_id: productId};

    }catch (e){
        await client.query('ROLLBACK');
        throw e;

    }finally{
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