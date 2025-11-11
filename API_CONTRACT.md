# Hợp đồng API (API_CONTRACT.md)

# Dự án: Sàn Đấu Giá Trực Tuyến

Phiên bản: 1.0
Base URL: `/api`

**Quy ước:**

- `[Auth: Required]` yêu cầu `Authorization: Bearer <token>` trong header.
- `[Auth: Seller]` yêu cầu token của user có `user_type` là 'seller'.
- `[Auth: Admin]` yêu cầu token của user có `user_type` là 'admin'.

---

## 1. Phân hệ Xác thực (Auth)

Liên quan đến: `Users`, `Password_Resets`

### `POST /api/auth/register`

- **Mô tả:** Đăng ký tài khoản mới.
- **Auth:** None
- **Body (Input):**
  ```json
  {
    "full_name": "...",
    "email": "...",
    "password": "...",
    "address": "..."
  }
  Response (Success): { "message": "Đăng ký thành công, vui lòng kiểm tra email để xác thực OTP." }
  ```

Ghi chú: Backend sẽ gửi email OTP (Yêu cầu 1.6).

POST /api/auth/verify-otp
Mô tả: Xác thực OTP sau khi đăng ký.

Auth: None

Body (Input):

JSON
{
"email": "...",
"otp": "..."
}
Response (Success): { "message": "Xác thực thành công. Vui lòng đăng nhập." }

POST /api/auth/login
Mô tả: Đăng nhập.

Auth: None

Body (Input):

JSON
{
"email": "...",
"password": "..."
}
Response (Success):

JSON
{
"token": "...",
"user": {
"id": 1,
"full_name": "...",
"email": "...",
"user_type": "bidder"
}
}
GET /api/auth/me
Mô tả: Lấy thông tin người dùng hiện tại (đã đăng nhập).

Auth: [Auth: Required]

Response (Success): (Giống user object khi login)

POST /api/auth/forgot-password
Mô tả: Yêu cầu OTP để reset mật khẩu (Yêu cầu 5.4).

Auth: None

Body (Input): { "email": "..." }

Response (Success): { "message": "Đã gửi OTP qua email." }

POST /api/auth/reset-password
Mô tả: Đặt lại mật khẩu bằng OTP.

Auth: None

Body (Input):

JSON
{
"email": "...",
"otp": "...",
"new_password": "..."
}
Response (Success): { "message": "Đổi mật khẩu thành công." }

2. Phân hệ Công khai (Public / Guest)
   Liên quan đến: Categories, Products, Product_Images, Product_Description_History, Bids, Youtubes

GET /api/categories
Mô tả: Lấy toàn bộ danh mục 2 cấp (Yêu cầu 1.1).

Auth: None

Response (Success):

JSON
[
{
"id": 1,
"name": "Điện tử",
"children": [
{ "id": 2, "name": "Điện thoại" },
{ "id": 3, "name": "Máy tính" }
]
}
]
GET /api/products/homepage-tops
Mô tả: Lấy 3 danh sách top 5 cho trang chủ (Yêu cầu 1.2).

Auth: None

Response (Success):

JSON
{
"top_ending_soon": [ ... 5 sản phẩm ... ],
"top_most_bids": [ ... 5 sản phẩm ... ],
"top_highest_price": [ ... 5 sản phẩm ... ]
}
GET /api/products
Mô tả: Lấy danh sách sản phẩm theo danh mục, có phân trang (Yêu cầu 1.3).

Auth: None

Query Params: ?page=1&limit=10&category_id=2

Response (Success): { "products": [...], "pagination": { "total_pages": 10, "current_page": 1 } }

GET /api/products/search
Mô tả: Tìm kiếm sản phẩm (Yêu cầu 1.4).

Auth: None

Query Params: ?query=iphone&category_id=2&sort=end_at:desc&page=1

Response (Success): (Giống GET /api/products)

