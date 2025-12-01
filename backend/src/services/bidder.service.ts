import pool from '../utils/db'

export const placeBid = async (bidderId: number, productId: number, amount: number ) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const productRes = await client.query(
            `SELECT * FROM Products WHERE id = $1 FOR UPDATE`,
            [productId]
        )
        if (productRes.rows.length === 0) {
            throw new Error('Product not found');
        }
        const product = productRes.rows[0];

        if (new Date(product.end_at) < new Date()) {
            throw new Error('Auction has ended');
        }
        if (product.seller_id === bidderId) {
            throw new Error('Seller cannot bid on their own product');
        }
        let minValidPrice = Number(product.start_price);
        if (product.bid_count > 0) {
            minValidPrice = Number(product.current_price) + Number(product.step_price);
        }
        if (amount < minValidPrice) {
            throw new Error(`Bid must be at least ${minValidPrice}`);
        }

        await client.query(
            `INSERT INTO Bids (product_id, bidder_id, amount) VALUES ($1, $2, $3)`,
            [productId, bidderId, amount]
        );

        await client.query(
            `UPDATE Products 
             SET current_price = $1, current_highest_bidder_id = $2, bid_count = bid_count + 1 
             WHERE id = $3`,
            [amount, bidderId, productId]
        );

        await client.query('COMMIT');
        return { message: 'Bid placed successfully' };


        
    }catch (e){
        await client.query('ROLLBACK');
        throw e;

    }finally{
        client.release();   
    }

}


export const getMyWatchList = async (userId: number) => {
    const res = await pool.query(
        `SELECT p.*,
        (SELECT img_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) AS image
        FROM Watchlist w
        JOIN Products p ON w.product_id = p.id
        WHERE w.user_id = $1`,
        [userId]
    );
    return res.rows;
    
}

export const getMyBid = async (userId: number) => {
    const res = await pool.query(
        `SELECT DISTINCT p.*,
        (SELECT img_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) AS image,
        FROM Bids b
        JOIN Products p ON b.product_id = p.id
        WHERE b.bidder_id = $1
        ORDER BY b.created_at DESC`,
        [userId]
    );
    return res.rows;    
    
}