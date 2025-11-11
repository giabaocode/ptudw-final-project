# Sơ đồ Cơ sở dữ liệu (DATABASE.md)

# Dự án: Sàn Đấu Giá Trực Tuyến

Đây là Sơ đồ Quan hệ Thực thể (ERD) hoàn chỉnh cho dự án, bao gồm 17 bảng được thiết kế để đáp ứng tất cả các yêu cầu nghiệp vụ trong file đặc tả.

---

## 1. Nhóm Người dùng & Phân loại

### Bảng: `Users` (Người dùng)

Lưu trữ thông tin cho tất cả các loại tài khoản (bidder, seller, admin).

- `id` (INT, Khóa chính, Tự tăng)
- `full_name` (VARCHAR)
- `email` (VARCHAR, Unique) - _Dùng để đăng nhập_
- `password_hash` (VARCHAR) - _Băm bằng bcrypt/scrypt_
- `address` (VARCHAR)
- `dob` (DATE, Có thể null) - _Ngày tháng năm sinh (Yêu cầu 5.2)_
- `user_type` (ENUM['bidder', 'seller', 'admin'], Mặc định: 'bidder')
- `rating_plus` (INT, Mặc định: 0) - _Tổng điểm đánh giá tốt_
- `rating_minus` (INT, Mặc định: 0) - _Tổng điểm đánh giá xấu_
- `created_at` (DATETIME, Mặc định: NOW())

### Bảng: `Categories` (Danh mục)

Lưu trữ danh mục sản phẩm 2 cấp (Yêu cầu 1.1).

- `id` (INT, Khóa chính, Tự tăng)
- `name` (VARCHAR)
- `parent_id` (INT, Khóa ngoại -> `Categories.id`, Có thể null) - _Tham chiếu đến chính nó để tạo quan hệ cha-con_

### Bảng: `Password_Resets` (Đặt lại mật khẩu / OTP)

Lưu trữ mã OTP và thời gian hết hạn (Yêu cầu 1.6 & 5.4).

- `id` (INT, Khóa chính, Tự tăng)
- `user_email` (VARCHAR) - _Email của người dùng yêu cầu_
- `otp_code_hash` (VARCHAR) - _Mã OTP đã được băm để bảo mật_
- `expires_at` (DATETIME) - _Thời gian hết hạn của OTP_
- `used` (BOOLEAN, Mặc định: false) - _Đánh dấu OTP đã được sử dụng hay chưa_

---

## 2. Nhóm Sản phẩm & Đấu giá

### Bảng: `Products` (Sản phẩm)

Bảng trung tâm lưu trữ thông tin về sản phẩm đấu giá.

- `id` (INT, Khóa chính, Tự tăng)
- `name` (VARCHAR)
- `start_price` (DECIMAL) - _Giá khởi điểm_
- `step_price` (DECIMAL) - _Bước giá (Yêu cầu 3.1)_
- `buy_now_price` (DECIMAL, Có thể null) - _Giá mua ngay_
- `start_at` (DATETIME, Mặc định: NOW()) - _Thời điểm đăng_
- `end_at` (DATETIME) - _Thời điểm kết thúc_
- `auto_renew` (BOOLEAN, Mặc định: false) - _Tự động gia hạn 10 phút (Yêu cầu 3.1)_
- `seller_id` (INT, Khóa ngoại -> `Users.id`) - _Người bán_
- `category_id` (INT, Khóa ngoại -> `Categories.id`)
- **-- Các cột phi chuẩn hóa (Denormalized) để tăng tốc độ truy vấn --**
- `current_price` (DECIMAL) - _Giá cao nhất hiện tại (được cập nhật bởi trigger/logic)_
- `current_highest_bidder_id` (INT, Khóa ngoại -> `Users.id`, Có thể null) - _Người giữ giá cao nhất_
- `bid_count` (INT, Mặc định: 0) - _Tổng số lượt ra giá (Yêu cầu 1.2)_