GET /api/products/:id
Mô tả: Lấy chi tiết 1 sản phẩm (Yêu cầu 1.5).

Auth: None

Response (Success):

JSON
{
"id": 1,
"name": "...",
"images": [ ... 3+ ảnh ... ],
"description_history": [ ... các lần bổ sung mô tả ... ],
"current_price": 500000,
"buy_now_price": 1000000,
"end_at": "...",
"seller": { "id": 2, "name": "Người Bán A", "rating_plus": 10, "rating_minus": 1 },
"current_highest_bidder": { "id": 3, "name": "Người Mua B", "rating_plus": 5, "rating_minus": 0 },
"related_products": [ ... 5 sản phẩm cùng danh mục ... ]
}
GET /api/products/:id/bid-history
Mô tả: Lấy lịch sử đấu giá (Yêu cầu 2.3).

Auth: None

Response (Success):

JSON
[
{ "amount": 500000, "created_at": "...", "bidder_name": "***n A" },
{ "amount": 490000, "created_at": "...", "bidder_name": "***g B" }
]
GET /api/products/:id/qna
Mô tả: Lấy các câu hỏi và trả lời (Yêu cầu 1.5).

Auth: None

Response (Success): [ { "question_text": "...", "answer_text": "...", "asked_at": "..." } ]

3. Phân hệ Bidder (Người mua)
   POST /api/products/:id/bid
   Mô tả: Ra giá cho sản phẩm (Yêu cầu 2.2).

Auth: [Auth: Required]

Body (Input): { "amount": 510000 }

Response (Success): { "success": true, "message": "Ra giá thành công." }

Response (Error): { "success": false, "message": "Điểm đánh giá của bạn (dưới 80%) không đủ để ra giá." }

POST /api/products/:id/qna
Mô tả: Đặt câu hỏi cho người bán (Yêu cầu 2.4).

Auth: [Auth: Required]

Body (Input): { "question_text": "Sản phẩm này còn bảo hành không?" }

Response (Success): { "success": true, "message": "Đã gửi câu hỏi." }

GET /api/profile/my-watchlist
Mô tả: Xem danh sách sản phẩm yêu thích (Yêu cầu 2.5).

Auth: [Auth: Required]

Response (Success): [ ... danh sách sản phẩm ... ]

POST /api/profile/my-watchlist
Mô tả: Thêm sản phẩm vào Watchlist (Yêu cầu 2.1).

Auth: [Auth: Required]

Body (Input): { "product_id": 123 }

Response (Success): { "success": true }

DELETE /api/profile/my-watchlist/:product_id
Mô tả: Xóa sản phẩm khỏi Watchlist (Yêu cầu 2.1).

Auth: [Auth: Required]

Response (Success): { "success": true }

GET /api/profile/my-bids
Mô tả: Xem danh sách sản phẩm đang tham gia đấu giá (Yêu cầu 2.5).

Auth: [Auth: Required]

Response (Success): [ ... danh sách sản phẩm ... ]

GET /api/profile/my-won-items
Mô tả: Xem danh sách sản phẩm đã thắng (Yêu cầu 2.5).

Auth: [Auth: Required]

Response (Success): [ ... danh sách sản phẩm ... ]

POST /api/profile/request-upgrade
Mô tả: Gửi yêu cầu nâng cấp lên Seller (Yêu cầu 2.6).

Auth: [Auth: Required]

Response (Success): { "success": true, "message": "Đã gửi yêu cầu, vui lòng chờ admin duyệt." }

PUT /api/profile/me
Mô tả: Cập nhật thông tin cá nhân (Yêu cầu 5.2).

Auth: [Auth: Required]

Body (Input): { "full_name": "...", "address": "...", "dob": "..." }

Response (Success): { "success": true, "user": { ... } }

PUT /api/profile/change-password
Mô tả: Đổi mật khẩu (Yêu cầu 5.3).

Auth: [Auth: Required]

