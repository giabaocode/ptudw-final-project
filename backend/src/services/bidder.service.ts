import pool from '../utils/db';

// Hàm helper: Lấy thông tin user để check điểm tín nhiệm
const getUserRating = async (userId: number) => {
    const res = await pool.query("SELECT rating_plus, rating_minus FROM Users WHERE id = $1", [userId]);
    return res.rows[0];
};

// backend/src/services/bidder.service.ts

export const placeBid = async (bidderId: number, productId: number, amount: number, maxAmount: number | null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lock sản phẩm
        const productRes = await client.query(`SELECT * FROM Products WHERE id = $1 FOR UPDATE`, [productId]);
        if (productRes.rows.length === 0) throw new Error('Sản phẩm không tồn tại');
        const product = productRes.rows[0];

        // 2. Validate thời gian
        if (new Date(product.end_at) < new Date()) throw new Error('Đấu giá đã kết thúc');
        if (product.seller_id === bidderId) throw new Error('Bạn không thể tự đấu giá sản phẩm của mình');

        // 3. Lấy thông tin người thắng hiện tại & Max Bid của họ
        let currentWinnerId = product.current_highest_bidder_id;
        let currentWinnerMaxBid = 0;

        if (currentWinnerId) {
            const winnerBidRes = await client.query(
                `SELECT max_amount FROM Bids WHERE product_id = $1 AND bidder_id = $2 ORDER BY amount DESC LIMIT 1`,
                [productId, currentWinnerId]
            );
            if (winnerBidRes.rows.length > 0) {
                currentWinnerMaxBid = Number(winnerBidRes.rows[0].max_amount) || 0;
            }
        }

        const step = Number(product.step_price);
        const currentPrice = Number(product.current_price);
        const startPrice = Number(product.start_price);

        // --- FIX LOGIC: NGƯỜI ĐANG THẮNG MUỐN NÂNG GIÁ TRẦN ---
        if (bidderId === currentWinnerId) {
            // Nếu người đang thắng ra giá thấp hơn giá trần cũ -> Báo lỗi hoặc chặn
            if (amount <= currentWinnerMaxBid) {
                throw new Error(`Bạn đang dẫn đầu với giá trần $${currentWinnerMaxBid}. Vui lòng ra giá cao hơn nếu muốn cập nhật.`);
            }

            // Cập nhật giá trần mới (max_amount) vào DB, NHƯNG KHÔNG TĂNG current_price
            await client.query(
                `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) 
                 VALUES ($1, $2, $3, $4, NOW())`,
                [productId, bidderId, currentPrice, amount] // Lưu ý: amount ở đây là giá hiện tại, max_amount là giá mới
            );
            
            // Chỉ update max_amount ngầm, không đổi giá hiển thị trên sản phẩm
            // (Trừ khi cần gia hạn thời gian)
            await client.query('COMMIT');
            return { message: 'Đã cập nhật mức giá trần mới của bạn!', status: 'updated_max' };
        }

        // --- CÁC TRƯỜNG HỢP KHÁC (NGƯỜI MỚI VÀO) ---
        
        // Tính giá hợp lệ tối thiểu cho người mới
        let minValidPrice = (product.bid_count === 0) ? startPrice : (currentPrice + step);
        if (amount < minValidPrice) {
            throw new Error(`Giá đặt không hợp lệ! Phải ít nhất là $${minValidPrice.toLocaleString()}`);
        }

        // KỊCH BẢN A: Người mới ra giá <= Giá trần của người cũ
        if (currentWinnerId && amount <= currentWinnerMaxBid) {
            let autoBidAmount = amount + step;
            if (autoBidAmount > currentWinnerMaxBid) autoBidAmount = currentWinnerMaxBid;

            // Insert bid người mới (thua)
            await client.query(
                `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) VALUES ($1, $2, $3, $4, NOW())`,
                [productId, bidderId, amount, amount]
            );
            // Insert bid tự động người cũ (thắng lại)
            await client.query(
                `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, is_auto_bid, created_at) VALUES ($1, $2, $3, $4, TRUE, NOW())`,
                [productId, currentWinnerId, autoBidAmount, currentWinnerMaxBid]
            );
            // Update giá sản phẩm lên mức autoBid
            await client.query(
                `UPDATE Products SET current_price = $1, bid_count = bid_count + 2 WHERE id = $2`,
                [autoBidAmount, productId]
            );
            
            await client.query('COMMIT');
            return { message: 'Bạn đã bị hệ thống tự động của người khác vượt qua!', status: 'outbid' };
        }

        // KỊCH BẢN B: Người mới ra giá > Giá trần người cũ (Người mới thắng)
        let newCurrentPrice = amount;
        
        // Logic "Second-Price": Giá mới = Giá trần người cũ + Bước giá (chứ không phải giá Max của người mới)
        if (currentWinnerId) {
            newCurrentPrice = currentWinnerMaxBid + step;
            // Nhưng không được vượt quá giá người mới vừa đặt (đề phòng bước giá quá lớn)
            if (newCurrentPrice > amount) newCurrentPrice = amount;
        } else {
            // Nếu chưa ai đặt, giá = giá khởi điểm (hoặc giá người đó đặt nếu họ muốn)
            // Thường thì chỉ cần bằng giá khởi điểm là thắng
            newCurrentPrice = startPrice; 
            // Nếu người dùng đặt 42tr cho món 40tr khởi điểm, giá hiện tại nên là 40tr (nếu chưa ai bid)
            // Tuy nhiên logic đơn giản nhất là set bằng startPrice
            if(amount > startPrice) newCurrentPrice = startPrice;
        }

        // Insert Bid người mới
        await client.query(
            `INSERT INTO Bids (product_id, bidder_id, amount, max_amount, created_at) VALUES ($1, $2, $3, $4, NOW())`,
            [productId, bidderId, newCurrentPrice, amount] // Lưu ý: amount ở đây là Max Amount
        );

        // Update Sản phẩm
        // Xử lý tự động gia hạn
        const timeRemaining = new Date(product.end_at).getTime() - Date.now();
        let newEndAt = product.end_at;
        if (timeRemaining > 0 && timeRemaining < 5 * 60 * 1000) { 
            newEndAt = new Date(new Date(product.end_at).getTime() + 10 * 60 * 1000); 
        }

        await client.query(
            `UPDATE Products SET current_price = $1, current_highest_bidder_id = $2, bid_count = bid_count + 1, end_at = $3 WHERE id = $4`,
            [newCurrentPrice, bidderId, newEndAt, productId]
        );

        await client.query('COMMIT');
        return { message: 'Ra giá thành công!', status: 'success' };

    } catch (e: any) {
        await client.query('ROLLBACK');
        throw new Error(e.message);
    } finally {
        client.release();
    }
};