### Bảng: `Product_Images` (Ảnh sản phẩm)

Lưu trữ ảnh của sản phẩm (Yêu cầu 3 ảnh tối thiểu).

- `id` (INT, Khóa chính, Tự tăng)
- `product_id` (INT, Khóa ngoại -> `Products.id`)
- `image_url` (VARCHAR)
- `is_thumbnail` (BOOLEAN, Mặc định: false) - _Đánh dấu ảnh đại diện (Yêu cầu 1.4.1)_

### Bảng: `Product_Description_History` (Lịch sử mô tả)

Hỗ trợ Yêu cầu 3.2: Chỉ được phép thêm vào mô tả, không được sửa.

- `id` (INT, Khóa chính, Tự tăng)
- `product_id` (INT, Khóa ngoại -> `Products.id`)
- `description_text` (TEXT) - _Nội dung mô tả được thêm vào_
- `created_at` (DATETIME, Mặc định: NOW()) - _Thời điểm bổ sung_

### Bảng: `Bids` (Lịch sử ra giá)

Lưu lại mọi lượt ra giá hợp lệ của tất cả người dùng cho một sản phẩm.

- `id` (INT, Khóa chính, Tự tăng)
- `product_id` (INT, Khóa ngoại -> `Products.id`)
- `bidder_id` (INT, Khóa ngoại -> `Users.id`)
- `amount` (DECIMAL) - _Giá đặt_
- `created_at` (DATETIME, Mặc định: NOW())

---

## 3. Nhóm Tương tác Người dùng

### Bảng: `Watchlists` (Sản phẩm theo dõi)

Bảng quan hệ nhiều-nhiều cho Yêu cầu 2.1.

- `user_id` (INT, Khóa chính, Khóa ngoại -> `Users.id`)
- `product_id` (INT, Khóa chính, Khóa ngoại -> `Products.id`)
- _-- (Khóa chính phức hợp: `user_id`, `product_id`) --_

### Bảng: `Youtubes` (Hỏi & Đáp)

Lưu các câu hỏi và câu trả lời (Yêu cầu 1.5 & 2.4 & 3.4).

- `id` (INT, Khóa chính, Tự tăng)
- `product_id` (INT, Khóa ngoại -> `Products.id`)
- `asker_id` (INT, Khóa ngoại -> `Users.id`) - _Người hỏi_
- `responder_id` (INT, Khóa ngoại -> `Users.id`, Có thể null) - _Người bán trả lời_
- `question_text` (TEXT)
- `answer_text` (TEXT, Có thể null)
- `asked_at` (DATETIME, Mặc định: NOW())
- `answered_at` (DATETIME, Có thể null)

### Bảng: `Blocked_Bidders` (Bidder bị chặn)

Lưu các bidder bị seller từ chối ra giá tại một sản phẩm cụ thể (Yêu cầu 3.3).

- `product_id` (INT, Khóa chính, Khóa ngoại -> `Products.id`)
- `bidder_id` (INT, Khóa chính, Khóa ngoại -> `Users.id`)
- `seller_id` (INT, Khóa ngoại -> `Users.id`) - _Người thực hiện chặn (chính là seller của sản phẩm)_
- _-- (Khóa chính phức hợp: `product_id`, `bidder_id`) --_

---

## 4. Nhóm Sau đấu giá (Thanh toán & Đánh giá)

### Bảng: `Transactions` (Giao dịch)

Bảng trung tâm cho quy trình 4 bước sau đấu giá (Yêu cầu 7).