Body (Input): { "old_password": "...", "new_password": "..." }

Response (Success): { "success": true, "message": "Đổi mật khẩu thành công." }

4. Phân hệ Seller (Người bán)
   POST /api/seller/products
   Mô tả: Đăng sản phẩm đấu giá mới (Yêu cầu 3.1).

Auth: [Auth: Seller]

Body (Input): (Dạng multipart/form-data để upload ảnh)

JSON
{
"name": "...",
"description": "<p>Mô tả WYSIWYG</p>",
"images": [file1, file2, file3],
"thumbnail_index": 0,
"category_id": 1,
"start_price": 100000,
"step_price": 10000,
"buy_now_price": 500000,
"end_at": "...",
"auto_renew": true
}
Response (Success): { "success": true, "product_id": 124 }

PUT /api/seller/products/:id/description
Mô tả: Bổ sung mô tả sản phẩm (Yêu cầu 3.2 - Append-only).

Auth: [Auth: Seller]

Body (Input): { "new_description": "<p>Thông tin bổ sung...</p>" }

Response (Success): { "success": true }

POST /api/seller/products/:id/block-bidder
Mô tả: Từ chối/chặn lượt ra giá của 1 bidder (Yêu cầu 3.3).

Auth: [Auth: Seller]

Body (Input): { "bidder_id": 5 }

Response (Success): { "success": true, "message": "Đã chặn bidder khỏi sản phẩm này." }

PUT /api/seller/products/qna/:qna_id/answer
Mô tả: Trả lời câu hỏi của bidder (Yêu cầu 3.4).

Auth: [Auth: Seller]

Body (Input): { "answer_text": "Hàng xách tay, không bảo hành bạn nhé." }

Response (Success): { "success": true }

GET /api/seller/my-listed-items
Mô tả: Xem danh sách sản phẩm đang đăng bán (Yêu cầu 3.5).

Auth: [Auth: Seller]

Response (Success): [ ... danh sách sản phẩm ... ]

GET /api/seller/my-sold-items
Mô tả: Xem danh sách sản phẩm đã có người thắng (Yêu cầu 3.5).

Auth: [Auth: Seller]

Response (Success): [ ... danh sách giao dịch ... ]

5. Phân hệ Sau Đấu giá (Thanh toán & Chat)
   Liên quan đến: Transactions, Chat_Messages, Ratings (Yêu cầu 7)

GET /api/transactions/:product_id
Mô tả: Lấy thông tin & trạng thái quy trình 4 bước của 1 giao dịch.

Auth: [Auth: Required] (Phải là người mua hoặc người bán của giao dịch)

Response (Success):

JSON
{
"id": 1,
"product_name": "...",
"final_price": 750000,
"status": "pending_payment",
"shipping_address": null,
"payment_proof_url": null,
"shipping_invoice_url": null
}
POST /api/transactions/:product_id/pay (Bước 1: Người mua)
Mô tả: Người mua xác nhận thanh toán và gửi địa chỉ.

Auth: [Auth: Required] (Chỉ người mua)

Body (Input): (Dạng multipart/form-data để upload ảnh bằng chứng)

JSON
{
"shipping_address": "...",
"payment_proof_image": file1
}
Response (Success): { "success": true, "status": "pending_shipping" }

POST /api/transactions/:product_id/ship (Bước 2: Người bán)
Mô tả: Người bán xác nhận đã nhận tiền và gửi hàng.

Auth: [Auth: Required] (Chỉ người bán)

Body (Input): (Dạng multipart/form-data để upload ảnh hóa đơn)

JSON
{
"shipping_invoice_image": file1
}
Response (Success): { "success": true, "status": "shipped" }

POST /api/transactions/:product_id/confirm-receipt (Bước 3: Người mua)
Mô tả: Người mua xác nhận đã nhận được hàng.

Auth: [Auth: Required] (Chỉ người mua)

Response (Success): { "success": true, "status": "completed" }

