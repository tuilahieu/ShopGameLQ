# Cấu hình nạp tiền tự động SePay

Ứng dụng đã tạo mã nạp một lần cho từng yêu cầu và chỉ cộng ví khi callback
SePay có chữ ký HMAC hợp lệ, đúng mã nạp, đúng số tiền và chưa từng được xử lý.

## 1. Thêm một secret vào API

Trong `backend/.env`, thêm secret HMAC mà SePay Dashboard cấp cho webhook:

```env
SEPAY_WEBHOOK_SECRET=secret-hmac-cua-ban
```

Các biến bên dưới đã có giá trị mặc định; không cần thêm nếu không muốn đổi:

```env
SEPAY_PAYMENT_PREFIX=NAP
SEPAY_PAYMENT_TTL_MINUTES=15
```

Sau đó chạy migration một lần và khởi động lại backend:

```bash
cd backend
npm run migrate
npm start
```

## 2. Tạo webhook trong SePay Dashboard

Tạo webhook kiểu **Money in**, định dạng **JSON**, chọn đúng tài khoản ngân
hàng nhận tiền và đặt URL:

```text
https://api.ten-mien-cua-ban/api/payments/sepay/webhook
```

Chọn xác thực **HMAC SHA-256**, dùng cùng secret đã đặt ở API. Bật lọc mã giao
dịch với tiền tố `NAP` (hoặc giá trị `SEPAY_PAYMENT_PREFIX` nếu đã đổi).

Endpoint này không cần Bearer token và không được đặt sau Cloudflare Access hay
một lớp Basic Auth. Nó vẫn an toàn vì kiểm tra chữ ký HMAC trên chính raw body,
timestamp tối đa 5 phút và ID giao dịch SePay duy nhất.

## 3. Lưu ý khi test local

SePay phải gọi được endpoint qua HTTPS công khai. Khi chạy local, mở tunnel
(ví dụ Cloudflare Tunnel) tới cổng backend `3000`, rồi dùng URL tunnel ở bước
2. Không dùng `localhost` trong SePay Dashboard.

Mỗi lần khách bấm “Tạo mã nạp tiền”, UI sinh QR với đúng số tiền và nội dung
riêng. Không đổi số tiền hay nội dung khi chuyển khoản: giao dịch sai sẽ được
lưu audit nhưng không cộng ví.