- `id` (INT, Khóa chính, Tự tăng)
- `product_id` (INT, Khóa ngoại -> `Products.id`, Unique) - _Mỗi sản phẩm thắng chỉ có 1 giao dịch_
- `buyer_id` (INT, Khóa ngoại -> `Users.id`) - _Người thắng đấu giá_
- `seller_id` (INT, Khóa ngoại -> `Users.id`) - _Người bán_
- `final_price` (DECIMAL) - _Giá thắng cuối cùng_
- `status` (ENUM['pending_payment', 'pending_shipping', 'shipped', 'completed', 'cancelled'], Mặc định: 'pending_payment')
- `shipping_address` (TEXT, Có thể null) - _Địa chỉ giao hàng (bước 1)_
- `payment_proof_url` (VARCHAR, Có thể null) - _Hóa đơn thanh toán (bước 1)_
- `shipping_invoice_url` (VARCHAR, Có thể null) - _Hóa đơn vận chuyển (bước 2)_
- `created_at` (DATETIME, Mặc định: NOW()) - _Thời điểm đấu giá kết thúc_

### Bảng: `Ratings` (Đánh giá)

Lưu đánh giá (+1/-1) giữa người mua và người bán sau khi giao dịch (Yêu cầu 2.5 & 3.5 & 7).

- `id` (INT, Khóa chính, Tự tăng)
- `transaction_id` (INT, Khóa ngoại -> `Transactions.id`) - _Đánh giá phải dựa trên 1 giao dịch_
- `rater_id` (INT, Khóa ngoại -> `Users.id`) - _Người thực hiện đánh giá_
- `rated_user_id` (INT, Khóa ngoại -> `Users.id`) - _Người nhận đánh giá_
- `score` (ENUM['positive', 'negative']) - _Điểm +1 hoặc -1_
- `comment` (TEXT, Có thể null)
- `created_at` (DATETIME, Mặc định: NOW())

### Bảng: `Chat_Messages` (Tin nhắn Chat)

Lưu lịch sử chat giữa người mua và người bán trong 1 giao dịch (Yêu cầu 7).

- `id` (INT, Khóa chính, Tự tăng)
- `transaction_id` (INT, Khóa ngoại -> `Transactions.id`) - _Chat liên quan đến giao dịch_
- `sender_id` (INT, Khóa ngoại -> `Users.id`)
- `receiver_id` (INT, Khóa ngoại -> `Users.id`)
- `message_text` (TEXT)
- `created_at` (DATETIME, Mặc định: NOW())

---

## 5. Nhóm Quản trị & Hệ thống

### Bảng: `Upgrade_Requests` (Yêu cầu nâng cấp)

Lưu yêu cầu xin nâng cấp từ 'bidder' lên 'seller' (Yêu cầu 2.6 & 4.3).

- `id` (INT, Khóa chính, Tự tăng)
- `user_id` (INT, Khóa ngoại -> `Users.id`, Unique) - _Mỗi user chỉ có 1 yêu cầu_
- `status` (ENUM['pending', 'approved', 'rejected'], Mặc định: 'pending')
- `requested_at` (DATETIME, Mặc định: NOW())
- `processed_by_admin_id` (INT, Khóa ngoại -> `Users.id`, Có thể null) - _Admin đã duyệt_

### Bảng: `Audit_Logs` (Lịch sử hành động)

Ghi lại các hành động quan trọng (như Admin gỡ sản phẩm).

- `id` (INT, Khóa chính, Tự tăng)
- `user_id` (INT, Khóa ngoại -> `Users.id`, Có thể null) - _Ai thực hiện (có thể là Hệ thống)_
- `action` (VARCHAR) - _Mô tả hành động, vd: "ADMIN_REMOVE_PRODUCT", "SYSTEM_CLOSE_AUCTION"_
- `target_id` (INT, Có thể null) - _ID của đối tượng bị tác động (Product.id, User.id...)_
- `created_at` (DATETIME, Mặc định: NOW())

### Bảng: `System_Configs` (Cấu hình hệ thống)

Lưu các tham số hệ thống để Admin điều chỉnh (Yêu cầu 3.1).

- `config_key` (VARCHAR, Khóa chính) - _Ví dụ: "AUTO_RENEW_DURATION_MINUTES"_
- `config_value` (VARCHAR) - _Ví dụ: "10"_
- `description` (TEXT, Có thể null)