POST /api/transactions/:product_id/cancel (Người bán)
Mô tả: Người bán hủy giao dịch (Yêu cầu 3.5).

Auth: [Auth: Seller]

Response (Success): { "success": true, "status": "cancelled" }

Ghi chú: Backend tự động đánh giá -1 cho người mua với comment "Người thắng không thanh toán".

POST /api/transactions/:product_id/rate (Bước 4: Đánh giá)
Mô tả: Đánh giá người dùng còn lại của giao dịch (Yêu cầu 2.5 & 3.5).

Auth: [Auth: Required] (Người mua hoặc người bán)

Body (Input):

JSON
{
"score": "positive", // hoặc "negative"
"comment": "Giao dịch tốt."
}
Response (Success): { "success": true }

GET /api/transactions/:product_id/chat
Mô tả: Lấy lịch sử chat của giao dịch (Yêu cầu 7).

Auth: [Auth: Required] (Người mua hoặc người bán)

Response (Success): [ { "sender_id": 1, "message_text": "...", "created_at": "..." } ]

POST /api/transactions/:product_id/chat
Mô tả: Gửi tin nhắn chat (Yêu cầu 7).

Auth: [Auth: Required] (Người mua hoặc người bán)

Body (Input): { "message_text": "Bạn gửi hàng chưa?" }

Response (Success): { "success": true }

6. Phân hệ Admin (Quản trị viên)
   GET /api/admin/categories (CRUD cho Yêu cầu 4.1)
   Auth: [Auth: Admin]

Response: [ ... danh sách category ... ]

POST /api/admin/categories
Auth: [Auth: Admin]

Body: { "name": "...", "parent_id": 1 }

Response: { ... category vừa tạo ... }

PUT /api/admin/categories/:id
Auth: [Auth: Admin]

Body: { "name": "...", "parent_id": 1 }

Response: { ... category vừa cập nhật ... }

DELETE /api/admin/categories/:id
Auth: [Auth: Admin]

Response: { "success": true }

Ghi chú: Backend phải kiểm tra danh mục có sản phẩm không (Yêu cầu 4.1).

GET /api/admin/users (CRUD cho Yêu cầu 4.3)
Auth: [Auth: Admin]

Response: [ ... danh sách user ... ]

(Tương tự có POST, PUT /:id, DELETE /:id (Reset mật khẩu...))

GET /api/admin/products
Mô tả: Xem tất cả sản phẩm (Yêu cầu 4.2).

Auth: [Auth: Admin]

Response: [ ... danh sách sản phẩm ... ]

DELETE /api/admin/products/:id
Mô tả: Gỡ bỏ sản phẩm (Yêu cầu 4.2).

Auth: [Auth: Admin]

Response: { "success": true }

GET /api/admin/upgrade-requests
Mô tả: Xem danh sách xin nâng cấp (Yêu cầu 4.3).

Auth: [Auth: Admin]

Response: [ { "id": 1, "user_id": 5, "user_name": "...", "requested_at": "..." } ]

POST /api/admin/upgrade-requests/:request_id/approve
Mô tả: Duyệt nâng cấp (Yêu cầu 4.3).

Auth: [Auth: Admin]

Response: { "success": true }

POST /api/admin/upgrade-requests/:request_id/reject
Mô tả: Từ chối nâng cấp (Yêu cầu 4.3).

Auth: [Auth: Admin]

Response: { "success": true }

GET /api/admin/configs
Mô tả: Lấy cấu hình hệ thống (Yêu cầu 3.1).

Auth: [Auth: Admin]

Response: [ { "config_key": "AUTO_RENEW_DURATION_MINUTES", "config_value": "10" } ]

PUT /api/admin/configs
Mô tả: Cập nhật cấu hình hệ thống.

Auth: [Auth: Admin]

Body: { "config_key": "AUTO_RENEW_DURATION_MINUTES", "config_value": "15" }

Response: { "success": true }