export const addToWatchlist = async (userId: number, productId: number) => {
    // Sử dụng ON CONFLICT DO NOTHING: Nếu đã có trong danh sách rồi thì không báo lỗi, cứ bỏ qua
    await pool.query(
        `INSERT INTO Watchlists (user_id, product_id) VALUES ($1, $2) 
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, productId]
    );
    return { success: true, message: "Đã thêm vào danh sách theo dõi thành công!" };
};

// API: Lấy Watchlist
// backend/src/services/bidder.service.ts

export const getMyWatchList = async (userId: number) => {
    // Sửa câu Query:
    // 1. Lấy ảnh đầu tiên tìm thấy (LIMIT 1) thay vì bắt buộc phải là is_thumbnail=TRUE
    // 2. Sắp xếp theo thời gian thêm vào watchlist (w.created_at DESC)
    const res = await pool.query(
        `SELECT p.*, 
        (SELECT image_url FROM Product_Images WHERE product_id = p.id LIMIT 1) AS image 
        FROM Watchlists w
        JOIN Products p ON w.product_id = p.id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC`,
        [userId]
    );
    
    return res.rows;
};
// API: Lấy danh sách mình đang bid
export const getMyBid = async (userId: number) => {
    const res = await pool.query(
        `SELECT DISTINCT p.*, b.amount as my_bid_amount,
        (SELECT image_url FROM Product_Images WHERE product_id = p.id AND is_thumbnail = TRUE LIMIT 1) AS image
        FROM Bids b
        JOIN Products p ON b.product_id = p.id
        WHERE b.bidder_id = $1
        ORDER BY b.created_at DESC`,
        [userId]
    );
    return res.rows;
};