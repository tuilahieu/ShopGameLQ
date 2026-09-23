# Cấu hình nạp tiền tự động SePay

## Cấu hình trong Admin

1. Vào **Admin → Cấu hình → Thanh toán & Cộng tác viên**. Dán khóa HMAC webhook
   SePay vào ô **Khóa bảo mật webhook SePay** rồi lưu. Ô này để trống ở những lần
   lưu sau nếu không đổi khóa. API chỉ trả trạng thái đã cấu hình, không trả khóa.
2. Vào **Admin → Ngân hàng**, thêm tài khoản nhận tiền và bật trạng thái hoạt
   động. Khách sẽ chọn tài khoản này khi tạo mã nạp.
3. Trong SePay Dashboard, tạo webhook **Money in**, định dạng **JSON**, chọn đúng
   tài khoản ngân hàng và dùng URL webhook hiển thị trong Admin:

   ```text
   https://api.ten-mien-cua-ban/api/payments/sepay/webhook
   ```

   Chọn xác thực **HMAC SHA-256** và dùng đúng khóa đã lưu trong Admin. Cấu hình
   lọc mã giao dịch với tiền tố `NAP` (hoặc `SEPAY_PAYMENT_PREFIX` nếu hệ thống
   đã đổi). Không cần sửa code hay khởi động lại backend khi đổi khóa trong Admin.

Khóa lưu trong database được mã hóa bằng `ACCOUNT_CREDENTIALS_ENCRYPTION_KEY`
đã dùng cho thông tin tài khoản. Giữ nguyên khóa mã hóa này qua các lần triển
khai; nếu thay, khóa SePay đã lưu sẽ không thể giải mã.
Khóa từng lưu dạng chữ thường bởi phiên bản cũ được mã hóa lại khi backend đọc
cấu hình lần đầu sau khi cập nhật.

## Triển khai cũ và tùy chọn

`SEPAY_WEBHOOK_SECRET` trong `backend/.env` vẫn dùng làm dự phòng nếu Admin chưa
lưu khóa. Khóa trong Admin được ưu tiên ngay sau khi lưu. Có thể đặt
`SEPAY_WEBHOOK_ENABLED=false` để tạm ngừng nạp tự động. Tiền tố mã nạp và thời
gian hiệu lực mặc định là `NAP` và 15 phút; có thể đổi bằng
`SEPAY_PAYMENT_PREFIX` và `SEPAY_PAYMENT_TTL_MINUTES` trong môi trường.

Webhook không cần Bearer token; server kiểm tra chữ ký HMAC trên raw body,
timestamp tối đa 5 phút và ID giao dịch duy nhất. Mỗi yêu cầu nạp có mã riêng;
giao dịch sai mã hoặc sai số tiền không được cộng ví.

Khi test local, SePay cần gọi được endpoint HTTPS công khai. Dùng tunnel tới
backend thay vì `localhost` trong SePay Dashboard.
